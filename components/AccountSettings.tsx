"use client";

import { useActionState } from "react";
import PasswordInput from "./PasswordInput";
import Field, { FormBanner } from "./Field";
import { changePassword, deleteMyAccount } from "@/app/actions/account";

export default function AccountSettings() {
  const [pw, pwAction, pwPending] = useActionState(changePassword, {});
  const [del, delAction, delPending] = useActionState(deleteMyAccount, {});
  const fe = pw.fieldErrors ?? {};
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form key={pw.ok ? "done" : "form"} action={pwAction} className="card flex flex-col gap-5" noValidate>
        <h3 className="text-lg font-semibold">Changer mon mot de passe</h3>
        <Field label="Mot de passe actuel" name="current" error={fe.current}>
          <PasswordInput id="current" name="current" required autoComplete="current-password" />
        </Field>
        <Field label="Nouveau mot de passe" name="next" error={fe.next} hint="8 caractères minimum">
          <PasswordInput id="next" name="next" required autoComplete="new-password" />
        </Field>
        <FormBanner error={pw.fieldErrors ? undefined : pw.error} ok={pw.ok} okText="Mot de passe modifié." />
        <button type="submit" disabled={pwPending} className="btn-secondary self-start">
          {pwPending ? "Enregistrement…" : "Modifier"}
        </button>
      </form>

      <form
        action={delAction}
        className="card flex flex-col gap-5"
        onSubmit={(e) => {
          if (!confirm("Supprimer définitivement votre compte, votre profil et vos rencontres ?")) e.preventDefault();
        }}
      >
        <h3 className="text-lg font-semibold">Supprimer mon compte</h3>
        <p className="text-sm text-ink-muted">
          Votre profil, vos fichiers et vos rencontres seront effacés définitivement. Cette action est irréversible.
        </p>
        <Field label="Confirmez avec votre mot de passe" name="del-password">
          <PasswordInput id="del-password" name="password" required autoComplete="current-password" />
        </Field>
        <FormBanner error={del.error} />
        <button type="submit" disabled={delPending} className="btn-danger self-start">
          {delPending ? "Suppression…" : "Supprimer mon compte"}
        </button>
      </form>
    </div>
  );
}
