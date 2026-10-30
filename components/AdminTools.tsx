"use client";

import { useState, useTransition } from "react";
import { adminDeleteUser, adminResetPassword } from "@/app/actions/account";

export default function AdminTools({ userId, label }: { userId: string; label: string }) {
  const [pending, start] = useTransition();
  const [temp, setTemp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3 border-t border-hairline pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="btn-ghost h-9 px-3"
          onClick={() =>
            start(async () => {
              const res = await adminResetPassword(userId);
              setError(res.error ?? null);
              setTemp(res.password ?? null);
            })
          }
        >
          Réinitialiser le mot de passe
        </button>
        <button
          type="button"
          disabled={pending}
          className="btn-ghost h-9 px-3 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm(`Supprimer définitivement « ${label} » ? Son profil et ses rencontres seront effacés.`)) {
              start(async () => {
                const res = await adminDeleteUser(userId);
                if (res.error) setError(res.error);
              });
            }
          }}
        >
          Supprimer le compte
        </button>
      </div>
      {temp && (
        <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          Mot de passe temporaire (à transmettre à la personne, affiché une seule fois) :{" "}
          <code className="font-mono font-semibold select-all">{temp}</code>
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
