import { getUser } from "@/lib/session";
import { FILE_RE, readImage } from "@/lib/uploads";

const notFound = () => new Response("Introuvable", { status: 404 });

export async function GET(_req: Request, { params }: RouteContext<"/fichiers/[name]">) {
  const { name } = await params;
  if (!FILE_RE.test(name)) return notFound();

  const isTeamPhoto = name.startsWith("team-");

  if (isTeamPhoto) {
    // Photos de personnes : réservées aux investisseurs validés, à l'administration
    // et à la startup concernée. On répond 404 (et non 403) pour ne rien révéler.
    const user = await getUser();
    const allowed =
      user &&
      (user.role === "ADMIN" ||
        (user.role === "INVESTOR" && user.status === "APPROVED") ||
        (user.role === "STARTUP" && user.startup?.team.includes(name)));
    if (!allowed) return notFound();
  }

  const file = await readImage(name);
  if (!file) return notFound();

  return new Response(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.mime,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Les noms changent à chaque nouvel envoi : le logo peut être mis en cache longtemps.
      "Cache-Control": isTeamPhoto ? "private, max-age=3600" : "public, max-age=31536000, immutable",
    },
  });
}
