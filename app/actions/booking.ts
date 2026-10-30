"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { ACTIVE_BOOKING } from "@/lib/config";
import { notifyBooking, type BookingEvent } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { isValidSlot } from "@/lib/slots";
import type { FormState } from "@/lib/validation";

const CONFLICT = "Ce créneau vient d'être pris, ou l'une des deux parties a déjà une rencontre à cette heure-là.";

function refresh(startupId: string) {
  revalidatePath("/espace");
  revalidatePath(`/startups/${startupId}`);
  revalidatePath("/admin");
}

/** Investisseur : demande une rencontre. La startup devra l'accepter, la refuser ou proposer un autre horaire. */
export async function bookSlot(startupId: string, startsAtIso: string): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "INVESTOR" || !user.investor) return { error: "Seuls les investisseurs peuvent demander une rencontre." };
  if (user.status !== "APPROVED") return { error: "Votre compte est suspendu ou en cours d'examen : la demande est indisponible." };

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime()) || !isValidSlot(startsAt)) return { error: "Créneau invalide." };
  if (startsAt.getTime() <= Date.now()) return { error: "Ce créneau est déjà passé." };

  const already = await db.booking.findFirst({
    where: { investorId: user.investor.id, startupId, status: { in: ACTIVE_BOOKING } },
  });
  if (already) return { error: "Vous avez déjà une demande ou une rencontre avec cette startup. Annulez-la pour en faire une autre." };

  const startup = await db.startup.findUnique({ where: { id: startupId }, include: { user: true } });
  if (!startup || startup.user.status !== "APPROVED") return { error: "Startup introuvable." };

  let booking;
  try {
    booking = await db.booking.create({
      data: { investorId: user.investor.id, startupId, startsAt, activeStart: startsAt, status: "PENDING", proposedBy: "INVESTOR" },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: CONFLICT };
    throw e;
  }
  const investor = user.investor;
  after(() => notifyBooking({ kind: "requested", to: startup.user.email, startupName: startup.name, investor, startsAt, recipient: "STARTUP" }));
  refresh(startupId);
  return { ok: true, values: { id: booking.id } };
}

type Loaded = Prisma.BookingGetPayload<{ include: { startup: { include: { user: true } }; investor: { include: { user: true } } } }>;

async function loadFor(bookingId: string): Promise<{ error: string } | { booking: Loaded; side: "INVESTOR" | "STARTUP" | null }> {
  const user = await requireUser();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { startup: { include: { user: true } }, investor: { include: { user: true } } },
  });
  if (!booking) return { error: "Rencontre introuvable." };
  const side = user.investor && booking.investorId === user.investor.id ? "INVESTOR" : user.startup && booking.startupId === user.startup.id ? "STARTUP" : null;
  if (!side && user.role !== "ADMIN") return { error: "Action non autorisée." };
  return { booking, side };
}

/** Le message part à l'autre partie (à la startup si c'est l'admin qui agit). */
function eventFor(kind: BookingEvent["kind"], booking: Loaded, side: "INVESTOR" | "STARTUP" | null, startsAt: Date): BookingEvent {
  const toStartup = side !== "STARTUP";
  return {
    kind,
    to: toStartup ? booking.startup.user.email : booking.investor.user.email,
    startupName: booking.startup.name,
    investor: booking.investor,
    startsAt,
    recipient: toStartup ? "STARTUP" : "INVESTOR",
  };
}

/** L'autre partie (celle qui n'a pas fait la dernière proposition) accepte l'horaire. */
export async function acceptBooking(bookingId: string): Promise<FormState> {
  const r = await loadFor(bookingId);
  if ("error" in r) return { error: r.error };
  const { booking, side } = r;
  if (booking.status !== "PENDING") return { error: "Cette demande n'est plus en attente." };
  if (!side || booking.proposedBy === side) return { error: "C'est à l'autre partie de répondre." };
  await db.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
  after(() => notifyBooking(eventFor("accepted", booking, side, booking.startsAt)));
  refresh(booking.startupId);
  return { ok: true };
}

/** Refuse la demande : le créneau est libéré. */
export async function declineBooking(bookingId: string): Promise<FormState> {
  const r = await loadFor(bookingId);
  if ("error" in r) return { error: r.error };
  const { booking, side } = r;
  if (booking.status !== "PENDING") return { error: "Cette demande n'est plus en attente." };
  if (!side || booking.proposedBy === side) return { error: "C'est à l'autre partie de répondre." };
  await db.booking.update({ where: { id: bookingId }, data: { status: "DECLINED", activeStart: null, closedBy: side } });
  after(() => notifyBooking(eventFor("declined", booking, side, booking.startsAt)));
  refresh(booking.startupId);
  return { ok: true };
}

/** Propose un autre horaire : la balle passe à l'autre partie, qui peut accepter, refuser ou contre-proposer. */
export async function proposeSlot(bookingId: string, startsAtIso: string): Promise<FormState> {
  const r = await loadFor(bookingId);
  if ("error" in r) return { error: r.error };
  const { booking, side } = r;
  if (booking.status !== "PENDING") return { error: "Cette demande n'est plus en attente." };
  if (!side || booking.proposedBy === side) return { error: "C'est à l'autre partie de répondre." };

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime()) || !isValidSlot(startsAt)) return { error: "Créneau invalide." };
  if (startsAt.getTime() <= Date.now()) return { error: "Ce créneau est déjà passé." };
  if (startsAt.getTime() === booking.startsAt.getTime()) return { error: "Choisissez un horaire différent." };

  try {
    await db.booking.update({ where: { id: bookingId }, data: { startsAt, activeStart: startsAt, proposedBy: side } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: CONFLICT };
    throw e;
  }
  after(() => notifyBooking(eventFor("proposed", booking, side, startsAt)));
  refresh(booking.startupId);
  return { ok: true };
}

/** Annule une rencontre confirmée, ou retire sa propre demande en attente. */
export async function cancelBooking(bookingId: string): Promise<FormState> {
  const r = await loadFor(bookingId);
  if ("error" in r) return { error: r.error };
  const { booking, side } = r;
  if (!ACTIVE_BOOKING.includes(booking.status)) return { error: "Cette rencontre n'est plus active." };
  await db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", activeStart: null, closedBy: side ?? "ADMIN" } });
  after(() => notifyBooking(eventFor("cancelled", booking, side, booking.startsAt)));
  refresh(booking.startupId);
  return { ok: true };
}

/** Retire de la liste une demande refusée ou annulée par l'autre partie. */
export async function dismissBooking(bookingId: string): Promise<FormState> {
  const r = await loadFor(bookingId);
  if ("error" in r) return { error: r.error };
  const { booking } = r;
  if (ACTIVE_BOOKING.includes(booking.status)) return { error: "Cette rencontre est toujours active." };
  await db.booking.delete({ where: { id: bookingId } });
  refresh(booking.startupId);
  return { ok: true };
}
