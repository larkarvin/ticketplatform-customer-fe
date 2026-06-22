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

// col_span 12 → full row; 6/4/3 → half (2-col max). Mobile stacks (grid-cols-1).
const cellClass = computed(() => (props.field.col_span >= 12 ? 'sm:col-span-2' : 'sm:col-span-1'))
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
