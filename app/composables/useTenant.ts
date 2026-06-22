// composables/useTenant.ts
// Resolves the current org from the request host (subdomain), fetches its public branding on the
// server, and injects the brand CSS vars + favicon via useHead so the first paint is already
// branded. Idempotent and dedup-safe: useTenantState is shared, and useAsyncData dedupes by key, so
// calling useTenant() from both app.vue and the layout resolves once per request.
import { useApiClient } from '#core/api'
import { fetchPublicBranding } from '#core/services/branding.service'
import type { PublicBranding } from '#core/types/branding'
import { brandingToCssVars } from '#core/utils/colorUtils'

// Parse the org label from a host like `acme.example.com` given baseDomain `example.com`. Returns
// null for the bare/`www` apex (no org) or a non-matching host.
function parseSubdomain(host: string, baseDomain: string): string | null {
  const h = host.split(':')[0] ?? ''
  if (!baseDomain || h === baseDomain || h === `www.${baseDomain}`) return null
  if (!h.endsWith(`.${baseDomain}`)) return null
  const label = h.slice(0, h.length - baseDomain.length - 1)
  return label && label !== 'www' ? label : null
}

export function useTenant() {
  const config = useRuntimeConfig()
  const tenant = useTenantState()

  const host = useRequestURL().host
  const resolved =
    parseSubdomain(host, config.public.baseDomain as string) || (config.public.devOrgSubdomain as string) || null
  tenant.value = resolved

  const subdomain = computed(() => tenant.value)
  const api = useApiClient()

  const { data: branding } = useAsyncData<PublicBranding | null>(
    'tenant-branding',
    async () => (tenant.value ? fetchPublicBranding(api, tenant.value) : null),
    { watch: [tenant] }
  )

  useHead(() => {
    const b = branding.value
    if (!b) return {}
    const cssVars = brandingToCssVars(b)
    return {
      style: cssVars ? [{ id: 'brand-vars', innerHTML: cssVars }] : [],
      link: b.faviconUrl ? [{ rel: 'icon', href: b.faviconUrl }] : [],
    }
  })

  const isResolved = computed(() => tenant.value !== null)
  return { subdomain, branding, isResolved }
}
