// app/whitelabels/sportsquad/Chrome.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Chrome from './Chrome.vue'

const orgName = 'SportSquad'

describe('sportsquad Chrome', () => {
  it('shows organizer sign in/up links when staffUrl is set', () => {
    const w = mount(Chrome, { props: { staffUrl: 'https://app.sportsquad.io', orgName } })
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('https://app.sportsquad.io/login')
    expect(hrefs).toContain('https://app.sportsquad.io/signup')
  })
  it('hides them when staffUrl is empty', () => {
    const w = mount(Chrome, { props: { staffUrl: '', orgName } })
    expect(w.findAll('a').map((a) => a.attributes('href'))).not.toContain('/login')
  })
})
