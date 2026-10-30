import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <p className="counter text-6xl">404</p>
      <h1 className="display text-[2rem]">Page introuvable</h1>
      <p className="text-ink-muted">Cette page n’existe pas, ou la startup n’est plus visible dans l’annuaire.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-secondary">Accueil</Link>
        <Link href="/startups" className="btn-primary">Voir les startups</Link>
      </div>
    </div>
  );
}
