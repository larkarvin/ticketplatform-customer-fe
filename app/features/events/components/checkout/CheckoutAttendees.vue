<!-- Checkout section: one ParticipantGroup per qualifying cart instance (has fields or collect_details_later). Blank-field tickets render nothing here. -->
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

const emit = defineEmits<{
  remove: [uid: string]
  'add-participant': [uid: string]
  'remove-participant': [uid: string, index: number]
}>()

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

/** Entries whose ticket has at least one participant field, or is collect_details_later.
 *  Blank-field (no fields, not later) tickets are excluded from this section. */
const qualifyingEntries = computed(() =>
  cartEntries.value.filter(({ ticket }) => (ticket.participant_fields?.length ?? 0) > 0 || ticket.collect_details_later)
)

const hasAnyFields = computed(() => qualifyingEntries.value.length > 0)

// The uid prefix of the first errored instance — ParticipantGroup watches this to auto-expand.
const forceExpandUid = computed(() => Object.keys(props.errors)[0]?.split('.')[0] ?? null)
</script>

<template>
  <section v-if="hasAnyFields" class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Who's attending</h2>
    <ParticipantGroup
      v-for="(entry, i) in qualifyingEntries"
      :key="entry.inst.uid"
      :ticket="entry.ticket"
      :instance="entry.inst"
      :instance-number="entry.instanceNumber"
      :identity-key="identityKeyFor(entry.inst.ticket_id)"
      :errors="errors"
      :default-open="i === 0"
      :force-expand-uid="forceExpandUid"
      @remove="emit('remove', $event)"
      @add-participant="emit('add-participant', $event)"
      @remove-participant="(uid, index) => emit('remove-participant', uid, index)"
    />
  </section>
</template>
