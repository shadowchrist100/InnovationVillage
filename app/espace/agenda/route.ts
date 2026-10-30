import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { MEETINGS } from "@/lib/config";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** Export iCalendar des rencontres de la personne connectée. */
export async function GET() {
  const user = await getUser();
  if (!user || (!user.investor && !user.startup)) return new Response("Non connecté", { status: 401 });

  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", ...(user.investor ? { investorId: user.investor.id } : { startupId: user.startup!.id }) },
    include: { startup: true, investor: true },
    orderBy: { startsAt: "asc" },
  });

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MTDI//Village de l'Innovation//FR", "CALSCALE:GREGORIAN"];
  for (const b of bookings) {
    const who = user.investor ? b.startup.name : `${b.investor.fullName} (${b.investor.organization})`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@village-innovation`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(b.startsAt)}`,
      `DTEND:${stamp(new Date(b.startsAt.getTime() + MEETINGS.durationMinutes * 60_000))}`,
      `SUMMARY:${esc(`Rencontre Village de l'Innovation : ${who}`)}`,
      "LOCATION:Esplanade du Palais des Congrès\\, Cotonou",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mes-rencontres.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
