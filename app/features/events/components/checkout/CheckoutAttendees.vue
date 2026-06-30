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

// Every instance uid that has a submit error — each ParticipantGroup watches this to auto-expand, so
// fixing one group then pressing Continue no longer hides errors still pending in another group.
const forceExpandUids = computed(() => [...new Set(Object.keys(props.errors).map((k) => k.split('.')[0]!))])

// How many distinct people (uid.index) still have unmet required fields — drives the summary banner.
const peopleWithErrors = computed(
  () => new Set(Object.keys(props.errors).map((k) => k.split('.').slice(0, 2).join('.'))).size
)
</script>

<template>
  <section v-if="hasAnyFields" class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Who's attending</h2>
    <p
      v-if="peopleWithErrors > 0"
      role="alert"
      aria-live="polite"
      class="rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-950 dark:text-danger-300"
    >
      Please finish the required details for
      {{ peopleWithErrors === 1 ? '1 person' : `${peopleWithErrors} people` }}
      below.
    </p>
    <ParticipantGroup
      v-for="(entry, i) in qualifyingEntries"
      :key="entry.inst.uid"
      :ticket="entry.ticket"
      :instance="entry.inst"
      :instance-number="entry.instanceNumber"
      :identity-key="identityKeyFor(entry.inst.ticket_id)"
      :errors="errors"
      :default-open="i === 0"
      :force-expand-uids="forceExpandUids"
      @remove="emit('remove', $event)"
      @add-participant="emit('add-participant', $event)"
      @remove-participant="(uid, index) => emit('remove-participant', uid, index)"
    />
  </section>
</template>
