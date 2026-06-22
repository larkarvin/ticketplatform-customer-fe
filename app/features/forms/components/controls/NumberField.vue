<!-- controls/NumberField.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
import { borderClass, controlClass } from './inputClass'
const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <input
    :id="`field-${props.field.id}`"
    :value="(props.modelValue as string) ?? ''"
    type="number"
    :placeholder="props.field.placeholder ?? ''"
    :step="props.field.allow_decimal === false ? '1' : 'any'"
    :min="props.field.min !== null ? props.field.min : undefined"
    :max="props.field.max !== null ? props.field.max : undefined"
    :class="[controlClass, borderClass(props.invalid ?? false)]"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
