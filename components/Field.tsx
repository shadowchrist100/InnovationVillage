import type { ReactNode } from "react";

export default function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="text-13 text-ink-faint">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-13 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormBanner({ error, ok, okText }: { error?: string; ok?: boolean; okText?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  if (ok && okText)
    return (
      <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
        {okText}
      </p>
    );
  return null;
}
