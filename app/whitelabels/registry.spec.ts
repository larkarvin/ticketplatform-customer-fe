import { describe, expect, it } from 'vitest'
import { resolveSite } from './registry'

describe('resolveSite', () => {
  it('maps known domains to folders', () => {
    expect(resolveSite('sportsquad.io')).toBe('sportsquad')
    expect(resolveSite('catholictickets.com')).toBe('catholic')
  })
  it('is case- and whitespace-insensitive', () => {
    expect(resolveSite('  CatholicTickets.com ')).toBe('catholic')
  })
  it('defaults to sportsquad when unset or unknown', () => {
    expect(resolveSite(undefined)).toBe('sportsquad')
    expect(resolveSite('')).toBe('sportsquad')
    expect(resolveSite('nope.example')).toBe('sportsquad')
  })
})
