import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** Dossier hors de `public/` : aucun fichier n'est servi sans passer par /fichiers/[name]. */
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageKind = "logo" | "team";
type Ext = "png" | "jpg" | "webp";

export const MIME: Record<Ext, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Noms de fichiers générés par nous : logo-<uuid>.png | team-<uuid>.jpg … */
export const FILE_RE = /^(logo|team)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

/** Reconnaît le format réel d'après les premiers octets (l'extension et le type envoyés ne sont pas fiables). */
function sniff(b: Buffer): Ext | null {
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP")
    return "webp";
  return null; // SVG et GIF volontairement refusés (SVG peut contenir du script)
}

export type Inspected = { ok: true; buf: Buffer; ext: Ext } | { ok: false; error: string };

export async function inspectImage(file: File): Promise<Inspected> {
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Image trop lourde (2 Mo maximum)." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { ok: false, error: "Format non pris en charge (PNG, JPEG ou WebP)." };
  return { ok: true, buf, ext };
}

export async function storeImage(img: { buf: Buffer; ext: Ext }, kind: ImageKind): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${kind}-${randomUUID()}.${img.ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), img.buf, { flag: "wx" });
  return name;
}

export async function deleteImages(names: Iterable<string | null | undefined>) {
  for (const n of names) {
    if (!n || !FILE_RE.test(n)) continue;
    await unlink(path.join(UPLOAD_DIR, n)).catch(() => {});
  }
}

export async function readImage(name: string): Promise<{ buf: Buffer; mime: string } | null> {
  const m = FILE_RE.exec(name);
  if (!m) return null;
  try {
    return { buf: await readFile(path.join(UPLOAD_DIR, name)), mime: MIME[m[2] as Ext] };
  } catch {
    return null;
  }
}

export const fileUrl = (name: string | null | undefined) => (name ? `/fichiers/${name}` : null);
