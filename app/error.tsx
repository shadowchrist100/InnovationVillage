"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="display text-[2rem]">Une erreur est survenue</h1>
      <p className="text-ink-muted">Réessayez dans un instant. Si le problème persiste, contactez l’équipe du Village.</p>
      <button type="button" onClick={reset} className="btn-primary">Réessayer</button>
    </div>
  );
}
