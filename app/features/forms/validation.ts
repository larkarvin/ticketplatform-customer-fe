// Pure, metadata-driven validation. The backend remains authoritative (422); these checks only
// avoid obvious round-trips. Display-only, readonly, and deferred types collect no data.
import type { Field } from './types'

export const COLLECTING_TYPES = new Set<string>([
  'text', 'email', 'textarea', 'phone', 'number', 'select', 'date', 'time', 'file', 'image',
])

export function isCollecting(field: Field): boolean {
  return field.visibility !== 'readonly' && field.visibility !== 'admin' && COLLECTING_TYPES.has(field.type)
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateField(field: Field, value: unknown): string | null {
  if (!isCollecting(field)) return null

  if (field.required && isEmpty(value)) return `${field.label} is required`
  if (isEmpty(value)) return null // optional + empty → fine

  if (field.type === 'email' && typeof value === 'string' && !EMAIL_RE.test(value.trim())) {
    return 'Enter a valid email address'
  }

  if (field.type === 'number') {
    const n = Number(value)
    if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(n)) return 'Enter a number'
    if (field.allow_decimal === false && !Number.isInteger(n)) return 'Enter a whole number'
    if (field.min !== null && n < field.min) return `Must be at least ${field.min}`
    if (field.max !== null && n > field.max) return `Must be at most ${field.max}`
  }

  if (field.type === 'select') {
    const keys = field.options.map((o) => o.option_key)
    if (!keys.includes(String(value))) return 'Choose one of the options'
  }

  return null
}

export function validateAll(fields: Field[], answers: Record<string, unknown>): Record<number, string> {
  const errors: Record<number, string> = {}
  for (const field of fields) {
    const msg = validateField(field, answers[String(field.id)])
    if (msg) errors[field.id] = msg
  }
  return errors
}
