import { describe, expect, it } from 'vitest'
import { buildSitemapXml } from './sitemap.xml.get'

describe('buildSitemapXml', () => {
  it('includes the home URL and each event URL', () => {
    const xml = buildSitemapXml('https://tix.test', [{ slug: 'a' }])

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('</urlset>')
    expect(xml).toContain('<loc>https://tix.test/</loc>')
    expect(xml).toContain('<loc>https://tix.test/e/a</loc>')
  })

  it('includes lastmod when an event has updated_at', () => {
    const xml = buildSitemapXml('https://tix.test', [{ slug: 'a', updated_at: '2026-07-01T00:00:00Z' }])

    expect(xml).toContain('<lastmod>2026-07-01T00:00:00Z</lastmod>')
  })

  it('omits lastmod when an event has no updated_at', () => {
    const xml = buildSitemapXml('https://tix.test', [{ slug: 'a' }])

    expect(xml).not.toContain('<lastmod>')
  })

  it('produces the static pages (home + events browser) when there are no events', () => {
    const xml = buildSitemapXml('https://tix.test', [])

    expect(xml).toContain('<loc>https://tix.test/</loc>')
    expect(xml).toContain('<loc>https://tix.test/events</loc>')
    expect(xml).toContain('<loc>https://tix.test/events/calendar</loc>')
    expect(xml.match(/<url>/g)).toHaveLength(3)
  })
})
