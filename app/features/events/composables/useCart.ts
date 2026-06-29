import { ref, type Ref } from 'vue'
import type { CartTicket, CheckoutSelection, PublicEvent, PublicTicket } from '../types'

export function useCart(event: PublicEvent, initial: CheckoutSelection[]) {
  const ticketDef = (id: number): PublicTicket | undefined => event.tickets.find((t) => t.id === id)
  const counters: Record<number, number> = {}

  function makeInstance(id: number): CartTicket {
    const def = ticketDef(id)
    const minP = def?.min_participants ?? 1
    const n = (counters[id] = (counters[id] ?? 0) + 1)
    return {
      uid: `${id}-${n}`,
      ticket_id: id,
      participants: Array.from({ length: minP }, () => ({ field_data: {} })),
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

  function addParticipant(uid: string): void {
    const instance = cart.value.find((c) => c.uid === uid)
    if (!instance) return
    const max = ticketDef(instance.ticket_id)?.max_participants ?? 1
    if (instance.participants.length >= max) return
    instance.participants.push({ field_data: {} })
  }

  function removeParticipant(uid: string, index: number): void {
    const instance = cart.value.find((c) => c.uid === uid)
    if (!instance) return
    const min = ticketDef(instance.ticket_id)?.min_participants ?? 1
    if (instance.participants.length <= min) return
    instance.participants.splice(index, 1)
  }

  function replaceCart(tickets: CartTicket[]): void {
    for (const t of tickets) {
      const match = /^(\d+)-(\d+)$/.exec(t.uid)
      if (!match) continue
      const id = Number(match[1])
      const n = Number(match[2])
      counters[id] = Math.max(counters[id] ?? 0, n)
    }
    cart.value = tickets
  }

  const serializeToQuery = (): string =>
    event.tickets
      .map((t) => [t.id, quantityOf(t.id)] as const)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => `${id}:${q}`)
      .join(',')

  return {
    cart,
    ticketDef,
    ticketsFor,
    quantityOf,
    maxFor,
    addTicket,
    removeTicket,
    addParticipant,
    removeParticipant,
    replaceCart,
    serializeToQuery,
  }
}
