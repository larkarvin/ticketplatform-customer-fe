import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EventShare from './EventShare.vue'

const props = { url: 'https://tix.test/e/spring-gala', title: 'Spring Gala' }

describe('EventShare', () => {
  it('renders network share links with the encoded url when Web Share is unavailable', () => {
    vi.stubGlobal('navigator', {}) // no .share
    const w = mount(EventShare, { props })
    const fb = w.get('[data-test="share-facebook"]')
    expect(fb.attributes('href')).toContain('facebook.com/sharer')
    expect(fb.attributes('href')).toContain(encodeURIComponent(props.url))
    expect(w.get('[data-test="share-x"]').attributes('href')).toContain('twitter.com/intent/tweet')
    expect(w.get('[data-test="share-whatsapp"]').attributes('href')).toContain('wa.me')
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    const w = mount(EventShare, { props })
    await w.get('[data-test="share-native"]').trigger('click')
    expect(share).toHaveBeenCalledWith({ title: props.title, url: props.url })
  })
})
