import { describe, expect, it } from 'vitest'
import { hasAnswer } from './answers'

describe('hasAnswer', () => {
  it('treats null/undefined/blank/empty-array as absent', () => {
    expect(hasAnswer(null)).toBe(false)
    expect(hasAnswer(undefined)).toBe(false)
    expect(hasAnswer('')).toBe(false)
    expect(hasAnswer('   ')).toBe(false)
    expect(hasAnswer([])).toBe(false)
  })

  it('treats false and 0 as absent — an unchecked box or zero donation is not an answer', () => {
    expect(hasAnswer(false)).toBe(false)
    expect(hasAnswer(0)).toBe(false)
    expect(hasAnswer(Number.NaN)).toBe(false)
  })

  it('treats positive selections as present', () => {
    expect(hasAnswer(true)).toBe(true)
    expect(hasAnswer(25)).toBe(true)
    expect(hasAnswer('Juan')).toBe(true)
    expect(hasAnswer([{ variant_id: 1, quantity: 1 }])).toBe(true)
  })
})
