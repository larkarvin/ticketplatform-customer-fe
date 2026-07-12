<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import { Check, Lock } from '#icons'
import type { SubmissionEditState } from '~/features/forms/composables/useSubmissionEdit'

const props = defineProps<{ state: SubmissionEditState }>()
const s = props.state
</script>

<template>
  <div class="bg-white px-4 py-6 sm:rounded-2xl sm:p-10 sm:shadow-theme-lg sm:ring-1 sm:ring-gray-100">
    <header class="mb-8">
      <h1 class="text-title-sm font-semibold leading-tight tracking-tight text-gray-900">
        {{ s.detail.form.title }}
      </h1>
      <p class="mt-2 text-lg text-gray-600">Update your response below.</p>
    </header>

    <form class="space-y-6" novalidate @submit.prevent="s.submit()">
      <div class="grid grid-cols-12 gap-5">
        <template v-for="field in s.fields.value" :key="field.id">
          <!-- Locked (priced-when-paid / disabled): show the answer as read-only text. -->
          <div v-if="s.isLocked(field)" class="col-span-12">
            <p class="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              {{ field.label }}
              <Lock :size="14" class="text-gray-400" />
            </p>
            <p class="min-h-control-lg rounded-xl bg-gray-50 px-4 py-3 text-base text-gray-600 ring-1 ring-gray-200">
              {{ s.formatLocked(field) || '—' }}
            </p>
          </div>
          <!-- Editable: the normal field control. -->
          <FieldCell
            v-else
            :field="field"
            :model-value="s.answers[String(field.id)]"
            :error="s.errors.value[field.id]"
            @update:model-value="s.setAnswer(field.id, $event)"
          />
        </template>
      </div>

      <div class="flex items-center gap-3 border-t border-gray-100 pt-6">
        <button
          type="submit"
          :disabled="s.submitting.value"
          class="inline-flex min-h-control-lg flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-8"
        >
          <Check v-if="!s.submitting.value" :size="20" />
          {{ s.submitting.value ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </form>
  </div>
</template>
