<!-- controls/TextareaField.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
import { borderClass, controlClass } from './inputClass'
const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <textarea
    :id="`field-${props.field.id}`"
    :value="(props.modelValue as string) ?? ''"
    rows="4"
    :placeholder="props.field.placeholder ?? ''"
    :class="[controlClass, borderClass(props.invalid ?? false)]"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
