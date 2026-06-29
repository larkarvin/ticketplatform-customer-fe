<script setup lang="ts">
import { Trash2 } from '#icons'
import { computed, ref, watch } from 'vue'
import type { CartTicket, PublicTicket } from '../../types'
import ParticipantCard from './ParticipantCard.vue'

const props = defineProps<{
  ticket: PublicTicket
  instance: CartTicket
  instanceNumber: number
  identityKey: string | null
  errors: Record<string, string>
  showPrefill: boolean
  buyerName: string
  forceExpandUid?: string | null
}>()
const emit = defineEmits<{ remove: [uid: string] }>()

const cards = ref<Array<InstanceType<typeof ParticipantCard> | null>>([])
const collapsed = ref(props.ticket.collect_details_later)

watch(
  () => props.forceExpandUid,
  (uid) => {
    if (uid === props.instance.uid) collapsed.value = false
  },
  { immediate: true }
)
const fields = computed(() => props.ticket.participant_fields ?? [])

const names = computed(() =>
  props.identityKey
    ? props.instance.participants.map((p) => p.field_data[props.identityKey as string]).filter(Boolean)
    : []
)
const complete = computed(
  () =>
    !!props.identityKey &&
    props.instance.participants.every((p) => `${p.field_data[props.identityKey as string] ?? ''}`.trim() !== '')
)

function copyInto(i: number): void {
  const src = props.instance.participants[i - 1]?.field_data
  if (!src) return
  const target = props.instance.participants[i]
  if (!target) return
  target.field_data = { ...src }
  cards.value[i]?.focusIdentity()
}

function setGroupName(value: string): void {
  const inst = props.instance
  inst.group_name = value
}

function groupLabel(): string {
  return `${props.ticket.name} · #${props.instanceNumber}`
}
</script>

<template>
  <fieldset class="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
    <div class="flex items-center justify-between">
      <legend class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ groupLabel() }}
        <span v-if="ticket.admits_per_ticket > 1" class="ml-1 font-normal text-gray-500">
          · {{ names.length }} of {{ ticket.admits_per_ticket }}
        </span>
      </legend>
      <button
        data-test="remove-group"
        type="button"
        aria-label="Remove this ticket"
        class="flex min-h-tap min-w-tap items-center justify-center text-gray-400 hover:text-danger-500"
        @click="emit('remove', instance.uid)"
      >
        <Trash2 :size="18" />
      </button>
    </div>

    <!-- collect-later or completed → collapsed summary -->
    <div v-if="collapsed" class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
      <span v-if="ticket.collect_details_later">
        {{ ticket.admits_per_ticket }} participants — you'll add names after payment
      </span>
      <span v-else>✓ {{ names.join(', ') }}</span>
      <button
        v-if="!ticket.collect_details_later"
        type="button"
        class="min-h-tap text-brand-500"
        @click="collapsed = false"
      >
        Edit
      </button>
    </div>

    <template v-else>
      <div v-if="ticket.ask_group_name">
        <label :for="`gn-${instance.uid}`" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ ticket.group_name_label }}
          <span class="text-xs text-gray-400">(optional)</span>
        </label>
        <input
          :id="`gn-${instance.uid}`"
          :value="instance.group_name"
          type="text"
          class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @input="setGroupName(($event.target as HTMLInputElement).value)"
        />
      </div>

      <ParticipantCard
        v-for="(p, i) in instance.participants"
        :key="i"
        :ref="(el) => (cards[i] = el as InstanceType<typeof ParticipantCard> | null)"
        :fields="fields"
        :participant="p"
        :index="i"
        :identity-key="identityKey"
        :errors="errors"
        :error-prefix="`${instance.uid}.${i}`"
        :show-prefill="showPrefill && instanceNumber === 1 && i === 0"
        :buyer-name="buyerName"
        @copy-from-above="copyInto(i)"
      />

      <button v-if="complete" type="button" class="min-h-tap text-sm text-gray-500" @click="collapsed = true">
        Done — collapse
      </button>
    </template>
  </fieldset>
</template>
