<script setup lang="ts">
import type { PublicFormState } from '~/features/forms/composables/usePublicForm'
import FormFieldCell from './FormFieldCell.vue'
const props = defineProps<{ state: PublicFormState }>()
const s = props.state
</script>

<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white/90">{{ s.form.title }}</h1>
      <p v-if="s.form.description" class="mt-1 text-gray-500 dark:text-gray-400">{{ s.form.description }}</p>
    </header>

    <!-- Success panel replaces the form once submitted -->
    <div
      v-if="s.submitted.value"
      class="rounded-xl border border-success-200 bg-success-50 p-6 text-success-800 dark:border-success-900 dark:bg-success-500/10 dark:text-success-200"
    >
      <p class="font-medium">Thanks! Your response was submitted.</p>
      <a
        v-if="s.submitted.value.edit_url"
        :href="s.submitted.value.edit_url"
        class="mt-1 inline-block text-sm underline"
      >
        View or edit your response
      </a>
    </div>

    <template v-else>
      <p
        v-if="s.isClosed.value"
        class="rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        This form is closed and no longer accepting responses.
      </p>
      <p
        v-else-if="s.membersOnlyBlocked.value"
        class="rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        This form is for members only.
      </p>
      <template v-else>
        <p
          v-if="s.isPriced.value"
          class="rounded-lg bg-warning-50 p-4 text-sm text-warning-800 dark:bg-warning-500/10 dark:text-warning-200"
        >
          This form requires payment, which isn't available here yet.
        </p>

        <form class="space-y-8" novalidate @submit.prevent="s.submit()">
          <!-- Wizard step indicator: a dot + label per step. Completed steps are clickable (go back). -->
          <nav v-if="s.isMultiStep.value" aria-label="Form steps">
            <ol class="flex flex-wrap items-center gap-x-5 gap-y-2">
              <li v-for="(section, i) in s.sections.value" :key="section.id">
                <button
                  type="button"
                  :disabled="i >= s.currentStep.value"
                  class="flex min-h-tap items-center gap-2 disabled:cursor-default"
                  :aria-current="i === s.currentStep.value ? 'step' : undefined"
                  @click="s.goToStep(i)"
                >
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full transition-colors"
                    :class="i > s.currentStep.value ? 'bg-gray-300 dark:bg-gray-600' : ''"
                    :style="i <= s.currentStep.value ? { backgroundColor: 'var(--color-brand-500)' } : {}"
                  />
                  <span
                    class="text-sm"
                    :class="
                      i === s.currentStep.value
                        ? 'font-semibold text-gray-900 dark:text-white/90'
                        : 'text-gray-500 dark:text-gray-400'
                    "
                  >
                    {{ section.title || 'Details' }}
                  </span>
                </button>
              </li>
            </ol>
          </nav>

          <section v-for="section in s.visibleSections.value" :key="section.id" class="space-y-3">
            <div v-if="section.title">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white/90">{{ section.title }}</h2>
              <p v-if="section.description" class="text-sm text-gray-500 dark:text-gray-400">
                {{ section.description }}
              </p>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <FormFieldCell
                v-for="field in section.fields"
                :key="field.id"
                :field="field"
                :model-value="s.answers[String(field.id)]"
                :error="s.errors.value[field.id]"
                :upload="s.uploads[field.id]"
                @update:model-value="s.setAnswer(field.id, $event)"
                @upload="s.uploadFile(field.id, $event)"
              />
            </div>
          </section>

          <!-- Guest email + submit live on the last step (or the only page). -->
          <div v-if="s.needsGuestEmail.value && (!s.isMultiStep.value || s.isLastStep.value)">
            <label for="guest-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Your email
              <span class="text-danger-500">*</span>
            </label>
            <input
              id="guest-email"
              v-model="s.guestEmail.value"
              type="email"
              class="min-h-tap w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-base text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
            />
            <p v-if="s.errors.value[-1]" class="mt-1 text-sm text-danger-600 dark:text-danger-400">
              {{ s.errors.value[-1] }}
            </p>
          </div>

          <div class="flex items-center justify-between gap-3">
            <button
              v-if="s.isMultiStep.value && !s.isFirstStep.value"
              type="button"
              class="min-h-tap rounded-lg border border-gray-300 px-6 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              @click="s.prevStep()"
            >
              Back
            </button>
            <span v-else></span>

            <button
              v-if="s.isMultiStep.value && !s.isLastStep.value"
              type="button"
              class="min-h-tap rounded-lg px-6 text-base font-medium text-white"
              :style="{ backgroundColor: 'var(--color-brand-500)' }"
              @click="s.nextStep()"
            >
              Next
            </button>
            <button
              v-else
              type="submit"
              :disabled="s.submitting.value || s.isPriced.value"
              class="min-h-tap rounded-lg px-6 text-base font-medium text-white disabled:opacity-60"
              :style="{ backgroundColor: 'var(--color-brand-500)' }"
            >
              {{ s.submitting.value ? 'Submitting…' : s.form.submit_button_text || 'Submit' }}
            </button>
          </div>
        </form>
      </template>
    </template>
  </div>
</template>
