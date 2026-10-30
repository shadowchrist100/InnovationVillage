// Règles des rencontres investisseur ↔ startup. À ajuster avec les organisateurs.
export const MEETINGS = {
  // Jours ouverts aux rencontres (heure du Bénin, UTC+1, pas d'heure d'été)
  days: ["2026-11-18", "2026-11-19", "2026-11-20"],
  startHour: 9,
  endHour: 17,
  durationMinutes: 20,
  timeZone: "Africa/Porto-Novo",
  utcOffset: "+01:00",
} as const;

export const SECTORS = [
  "Fintech",
  "Agritech / Agriculture",
  "Santé / Healthtech",
  "Éducation / Edtech",
  "Énergie / Cleantech",
  "Mobilité / Logistique",
  "Ville intelligente",
  "Commerce / E-commerce",
  "Économie créative / Tourisme",
  "Cybersécurité",
  "Intelligence artificielle",
  "Services publics / GovTech",
  "Autre",
] as const;

export const ROLES = { STARTUP: "STARTUP", INVESTOR: "INVESTOR", ADMIN: "ADMIN" } as const;
export const STATUS = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" } as const;

export const BOOKING = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DECLINED: "DECLINED",
  CANCELLED: "CANCELLED",
} as const;
/** Statuts qui occupent un créneau. */
export const ACTIVE_BOOKING = ["PENDING", "CONFIRMED"];
