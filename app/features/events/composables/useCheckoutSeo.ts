// Checkout-page SEO: title only, and always noindex — checkout is a transactional page that must
// never be indexed or shared with rich previews (unlike the public event page, see `useEventSeo`).
// `buildCheckoutTitle` is pure (unit-tested); `useCheckoutSeo` wires it into the Nuxt head.
import type { PublicEvent } from '../types'

export function buildCheckoutTitle(event: PublicEvent | null | undefined, fallback: string): string {
  return event ? `Checkout — ${event.title}` : fallback
}

export function useCheckoutSeo(event: PublicEvent, fallbackTitle: string): void {
  useSeoMeta({
    title: buildCheckoutTitle(event, fallbackTitle),
    robots: 'noindex, nofollow',
  })
}
