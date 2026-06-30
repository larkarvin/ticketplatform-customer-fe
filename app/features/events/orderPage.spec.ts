import { describe, expect, it } from 'vitest'
import { formatCountdown } from './orderPage'

describe('formatCountdown', () => {
  it('returns empty string for null', () => {
    expect(formatCountdown(null)).toBe('')
  })

  it('returns empty string for negative values', () => {
    expect(formatCountdown(-1)).toBe('')
    expect(formatCountdown(-100)).toBe('')
  })

  it('formats 0 as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00')
  })

  it('formats seconds only (< 60)', () => {
    expect(formatCountdown(5)).toBe('00:05')
    expect(formatCountdown(59)).toBe('00:59')
  })

  it('formats exactly 1 minute', () => {
    expect(formatCountdown(60)).toBe('01:00')
  })

  it('formats 90 seconds as 01:30', () => {
    expect(formatCountdown(90)).toBe('01:30')
  })

  it('formats 600 seconds as 10:00', () => {
    expect(formatCountdown(600)).toBe('10:00')
  })

  it('formats 3661 seconds (1h 1m 1s) — shows only mm:ss portion', () => {
    expect(formatCountdown(3661)).toBe('61:01')
  })
})
