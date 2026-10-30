const sizes = {
  sm: "size-12 rounded-lg text-sm",
  md: "size-16 rounded-xl text-lg",
  lg: "size-24 rounded-2xl text-2xl",
} as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Logo de la startup, ou ses initiales tant qu'aucun logo n'est enregistré. */
export default function StartupLogo({
  name,
  logo,
  size = "md",
}: {
  name: string;
  logo?: string | null;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      className={`${sizes[size]} grid shrink-0 place-items-center overflow-hidden border border-hairline bg-surface-2 font-medium text-signal`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- fichier servi par /fichiers, déjà réduit
        <img src={`/fichiers/${logo}`} alt={`Logo de ${name}`} className="size-full object-contain p-1.5" loading="lazy" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
