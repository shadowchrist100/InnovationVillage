# Village de l'Innovation — Startups & investisseurs

Inscription des startups et des investisseurs, annuaire, et réservation de rencontres.
Charte et logos repris du site d'attente digitalinnovationweek.bj.

## Démarrer

```bash
npm install
cp .env.example .env      # puis renseigner SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma db push        # crée la base SQLite (prisma/dev.db)
npm run seed              # crée le compte administrateur
npm run dev               # http://localhost:3000
```

## Parcours

- **Startup** : `/inscription/startup` — nom, équipe, ce qu'elle fait, origine de l'idée, objectif, problème résolu, vidéo de démo, lien.
- **Investisseur** : `/inscription/investisseur` — qui il est, d'où il vient, où il travaille, présentation, secteurs.
- **Admin** : `/admin` — valide ou refuse chaque profil. Seuls les profils validés sont publics (startups) ou peuvent réserver (investisseurs).
- **Annuaire** : `/startups` puis `/startups/[id]` — l'investisseur validé réserve un créneau.

## Règles des rencontres

Dans `lib/config.ts` : jours, horaires, durée (par défaut 20 min, 18-20 nov. 2026, 9h-17h, heure du Bénin).
Un investisseur ne peut pas avoir deux rencontres au même moment, ni une startup (contraintes uniques en base).

## Avant la mise en ligne

- Définir un `SESSION_SECRET` long et aléatoire (`openssl rand -hex 32`) et changer le mot de passe admin.
- Remplacer SQLite par une base hébergée (PostgreSQL) : changer `provider` dans `prisma/schema.prisma`.
- Envoi d'e-mails (confirmation de rencontre, validation du profil) : non implémenté.
