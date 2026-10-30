"use client";

import { useActionState } from "react";
import PasswordInput from "./PasswordInput";
import Field, { FormBanner } from "./Field";
import { SECTORS } from "@/lib/config";
import type { FormState } from "@/lib/validation";

export type InvestorValues = {
  fullName: string;
  organization: string;
  position: string;
  country: string;
  city: string;
  bio: string;
  sectors: string[];
  website: string;
};

const empty: InvestorValues = {
  fullName: "",
  organization: "",
  position: "",
  country: "",
  city: "",
  bio: "",
  sectors: [],
  website: "",
};

export default function InvestorForm({
  action,
  initial,
  mode,
  next,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: InvestorValues;
  mode: "register" | "edit";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = initial ?? empty;
  const fe = state.fieldErrors ?? {};
  // React vide le formulaire après l'envoi : on ré-affiche ce que la personne avait saisi.
  const d = (k: Exclude<keyof InvestorValues, "sectors">) => String(state.values?.[k] ?? v[k] ?? "");
  const chosen = (state.values?.sectors as string[] | undefined) ?? v.sectors;
  const inv = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <form action={formAction} className="flex flex-col gap-10" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "register" && (
        <fieldset className="flex flex-col gap-5">
          <legend className="label mb-5 text-signal/80">Votre compte</legend>
          <Field label="Adresse e-mail" name="email" error={fe.email}>
            <input id="email" name="email" type="email" required autoComplete="email" defaultValue={String(state.values?.email ?? "")} className="input" placeholder="prenom@fonds.com" {...inv("email")} />
          </Field>
          <Field label="Mot de passe" name="password" error={fe.password} hint="8 caractères minimum.">
            <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" {...inv("password")} />
          </Field>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-5">
        <legend className="label mb-5 text-signal/80">Qui êtes-vous ?</legend>
        <Field label="Nom complet" name="fullName" error={fe.fullName}>
          <input id="fullName" name="fullName" required autoComplete="name" defaultValue={d("fullName")} className="input" {...inv("fullName")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Structure, fonds ou entreprise" name="organization" error={fe.organization}>
            <input id="organization" name="organization" required defaultValue={d("organization")} className="input" {...inv("organization")} />
          </Field>
          <Field label="Votre fonction" name="position" error={fe.position}>
            <input id="position" name="position" required defaultValue={d("position")} className="input" placeholder="Partner, Business Angel…" {...inv("position")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Pays d'origine" name="country" error={fe.country}>
            <input id="country" name="country" required defaultValue={d("country")} className="input" {...inv("country")} />
          </Field>
          <Field label="Ville où vous travaillez" name="city" error={fe.city}>
            <input id="city" name="city" required defaultValue={d("city")} className="input" {...inv("city")} />
          </Field>
        </div>
        <Field label="Présentez-vous" name="bio" error={fe.bio} hint="Votre parcours, ce que vous recherchez, le type de startups que vous accompagnez.">
          <textarea id="bio" name="bio" required rows={5} defaultValue={d("bio")} className="input h-auto py-3" {...inv("bio")} />
        </Field>
        <Field label="Site ou profil LinkedIn" name="website" error={fe.website}>
          <input id="website" name="website" type="url" defaultValue={d("website")} className="input" placeholder="https://" {...inv("website")} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4" aria-describedby={fe.sectors ? "sectors-error" : undefined}>
        <legend className="label mb-5 text-signal/80">Secteurs qui vous intéressent</legend>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <label key={s} className="cursor-pointer">
              <input type="checkbox" name="sectors" value={s} defaultChecked={chosen.includes(s)} className="peer sr-only" />
              <span className="inline-flex rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-muted transition-colors peer-checked:bg-signal peer-checked:text-night peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-signal">
                {s}
              </span>
            </label>
          ))}
        </div>
        {fe.sectors && (
          <p id="sectors-error" role="alert" className="text-13 text-destructive">
            {fe.sectors}
          </p>
        )}
      </fieldset>

      <FormBanner error={state.error} ok={state.ok} okText="Profil enregistré." />
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Envoi…" : mode === "register" ? "M'inscrire comme investisseur" : "Enregistrer"}
      </button>
    </form>
  );
}
