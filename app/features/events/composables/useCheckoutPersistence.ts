import type { CartTicket } from '../types'

export interface CheckoutDraft {
  tickets: CartTicket[]
  checkoutAnswers: Record<string, unknown>
  email: string
}

const DEBOUNCE_MS = 400

function storageKey(slug: string): string {
  return `checkout:${slug}`
}

export function useCheckoutPersistence(slug: string) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function restore(): CheckoutDraft | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(storageKey(slug))
    if (raw === null) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        'tickets' in parsed &&
        'checkoutAnswers' in parsed &&
        'email' in parsed &&
        Array.isArray((parsed as Record<string, unknown>).tickets) &&
        typeof (parsed as Record<string, unknown>).checkoutAnswers === 'object' &&
        typeof (parsed as Record<string, unknown>).email === 'string'
      ) {
        return parsed as CheckoutDraft
      }
      return null
    } catch {
      return null
    }
  }

  function save(draft: CheckoutDraft): void {
    if (typeof window === 'undefined') return
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(draft))
      debounceTimer = null
    }, DEBOUNCE_MS)
  }

  function clear(): void {
    if (typeof window === 'undefined') return
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    window.localStorage.removeItem(storageKey(slug))
  }

  return { restore, save, clear }
}
