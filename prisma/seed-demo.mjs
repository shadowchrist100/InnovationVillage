// Données de démonstration : 100 startups (logos + photos d'équipe générés) et 10 investisseurs.
//   node --env-file=.env prisma/seed-demo.mjs          → crée les données et écrit COMPTES-DEMO.md
//   node --env-file=.env prisma/seed-demo.mjs --clean  → supprime uniquement les comptes @demo.village.bj
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DOMAIN = "demo.village.bj";
const UPLOADS = path.join(process.cwd(), "data", "uploads");
const OUT = path.join(process.cwd(), "..", "COMPTES-DEMO.md");

// Générateur pseudo-aléatoire déterministe : les mêmes données à chaque exécution
let seed = 20261118;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const password = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(rnd() * chars.length)]).join("");
};

async function clean() {
  const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, include: { startup: true } });
  for (const u of users) {
    const files = [];
    if (u.startup) {
      if (u.startup.logo) files.push(u.startup.logo);
      for (const m of JSON.parse(u.startup.team)) if (m.photo) files.push(m.photo);
    }
    for (const f of files) await unlink(path.join(UPLOADS, f)).catch(() => {});
    await db.user.delete({ where: { id: u.id } });
  }
  console.log(`${users.length} comptes de démonstration supprimés.`);
}

// ---------- Images ----------
const PALETTES = [
  ["#00c2ff", "#0057ff"], ["#00e5a8", "#0a7d5a"], ["#ffb300", "#ff5e00"], ["#ff5c8a", "#a3135b"],
  ["#9b6bff", "#4527c9"], ["#2ee6d6", "#0b6f9a"], ["#ffd166", "#e07a00"], ["#7bdcff", "#2b59ff"],
  ["#6ee7a0", "#1b8a4a"], ["#ff8a65", "#c2331b"],
];

