const map = {
  PENDING: {
    text: "En cours d'examen",
    cls: "border-signal/25 bg-signal/10 text-signal",
    dot: "bg-signal",
  },
  APPROVED: {
    text: "Actif",
    cls: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  REJECTED: {
    text: "Suspendu",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
} as const;

export default function StatusBadge({ status }: { status: string }) {
  const s = map[status as keyof typeof map] ?? map.PENDING;
  return (
    <span className={`pill ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.text}
    </span>
  );
}
