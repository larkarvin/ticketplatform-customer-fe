import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || ''
  setHeader(event, 'content-type', 'text/plain')
  return `User-agent: *\nAllow: /\nDisallow: /orders/\nSitemap: ${siteUrl}/sitemap.xml\n`
})
