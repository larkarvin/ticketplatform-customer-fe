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
          <!-- Wizard progress: full-width dots joined by lines. Reached steps (current + past) are
               filled+ringed; upcoming are plain. Completed dots are clickable to go back. The step's
               name shows as the section heading below. -->
          <nav v-if="s.isMultiStep.value" aria-label="Form steps">
            <ol class="relative flex items-center pb-8">
              <template v-for="(section, i) in s.sections.value" :key="section.id">
                <li class="relative" :class="i < s.currentStep.value ? 'group' : ''">
                  <!-- Dot. On hover of a clickable (completed) step the padding-circle tints in, so it
                       reads as a circle with the dot in the middle. -->
                  <button
                    type="button"
                    :disabled="i >= s.currentStep.value"
                    :aria-current="i === s.currentStep.value ? 'step' : undefined"
                    :aria-label="section.title || `Step ${i + 1}`"
                    class="block rounded-full p-1.5 transition-colors enabled:cursor-pointer disabled:cursor-default group-hover:bg-brand-500/10"
                    @click="s.goToStep(i)"
                  >
                    <span
                      class="block h-3 w-3 rounded-full transition-all"
                      :class="
                        i <= s.currentStep.value
                          ? 'bg-brand-500 ring-2 ring-brand-500/30'
                          : 'bg-gray-300 dark:bg-gray-600'
                      "
                    />
                  </button>
                  <!-- Title under the dot — clickable too (completed steps). Edge steps align to the edge,
                       middle steps center on the dot. Page-colored bg + the active step on top (z-20) keep
                       labels readable if they overlap. tabindex -1: the dot is the keyboard control. -->
                  <button
                    type="button"
                    :disabled="i >= s.currentStep.value"
                    tabindex="-1"
                    class="absolute top-full whitespace-nowrap bg-white px-1 text-xs transition-colors enabled:cursor-pointer disabled:cursor-default group-hover:text-gray-700 group-hover:underline dark:bg-gray-900 dark:group-hover:text-gray-200"
                    :class="[
                      i === 0 ? 'left-0' : i === s.sections.value.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2',
                      i === s.currentStep.value
                        ? 'z-20 font-semibold text-gray-900 dark:text-white/90'
                        : 'z-10 text-gray-500 dark:text-gray-400',
                    ]"
                    @click="s.goToStep(i)"
                  >
                    {{ section.title || `Step ${i + 1}` }}
                  </button>
                </li>
                <li
                  v-if="i < s.sections.value.length - 1"
                  class="-mx-1.5 h-px flex-1 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              </template>
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
