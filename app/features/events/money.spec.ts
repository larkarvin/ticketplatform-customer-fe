import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
  it('adds thousands separators and two decimals', () => {
    expect(formatMoney(1350, 'PHP')).toBe('PHP 1,350.00')
    expect(formatMoney(1234567.5, 'USD')).toBe('USD 1,234,567.50')
  })

  it('handles small and zero amounts', () => {
    expect(formatMoney(0, 'PHP')).toBe('PHP 0.00')
    expect(formatMoney(215, 'PHP')).toBe('PHP 215.00')
  })
})
