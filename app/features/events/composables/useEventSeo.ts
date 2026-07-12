// Event-page SEO: meta/OG/Twitter, canonical, JSON-LD (schema.org Event), and noindex for unlisted
// events. `buildEventJsonLd` is pure (unit-tested); `useEventSeo` wires it into the Nuxt head.
import type { PublicEvent } from '../types'

interface SeoOpts {
  siteUrl: string
  orgName: string
  imageUrl: string
}

export function buildEventJsonLd(event: PublicEvent, opts: SeoOpts): Record<string, unknown> {
  const prices = event.tickets.map((t) => t.price)
  const url = `${opts.siteUrl}/e/${event.slug}`
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.starts_at,
    url,
    image: opts.imageUrl,
    organizer: { '@type': 'Organization', name: opts.orgName, url: opts.siteUrl },
    eventStatus: 'https://schema.org/EventScheduled',
  }
  if (event.ends_at) ld.endDate = event.ends_at
  if (event.description) ld.description = event.description
  if (event.location) ld.location = { '@type': 'Place', name: event.location }
  if (prices.length) {
    ld.offers = {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      priceCurrency: event.currency,
      availability: 'https://schema.org/InStock',
      url,
    }
  }
  return ld
}

export function useEventSeo(event: PublicEvent, opts: SeoOpts): void {
  const canonical = `${opts.siteUrl}/e/${event.slug}`
  const description = (event.description ?? `${event.title} — tickets`).slice(0, 155)

  useSeoMeta({
    title: `${event.title} — ${opts.orgName}`,
    description,
    ogTitle: event.title,
    ogDescription: description,
    ogUrl: canonical,
    ogType: 'website',
    ogImage: opts.imageUrl,
    twitterCard: 'summary_large_image',
    twitterTitle: event.title,
    twitterDescription: description,
    twitterImage: opts.imageUrl,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    meta: event.visibility === 'unlisted' ? [{ name: 'robots', content: 'noindex,nofollow' }] : [],
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(buildEventJsonLd(event, opts)) }],
  })
}
