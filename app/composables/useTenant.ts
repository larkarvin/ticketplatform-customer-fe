// composables/useTenant.ts
// Resolves the current org (env-primary, host-subdomain fallback), fetches its public branding on
// the server, and injects the brand CSS vars + favicon via useHead so the first paint is already
// branded. Idempotent and dedup-safe: useTenantState is shared, and useAsyncData dedupes by key, so
// calling useTenant() from both app.vue and the layout resolves once per request.
import { useApiClient } from '#core/api'
import { fetchPublicBranding } from '#core/services/branding.service'
import type { PublicBranding } from '#core/types/branding'
import { brandingToCssVars } from '#core/utils/colorUtils'
import { resolveTenant } from './resolveTenant'

export function useTenant() {
  const config = useRuntimeConfig()
  const tenant = useTenantState()

  const host = useRequestURL().host
  tenant.value = resolveTenant(host, {
    orgSubdomain: config.public.orgSubdomain as string,
    baseDomain: config.public.baseDomain as string,
    devOrgSubdomain: config.public.devOrgSubdomain as string,
  })

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
