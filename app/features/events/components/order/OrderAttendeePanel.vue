<!-- Post-purchase attendee panel: lets a buyer fill in / fix attendee details from the order page.
     Props-in/events-out — reuses ParticipantCard, no service/#core/api import here. -->
<script setup lang="ts">
import { reactive } from 'vue'
import ParticipantCard from '../checkout/ParticipantCard.vue'
import type { AttendeeSubmission, PublicOrder } from '../../types'

const props = defineProps<{ order: PublicOrder; errors: Record<string, string>; saving: boolean }>()
const emit = defineEmits<{ submit: [AttendeeSubmission[]] }>()

// Flatten ticket items → one editable row per attendee, carrying the fields that item's
// attendees must answer and a mutable copy of their field_data for ParticipantCard to edit in place.
const rows = reactive(
  props.order.items.flatMap((item) =>
    (item.attendees ?? []).map((a) => ({
      id: a.id,
      fields: item.participant_fields ?? [],
      participant: { field_data: { ...a.field_data } },
    }))
  )
)

function save(): void {
  emit(
    'submit',
    rows.map((r) => ({ id: r.id, field_data: r.participant.field_data }))
  )
}
</script>

<template>
  <section class="mt-8">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Who's attending?</h2>
    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Add the details for everyone coming.</p>

    <div class="mt-4 space-y-3">
      <ParticipantCard
        v-for="(r, i) in rows"
        :key="r.id"
        :fields="r.fields"
        :participant="r.participant"
        :index="i"
        :identity-key="null"
        :errors="errors"
        :error-prefix="String(i)"
        :title="`Attendee ${i + 1}`"
        :can-copy="false"
        :can-remove="false"
      />
    </div>

    <button
      data-test="save-attendees"
      type="button"
      class="min-h-tap mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      :disabled="saving"
      @click="save"
    >
      {{ saving ? 'Saving…' : 'Save attendee details' }}
    </button>
  </section>
</template>
