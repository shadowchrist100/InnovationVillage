"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "./icons";

/** Champ mot de passe avec un œil : barré tant que le mot de passe est masqué, ouvert quand il est visible. */
export default function PasswordInput(props: Omit<ComponentProps<"input">, "type" | "className">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className="input pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted transition-colors hover:text-signal"
      >
        {visible ? <Eye /> : <EyeOff />}
      </button>
    </div>
  );
}
