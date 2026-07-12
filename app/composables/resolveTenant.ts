// composables/resolveTenant.ts — pure org-handle resolution (env-primary, host fallback).
function parseSubdomain(host: string, baseDomain: string): string | null {
  const h = host.split(':')[0] ?? ''
  if (!baseDomain || h === baseDomain || h === `www.${baseDomain}`) return null
  if (!h.endsWith(`.${baseDomain}`)) return null
  const label = h.slice(0, h.length - baseDomain.length - 1)
  return label && label !== 'www' ? label : null
}

export function resolveTenant(
  host: string,
  cfg: { orgSubdomain: string; baseDomain: string; devOrgSubdomain: string }
): string | null {
  return cfg.orgSubdomain || parseSubdomain(host, cfg.baseDomain) || cfg.devOrgSubdomain || null
}
