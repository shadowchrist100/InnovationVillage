import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site dynamique (connexion + base de données) : on garde le modèle de rendu classique.
  cacheComponents: false,
  partialPrefetching: false,
  // Envoi du logo et des photos d'équipe (réduits côté navigateur avant l'envoi)
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
