import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Chrome from './Chrome.vue'

const orgName = 'CatholicTickets'

describe('catholic Chrome', () => {
  it('shows organizer sign in/up links when staffUrl is set', () => {
    const w = mount(Chrome, { props: { staffUrl: 'https://app.catholictickets.com', orgName } })
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('https://app.catholictickets.com/login')
    expect(hrefs).toContain('https://app.catholictickets.com/signup')
  })
  it('hides them when staffUrl is empty', () => {
    const w = mount(Chrome, { props: { staffUrl: '', orgName } })
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).not.toContain('/login')
    expect(w.text()).toContain('hello@') // contact email still rendered
  })
})
