<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
import { isCollecting } from '~/features/forms/validation'
import FieldControl from './FieldControl.vue'

const props = defineProps<{
  field: Field
  modelValue: unknown
  error?: string
  upload?: { uploading: boolean; filename: string | null }
}>()
const emit = defineEmits<{ 'update:modelValue': [unknown]; upload: [File] }>()

// Faithfully honor the admin's 12-col grid on sm+ (col_span 3 → 4-up, 4 → 3-up, 6 → 2-up, 12 → full);
// mobile stacks (the parent grid is grid-cols-1 below sm). Literal classes so Tailwind generates them.
const COL_SPAN: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
}
const cellClass = computed(() => COL_SPAN[props.field.col_span] ?? 'sm:col-span-12')
const showLabel = computed(() => isCollecting(props.field))
</script>

<template>
  <div :class="cellClass">
    <label
      v-if="showLabel"
      :for="`field-${field.id}`"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
    >
      {{ field.label }}
      <span v-if="field.required" class="text-danger-500">*</span>
    </label>
    <p v-if="showLabel && field.description" class="mb-1 text-xs text-gray-500 dark:text-gray-400">
      {{ field.description }}
    </p>
    <FieldControl
      :field="field"
      :model-value="modelValue"
      :invalid="!!error"
      :upload="upload"
      @update:model-value="emit('update:modelValue', $event)"
      @upload="emit('upload', $event)"
    />
    <p v-if="error" :id="`field-${field.id}-error`" class="mt-1 text-sm text-danger-600 dark:text-danger-400">
      {{ error }}
    </p>
  </div>
</template>
