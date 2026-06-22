<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
import DateField from './controls/DateField.vue'
import EmailField from './controls/EmailField.vue'
import NumberField from './controls/NumberField.vue'
import PhoneField from './controls/PhoneField.vue'
import SelectField from './controls/SelectField.vue'
import TextareaField from './controls/TextareaField.vue'
import TextField from './controls/TextField.vue'
import TimeField from './controls/TimeField.vue'
import DecorativeImage from './display/DecorativeImage.vue'
import Divider from './display/Divider.vue'
import HeadingBlock from './display/HeadingBlock.vue'
import ParagraphBlock from './display/ParagraphBlock.vue'
import Spacer from './display/Spacer.vue'

const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [unknown] }>()

const controls: Record<string, unknown> = {
  text: TextField,
  email: EmailField,
  textarea: TextareaField,
  phone: PhoneField,
  number: NumberField,
  select: SelectField,
  date: DateField,
  time: TimeField,
}
const displays: Record<string, unknown> = {
  paragraph: ParagraphBlock,
  heading: HeadingBlock,
  divider: Divider,
  spacer: Spacer,
  decorative_image: DecorativeImage,
}
const control = computed(() => controls[props.field.type] ?? null)
const display = computed(() => displays[props.field.type] ?? null)
</script>

<template>
  <component :is="display" v-if="display" :field="field" />
  <component
    :is="control"
    v-else-if="control"
    :field="field"
    :model-value="modelValue"
    :invalid="invalid"
    @update:model-value="emit('update:modelValue', $event)"
  />
  <p v-else class="text-sm text-gray-400">This field type isn't available yet.</p>
</template>
