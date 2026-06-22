<script setup lang="ts">
import { Loader2, Upload, X } from '#icons'
import type { Field } from '~/features/forms/types'
import { borderClass } from './inputClass'
const props = defineProps<{
  field: Field
  modelValue: unknown
  invalid?: boolean
  uploading?: boolean
  filename?: string | null
}>()
const emit = defineEmits<{ select: [File]; clear: [] }>()
const accept = () => (props.field.type === 'image' ? 'image/*' : undefined)
function onChange(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <label
      :class="[
        'flex min-h-tap cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-gray-600 hover:border-brand-500 dark:text-gray-300',
        borderClass(props.invalid ?? false),
      ]"
    >
      <input :id="`field-${field.id}`" type="file" :accept="accept()" class="sr-only" @change="onChange" />
      <Loader2 v-if="uploading" :size="18" class="animate-spin text-brand-500" />
      <Upload v-else :size="18" class="text-gray-400" />
      <span>{{ uploading ? 'Uploading…' : 'Choose a file' }}</span>
    </label>
    <p v-if="filename && !uploading" class="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      {{ filename }}
      <button type="button" class="text-gray-400 hover:text-danger-600" aria-label="Remove file" @click="emit('clear')">
        <X :size="14" />
      </button>
    </p>
  </div>
</template>
