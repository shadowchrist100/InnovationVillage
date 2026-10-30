import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { MEETINGS } from "@/lib/config";
import { formatDay, formatTime } from "@/lib/slots";
import { embedUrl } from "@/lib/video";
import BookingPanel from "@/components/BookingPanel";
import { daySlotsFor, type DaySlots } from "@/lib/availability";
import { ACTIVE_BOOKING } from "@/lib/config";
import StartupLogo from "@/components/StartupLogo";
import TeamPhoto from "@/components/TeamPhoto";
import { ArrowLeft, ArrowUpRight, Calendar } from "@/components/icons";

async function getStartup(id: string) {
  const s = await db.startup.findUnique({ where: { id }, include: { user: true } });
  return s && s.user.status === "APPROVED" ? s : null;
}

export async function generateMetadata({ params }: PageProps<"/startups/[id]">): Promise<Metadata> {
  const s = await getStartup((await params).id);
  return { title: s?.name ?? "Startup", description: s?.whatTheyDo.slice(0, 160) };
}

export default async function Page({ params }: PageProps<"/startups/[id]">) {
  const { id } = await params;
  const startup = await getStartup(id);
  if (!startup) notFound();

  const viewer = await getUser();
  const team: { name: string; role: string; bio?: string; photo?: string }[] = JSON.parse(startup.team);
  // L'équipe (noms et photos) est réservée aux investisseurs inscrits, à l'administration et à la startup elle-même.
  const canSeeTeam =
    viewer?.role === "ADMIN" ||
    (viewer?.role === "INVESTOR" && viewer.status === "APPROVED") ||
    (viewer?.role === "STARTUP" && viewer.startup?.id === startup.id);
  const isOwner = viewer?.role === "STARTUP" && viewer.startup?.id === startup.id;
  const video = embedUrl(startup.demoVideoUrl);

  const sections = [
    ["Ce qu'ils font", startup.whatTheyDo],
    ["Le problème résolu", startup.problem],
    ["D'où vient l'idée", startup.origin],
    ["Objectif", startup.goal],
  ] as const;

  let days: DaySlots[] = [];
  let existing: { label: string; confirmed: boolean; mine: boolean } | null = null;
  const canBook = viewer?.role === "INVESTOR" && viewer.status === "APPROVED" && viewer.investor;
  if (canBook) {
    const own = await db.booking.findFirst({
      where: { investorId: viewer.investor!.id, startupId: startup.id, status: { in: ACTIVE_BOOKING } },
    });
    if (own) {
      existing = { label: `${formatDay(own.startsAt)} à ${formatTime(own.startsAt)}`, confirmed: own.status === "CONFIRMED", mine: own.proposedBy === "INVESTOR" };
    } else {
      days = await daySlotsFor(viewer.investor!.id, startup.id);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/startups" className="label inline-flex items-center gap-2 text-[0.6875rem] text-signal/80 hover:text-signal">
        <ArrowLeft width={15} height={15} />
        Toutes les startups
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <article className="flex flex-col gap-12">
          <header className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="pill border-signal/25 bg-signal/10 text-signal">
                {startup.sector} · {startup.country}
              </p>
              <a href={startup.website} target="_blank" rel="noopener noreferrer" className="btn-secondary h-10">
                Voir le produit
                <ArrowUpRight width={16} height={16} />
              </a>
            </div>
            <div className="flex items-center gap-5">
              <StartupLogo name={startup.name} logo={startup.logo} size="lg" />
              <h1 className="display text-[clamp(2.25rem,5vw,3.25rem)]">{startup.name}</h1>
            </div>
          </header>

          {video ? (
            <div className="aspect-video overflow-hidden rounded-xl border border-hairline bg-surface-1 shadow-[var(--glow)]">
              <iframe
                src={video}
                title={`Démo de ${startup.name}`}
                allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="size-full"
              />
            </div>
          ) : startup.demoVideoUrl ? (
            <a href={startup.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary self-start">
              Voir la vidéo de démo
              <ArrowUpRight width={16} height={16} />
            </a>
          ) : null}

          {sections.map(([title, text]) => (
            <section key={title} className="flex flex-col gap-4">
              <h2 className="label flex items-center gap-2 text-signal/80">
                <span className="size-1.5 rounded-full bg-signal" aria-hidden />
                {title}
              </h2>
              <p className="max-w-[68ch] text-[1.0625rem] leading-relaxed whitespace-pre-line text-ink-muted">{text}</p>
            </section>
          ))}

          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="label flex items-center gap-2 text-signal/80">
                <span className="size-1.5 rounded-full bg-signal" aria-hidden />
                L’équipe fondatrice
              </h2>
              <span className="label text-[0.6875rem] text-ink-faint">
                {team.length} membre{team.length > 1 ? "s" : ""}
              </span>
            </div>
            {canSeeTeam ? (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {team.map((m, i) => (
                  <li key={i} className="card flex flex-col items-center gap-3 p-5 text-center">
                    <TeamPhoto name={m.name} photo={m.photo} size="lg" />
                    <span className="font-medium">{m.name}</span>
                    <span className="label text-[0.6875rem] text-signal/80">{m.role}</span>
                    {m.bio && <p className="text-sm leading-relaxed whitespace-pre-line text-ink-muted">{m.bio}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-ink-muted">
                  L’équipe fondatrice ({team.length} membre{team.length > 1 ? "s" : ""}) est visible des investisseurs
                  inscrits.
                </p>
                {!viewer && (
                  <Link href={`/connexion?next=/startups/${startup.id}`} className="btn-secondary self-start">
                    Connexion
                  </Link>
                )}
              </div>
            )}
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card flex flex-col gap-6 border-t-signal/40 shadow-[var(--glow)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">{isOwner ? "Votre fiche publique" : "Demander une rencontre"}</h2>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {isOwner
                    ? "Voici ce que voient les investisseurs."
                    : `Rencontre individuelle de ${MEETINGS.durationMinutes} minutes au Village de l’Innovation.`}
                </p>
              </div>
              <Calendar className="shrink-0 text-signal" />
            </div>

            {canBook && existing ? (
              <div className="flex flex-col gap-4">
                <p
                  className={`rounded-lg border p-4 text-sm ${
                    existing.confirmed ? "border-success/25 bg-success/10 text-success" : "border-signal/25 bg-signal/10 text-signal"
                  }`}
                >
                  {existing.confirmed ? "Rencontre confirmée" : existing.mine ? "Demande envoyée, en attente de réponse" : "Cette startup vous propose un horaire"} :{" "}
                  <span className="inline-block first-letter:uppercase">{existing.label}</span>.
                </p>
                <p className="text-sm text-ink-muted">Une seule rencontre à la fois par startup. Gérez-la depuis votre espace.</p>
                <Link href="/espace" className="btn-secondary self-start">Gérer dans mon espace</Link>
              </div>
            ) : canBook ? (
              <BookingPanel
                days={days}
                startupId={startup.id}
                startupName={startup.name}
                duration={MEETINGS.durationMinutes}
              />
            ) : !viewer ? (
              <>
                <p className="text-sm text-ink-muted">Connectez-vous avec un compte investisseur pour demander une rencontre.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/connexion?next=/startups/${startup.id}`} className="btn-primary">
                    Connexion
                  </Link>
                  <Link href={`/inscription/investisseur?next=/startups/${startup.id}`} className="btn-secondary">
                    S’inscrire
                  </Link>
                </div>
              </>
            ) : viewer.role === "INVESTOR" ? (
              <p className="text-sm text-ink-muted">
                {viewer.status === "REJECTED"
                  ? "Votre compte a été suspendu par l'équipe du Village."
                  : "Votre profil est en cours d'examen par l'équipe du Village."}
              </p>
            ) : isOwner ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-ink-muted">Les investisseurs demandent une rencontre depuis cette page. Vous acceptez, refusez ou proposez un autre horaire depuis votre espace.</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/espace/profil" className="btn-primary">Modifier ma fiche</Link>
                  <Link href="/espace" className="btn-secondary">Mon espace</Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                {viewer.role === "ADMIN"
                  ? "Vue administrateur : seuls les investisseurs peuvent demander une rencontre."
                  : "Seuls les comptes investisseurs peuvent demander des rencontres."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
