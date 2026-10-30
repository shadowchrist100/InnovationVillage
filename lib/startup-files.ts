import "server-only";
import { deleteImages, inspectImage, storeImage, type Inspected } from "./uploads";

export type Member = { name: string; role: string; bio?: string; photo?: string };

type Current = { logo: string; team: Member[] } | null;

type Result =
  | { ok: false; fieldErrors: Record<string, string> }
  | {
      ok: true;
      logo: string;
      team: Member[];
      /** Fichiers créés : à supprimer si l'enregistrement en base échoue. */
      created: string[];
      /** Anciens fichiers remplacés ou retirés : à supprimer une fois la base à jour. */
      obsolete: string[];
    };

const fileOf = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
};

/**
 * Traite le logo et les photos de l'équipe d'un formulaire startup.
 * 1) tout est vérifié (taille, format réel) avant d'écrire quoi que ce soit ;
 * 2) puis les nouveaux fichiers sont enregistrés.
 * Une photo existante n'est conservée que si elle appartient déjà à cette startup.
 */
export async function applyStartupFiles(
  fd: FormData,
  members: { idx: number; name: string; role: string; bio?: string; photo?: string }[],
  current: Current,
): Promise<Result> {
  const errors: Record<string, string> = {};

  const logoFile = fileOf(fd, "logo");
  let logoImg: Inspected | null = null;
  if (logoFile) {
    logoImg = await inspectImage(logoFile);
    if (!logoImg.ok) errors.logo = logoImg.error;
  } else if (!current?.logo) {
    errors.logo = "Ajoutez le logo de votre startup.";
  }

  const photoImgs = new Map<number, Inspected>();
  for (let i = 0; i < members.length; i++) {
    const f = fileOf(fd, `team_photo_${members[i].idx}`);
    if (!f) continue;
    const img = await inspectImage(f);
    if (!img.ok) errors.team = `Photo de ${members[i].name || `membre ${members[i].idx + 1}`} : ${img.error}`;
    else photoImgs.set(i, img);
  }

  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };

  const owned = new Set([current?.logo, ...(current?.team ?? []).map((m) => m.photo)].filter(Boolean) as string[]);
  const created: string[] = [];
  const keep = new Set<string>();

  let logo = current?.logo ?? "";
  if (logoImg?.ok) {
    logo = await storeImage(logoImg, "logo");
    created.push(logo);
  } else if (logo) keep.add(logo);

  const team: Member[] = [];
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const img = photoImgs.get(i);
    let photo: string | undefined;
    if (img?.ok) {
      photo = await storeImage(img, "team");
      created.push(photo);
    } else if (m.photo && owned.has(m.photo)) {
      photo = m.photo;
      keep.add(photo);
    }
    team.push({ name: m.name, role: m.role, ...(m.bio ? { bio: m.bio } : {}), ...(photo ? { photo } : {}) });
  }

  const obsolete = [...owned].filter((n) => !keep.has(n));
  return { ok: true, logo, team, created, obsolete };
}

export { deleteImages };
