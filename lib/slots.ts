import { MEETINGS } from "./config";

export type Slot = { startsAt: Date; endsAt: Date };

const pad = (n: number) => String(n).padStart(2, "0");

/** Tous les créneaux théoriques, groupés par jour (clé "YYYY-MM-DD"). */
export function allSlots(): Record<string, Slot[]> {
  const out: Record<string, Slot[]> = {};
  for (const day of MEETINGS.days) {
    const slots: Slot[] = [];
    const first = MEETINGS.startHour * 60;
    const last = MEETINGS.endHour * 60;
    for (let m = first; m + MEETINGS.durationMinutes <= last; m += MEETINGS.durationMinutes) {
      const start = new Date(`${day}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00${MEETINGS.utcOffset}`);
      const end = new Date(start.getTime() + MEETINGS.durationMinutes * 60_000);
      slots.push({ startsAt: start, endsAt: end });
    }
    out[day] = slots;
  }
  return out;
}

export function isValidSlot(startsAt: Date): boolean {
  const t = startsAt.getTime();
  return Object.values(allSlots()).some((slots) => slots.some((s) => s.startsAt.getTime() === t));
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: MEETINGS.timeZone, ...opts });

export const formatTime = (d: Date) => fmt({ hour: "2-digit", minute: "2-digit" }).format(d);
export const formatDay = (d: Date) => fmt({ weekday: "long", day: "numeric", month: "long" }).format(d);
export const formatDayShort = (d: Date) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(d);

/** « 18 » et « NOV » pour le bloc date des listes de rencontres. */
export const formatDayNumber = (d: Date) => fmt({ day: "numeric" }).format(d);
export const formatMonthShort = (d: Date) => fmt({ month: "short" }).format(d).replace(".", "").toUpperCase();
