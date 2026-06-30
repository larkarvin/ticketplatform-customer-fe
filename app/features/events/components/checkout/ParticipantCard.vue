<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import type { Field } from '#core/field-engine/types'
import { Check, ChevronDown, Copy, Trash2 } from '#icons'
import { computed, nextTick, ref, watch } from 'vue'
import { participantFieldErrors } from '../../checkoutValidation'
import type { CartParticipant } from '../../types'

const props = defineProps<{
  fields: Field[]
  participant: CartParticipant
  index: number
  identityKey: string | null
  errors: Record<string, string>
  errorPrefix: string
  title: string
  canCopy: boolean
  canRemove: boolean
}>()
const emit = defineEmits<{ 'copy-from-above': []; remove: [] }>()

const identityInput = ref<HTMLElement>()

// Progressive disclosure: the first card opens; the rest start collapsed (shown by their status pill)
// so a long group form isn't a wall of fields. Auto-open if this person has submit errors.
const open = ref(props.index === 0)

// Live completion + per-field errors from the shared validator, so the pill agrees with the Continue
// gate exactly (a non-empty but invalid value counts as incomplete, never "done"). missingCount derives
// from liveErrors rather than re-validating, so each keystroke validates the participant once, not twice.
const liveErrors = computed(() => participantFieldErrors(props.fields, props.participant))
const missingCount = computed(() => Object.keys(liveErrors.value).length)
const complete = computed(() => missingCount.value === 0 && props.fields.length > 0)

// On-leave inline validation: a field's error shows once the buyer has finished that person (focus left
// the card) or after a submit attempt — never mid-typing. Submit errors (from the parent) always show.
const revealed = ref(false)
function errorFor(f: Field): string | undefined {
  const submitError = props.errors[`${props.errorPrefix}.${f.field_key}`]
  if (submitError) return submitError
  return revealed.value ? liveErrors.value[f.field_key] : undefined
}

// Reveal + auto-expand the moment this person has a submit error, so it can't hide while collapsed.
const hasSubmitError = computed(() => Object.keys(props.errors).some((k) => k.startsWith(`${props.errorPrefix}.`)))
watch(
  hasSubmitError,
  (has) => {
    if (has) {
      revealed.value = true
      open.value = true
    }
  },
  { immediate: true }
)

function onCardFocusOut(e: FocusEvent): void {
  // Only reveal when focus actually leaves the card (not when moving between its own fields), so the
  // buyer is never nagged about a field they're about to fill.
  const next = e.relatedTarget as Node | null
  if (next && e.currentTarget instanceof Node && (e.currentTarget as HTMLElement).contains(next)) return
  revealed.value = true
}

function set(key: string, value: unknown): void {
  const data = props.participant.field_data
  data[key] = value
}

async function focusIdentity(): Promise<void> {
  open.value = true
  await nextTick()
  const el = identityInput.value?.querySelector('input')
  el?.focus()
  el?.select()
}

defineExpose({ focusIdentity })
</script>

<template>
  <div
    :id="`attendee-${errorPrefix.replaceAll('.', '-')}`"
    class="rounded-xl border border-gray-200 dark:border-gray-700"
    @focusout="onCardFocusOut"
  >
    <div class="flex items-center gap-2 px-4 pt-4 pb-3">
      <button
        data-test="card-toggle"
        type="button"
        class="flex flex-1 items-center gap-2 text-left min-h-tap"
        :aria-expanded="open"
        :aria-label="open ? `Collapse ${title}` : `Expand ${title}`"
        @click="open = !open"
      >
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</span>
        <span
          v-if="fields.length > 0"
          data-test="card-status"
          class="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            complete
              ? 'bg-success-100 text-success-700'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          "
        >
          <Check v-if="complete" :size="13" class="shrink-0" aria-hidden="true" />
          {{ complete ? 'Complete' : `${missingCount} to add` }}
        </span>
        <ChevronDown
          :size="18"
          class="ml-auto shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none"
          :class="open ? '' : '-rotate-90'"
        />
      </button>
      <button
        v-if="canCopy"
        data-test="copy-above"
        type="button"
        class="flex min-h-tap min-w-tap items-center gap-1 rounded px-2 text-sm font-medium text-brand-500 hover:text-brand-600"
        @click="emit('copy-from-above')"
      >
        <Copy class="size-4 shrink-0" aria-hidden="true" />
        Copy from above
      </button>
      <button
        v-if="canRemove"
        data-test="remove"
        type="button"
        class="flex min-h-tap min-w-tap items-center gap-1 rounded border-l border-gray-200 pl-3 text-sm font-medium text-danger-500 hover:text-danger-600 dark:border-gray-700"
        @click="emit('remove')"
      >
        <Trash2 class="size-4 shrink-0" aria-hidden="true" />
        Remove
      </button>
    </div>
    <div v-show="open" data-test="card-body" class="grid grid-cols-12 gap-4 px-4 pb-4">
      <FieldCell
        v-for="f in fields"
        :key="f.id"
        :ref="
          f.field_key === identityKey
            ? (el) => (identityInput = (el as InstanceType<typeof FieldCell>)?.$el)
            : undefined
        "
        :field="f"
        :model-value="participant.field_data[f.field_key]"
        :error="errorFor(f)"
        @update:model-value="set(f.field_key, $event)"
      />
    </div>
  </div>
</template>