function glyph(style, c) {
  // symboles simples, dessinés dans un carré 512
  switch (style) {
    case 0: return `<circle cx="256" cy="256" r="120" fill="none" stroke="${c}" stroke-width="34"/><circle cx="256" cy="256" r="38" fill="${c}"/>`;
    case 1: return `<path d="M256 120 L376 340 H136 Z" fill="${c}"/><path d="M256 200 L316 320 H196 Z" fill="rgba(0,0,0,.25)"/>`;
    case 2: return `<rect x="150" y="150" width="100" height="212" rx="20" fill="${c}"/><rect x="270" y="150" width="100" height="120" rx="20" fill="${c}" opacity=".75"/><rect x="270" y="290" width="100" height="72" rx="20" fill="${c}" opacity=".5"/>`;
    case 3: return `<path d="M140 340 Q256 90 372 340" fill="none" stroke="${c}" stroke-width="44" stroke-linecap="round"/><circle cx="256" cy="350" r="26" fill="${c}"/>`;
    case 4: return `<path d="M256 110 L360 170 V290 L256 350 L152 290 V170 Z" fill="none" stroke="${c}" stroke-width="32" stroke-linejoin="round"/><circle cx="256" cy="230" r="34" fill="${c}"/>`;
    default: return `<path d="M130 300 L220 200 L290 270 L382 150" fill="none" stroke="${c}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

async function makeLogo(name, i) {
  const [a, b] = PALETTES[i % PALETTES.length];
  const style = Math.floor(i / PALETTES.length + i) % 6;
  const initial = name.trim()[0].toUpperCase();
  const dark = i % 3 === 0;
  const bg = dark
    ? `<rect width="512" height="512" fill="#0b1c3f"/>`
    : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/>`;
  const ink = dark ? a : "#ffffff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${bg}${glyph(style, ink)}<text x="256" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="54" fill="${ink}" opacity=".9">${initial}</text></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}

async function makeAvatar(fullName, i) {
  const [a, b] = PALETTES[(i * 7 + 3) % PALETTES.length];
  const initials = fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="320" fill="url(#g)"/><circle cx="160" cy="124" r="52" fill="rgba(255,255,255,.28)"/><path d="M52 320 C60 230 110 200 160 200 C210 200 260 230 268 320 Z" fill="rgba(255,255,255,.28)"/><text x="160" y="190" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="84" fill="#fff">${initials}</text></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}

async function save(kind, buf) {
  const name = `${kind}-${randomUUID()}.webp`;
  await writeFile(path.join(UPLOADS, name), buf);
  return name;
}

// ---------- Données ----------
const COUNTRIES = ["Bénin", "Bénin", "Bénin", "Bénin", "Togo", "Côte d'Ivoire", "Sénégal", "Nigeria", "Ghana", "Burkina Faso", "Cameroun", "Niger"];
const FIRST = ["Awa", "Koffi", "Mariam", "Sènami", "Yves", "Fatou", "Ibrahim", "Rose", "Codjo", "Aïcha", "Habib", "Nadège", "Armand", "Chimène", "Samuel", "Léa", "Moussa", "Grâce", "Rodrigue", "Estelle", "Bakary", "Judith", "Franck", "Sylvie", "Kader", "Prisca", "Wilfried", "Adjoa", "Théo", "Inès"];
const LAST = ["Dossou", "Adjovi", "Houngbo", "Agbodjan", "Tossou", "Sow", "Traoré", "Kouassi", "Mensah", "Ouédraogo", "Hounkpatin", "Akpovi", "Diallo", "Zinsou", "Ogunleye", "Amegah", "Gnanvi", "Fofana", "Ndiaye", "Biaou", "Sossou", "Koné", "Adeyemi", "Boko", "Quenum"];
const ROLES = ["CEO & cofondateur", "CTO & cofondatrice", "Directeur produit", "Responsable opérations", "Directrice commerciale", "Lead développeur", "Responsable impact", "Data scientist", "Directeur financier"];

const BIOS = [
  "Diplômé en gestion, {n} a passé huit ans dans la banque avant de cofonder la startup. Il pilote la stratégie et les relations avec les partenaires.",
  "Ingénieure logiciel avec dix ans d'expérience, {n} a construit des produits utilisés par plus de 100 000 personnes. Elle dirige toute la partie technique.",
  "Ancien consultant, {n} structure l'offre produit et suit de près les retours des premiers clients sur le terrain.",
  "{n} a lancé deux projets avant celui-ci et apporte sa connaissance du terrain, des réseaux de distribution et du recrutement local.",
];

const SECTORS = {
  "Fintech": { names: ["Pay", "Cauri", "Sika", "Mobi", "Tontine", "Fina"], what: "une solution de paiement et d'épargne mobile pour les commerçants et les ménages", problem: "l'accès limité aux services financiers formels et le coût élevé des transferts", origin: "une expérience vécue au marché Dantokpa, où les commerçantes perdaient du temps et de l'argent avec le cash" },
  "Agritech / Agriculture": { names: ["Agri", "Champ", "Récolte", "Savane", "Semence", "Agro"], what: "une plateforme qui connecte les producteurs aux acheteurs et leur fournit des conseils agronomiques", problem: "les pertes post-récolte et l'absence de débouchés fiables pour les petits producteurs", origin: "la ferme familiale de l'un des fondateurs, confrontée chaque année aux invendus" },
  "Santé / Healthtech": { names: ["Santé", "Clinik", "Médi", "Vita", "Soin", "Pharma"], what: "une application de téléconsultation et de suivi des patients pour les zones rurales", problem: "l'éloignement des centres de santé et la difficulté de suivre les maladies chroniques", origin: "le constat d'une infirmière de district qui parcourait des kilomètres pour de simples contrôles" },
  "Éducation / Edtech": { names: ["Savoir", "Édu", "Classe", "Lumi", "Cahier", "Mentor"], what: "des cours interactifs en langues locales accessibles hors connexion sur smartphone", problem: "le manque de ressources pédagogiques de qualité dans les écoles publiques", origin: "des cours du soir donnés bénévolement par les fondateurs dans leur quartier" },
  "Énergie / Cleantech": { names: ["Solaire", "Soleil", "Watt", "Éco", "Volt", "Énergi"], what: "des kits solaires en paiement à l'usage pour les foyers et les petits commerces", problem: "les coupures d'électricité et le coût des groupes électrogènes", origin: "une panne de courant de trois jours qui a ruiné le stock d'un atelier de couture familial" },
  "Mobilité / Logistique": { names: ["Zem", "Livre", "Route", "Cargo", "Trajet", "Move"], what: "une application de livraison du dernier kilomètre et de suivi des colis à moto", problem: "les délais de livraison imprévisibles et l'absence d'adresses fiables dans les villes", origin: "des années comme coursier à Cotonou, sans outil pour optimiser les tournées" },
  "Ville intelligente": { names: ["Cité", "Smart", "Quartier", "Urbi", "Civic", "Lampe"], what: "des capteurs et un tableau de bord pour gérer les déchets et l'éclairage public", problem: "la gestion réactive et coûteuse des services urbains dans les communes", origin: "un projet d'étude sur la collecte des déchets dans un arrondissement de Cotonou" },
  "Commerce / E-commerce": { names: ["Marché", "Boutik", "Panier", "Vente", "Click", "Troc"], what: "une marketplace qui aide les artisans et petits commerçants à vendre en ligne", problem: "la faible visibilité des commerçants locaux et la méfiance envers l'achat en ligne", origin: "une mère commerçante dont les ventes ont doublé dès qu'elle a été présente sur WhatsApp" },
  "Économie créative / Tourisme": { names: ["Culture", "Voyage", "Art", "Griot", "Vodun", "Safari"], what: "une plateforme de réservation d'expériences culturelles et de billetterie pour les artistes", problem: "le manque de revenus et de visibilité des créateurs et des sites touristiques locaux", origin: "un festival de musique organisé avec peu de moyens et une billetterie 100 % papier" },
  "Cybersécurité": { names: ["Bouclier", "Secure", "Cyber", "Garde", "Vigil", "Cryp"], what: "des audits et une surveillance de sécurité accessibles aux PME et aux administrations", problem: "la multiplication des fraudes en ligne et le manque de compétences en sécurité", origin: "un incident de piratage subi par l'entreprise précédente d'un des fondateurs" },
  "Intelligence artificielle": { names: ["Neuro", "Intel", "Algo", "Cerveau", "Data", "Sagesse"], what: "des modèles d'IA adaptés aux langues africaines pour la transcription et l'assistance", problem: "des outils d'IA qui ne comprennent pas le fon, le yoruba ou le français local", origin: "un projet de recherche universitaire sur la reconnaissance vocale en langues béninoises" },
  "Services publics / GovTech": { names: ["Civis", "Papiers", "Guichet", "Mairie", "Déclar", "Public"], what: "une plateforme de démarches administratives en ligne avec suivi des dossiers", problem: "les files d'attente, les déplacements et la lenteur des procédures administratives", origin: "une journée entière perdue par un fondateur pour obtenir un simple acte de naissance" },
};
const SECTOR_KEYS = Object.keys(SECTORS);
const SUFFIX = ["", "", " Bénin", " Labs", "Hub", " Africa", "ly", " Tech", "App", " Connect"];

const INVESTORS = [
  ["Aminata Diop", "Sahel Impact Capital", "Partner", "Sénégal", "Dakar", "Investit en seed et pré-seed dans la fintech et l'agritech d'Afrique de l'Ouest depuis dix ans, après une carrière dans la banque de développement.", ["Fintech", "Agritech / Agriculture"], "https://example.com/sahel-impact"],
  ["Olivier Dansou", "Cotonou Ventures", "Directeur d'investissement", "Bénin", "Cotonou", "Accompagne les jeunes entreprises béninoises du numérique, avec un intérêt marqué pour la GovTech et la ville intelligente.", ["Services publics / GovTech", "Ville intelligente"], "https://example.com/cotonou-ventures"],
  ["Chidi Okafor", "Lagos Growth Fund", "Managing Partner", "Nigeria", "Lagos", "Ancien fondateur d'une licorne nigériane, il finance désormais des startups en série A dans l'IA et la cybersécurité.", ["Intelligence artificielle", "Cybersécurité"], "https://example.com/lagos-growth"],
  ["Mireille Kouamé", "Éburnie Santé Invest", "Associée", "Côte d'Ivoire", "Abidjan", "Soutient les solutions de santé numérique et d'éducation à fort impact social en Afrique francophone.", ["Santé / Healthtech", "Éducation / Edtech"], "https://example.com/eburnie-sante"],
  ["Thomas Lefèvre", "Paris–Afrique Partners", "Principal", "France", "Paris", "Fonds européen dédié à l'énergie propre et à la mobilité durable sur le continent africain, tickets de 200 000 à 2 M€.", ["Énergie / Cleantech", "Mobilité / Logistique"], "https://example.com/paris-afrique"],
  ["Efua Mensah", "Accra Angels", "Business angel", "Ghana", "Accra", "Réseau de business angels ghanéens finançant le commerce en ligne et l'économie créative.", ["Commerce / E-commerce", "Économie créative / Tourisme"], "https://example.com/accra-angels"],
  ["Ibrahim Traoré", "Faso Innovation Fund", "Gérant", "Burkina Faso", "Ouagadougou", "Finance des projets agricoles et énergétiques innovants dans le Sahel, avec un accompagnement terrain.", ["Agritech / Agriculture", "Énergie / Cleantech"], "https://example.com/faso-innovation"],
  ["Sophie Martin", "Impact Gateway", "Responsable Afrique", "Canada", "Montréal", "Investit dans les startups à impact en éducation et en santé, et mobilise des subventions pour les projets pilotes.", ["Éducation / Edtech", "Santé / Healthtech"], "https://example.com/impact-gateway"],
  ["Kwame Asante", "Gold Coast Digital", "CEO", "Ghana", "Kumasi", "Opérateur et investisseur : cherche des startups fintech et GovTech complémentaires à ses services de paiement.", ["Fintech", "Services publics / GovTech"], "https://example.com/gold-coast-digital"],
  ["Nadia Benali", "Maghreb–Sahel Capital", "Directrice des investissements", "Maroc", "Casablanca", "Ouverte à tous les secteurs numériques, avec une préférence pour les équipes techniques fortes et les marchés régionaux.", ["Fintech", "Intelligence artificielle", "Commerce / E-commerce"], "https://example.com/maghreb-sahel"],
];

async function main() {
  if (process.argv.includes("--clean")) return clean();
  await clean(); // idempotent : on repart d'une base de démo propre
  await mkdir(UPLOADS, { recursive: true });

  const rows = [];
  const usedNames = new Set();

  // Investisseurs
  for (let i = 0; i < INVESTORS.length; i++) {
    const [fullName, organization, position, country, city, bio, sectors, website] = INVESTORS[i];
    const email = `investisseur${String(i + 1).padStart(2, "0")}@${DOMAIN}`;
    const pw = password();
    await db.user.create({
      data: {
        email, passwordHash: await bcrypt.hash(pw, 10), role: "INVESTOR", status: "APPROVED",
        investor: { create: { fullName, organization, position, country, city, bio, sectors: sectors.join(","), website } },
      },
    });
    rows.push({ kind: "Investisseur", name: fullName, detail: `${position}, ${organization} (${city}, ${country})`, email, pw });
  }

  // Startups
  for (let i = 0; i < 100; i++) {
    const sector = SECTOR_KEYS[i % SECTOR_KEYS.length];
    const S = SECTORS[sector];
    let name;
    for (let tries = 0; ; tries++) {
      const base = (pick(S.names) + pick(SUFFIX)).replace(/\s+/g, " ").trim();
      name = base[0].toUpperCase() + base.slice(1) + (tries > 6 ? ` ${tries}` : "");
      if (!usedNames.has(name.toLowerCase())) break;
    }
    usedNames.add(name.toLowerCase());
    const country = pick(COUNTRIES);

    const team = [];
    const size = int(2, 4);
    for (let m = 0; m < size; m++) {
      const full = `${pick(FIRST)} ${pick(LAST)}`;
      team.push({ name: full, role: ROLES[m % ROLES.length], bio: BIOS[m % BIOS.length].replace("{n}", full.split(" ")[0]), photo: await save("team", await makeAvatar(full, i * 5 + m)) });
    }
    const logo = await save("logo", await makeLogo(name, i));
    const founder = team[0].name.split(" ")[0];
    const email = `startup${String(i + 1).padStart(3, "0")}@${DOMAIN}`;
    const pw = password();

    await db.user.create({
      data: {
        email, passwordHash: await bcrypt.hash(pw, 10), role: "STARTUP", status: "APPROVED",
        startup: {
          create: {
            name, logo, sector, country, team: JSON.stringify(team),
            website: `https://example.com/${slug(name)}`,
            demoVideoUrl: "",
            whatTheyDo: `${name} développe ${S.what}. Notre équipe de ${size} personnes basée à ${country === "Bénin" ? "Cotonou" : country} sert déjà ses premiers clients et prépare son déploiement dans la sous-région.`,
            origin: `L'idée est née de ${S.origin}. ${founder} a alors réuni une équipe pour construire une réponse concrète et durable.`,
            goal: `Atteindre ${pick(["5 000", "10 000", "25 000", "50 000"])} utilisateurs d'ici fin 2027, lever ${pick(["150 000", "300 000", "500 000", "1 000 000"])} € pour financer la croissance et ouvrir ${pick(["deux", "trois", "quatre"])} nouveaux marchés.`,
            problem: `Nous répondons à ${S.problem}, qui touche chaque jour des milliers de personnes et de petites entreprises.`,
          },
        },
      },
    });
    rows.push({ kind: "Startup", name, detail: `${sector} · ${country}`, email, pw });
  }

  const table = (kind) =>
    "| Nom | Détail | E-mail | Mot de passe |\n|---|---|---|---|\n" +
    rows.filter((r) => r.kind === kind).map((r) => `| ${r.name} | ${r.detail} | \`${r.email}\` | \`${r.pw}\` |`).join("\n");
  await writeFile(
    OUT,
    `# Comptes de démonstration : Village de l'Innovation\n\n` +
      `Données fictives générées par \`app/prisma/seed-demo.mjs\` (adresses en \`@${DOMAIN}\`). Tous les comptes sont actifs.\n` +
      `Connexion : http://localhost:3000/connexion\n\n` +
      `**Ce fichier contient des mots de passe : ne le partagez pas et ne le publiez pas.**\n\n` +
      `Supprimer toutes les données de démonstration :\n\n\`\`\`bash\ncd app && node --env-file=.env prisma/seed-demo.mjs --clean\n\`\`\`\n\n` +
      `## Investisseurs (10)\n\n${table("Investisseur")}\n\n## Startups (100)\n\n${table("Startup")}\n`,
  );
  console.log(`${rows.length} comptes créés. Identifiants : ${OUT}`);
}

main().finally(() => db.$disconnect());
