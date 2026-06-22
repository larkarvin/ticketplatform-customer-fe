<!-- controls/SelectField.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
import { borderClass, controlClass } from './inputClass'
const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const optionLabel = (label: string, price: number | null) => (price ? `${label} (+${price})` : label)
</script>
<template>
  <select
    :id="`field-${props.field.id}`"
    :value="(props.modelValue as string) ?? ''"
    :class="[controlClass, borderClass(props.invalid ?? false)]"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="" disabled>{{ props.field.placeholder ?? 'Choose…' }}</option>
    <option v-for="o in props.field.options" :key="o.id" :value="o.option_key">
      {{ optionLabel(o.label, o.price) }}
    </option>
  </select>
</template>
