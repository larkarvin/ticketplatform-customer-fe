// composables/useTenantState.ts
// SSR-safe shared state for the current org subdomain — the source the API client's getSubdomain
// seam reads. Resolved once per request by useTenant(); useState keeps it consistent across the
// server render and client hydration.
export function useTenantState() {
  return useState<string | null>('tenant-subdomain', () => null)
}
