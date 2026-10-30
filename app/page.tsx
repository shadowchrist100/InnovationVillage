import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { MEETINGS } from "@/lib/config";
import { allSlots } from "@/lib/slots";
import { ArrowRight, Briefcase, Pin, Rocket, Search, Shield } from "@/components/icons";

const steps = [
  {
    n: "01",
    title: "Je m'inscris",
    text: "Créez le profil détaillé de votre startup ou de votre structure d'investissement en quelques minutes.",
  },
  {
    n: "02",
    title: "Mon profil est en ligne",
    text: "Dès l'inscription, votre profil est visible : les startups dans l'annuaire, les investisseurs avec accès à la réservation.",
  },
  {
    n: "03",
    title: "L'investisseur choisit",
    text: `Les investisseurs parcourent l'annuaire, regardent les démos et réservent des rencontres de ${MEETINGS.durationMinutes} minutes.`,
  },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const deleted = (await searchParams).compte === "supprime";
  const [user, startups] = await Promise.all([
    getUser(),
    db.startup.count({ where: { user: { status: "APPROVED" } } }),
  ]);
  const role = user?.role;
  const slotsPerDay = Object.values(allSlots())[0]?.length ?? 0;

  const stats = [
    { value: String(MEETINGS.days.length), label: "Jours d'immersion" },
    { value: String(MEETINGS.durationMinutes), label: "Minutes par rencontre" },
    { value: String(slotsPerDay), label: "Créneaux par jour" },
    { value: String(startups), label: startups > 1 ? "Startups inscrites" : "Startup inscrite" },
  ];

  return (
    <>
      {deleted && (
        <p role="status" className="bg-success/10 px-4 py-3 text-center text-sm text-success">
          Votre compte a bien été supprimé.
        </p>
      )}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(0,255,255,0.12),transparent_70%)]"
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-5 pt-16 pb-14 text-center sm:pt-24">
          <p className="pill border-signal/30 bg-signal/5 text-signal">
            <span className="size-1.5 rounded-full bg-signal shadow-[0_0_8px_var(--signal)]" aria-hidden />
            Benin Digital &amp; Innovation Week · 18-20 novembre 2026
          </p>
          <h1 className="display text-[clamp(2rem,5.5vw,3.5rem)]">
            Startups et investisseurs, rencontrez-vous au <span className="text-signal">Village</span>
          </h1>
          <p className="max-w-[52ch] text-[clamp(1.0625rem,2vw,1.25rem)] leading-relaxed text-ink-muted">
            Présentez votre projet, découvrez celles et ceux qui innovent, et planifiez vos rencontres à l’esplanade du
            Palais des Congrès de Cotonou.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-4 py-2">
              <Pin className="text-signal" width={16} height={16} />
              Esplanade du Palais des Congrès · Cotonou
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-4 py-2">
              <Shield className="text-success" width={16} height={16} />
              Profil en ligne dès l’inscription
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
        <article className="card-link flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <span className="pill border-signal/25 bg-signal/10 text-signal">Espace entrepreneurs</span>
            <Rocket className="text-signal" />
          </div>
          <h2 className="display text-[1.75rem] leading-[1.15]">Startups : montrez ce que vous construisez</h2>
          <p className="leading-relaxed text-ink-muted">
            Présentez votre équipe, le problème que vous résolvez et votre démo. Les investisseurs vous trouvent et vous
            réservent un créneau.
          </p>
          {role === "INVESTOR" ? (
            <Link href="/startups" className="btn-primary mt-auto self-start">
              Découvrir les startups
              <ArrowRight width={16} height={16} />
            </Link>
          ) : role === "ADMIN" ? (
            <Link href="/admin" className="btn-primary mt-auto self-start">
              Administration
              <ArrowRight width={16} height={16} />
            </Link>
          ) : (
            <Link href={role === "STARTUP" ? "/espace" : "/inscription/startup"} className="btn-primary mt-auto self-start">
              {role === "STARTUP" ? "Mon espace startup" : "Inscrire ma startup"}
              <ArrowRight width={16} height={16} />
            </Link>
          )}
        </article>

        <article className="card-link flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <span className="pill border-signal/25 bg-signal/10 text-signal">Espace investisseurs</span>
            <Briefcase className="text-signal" />
          </div>
          <h2 className="display text-[1.75rem] leading-[1.15]">Investisseurs : repérez les startups à rencontrer</h2>
          <p className="leading-relaxed text-ink-muted">
            Présentez-vous, parcourez l’annuaire, visionnez les démos et réservez vos rencontres de{" "}
            {MEETINGS.durationMinutes} minutes selon le calendrier du Village.
          </p>
          {role === "STARTUP" ? (
            <p className="mt-auto rounded-lg border border-hairline bg-night/40 px-4 py-3 text-sm text-ink-muted">
              Vous êtes connecté avec un compte startup : les investisseurs vous réservent depuis votre fiche.
            </p>
          ) : role === "ADMIN" ? (
            <Link href="/admin" className="btn-secondary mt-auto self-start">
              Administration
              <ArrowRight width={16} height={16} />
            </Link>
          ) : (
            <Link href={role === "INVESTOR" ? "/espace" : "/inscription/investisseur"} className="btn-secondary mt-auto self-start">
              {role === "INVESTOR" ? "Mon espace investisseur" : "M'inscrire comme investisseur"}
              <ArrowRight width={16} height={16} />
            </Link>
          )}
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6" aria-labelledby="how">
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <p className="label text-signal/80">Processus · 3 étapes</p>
          <h2 id="how" className="display text-[clamp(1.75rem,4vw,2.5rem)]">
            Comment fonctionne le Village de l’Innovation ?
          </h2>
          <span className="h-px w-16 bg-signal/60" aria-hidden />
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="card flex flex-col gap-4">
              <span className="counter text-5xl">{s.n}</span>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <p className="leading-relaxed text-ink-muted">{s.text}</p>
              <span className="mt-auto h-0.5 w-8 bg-signal/50" aria-hidden />
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Le Village en chiffres">
        <div className="card flex flex-col gap-8 p-8">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <dd className="counter order-1 text-[clamp(2rem,4vw,3rem)] leading-none">{s.value}</dd>
                <dt className="label order-2 text-[0.6875rem] text-ink-faint">{s.label}</dt>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-ink-muted">
              <span className="size-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_var(--success)]" aria-hidden />
              L’annuaire des startups inscrites est ouvert à tous les visiteurs.
            </p>
            <Link href="/startups" className="btn-secondary self-start">
              <Search width={16} height={16} />
              Parcourir l’annuaire
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
