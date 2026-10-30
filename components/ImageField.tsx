"use client";

import { useEffect, useRef, useState } from "react";

const ACCEPT = "image/png,image/jpeg,image/webp";

/** Réduit l'image dans le navigateur (max `maxSize` px, WebP) : envoi rapide, même sur une connexion lente. */
async function shrink(file: File, maxSize: number): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.88));
  if (!blob || blob.type !== "image/webp") return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

export default function ImageField({
  name,
  label,
  hint,
  error,
  existingUrl,
  onClearExisting,
  round = false,
  maxSize = 800,
  fallback,
  compact = false,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  /** Image déjà enregistrée (modification d'un profil). */
  existingUrl?: string | null;
  /** Appelé quand la personne retire l'image enregistrée. */
  onClearExisting?: () => void;
  round?: boolean;
  maxSize?: number;
  fallback?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = preview ?? existingUrl ?? null;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    setBusy(true);
    try {
      const small = await shrink(file, maxSize);
      const dt = new DataTransfer();
      dt.items.add(small);
      e.target.files = dt.files;
      setPreview(URL.createObjectURL(small));
    } catch {
      e.target.value = "";
      setPreview(null);
      setLocalError("Impossible de lire cette image. Utilisez un fichier PNG, JPEG ou WebP.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    if (input.current) input.current.value = "";
    setPreview(null);
    setLocalError(null);
    onClearExisting?.();
  }

  const box = `${compact ? "size-16" : "size-24"} ${round ? "rounded-full" : "rounded-xl"}`;
  const msg = localError ?? error;

  return (
    <div className="flex items-center gap-4">
      <div
        className={`${box} grid shrink-0 place-items-center overflow-hidden border border-dashed border-hairline bg-surface-2 text-ink-faint`}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou fichier servi par /fichiers
          <img src={shown} alt="" className={`size-full ${round ? "object-cover" : "object-contain p-2"}`} />
        ) : (
          <span className="label text-[0.625rem]">{fallback ?? "Image"}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-13 text-ink-faint">{hint}</span>}
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-secondary h-9 cursor-pointer px-3 focus-within:outline focus-within:outline-2 focus-within:outline-signal">
            {busy ? "Traitement…" : shown ? "Changer" : "Choisir une image"}
            <input
              ref={input}
              type="file"
              name={name}
              accept={ACCEPT}
              onChange={onPick}
              className="sr-only"
              aria-label={label}
            />
          </label>
          {shown && onClearExisting && (
            <button type="button" onClick={clear} className="btn-ghost h-9 px-3">
              Retirer
            </button>
          )}
        </div>
        {msg && (
          <p role="alert" className="text-13 text-destructive">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
