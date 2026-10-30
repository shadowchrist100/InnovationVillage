import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; html: string; text: string };

export const siteUrl = () => (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Envoie un e-mail par SMTP (uniquement si MAIL_ENABLED="true"). Sans SMTP_HOST (développement), le message est écrit dans data/outbox/.
 * Ne lève jamais d'erreur : un e-mail raté ne doit pas faire échouer l'action de l'utilisateur.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const from = process.env.MAIL_FROM ?? "Village de l'Innovation <no-reply@example.com>";
  // Système en veille : tant que MAIL_ENABLED n'est pas "true", rien n'est envoyé ni écrit.
  if (process.env.MAIL_ENABLED !== "true") return;
  try {
    if (!process.env.SMTP_HOST) {
      const dir = path.join(process.cwd(), "data", "outbox");
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${Date.now()}-${mail.to.replace(/[^a-z0-9@.-]/gi, "_")}.html`);
      await writeFile(file, `<!-- À : ${mail.to} | Objet : ${mail.subject} -->\n${mail.html}`);
      console.log(`[mail] (non envoyé, SMTP absent) → ${mail.to} : ${mail.subject}`);
      return;
    }
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from, ...mail });
  } catch (e) {
    console.error("[mail] échec d'envoi", mail.to, e);
  }
}

/** Gabarit commun : fond sombre aux couleurs du Village, un bouton, aucune image externe. */
export function layout(title: string, bodyHtml: string, cta: { label: string; url: string }) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#061430;font-family:Helvetica,Arial,sans-serif;color:#f3f6fb">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b1c3f;border:1px solid #1d3466;border-radius:12px">
<tr><td style="padding:28px 32px">
<p style="margin:0 0 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#0ff">Le Village de l’Innovation · Cotonou</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${escapeHtml(title)}</h1>
${bodyHtml}
<p style="margin:28px 0 8px"><a href="${cta.url}" style="display:inline-block;background:#0ff;color:#061430;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px">${escapeHtml(cta.label)}</a></p>
<p style="margin:12px 0 0;font-size:12px;color:#9aa8c4">Si le bouton ne fonctionne pas : ${cta.url}</p>
</td></tr></table>
<p style="font-size:11px;color:#6f7f9f;margin-top:16px">Ministère de la Transformation Digitale et de l’Innovation · Bénin</p>
</td></tr></table></body></html>`;
}
