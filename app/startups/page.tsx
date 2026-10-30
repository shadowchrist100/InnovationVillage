import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { MEETINGS, SECTORS } from "@/lib/config";
import StartupLogo from "@/components/StartupLogo";
import { ArrowRight, Calendar, Pin, Search } from "@/components/icons";

export const metadata: Metadata = { title: "Startups" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: PageProps<"/startups">) {
  const sp = await searchParams;
  const sectorParam = first(sp.secteur);
  const sector = sectorParam && (SECTORS as readonly string[]).includes(sectorParam) ? sectorParam : undefined;
  const q = first(sp.q)?.trim().slice(0, 80) ?? "";

  const viewer = await getUser();
  const PAGE_SIZE = 24;
  const where = {
      user: { status: "APPROVED" },
      ...(sector ? { sector } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { whatTheyDo: { contains: q } },
              { problem: { contains: q } },
              { country: { contains: q } },
            ],
          }
        : {}),
    };
  const total = await db.startup.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1), pages);
  const startups = await db.startup.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const href = (s?: string, p = 1) => {
    const params = new URLSearchParams();
    if (s) params.set("secteur", s);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/startups?${qs}` : "/startups";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="label flex items-center gap-2 text-signal/80">
            <span className="size-1.5 rounded-full bg-signal shadow-[0_0_8px_var(--signal)]" aria-hidden />
            Annuaire officiel
          </p>
          <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Les startups du Village</h1>
          <p className="leading-relaxed text-ink-muted">
            Explorez les startups inscrites au Village et réservez vos rencontres avec les fondateurs.
          </p>
        </div>
        <div className="card flex gap-8 px-6 py-5">
          <div>
            <p className="label text-[0.6875rem] text-ink-faint">Résultats</p>
            <p className="counter text-3xl">{total}</p>
          </div>
        </div>
      </header>

      <div className="mb-10 flex flex-col gap-4">
        <form action="/startups" role="search" className="relative sm:w-96">
          {sector && <input type="hidden" name="secteur" value={sector} />}
          <label htmlFor="q" className="sr-only">
            Rechercher une startup
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
          <input id="q" name="q" defaultValue={q} placeholder="Rechercher par nom, mot-clé…" className="input pl-11" />
        </form>
        <nav aria-label="Filtrer par secteur" className="flex flex-wrap gap-2">
          {[undefined, ...SECTORS].map((s) => {
            const active = s === sector;
            return (
              <Link
                key={s ?? "all"}
                href={href(s)}
                aria-current={active ? "true" : undefined}
                className={`btn h-10 px-4 ${
                  active ? "bg-signal font-semibold text-night" : "border border-hairline bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {s ?? "Tous"}
              </Link>
            );
          })}
        </nav>
      </div>

      {startups.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg">Aucune startup trouvée.</p>
          <p className="text-ink-muted">
            {sector || q ? "Essayez un autre secteur ou un autre mot-clé." : "Les premières startups apparaîtront dès leur inscription."}
          </p>
          {(sector || q) && (
            <Link href="/startups" className="btn-secondary mt-2">
              Réinitialiser les filtres
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <li key={s.id}>
              <Link href={`/startups/${s.id}`} className="card-link group flex h-full flex-col gap-4">
                <div className="flex items-center gap-4">
                  <StartupLogo name={s.name} logo={s.logo} size="md" />
                  <p className="label text-[0.6875rem] text-signal/80">
                    {s.sector} · {s.country}
                  </p>
                </div>
                <h2 className="display text-[1.625rem] leading-[1.15]">{s.name}</h2>
                <p className="line-clamp-3 leading-relaxed text-ink-muted">{s.whatTheyDo}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-ink-faint">
                    <Pin width={15} height={15} />
                    {s.country}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-signal">
                    Découvrir la fiche
                    <ArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={href(sector, page - 1)} className="btn-secondary h-10 px-4">
              Précédent
            </Link>
          )}
          <span className="label text-[0.6875rem] text-ink-faint">
            Page {page} / {pages}
          </span>
          {page < pages && (
            <Link href={href(sector, page + 1)} className="btn-secondary h-10 px-4">
              Suivant
            </Link>
          )}
        </nav>
      )}

      {(!viewer || viewer.role === "INVESTOR") && (
      <aside className="card mt-16 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal">
            <Calendar />
          </span>
          <div>
            <p className="text-lg font-medium">Vous souhaitez rencontrer ces équipes ?</p>
            <p className="text-sm text-ink-muted">
              Réservez des créneaux de {MEETINGS.durationMinutes} minutes pendant les {MEETINGS.days.length} jours du Village.
            </p>
          </div>
        </div>
        {viewer ? (
          <Link href="/espace" className="btn-primary self-start sm:self-auto">
            Mes rencontres
            <Calendar width={16} height={16} />
          </Link>
        ) : (
          <Link href="/inscription/investisseur" className="btn-primary self-start sm:self-auto">
            Planifier un rendez-vous
            <Calendar width={16} height={16} />
          </Link>
        )}
      </aside>
      )}
    </div>
  );
}
