<script setup lang="ts">
import { ChevronDown, Plus, Trash2 } from '#icons'
import { computed, ref, watch } from 'vue'
import type { CartTicket, PublicTicket } from '../../types'
import ParticipantCard from './ParticipantCard.vue'

const props = defineProps<{
  ticket: PublicTicket
  instance: CartTicket
  instanceNumber: number
  identityKey: string | null
  errors: Record<string, string>
  defaultOpen: boolean
  forceExpandUid?: string | null
}>()

const emit = defineEmits<{
  remove: [uid: string]
  'add-participant': [uid: string]
  'remove-participant': [uid: string, index: number]
}>()

const cards = ref<Array<InstanceType<typeof ParticipantCard> | null>>([])

const open = ref(props.ticket.collect_details_later ? false : props.defaultOpen)

watch(
  () => props.forceExpandUid,
  (uid) => {
    if (uid === props.instance.uid) open.value = true
  },
  { immediate: true }
)

const fields = computed(() => props.ticket.participant_fields ?? [])

const requiredKeys = computed(() => fields.value.filter((f) => f.required).map((f) => f.field_key))

const completedCount = computed(
  () =>
    props.instance.participants.filter((p) => requiredKeys.value.every((k) => `${p.field_data[k] ?? ''}`.trim() !== ''))
      .length
)

const totalCount = computed(() => props.instance.participants.length)

function setGroupName(value: string): void {
  const inst = props.instance
  inst.group_name = value
}

function copyInto(i: number): void {
  const src = props.instance.participants[i - 1]?.field_data
  if (!src) return
  const target = props.instance.participants[i]
  if (!target) return
  for (const k of Object.keys(src)) {
    const field = fields.value.find((f) => f.field_key === k)
    if (k === 'email' || field?.type === 'email') continue
    target.field_data[k] = src[k]
  }
  cards.value[i]?.focusIdentity()
}

function removeParticipant(i: number): void {
  emit('remove-participant', props.instance.uid, i)
}
</script>

<template>
  <fieldset class="rounded-xl border border-gray-200 dark:border-gray-700">
    <!-- Header row: toggle (title + badge + chevron) and trash as siblings -->
    <div class="flex items-center gap-1 px-4 pt-4 pb-3">
      <button
        data-test="toggle"
        type="button"
        class="flex flex-1 items-center gap-2 text-left min-h-tap"
        :aria-expanded="open"
        :aria-label="open ? `Collapse ${ticket.name}` : `Expand ${ticket.name}`"
        @click="open = !open"
      >
        <span class="font-semibold text-gray-900 dark:text-white text-sm">
          {{ ticket.name }} · #{{ instanceNumber }}
        </span>
        <span
          data-test="badge"
          class="rounded-full px-2 py-0.5 text-xs font-medium ml-2"
          :class="
            completedCount === totalCount
              ? 'bg-success-100 text-success-700'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          "
        >
          {{ completedCount }}/{{ totalCount }}
        </span>
        <ChevronDown
          :size="18"
          class="ml-auto shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none"
          :class="open ? '' : '-rotate-90'"
        />
      </button>
      <button
        data-test="remove-group"
        type="button"
        aria-label="Remove this ticket"
        class="flex min-h-tap min-w-tap shrink-0 items-center justify-center text-gray-400 hover:text-danger-500"
        @click="emit('remove', instance.uid)"
      >
        <Trash2 :size="18" />
      </button>
    </div>

    <div v-show="open" data-test="body" class="px-4 pb-4 space-y-3">
      <!-- collect_details_later: collapsed summary only -->
      <p v-if="ticket.collect_details_later" class="text-sm text-gray-600 dark:text-gray-300">
        {{ instance.participants.length }} participants — you'll add names after payment
      </p>

      <template v-else>
        <div v-if="ticket.ask_group_name">
          <label :for="`gn-${instance.uid}`" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ ticket.group_name_label }}
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
          :title="`Participant ${i + 1}`"
          :can-copy="i > 0"
          :can-remove="instance.participants.length > ticket.min_participants"
          @copy-from-above="copyInto(i)"
          @remove="removeParticipant(i)"
        />

        <button
          v-if="ticket.participant_type === 'group' && instance.participants.length < ticket.max_participants"
          data-test="add-participant"
          type="button"
          class="flex min-h-tap items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
          @click="emit('add-participant', instance.uid)"
        >
          <Plus :size="16" aria-hidden="true" />
          Add Participant
        </button>
      </template>
    </div>
  </fieldset>
</template>
