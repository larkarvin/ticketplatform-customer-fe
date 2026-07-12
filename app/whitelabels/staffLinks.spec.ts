// app/whitelabels/staffLinks.spec.ts
import { describe, expect, it } from 'vitest'
import { staffLinks } from './staffLinks'

describe('staffLinks', () => {
  it('builds login/signup urls from the staff base, trimming a trailing slash', () => {
    expect(staffLinks('https://app.sportsquad.io/')).toEqual({
      enabled: true,
      signIn: 'https://app.sportsquad.io/login',
      signUp: 'https://app.sportsquad.io/signup',
    })
  })
  it('is disabled when the staff url is missing', () => {
    expect(staffLinks('')).toEqual({ enabled: false, signIn: '', signUp: '' })
    expect(staffLinks(undefined)).toEqual({ enabled: false, signIn: '', signUp: '' })
  })
})
