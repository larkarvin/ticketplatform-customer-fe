<!-- Checkout section: per-ticket, per-admit attendee detail fields.
     Tickets with collect_details_later=true are skipped entirely. -->
<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import type { Field } from '#core/field-engine/types'
import type { CheckoutSelection, PublicTicket } from '../../types'

const props = defineProps<{
  tickets: PublicTicket[]
  selection: CheckoutSelection[]
  answers: Record<number, Array<Record<string, unknown>>>
  errors: Record<string, string>
}>()

function ticketFor(id: number): PublicTicket | undefined {
  return props.tickets.find((t) => t.id === id)
}

function fields(id: number): Field[] {
  const t = ticketFor(id)
  return t && !t.collect_details_later ? (t.participant_fields ?? []) : []
}

const hasAnyFields = (): boolean => props.selection.some((s) => fields(s.ticket_id).length > 0)

function setAnswer(ticketId: number, index: number, key: string, value: unknown): void {
  const row = props.answers[ticketId]
  if (row?.[index] !== undefined) {
    row[index][key] = value
  }
}
</script>

<template>
  <section v-if="hasAnyFields()" class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Who's attending</h2>
    <template v-for="sel in selection" :key="sel.ticket_id">
      <div
        v-for="i in sel.quantity"
        :key="`${sel.ticket_id}-${i}`"
        class="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ ticketFor(sel.ticket_id)?.name }} · attendee {{ i }}
        </p>
        <div class="grid grid-cols-12 gap-4">
          <FieldCell
            v-for="f in fields(sel.ticket_id)"
            :key="f.id"
            :field="f"
            :model-value="answers[sel.ticket_id]?.[i - 1]?.[f.field_key]"
            :error="errors[`${sel.ticket_id}.${i - 1}.${f.field_key}`]"
            @update:model-value="setAnswer(sel.ticket_id, i - 1, f.field_key, $event)"
          />
        </div>
      </div>
    </template>
  </section>
</template>
