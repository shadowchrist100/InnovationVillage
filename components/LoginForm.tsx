"use client";

import { useActionState } from "react";
import PasswordInput from "./PasswordInput";
import Field, { FormBanner } from "./Field";
import { login } from "@/app/actions/auth";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, {});
  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Adresse e-mail" name="email">
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field label="Mot de passe" name="password">
        <PasswordInput id="password" name="password" required autoComplete="current-password" />
      </Field>
      <FormBanner error={state.error} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
