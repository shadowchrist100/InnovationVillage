import { z } from "zod";

const text = (label: string, min = 2, max = 200) =>
  z.string().trim().min(min, `${label} : trop court`).max(max, `${label} : trop long`);

const longText = (label: string) => text(label, 20, 2000);

const url = (label: string, required = true) =>
  z
    .string()
    .trim()
    .refine((v) => (required ? v.length > 0 : true), `${label} : requis`)
    .refine((v) => {
      if (!v) return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, `${label} : lien invalide (https://…)`);

export const accountSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(100),
});

export const teamSchema = z
  .array(
    z.object({
      name: text("Nom du membre", 2, 80),
      role: text("Rôle du membre", 2, 80),
      bio: z.string().trim().max(500, "Bio : 500 caractères maximum").optional(),
      photo: z.string().optional(),
    }),
  )
  .min(1, "Ajoutez au moins un membre de l'équipe")
  .max(12);

export const startupSchema = z.object({
  name: text("Nom de la startup", 2, 80),
  sector: text("Secteur", 2, 60),
  country: text("Pays", 2, 60),
  website: url("Lien du produit ou du site"),
  demoVideoUrl: url("Lien de la vidéo de démo", false),
  whatTheyDo: longText("Ce que vous faites"),
  origin: longText("D'où vient l'idée"),
  goal: longText("Objectif"),
  problem: longText("Problème résolu"),
});

export const investorSchema = z.object({
  fullName: text("Nom complet", 2, 100),
  organization: text("Structure / fonds", 2, 120),
  position: text("Fonction", 2, 100),
  country: text("Pays d'origine", 2, 60),
  city: text("Ville où vous travaillez", 2, 80),
  bio: longText("Présentation"),
  sectors: z.array(z.string()).min(1, "Choisissez au moins un secteur"),
  website: url("Site ou LinkedIn", false),
});

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, renvoyées en cas d'erreur car React vide le formulaire après l'envoi. */
  values?: Record<string, string | string[]>;
};

/** Valeurs du formulaire à ré-afficher après une erreur (le mot de passe n'est jamais renvoyé). */
export function rawValues(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key === "password" || key.startsWith("$ACTION")) continue;
    const v = fd.get(key);
    if (v instanceof File) continue;
    out[key] = key === "sectors" ? fd.getAll(key).map(String) : String(v ?? "");
  }
  return out;
}

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/** Récupère l'équipe depuis les champs team_name_i / team_role_i (et la photo déjà enregistrée team_photo_keep_i). */
export function readTeam(fd: FormData) {
  const members: { idx: number; name: string; role: string; bio?: string; photo?: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const name = String(fd.get(`team_name_${i}`) ?? "").trim();
    const role = String(fd.get(`team_role_${i}`) ?? "").trim();
    const bio = String(fd.get(`team_bio_${i}`) ?? "").trim();
    const keep = String(fd.get(`team_photo_keep_${i}`) ?? "").trim();
    const hasNewPhoto = fd.get(`team_photo_${i}`) instanceof File && (fd.get(`team_photo_${i}`) as File).size > 0;
    if (name || role || hasNewPhoto) members.push({ idx: i, name, role, ...(bio ? { bio } : {}), ...(keep ? { photo: keep } : {}) });
  }
  return members;
}
