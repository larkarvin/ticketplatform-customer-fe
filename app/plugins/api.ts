// plugins/api.ts
// Guest API client for the public app. No auth token — visitors are anonymous; account linking
// arrives in a later cycle. The org-subdomain seam reads the SSR tenant state (set by useTenant),
// so org-scoped calls carry the X-Organization-Subdomain header the backend expects.
import { createApiClient } from '#core/api'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const tenant = useTenantState()

  const api = createApiClient({
    baseURL: config.public.apiUrl as string,
    getToken: () => null,
    getSubdomain: () => tenant.value,
    onUnauthorized: () => {
      // Public app: no session to clear — send the visitor home.
      navigateTo('/')
    },
  })

  return { provide: { api } }
})
