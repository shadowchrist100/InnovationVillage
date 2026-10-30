import "server-only";
import { MEETINGS } from "./config";
import { escapeHtml, layout, sendMail, siteUrl } from "./mail";
import { formatDay, formatTime } from "./slots";

type InvestorInfo = { fullName: string; organization: string; position: string; city: string; country: string; bio: string; sectors: string };

export type BookingEvent = {
  kind: "requested" | "proposed" | "accepted" | "declined" | "cancelled";
  to: string;
  startupName: string;
  investor: InvestorInfo;
  startsAt: Date;
  /** Qui reçoit le message : détermine le point de vue du texte. */
  recipient: "STARTUP" | "INVESTOR";
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// Le lien passe par la connexion (si besoin) puis arrive sur l'espace de la personne.
const link = () => `${siteUrl()}/connexion?next=/espace`;

const p = (html: string) => `<p style="margin:0 0 16px;line-height:1.6;color:#c9d3e6">${html}</p>`;
const b = (s: string) => `<strong style="color:#fff">${escapeHtml(s)}</strong>`;

export async function notifyBooking(e: BookingEvent) {
  const when = `${cap(formatDay(e.startsAt))} à ${formatTime(e.startsAt)}`;
  const i = e.investor;
  const toStartup = e.recipient === "STARTUP";
  const other = toStartup ? i.fullName : e.startupName;
  const card = `<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#10244b;border-radius:8px;width:100%"><tr><td style="padding:14px 16px;color:#fff;line-height:1.6">
📅 <strong>${escapeHtml(when)}</strong> · ${MEETINGS.durationMinutes} minutes<br>📍 Esplanade du Palais des Congrès, Cotonou</td></tr></table>`;
  const who = `${b(i.fullName)} (${escapeHtml(i.position)}, ${escapeHtml(i.organization)})`;

  const content = {
    requested: {
      subject: `Demande de rencontre : ${i.fullName}`,
      title: "Un investisseur demande à vous rencontrer",
      body: p(`${who} souhaite rencontrer ${b(e.startupName)} au Village de l’Innovation. Vous pouvez accepter, refuser ou proposer un autre horaire depuis votre espace.`) + card +
        p(`${escapeHtml(i.city)}, ${escapeHtml(i.country)} · Secteurs : ${escapeHtml(i.sectors.split(",").join(", "))}`) + p(escapeHtml(i.bio.slice(0, 400)) + (i.bio.length > 400 ? "…" : "")),
      cta: "Répondre à la demande",
    },
    proposed: {
      subject: `Nouvel horaire proposé : ${other}`,
      title: "Un autre horaire vous est proposé",
      body: p(`${b(other)} propose un autre horaire pour votre rencontre. Acceptez-le, refusez-le ou proposez-en un autre depuis votre espace.`) + card,
      cta: "Répondre à la proposition",
    },
    accepted: {
      subject: `Rencontre confirmée avec ${other}`,
      title: "Rencontre confirmée",
      body: p(`${b(other)} a accepté la rencontre. Elle est confirmée.`) + card,
      cta: "Voir ma rencontre",
    },
    declined: {
      subject: `Demande refusée par ${other}`,
      title: "Demande refusée",
      body: p(`${b(other)} ne peut pas vous rencontrer sur cet horaire (${escapeHtml(when)}). Le créneau est libéré : vous pouvez faire une autre demande.`),
      cta: "Ouvrir mon espace",
    },
    cancelled: {
      subject: `Rencontre annulée : ${other}`,
      title: "Une rencontre a été annulée",
      body: p(`La rencontre prévue avec ${b(other)} le ${b(when)} a été annulée. Le créneau est de nouveau disponible.`),
      cta: "Ouvrir mon espace",
    },
  }[e.kind];

  await sendMail({
    to: e.to,
    subject: content.subject,
    html: layout(content.title, content.body, { label: content.cta, url: link() }),
    text: `${content.title} : ${other}, ${when}. ${link()}`,
  });
}
