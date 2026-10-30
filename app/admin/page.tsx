import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";
import ReviewButtons from "@/components/ReviewButtons";
import AdminTools from "@/components/AdminTools";
import StartupLogo from "@/components/StartupLogo";
import TeamPhoto from "@/components/TeamPhoto";
import { ArrowUpRight, Briefcase, ChevronDown, Rocket } from "@/components/icons";

export const metadata: Metadata = { title: "Administration" };

const FILTERS = [
  { key: "ALL", label: "Tous" },
  { key: "APPROVED", label: "Actifs" },
  { key: "PENDING", label: "En examen" },
  { key: "REJECTED", label: "Suspendus" },
] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="label text-[0.6875rem] text-signal/80">{title}</dt>
      <dd className="leading-relaxed whitespace-pre-line text-ink-muted">{children}</dd>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const requested = first(sp.statut);
  const filter = FILTERS.some((f) => f.key === requested) ? (requested as (typeof FILTERS)[number]["key"]) : "ALL";

  const [all, bookings] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["STARTUP", "INVESTOR"] } },
      include: { startup: true, investor: true },
      orderBy: { createdAt: "desc" },
    }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
  ]);

  const count = (s: string) => all.filter((u) => u.status === s).length;
  const counts = { PENDING: count("PENDING"), APPROVED: count("APPROVED"), REJECTED: count("REJECTED"), ALL: all.length };
  const users = filter === "ALL" ? all : all.filter((u) => u.status === filter);

  const stats = [
    { label: "Inscrits", value: all.length, tone: "" },
    { label: "Startups", value: all.filter((u) => u.role === "STARTUP").length, tone: "" },
    { label: "Investisseurs", value: all.filter((u) => u.role === "INVESTOR").length, tone: "" },
    { label: "Rencontres confirmées", value: bookings, tone: "" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="label mb-4 text-signal/80">Administration</p>
      <h1 className="display mb-10 text-[clamp(2rem,5vw,3rem)]">Gestion des profils</h1>

      <dl className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col gap-2 p-5">
            <dt className="label order-2 text-[0.6875rem] text-ink-faint">{s.label}</dt>
            <dd className={`counter order-1 text-3xl ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <nav aria-label="Filtrer par statut" className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.key === "ALL" ? "/admin" : `/admin?statut=${f.key}`}
              aria-current={active ? "true" : undefined}
              className={`btn h-10 gap-2 px-4 ${
                active ? "bg-signal font-semibold text-night" : "border border-hairline bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {f.label}
              <span className={`label text-[0.6875rem] ${active ? "text-night/70" : "text-ink-faint"}`}>{counts[f.key]}</span>
            </Link>
          );
        })}
      </nav>

      {users.length === 0 ? (
        <div className="card py-16 text-center text-ink-muted">
          Aucun profil dans cette catégorie.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {users.map((u) => (
            <li key={u.id} className="card flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="label flex items-center gap-2 text-signal/80">
                  {u.role === "STARTUP" ? <Rocket width={16} height={16} /> : <Briefcase width={16} height={16} />}
                  {u.role === "STARTUP" ? "Startup" : "Investisseur"}
                </span>
                <StatusBadge status={u.status} />
                <span className="ml-auto text-13 text-ink-faint">{u.email}</span>
              </div>

              {u.startup && (
                <>
                  <div className="flex items-start gap-4">
                    <StartupLogo name={u.startup.name} logo={u.startup.logo} size="lg" />
                    <div className="flex min-w-0 flex-col gap-2">
                      <h2 className="display text-[1.625rem] leading-[1.15]">{u.startup.name}</h2>
                      <p className="label text-[0.6875rem] text-ink-faint">
                        {u.startup.sector} · {u.startup.country}
                      </p>
                      <p className="line-clamp-2 text-ink-muted">{u.startup.whatTheyDo}</p>
                    </div>
                  </div>
                  <details className="group rounded-lg border border-hairline bg-night/40">
                    <summary className="label flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[0.6875rem] text-signal marker:hidden">
                      Voir le dossier complet
                      <ChevronDown width={16} height={16} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <dl className="flex flex-col gap-5 border-t border-hairline p-4">
                      <Detail title="Ce qu'ils font">{u.startup.whatTheyDo}</Detail>
                      <Detail title="Problème résolu">{u.startup.problem}</Detail>
                      <Detail title="D'où vient l'idée">{u.startup.origin}</Detail>
                      <Detail title="Objectif">{u.startup.goal}</Detail>
                      <div className="flex flex-col gap-3">
                        <dt className="label text-[0.6875rem] text-signal/80">Équipe</dt>
                        <dd>
                          <ul className="flex flex-wrap gap-3">
                            {(JSON.parse(u.startup.team) as { name: string; role: string; bio?: string; photo?: string }[]).map((m, i) => (
                              <li key={i} className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2">
                                <TeamPhoto name={m.name} photo={m.photo} size="sm" />
                                <span className="flex flex-col text-sm">
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-ink-faint">{m.role}</span>
                                  {m.bio && <span className="mt-1 max-w-xs whitespace-pre-line text-ink-muted">{m.bio}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    </dl>
                  </details>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a href={u.startup.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-signal hover:underline">
                      Produit <ArrowUpRight width={14} height={14} />
                    </a>
                    {u.startup.demoVideoUrl && (
                      <a href={u.startup.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-signal hover:underline">
                        Vidéo de démo <ArrowUpRight width={14} height={14} />
                      </a>
                    )}
                    {u.status === "APPROVED" && (
                      <Link href={`/startups/${u.startup.id}`} className="text-signal hover:underline">
                        Page publique
                      </Link>
                    )}
                  </div>
                </>
              )}

              {u.investor && (
                <>
                  <div className="flex flex-col gap-2">
                    <h2 className="display text-[1.625rem] leading-[1.15]">{u.investor.fullName}</h2>
                    <p className="label text-[0.6875rem] text-ink-faint">
                      {u.investor.position} · {u.investor.organization}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {u.investor.city}, {u.investor.country}
                    </p>
                    <p className="line-clamp-2 text-ink-muted">{u.investor.bio}</p>
                  </div>
                  <details className="group rounded-lg border border-hairline bg-night/40">
                    <summary className="label flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[0.6875rem] text-signal marker:hidden">
                      Voir le dossier complet
                      <ChevronDown width={16} height={16} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <dl className="flex flex-col gap-5 border-t border-hairline p-4">
                      <Detail title="Présentation">{u.investor.bio}</Detail>
                      <Detail title="Secteurs d'intérêt">{u.investor.sectors.split(",").join(" · ")}</Detail>
                    </dl>
                  </details>
                  {u.investor.website && (
                    <a href={u.investor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start text-sm text-signal hover:underline">
                      Site / LinkedIn <ArrowUpRight width={14} height={14} />
                    </a>
                  )}
                </>
              )}

              <ReviewButtons userId={u.id} status={u.status} />
              <AdminTools userId={u.id} label={u.startup?.name ?? u.investor?.fullName ?? u.email} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
