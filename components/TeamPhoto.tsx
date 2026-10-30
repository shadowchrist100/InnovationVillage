const sizes = { sm: "size-10 text-xs", lg: "size-20 text-xl" } as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Photo d'un membre de l'équipe (ronde), ou ses initiales. Le fichier n'est servi qu'aux personnes autorisées. */
export default function TeamPhoto({ name, photo, size = "lg" }: { name: string; photo?: string; size?: keyof typeof sizes }) {
  return (
    <span
      className={`${sizes[size]} grid shrink-0 place-items-center overflow-hidden rounded-full border border-signal/30 bg-surface-2 font-medium text-signal`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- fichier servi par /fichiers
        <img src={`/fichiers/${photo}`} alt={name} className="size-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
