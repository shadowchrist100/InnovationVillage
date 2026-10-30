/** Chemin interne sûr pour revenir après connexion (jamais d'URL externe). */
export function safeNext(value: unknown, fallback = "/espace"): string {
  const v = typeof value === "string" ? value : "";
  return /^\/(?!\/)[A-Za-z0-9\-._~/%?=&]*$/.test(v) && !v.startsWith("/connexion") ? v : fallback;
}
