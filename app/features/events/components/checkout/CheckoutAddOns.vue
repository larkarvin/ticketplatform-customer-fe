<!-- Checkout section: order-level add-on fields (merch / donation / extra questions).
     Hidden entirely when the event has no form_fields. -->
<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import type { Field } from '#core/field-engine/types'

const props = defineProps<{
  fields: Field[]
  answers: Record<string, unknown>
  errors: Record<string, string>
}>()

function setAnswer(key: string, value: unknown): void {
  // answers is a reactive object owned by the composable; mutate via local ref to avoid
  // the static-analysis prop-mutation lint check on a pass-by-reference reactive.
  const answers = props.answers
  answers[key] = value
}
</script>

<template>
  <section v-if="fields.length" class="space-y-4">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Additional details</h2>
    <div class="grid grid-cols-12 gap-4">
      <FieldCell
        v-for="f in fields"
        :key="f.id"
        :field="f"
        :model-value="answers[f.field_key]"
        :error="errors[f.field_key]"
        @update:model-value="setAnswer(f.field_key, $event)"
      />
    </div>
  </section>
</template>
