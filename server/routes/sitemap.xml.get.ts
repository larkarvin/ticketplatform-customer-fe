import { defineEventHandler, setHeader } from 'h3'

export function buildSitemapXml(siteUrl: string, events: { slug: string; updated_at?: string }[]): string {
  const url = (loc: string, lastmod?: string) =>
    `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
  const urls = [
    url(`${siteUrl}/`),
    url(`${siteUrl}/events`),
    url(`${siteUrl}/events/calendar`),
    ...events.map((e) => url(`${siteUrl}/e/${e.slug}`, e.updated_at)),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || ''
  const res = await $fetch<{ data: { slug: string; updated_at?: string }[] }>(
    `${config.public.apiUrl}/events/public/`,
    { headers: { 'X-Organization-Subdomain': (config.public.orgSubdomain as string) || '' } }
  ).catch(() => ({ data: [] }))
  setHeader(event, 'content-type', 'application/xml')
  return buildSitemapXml(siteUrl, res.data)
})
