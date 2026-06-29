// customer-fe/app/features/events/components/EventDetailsBody.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EventDetailsBody from './EventDetailsBody.vue'

describe('EventDetailsBody', () => {
  it('renders the sanitized html', () => {
    const w = mount(EventDetailsBody, { props: { html: '<p>Hello <strong>world</strong></p>' } })
    expect(w.html()).toContain('<strong>world</strong>')
    expect(w.text()).toContain('About this event')
  })

  it('renders nothing when empty', () => {
    const w = mount(EventDetailsBody, { props: { html: null } })
    expect(w.text()).toBe('')
  })
})
