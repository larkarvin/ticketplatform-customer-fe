<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import type { Field } from '#core/field-engine/types'
import { Copy, Trash2 } from '#icons'
import { nextTick, ref } from 'vue'
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

function set(key: string, value: unknown): void {
  const data = props.participant.field_data
  data[key] = value
}

async function focusIdentity(): Promise<void> {
  await nextTick()
  const el = identityInput.value?.querySelector('input')
  el?.focus()
  el?.select()
}

defineExpose({ focusIdentity })
</script>

<template>
  <div class="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</p>
      <button
        v-if="canCopy"
        data-test="copy-above"
        type="button"
        class="ml-auto flex min-h-tap min-w-tap items-center gap-1 rounded px-2 text-sm font-medium text-brand-500 hover:text-brand-600"
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
        :class="canCopy ? 'ml-2' : 'ml-auto'"
        @click="emit('remove')"
      >
        <Trash2 class="size-4 shrink-0" aria-hidden="true" />
        Remove
      </button>
    </div>
    <div class="grid grid-cols-12 gap-4">
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
        :error="errors[`${errorPrefix}.${f.field_key}`]"
        @update:model-value="set(f.field_key, $event)"
      />
    </div>
  </div>
</template>
