/**
 * Pure helpers for the order page — kept outside the .vue component so they are
 * unit-testable without mounting the page.
 */

/**
 * Formats a seconds countdown as mm:ss.
 * Returns '' for null or negative values.
 */
export function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds < 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
