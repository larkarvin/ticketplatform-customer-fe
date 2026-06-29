import { ref, type Ref } from 'vue'
import type { CartTicket, CheckoutSelection, PublicEvent, PublicTicket } from '../types'

export function useCart(event: PublicEvent, initial: CheckoutSelection[]) {
  const ticketDef = (id: number): PublicTicket | undefined => event.tickets.find((t) => t.id === id)
  const counters: Record<number, number> = {}

  function makeInstance(id: number): CartTicket {
    const admits = ticketDef(id)?.admits_per_ticket ?? 1
    const n = (counters[id] = (counters[id] ?? 0) + 1)
    return {
      uid: `${id}-${n}`,
      ticket_id: id,
      participants: Array.from({ length: admits }, () => ({ field_data: {} })),
    }
  }

  const cart: Ref<CartTicket[]> = ref(
    initial
      .filter((s) => ticketDef(s.ticket_id))
      .flatMap((s) => Array.from({ length: s.quantity }, () => makeInstance(s.ticket_id)))
  )

  const ticketsFor = (id: number): CartTicket[] => cart.value.filter((c) => c.ticket_id === id)
  const quantityOf = (id: number): number => ticketsFor(id).length

  function maxFor(id: number): number {
    const t = ticketDef(id)
    return Math.min(t?.max_per_order ?? Infinity, t?.available_quantity ?? Infinity)
  }

  function addTicket(id: number): void {
    if (quantityOf(id) >= maxFor(id)) return
    cart.value = [...cart.value, makeInstance(id)]
  }

  function removeTicket(uid: string): void {
    cart.value = cart.value.filter((c) => c.uid !== uid)
  }

  const serializeToQuery = (): string =>
    event.tickets
      .map((t) => [t.id, quantityOf(t.id)] as const)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => `${id}:${q}`)
      .join(',')

  return { cart, ticketDef, ticketsFor, quantityOf, maxFor, addTicket, removeTicket, serializeToQuery }
}
