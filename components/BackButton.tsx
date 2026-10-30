"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "./icons";

/** Bouton « Retour » sur toutes les pages sauf l'accueil : revient à la page précédente, ou à l'accueil à défaut. */
export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="btn-ghost -ml-3 h-9 px-3"
      >
        <ArrowLeft width={16} height={16} />
        Retour
      </button>
    </div>
  );
}
