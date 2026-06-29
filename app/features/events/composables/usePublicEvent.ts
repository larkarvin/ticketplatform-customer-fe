// Owns the public event page's SSR fetch + SEO + not-found. No transport (service) or UI here.
import { eventsService } from '~/features/events/services/events.service'

export async function usePublicEvent(slug: string) {
  // Nuxt composables must be set up synchronously before any await (setup context is lost after it).
  const asyncEvent = useAsyncData(`public-event:${slug}`, () => eventsService.getPublicEvent(slug))
  const { data, error } = asyncEvent

  useSeoMeta({
    title: () => data.value?.title,
    description: () => data.value?.description ?? undefined,
    ogImage: () => data.value?.cover?.url,
    ogType: 'website',
  })

  await asyncEvent

  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found', fatal: true })
  }

  return { event: data.value }
}
