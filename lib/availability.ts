import "server-only";
import { db } from "./db";
import { allSlots, formatDay, formatDayShort, formatTime } from "./slots";

export type SlotState = "free" | "taken" | "busy" | "past";
export type DaySlots = {
  day: string;
  label: string; // « mercredi 18 novembre »
  short: string; // « mer. 18 nov. »
  slots: { iso: string; time: string; state: SlotState }[];
};

/**
 * Créneaux du Village, avec leur état pour un investisseur et une startup donnés.
 * taken = la startup a déjà une rencontre à cette heure · busy = l'investisseur en a une · past = passé.
 * Une demande en attente ou confirmée occupe le créneau ; refusée ou annulée, elle le libère.
 */
export async function daySlotsFor(investorId: string, startupId: string): Promise<DaySlots[]> {
  const [startupActive, investorActive] = await Promise.all([
    db.booking.findMany({ where: { startupId, activeStart: { not: null } }, select: { activeStart: true } }),
    db.booking.findMany({ where: { investorId, activeStart: { not: null } }, select: { activeStart: true } }),
  ]);
  const taken = new Set(startupActive.map((b) => b.activeStart!.getTime()));
  const busy = new Set(investorActive.map((b) => b.activeStart!.getTime()));
  const now = Date.now();
  return Object.entries(allSlots()).map(([day, slots]) => ({
    day,
    label: formatDay(slots[0].startsAt),
    short: formatDayShort(slots[0].startsAt),
    slots: slots.map((s) => {
      const t = s.startsAt.getTime();
      return {
        iso: s.startsAt.toISOString(),
        time: formatTime(s.startsAt),
        state: t <= now ? "past" : busy.has(t) ? "busy" : taken.has(t) ? "taken" : "free",
      };
    }),
  }));
}
