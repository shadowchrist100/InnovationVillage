import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import { User } from "./icons";
import { getUser } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";

export default async function Header() {
  const user = await getUser();
  // Demandes de rencontre qui attendent une réponse de cette personne.
  const toAnswer =
    user && (user.investor || user.startup)
      ? await db.booking.count({
          where: {
            status: "PENDING",
            proposedBy: user.investor ? "STARTUP" : "INVESTOR",
            ...(user.investor ? { investorId: user.investor.id } : { startupId: user.startup!.id }),
          },
        })
      : 0;
  const home = user ? (user.role === "ADMIN" ? "/admin" : "/espace") : "/connexion";

  return (
    <header className="sticky top-0 z-30 h-(--header-h) border-b border-hairline bg-night/80 backdrop-blur-lg">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/" aria-label="Le Village de l’Innovation, accueil">
            <Logo height={34} />
          </Link>
          <Image
            src="/brand/mtdi.png"
            alt="République du Bénin · Ministère de la Transformation Digitale et de l’Innovation"
            width={412}
            height={100}
            className="hidden h-8 w-auto border-l border-hairline pl-4 lg:block"
          />
        </div>

        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={home} className="btn-secondary h-10 px-4">
                {user.role === "ADMIN" ? "Admin" : "Mon espace"}
                {toAnswer > 0 && (
                  <span aria-label={`${toAnswer} demande${toAnswer > 1 ? "s" : ""} à traiter`} className="grid min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[0.6875rem] font-bold text-night">
                    {toAnswer}
                  </span>
                )}
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-ghost h-10 px-3">
                  Quitter
                </button>
              </form>
            </>
          ) : (
            <Link href="/connexion" className="btn-secondary h-10 px-4">
              Connexion
            </Link>
          )}
          <Link
            href={home}
            aria-label={user ? "Mon compte" : "Se connecter"}
            className="grid size-10 place-items-center rounded-full bg-ink text-night transition-colors hover:bg-signal max-sm:hidden"
          >
            <User />
          </Link>
        </div>
      </div>
    </header>
  );
}
