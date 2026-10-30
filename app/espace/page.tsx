import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MEETINGS } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { formatDay, formatDayNumber, formatMonthShort, formatTime } from "@/lib/slots";
import StatusBadge from "@/components/StatusBadge";
import StartupLogo from "@/components/StartupLogo";
import MeetingActions from "@/components/MeetingActions";
import { daySlotsFor } from "@/lib/availability";
import AccountSettings from "@/components/AccountSettings";
import { ArrowUpRight, Briefcase, Rocket, Shield } from "@/components/icons";

export const metadata: Metadata = { title: "Mon espace" };

export default async function Page() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");

  const isInvestor = user.role === "INVESTOR";
  const bookings = isInvestor
    ? await db.booking.findMany({
        where: { investorId: user.investor!.id },
        include: { startup: true },
        orderBy: { startsAt: "asc" },
      })
    : await db.booking.findMany({
        where: { startupId: user.startup!.id },
        include: { investor: true },
        orderBy: { startsAt: "asc" },
      });

  const name = isInvestor ? user.investor!.fullName : user.startup!.name;
  const subtitle = isInvestor
    ? `${user.investor!.position} · ${user.investor!.organization}`
    : `${user.startup!.sector} · ${user.startup!.country}`;
  const role = isInvestor ? "INVESTOR" : "STARTUP";
  // Une demande refusée ou annulée par soi-même disparaît ; l'autre partie la voit jusqu'à ce qu'elle la masque.
  const visible = bookings.filter((b) => !(["DECLINED", "CANCELLED"].includes(b.status) && b.closedBy === role));
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const toAnswer = bookings.filter((b) => b.status === "PENDING" && b.proposedBy !== role);
  const next = confirmed.find((b) => b.startsAt.getTime() > Date.now());

  const stats = [
    { label: "Durée d'une rencontre", value: `${MEETINGS.durationMinutes} min` },
    { label: "Rencontres confirmées", value: String(confirmed.length).padStart(2, "0") },
    { label: "À traiter", value: String(toAnswer.length).padStart(2, "0") },
    ...(next
      ? [{ label: "Prochaine rencontre", value: `${formatDayNumber(next.startsAt)} ${formatMonthShort(next.startsAt)} · ${formatTime(next.startsAt)}` }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="card flex flex-col gap-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label flex items-center gap-2 text-signal/80">
            {isInvestor ? <Briefcase width={16} height={16} /> : <Rocket width={16} height={16} />}
            Mon espace {isInvestor ? "investisseur" : "startup"}
          </p>
          <StatusBadge status={user.status} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            {!isInvestor && <StartupLogo name={name} logo={user.startup!.logo} size="lg" />}
            <div className="flex flex-col gap-3">
              <h1 className="display text-[clamp(2rem,5vw,3.25rem)]">{name}</h1>
              <p className="label text-[0.75rem] text-ink-faint">{subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/espace/profil" className="btn-secondary">
              Modifier mon profil
            </Link>
            {isInvestor ? (
              <Link href="/startups" className="btn-primary">
                Parcourir les startups
              </Link>
            ) : (
              user.status === "APPROVED" && (
                <Link href={`/startups/${user.startup!.id}`} className="btn-secondary text-signal">
                  Voir ma page publique
                  <ArrowUpRight width={16} height={16} />
                </Link>
              )
            )}
          </div>
        </div>

        {user.status === "APPROVED" && (
          <p className="flex items-start gap-3 rounded-lg border border-hairline bg-night/50 p-4 text-ink-muted">
            <Shield className="mt-0.5 shrink-0 text-success" />
            {isInvestor
              ? "Votre profil est actif. Vous pouvez réserver des rencontres avec les startups."
              : "Votre profil est en ligne. Vous êtes visible dans l’annuaire des startups du Village."}
          </p>
        )}
        {user.status === "PENDING" && (
          <p className="rounded-lg border border-signal/25 bg-signal/5 p-4 text-ink-muted">
            Votre profil est en cours d’examen par l’équipe du Village.{" "}
            {isInvestor
              ? "Vous pourrez réserver des rencontres dès qu’il sera rétabli."
              : "Il réapparaîtra dans l’annuaire dès qu’il sera rétabli."}
          </p>
        )}
        {user.status === "REJECTED" && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-destructive">
            Votre compte a été suspendu par l’équipe du Village. Contactez-la pour en savoir plus.
          </p>
        )}

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 rounded-lg border border-hairline bg-night/40 p-5">
              <dt className="label text-[0.6875rem] text-ink-faint">{s.label}</dt>
              <dd className="counter text-2xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="meetings" className="mt-12">
        <p className="label mb-3 text-ink-faint">Programme</p>
        <h2 id="meetings" className="display mb-8 text-[1.75rem] leading-[1.15]">
          {isInvestor ? "Mes rencontres" : "Demandes et rencontres"}
        </h2>
        {confirmed.length > 0 && (
          <a href="/espace/agenda" className="btn-secondary mb-4 self-start">
            Ajouter à mon calendrier (.ics)
          </a>
        )}
        {visible.length === 0 ? (
          <div className="card py-12 text-center text-ink-muted">
            {isInvestor ? "Aucune demande pour le moment. Parcourez les startups pour en envoyer une." : "Aucune demande pour le moment."}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {await Promise.all(
              visible.map(async (b) => {
                const who =
                  "startup" in b
                    ? { title: b.startup.name, sub: b.startup.sector, href: `/startups/${b.startup.id}`, investor: null }
                    : {
                        title: b.investor.fullName,
                        sub: `${b.investor.position} · ${b.investor.organization} · ${b.investor.city}, ${b.investor.country}`,
                        href: null,
                        investor: b.investor,
                      };
                const closed = b.status === "DECLINED" || b.status === "CANCELLED";
                const past = b.status === "CONFIRMED" && b.startsAt.getTime() < Date.now();
                const mustAnswer = b.status === "PENDING" && b.proposedBy !== role;
                const waiting = b.status === "PENDING" && b.proposedBy === role;
                const days = mustAnswer
                  ? await daySlotsFor(
                      "investor" in b ? b.investor.id : user.investor!.id,
                      "startup" in b ? b.startup.id : user.startup!.id,
                    )
                  : undefined;
                const badge = closed
                  ? { text: b.status === "DECLINED" ? "Refusée par l’autre partie" : "Annulée par l’autre partie", cls: "border-destructive/25 bg-destructive/10 text-destructive" }
                  : past
                    ? { text: "Terminée", cls: "border-hairline text-ink-faint" }
                    : b.status === "CONFIRMED"
                      ? { text: "Confirmée", cls: "border-success/25 bg-success/10 text-success" }
                      : mustAnswer
                        ? { text: "À traiter", cls: "border-signal/40 bg-signal/10 text-signal" }
                        : { text: "En attente de réponse", cls: "border-hairline bg-surface-2 text-ink-muted" };
                return (
                  <li key={b.id} className={`card flex flex-wrap items-start gap-5 p-5 ${closed || past ? "opacity-60" : ""} ${mustAnswer ? "border-signal/40" : ""}`}>
                    <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-night/60 text-center">
                      <div>
                        <p className="label text-[0.625rem] text-signal">
                          {formatDayNumber(b.startsAt)} {formatMonthShort(b.startsAt)}
                        </p>
                        <p className="counter text-lg !text-ink !shadow-none">{formatTime(b.startsAt)}</p>
                      </div>
                    </div>
                    <div className="min-w-48 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`pill ${badge.cls}`}>{badge.text}</span>
                        <p className="label text-[0.6875rem] text-signal/80 first-letter:uppercase">
                          {formatDay(b.startsAt)} · {formatTime(b.startsAt)}
                        </p>
                      </div>
                      {who.href ? (
                        <Link href={who.href} className="text-lg font-medium hover:text-signal">
                          {who.title}
                        </Link>
                      ) : (
                        <p className="text-lg font-medium">{who.title}</p>
                      )}
                      <p className="text-sm text-ink-muted">{who.sub}</p>
                      {mustAnswer && (
                        <p className="mt-2 text-sm text-ink-muted">
                          {b.proposedBy === "INVESTOR" ? "Demande de rencontre reçue." : "Un autre horaire vous est proposé."} Acceptez, refusez ou proposez un autre horaire.
                        </p>
                      )}
                      {waiting && <p className="mt-2 text-sm text-ink-muted">En attente de la réponse de l’autre partie.</p>}
                      {who.investor && (
                        <details className="mt-3 text-sm">
                          <summary className="label cursor-pointer text-[0.6875rem] text-signal">Voir le profil de l’investisseur</summary>
                          <div className="mt-3 flex flex-col gap-2 text-ink-muted">
                            <p className="whitespace-pre-line">{who.investor.bio}</p>
                            <p>Secteurs : {who.investor.sectors.split(",").join(" · ")}</p>
                            {who.investor.website && (
                              <a href={who.investor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start text-signal hover:underline">
                                Site / LinkedIn <ArrowUpRight width={14} height={14} />
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                    {(closed || !past) && (
                      <MeetingActions
                        bookingId={b.id}
                        mode={closed ? "closed" : mustAnswer ? "respond" : waiting ? "waiting" : "confirmed"}
                        days={days}
                        startupId={b.startupId}
                        startupName={"startup" in b ? b.startup.name : user.startup!.name}
                        duration={MEETINGS.durationMinutes}
                      />
                    )}
                  </li>
                );
              }),
            )}
          </ul>
        )}
      </section>

      <section aria-labelledby="account" className="mt-16">
        <p className="label mb-3 text-ink-faint">Compte</p>
        <h2 id="account" className="display mb-8 text-[1.75rem] leading-[1.15]">
          Paramètres du compte
        </h2>
        <AccountSettings />
      </section>
    </div>
  );
}
