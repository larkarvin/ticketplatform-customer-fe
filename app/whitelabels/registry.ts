// Single source of truth mapping a deploy domain (from `--site=<domain>`) to its whitelabel
// folder under app/whitelabels/. Used by nuxt.config.ts and vitest.config.ts to resolve the
// #whitelabel alias, so it must stay dependency-free and pure.
export type WhitelabelFolder = 'sportsquad' | 'catholic'

export const SITE_REGISTRY: Record<string, WhitelabelFolder> = {
  'sportsquad.io': 'sportsquad',
  'catholictickets.com': 'catholic',
}

export const DEFAULT_SITE: WhitelabelFolder = 'sportsquad'

export function resolveSite(site: string | undefined): WhitelabelFolder {
  if (!site) return DEFAULT_SITE
  return SITE_REGISTRY[site.trim().toLowerCase()] ?? DEFAULT_SITE
}
