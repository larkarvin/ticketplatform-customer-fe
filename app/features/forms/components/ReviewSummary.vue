<script setup lang="ts">
// Read-back of the answers on the Review step: one card per section (label → value), each with an
// Edit link that jumps back to that step. Presentational — the composable owns the formatting.
import { Pencil } from '#icons'
import type { ReviewGroup } from '~/features/forms/composables/usePublicForm'

defineProps<{ groups: ReviewGroup[] }>()
const emit = defineEmits<{ edit: [stepIndex: number] }>()
</script>

<template>
  <div class="space-y-4">
    <section v-for="group in groups" :key="group.stepIndex" class="rounded-xl border border-gray-200 p-4 sm:p-5">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-base font-semibold text-gray-900">{{ group.title }}</h3>
        <button
          type="button"
          class="inline-flex min-h-tap items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
          @click="emit('edit', group.stepIndex)"
        >
          <Pencil :size="15" />
          Edit
        </button>
      </div>
      <dl class="space-y-3">
        <div v-for="item in group.items" :key="item.fieldId">
          <dt class="text-sm text-gray-500">{{ item.label }}</dt>
          <dd class="mt-0.5 text-base whitespace-pre-line text-gray-900">{{ item.value }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
