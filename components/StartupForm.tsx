"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import ImageField from "./ImageField";
import PasswordInput from "./PasswordInput";
import Field, { FormBanner } from "./Field";
import { SECTORS } from "@/lib/config";
import type { FormState } from "@/lib/validation";

type SavedMember = { name: string; role: string; bio?: string; photo?: string };
type Member = SavedMember & { uid: number };
const fileUrl = (name?: string) => (name ? `/fichiers/${name}` : null);

export type StartupValues = {
  name: string;
  logo: string;
  sector: string;
  country: string;
  website: string;
  demoVideoUrl: string;
  team: SavedMember[];
  whatTheyDo: string;
  origin: string;
  goal: string;
  problem: string;
};

const empty: StartupValues = {
  name: "",
  logo: "",
  sector: "",
  country: "Bénin",
  website: "",
  demoVideoUrl: "",
  team: [{ name: "", role: "" }],
  whatTheyDo: "",
  origin: "",
  goal: "",
  problem: "",
};

export default function StartupForm({
  action,
  initial,
  mode,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: StartupValues;
  mode: "register" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = initial ?? empty;
  const nextUid = useRef(0);
  const withUid = (m: SavedMember): Member => ({ ...m, uid: nextUid.current++ });
  const [team, setTeam] = useState<Member[]>(() => (v.team.length ? v.team : empty.team).map(withUid));
  const [, startTransition] = useTransition();
  const fe = state.fieldErrors ?? {};
  const d = (k: "name" | "sector" | "country" | "website" | "demoVideoUrl" | "whatTheyDo" | "origin" | "goal" | "problem") =>
    String(state.values?.[k] ?? v[k] ?? "");
  const setMember = (uid: number, patch: Partial<SavedMember>) =>
    setTeam((t) => t.map((x) => (x.uid === uid ? { ...x, ...patch } : x)));

  // On envoie le formulaire nous-mêmes : avec `action=`, React le réinitialiserait après chaque envoi
  // et la personne perdrait les images qu'elle vient de choisir en cas d'erreur.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
  const inv = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
      {mode === "register" && (
        <fieldset className="flex flex-col gap-5">
          <legend className="label mb-5 text-signal/80">Votre compte</legend>
          <Field label="Adresse e-mail" name="email" error={fe.email}>
            <input id="email" name="email" type="email" required autoComplete="email" defaultValue={String(state.values?.email ?? "")} className="input" placeholder="equipe@startup.bj" {...inv("email")} />
          </Field>
          <Field label="Mot de passe" name="password" error={fe.password} hint="8 caractères minimum.">
            <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" {...inv("password")} />
          </Field>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-5">
        <legend className="label mb-5 text-signal/80">La startup</legend>
        <ImageField
          name="logo"
          label="Logo de la startup"
          hint="PNG, JPEG ou WebP. Fond transparent conseillé."
          error={fe.logo}
          existingUrl={fileUrl(v.logo)}
          fallback="Logo"
          maxSize={600}
        />
        <Field label="Nom de la startup" name="name" error={fe.name}>
          <input id="name" name="name" required defaultValue={d("name")} className="input" {...inv("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Secteur" name="sector" error={fe.sector}>
            <select id="sector" name="sector" required defaultValue={d("sector")} className="input" {...inv("sector")}>
              <option value="" disabled>
                Choisir…
              </option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pays" name="country" error={fe.country}>
            <input id="country" name="country" required defaultValue={d("country")} className="input" {...inv("country")} />
          </Field>
        </div>
        <Field label="Ce que vous faites" name="whatTheyDo" error={fe.whatTheyDo} hint="Expliquez votre produit ou service simplement.">
          <textarea id="whatTheyDo" name="whatTheyDo" required rows={4} defaultValue={d("whatTheyDo")} className="input h-auto py-3" {...inv("whatTheyDo")} />
        </Field>
        <Field label="Quel problème résolvez-vous ?" name="problem" error={fe.problem}>
          <textarea id="problem" name="problem" required rows={4} defaultValue={d("problem")} className="input h-auto py-3" {...inv("problem")} />
        </Field>
        <Field label="D'où est venue l'idée ?" name="origin" error={fe.origin}>
          <textarea id="origin" name="origin" required rows={3} defaultValue={d("origin")} className="input h-auto py-3" {...inv("origin")} />
        </Field>
        <Field label="Votre objectif" name="goal" error={fe.goal} hint="Où voulez-vous aller dans les 12 à 24 prochains mois ?">
          <textarea id="goal" name="goal" required rows={3} defaultValue={d("goal")} className="input h-auto py-3" {...inv("goal")} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="label mb-5 text-signal/80">L’équipe</legend>
        <p className="-mt-2 text-13 text-ink-faint">
          Les photos de l’équipe sont visibles uniquement des investisseurs inscrits.
        </p>
        {team.map((member, i) => (
          <div key={member.uid} className="card flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <span className="label text-[0.6875rem] text-ink-faint">Membre {i + 1}</span>
              {team.length > 1 && (
                <button type="button" className="btn-ghost h-8 px-3" onClick={() => setTeam((t) => t.filter((x) => x.uid !== member.uid))}>
                  Retirer ce membre
                </button>
              )}
            </div>
            {member.photo && <input type="hidden" name={`team_photo_keep_${i}`} value={member.photo} />}
            <ImageField
              name={`team_photo_${i}`}
              label="Photo"
              hint="Optionnelle."
              existingUrl={fileUrl(member.photo)}
              onClearExisting={() => setMember(member.uid, { photo: undefined })}
              round
              compact
              maxSize={600}
              fallback={member.name ? member.name.slice(0, 2).toUpperCase() : "Photo"}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom" name={`team_name_${i}`}>
                <input id={`team_name_${i}`} name={`team_name_${i}`} value={member.name} onChange={(e) => setMember(member.uid, { name: e.target.value })} className="input" />
              </Field>
              <Field label="Rôle" name={`team_role_${i}`}>
                <input id={`team_role_${i}`} name={`team_role_${i}`} value={member.role} onChange={(e) => setMember(member.uid, { role: e.target.value })} className="input" placeholder="CEO, CTO…" />
              </Field>
            </div>
            <Field label="Bio" name={`team_bio_${i}`} hint="Optionnelle : parcours, expertise, expérience. Visible des investisseurs. 500 caractères maximum.">
              <textarea id={`team_bio_${i}`} name={`team_bio_${i}`} rows={3} maxLength={500} value={member.bio ?? ""} onChange={(e) => setMember(member.uid, { bio: e.target.value })} className="input h-auto py-3" />
            </Field>
          </div>
        ))}
        {fe.team && (
          <p role="alert" className="text-13 text-destructive">
            {fe.team}
          </p>
        )}
        {team.length < 12 && (
          <button type="button" className="btn-secondary self-start" onClick={() => setTeam((t) => [...t, withUid({ name: "", role: "" })])}>
            + Ajouter un membre
          </button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="label mb-5 text-signal/80">Démo et liens</legend>
        <Field label="Lien vers votre produit ou site" name="website" error={fe.website}>
          <input id="website" name="website" type="url" required defaultValue={d("website")} className="input" placeholder="https://" {...inv("website")} />
        </Field>
        <Field label="Vidéo de démo" name="demoVideoUrl" error={fe.demoVideoUrl} hint="Lien YouTube ou Vimeo, de préférence.">
          <input id="demoVideoUrl" name="demoVideoUrl" type="url" defaultValue={d("demoVideoUrl")} className="input" placeholder="https://youtube.com/watch?v=…" {...inv("demoVideoUrl")} />
        </Field>
      </fieldset>

      <FormBanner error={state.error} ok={state.ok} okText="Profil enregistré." />
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Envoi…" : mode === "register" ? "Inscrire ma startup" : "Enregistrer"}
      </button>
    </form>
  );
}
