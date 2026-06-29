<!-- Checkout section: one ParticipantGroup per cart instance, cart-driven. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { CartTicket, PublicEvent, PublicTicket } from '../../types'
import ParticipantGroup from './ParticipantGroup.vue'

const props = defineProps<{
  event: PublicEvent
  cart: CartTicket[]
  identityKeyFor: (ticketId: number) => string | null
  errors: Record<string, string>
}>()

const emit = defineEmits<{ remove: [uid: string] }>()

interface CartEntry {
  inst: CartTicket
  ticket: PublicTicket
  instanceNumber: number
}

const cartEntries = computed<CartEntry[]>(() => {
  const counts = new Map<number, number>()
  return props.cart.flatMap((inst) => {
    const ticket = props.event.tickets.find((t) => t.id === inst.ticket_id)
    if (!ticket) return []
    const n = (counts.get(inst.ticket_id) ?? 0) + 1
    counts.set(inst.ticket_id, n)
    return [{ inst, ticket, instanceNumber: n }]
  })
})

const hasAnyFields = computed(() =>
  cartEntries.value.some(({ ticket }) => !ticket.collect_details_later && (ticket.participant_fields?.length ?? 0) > 0)
)

// The uid prefix of the first errored instance — ParticipantGroup watches this to auto-expand.
const forceExpandUid = computed(() => Object.keys(props.errors)[0]?.split('.')[0] ?? null)
</script>

<template>
  <section v-if="hasAnyFields" class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Who's attending</h2>
    <ParticipantGroup
      v-for="(entry, i) in cartEntries"
      :key="entry.inst.uid"
      :ticket="entry.ticket"
      :instance="entry.inst"
      :instance-number="entry.instanceNumber"
      :identity-key="identityKeyFor(entry.inst.ticket_id)"
      :errors="errors"
      :default-open="i === 0"
      :force-expand-uid="forceExpandUid"
      @remove="emit('remove', $event)"
    />
  </section>
</template>
