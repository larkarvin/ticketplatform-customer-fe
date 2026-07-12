// Owns the public event page's SSR fetch + not-found. No transport (service) or UI here.
// Full SEO (meta/OG/JSON-LD/canonical) is composed separately by `useEventSeo`, called from the page
// once the org name + logo are available.
import { eventsService } from '~/features/events/services/events.service'

export async function usePublicEvent(slug: string) {
  // Nuxt composables must be set up synchronously before any await (setup context is lost after it).
  const asyncEvent = useAsyncData(`public-event:${slug}`, () => eventsService.getPublicEvent(slug))
  const { data, error } = asyncEvent

  await asyncEvent

  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found', fatal: true })
  }

  return { event: data.value }
}
