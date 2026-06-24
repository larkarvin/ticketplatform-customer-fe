<script setup lang="ts">
import FieldCell from '#core/field-engine/components/FieldCell.vue'
import { Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Lock, Mail, ShoppingCart } from '#icons'
import { computed } from 'vue'
import type { PublicFormState } from '~/features/forms/composables/usePublicForm'

const props = defineProps<{ state: PublicFormState }>()
const s = props.state

// Plaque data: 1-based step, the step now on screen, and the one coming next (for the "Next:" hint).
const stepNumber = computed(() => s.currentStep.value + 1)
const currentTitle = computed(() => s.visibleSections.value[0]?.title || `Step ${stepNumber.value}`)
const nextTitle = computed(() => s.sections.value[s.currentStep.value + 1]?.title || null)
const progressPct = computed(() => Math.round((stepNumber.value / s.totalSteps.value) * 100))

// One quiet helper is worth showing only when there's a required field to explain the asterisk for.
const hasRequired = computed(() => s.sections.value.some((sec) => sec.fields.some((f) => f.required)))
</script>

<template>
  <!-- Phone: full-bleed white page, minimal gutter. sm+: a calm sheet — rounded, shadowed, roomy padding. -->
  <div class="bg-white px-4 py-6 sm:rounded-2xl sm:p-10 sm:shadow-theme-lg sm:ring-1 sm:ring-gray-100">
    <!-- ── Done ────────────────────────────────────────────────────────────── -->
    <div v-if="s.submitted.value" class="py-6 text-center">
      <span class="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-success-50 text-success-600">
        <CheckCircle :size="36" :stroke-width="2" />
      </span>
      <h1 class="text-title-sm font-semibold tracking-tight text-gray-900">You're all done</h1>
      <p class="mx-auto mt-2 max-w-md text-lg text-gray-600">Your response has been submitted.</p>
      <a
        v-if="s.submitted.value.edit_url"
        :href="s.submitted.value.edit_url"
        class="mt-6 inline-flex min-h-tap items-center gap-1.5 text-base font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
      >
        Need to change something? View or edit your response
      </a>
    </div>

    <template v-else>
      <!-- ── Hero / orientation ──────────────────────────────────────────────── -->
      <header class="mb-8">
        <h1 class="text-title-sm font-semibold leading-tight tracking-tight text-gray-900">
          {{ s.form.title }}
        </h1>
        <p v-if="s.form.description" class="mt-3 text-lg leading-relaxed text-gray-600">
          {{ s.form.description }}
        </p>
        <p v-if="hasRequired && !s.isClosed.value && !s.membersOnlyBlocked.value" class="mt-3 text-base text-gray-500">
          Questions marked
          <span class="font-semibold text-danger-500">*</span>
          need an answer.
        </p>
      </header>

      <!-- ── Can't-proceed notices: plain language, friendly icon ────────────── -->
      <div
        v-if="s.isClosed.value"
        class="flex items-start gap-3 rounded-xl bg-gray-50 p-5 text-gray-700 ring-1 ring-gray-200"
      >
        <Clock :size="22" class="mt-0.5 shrink-0 text-gray-500" />
        <p class="text-base">This form is closed. It's no longer taking responses.</p>
      </div>
      <div
        v-else-if="s.membersOnlyBlocked.value"
        class="flex items-start gap-3 rounded-xl bg-gray-50 p-5 text-gray-700 ring-1 ring-gray-200"
      >
        <Lock :size="22" class="mt-0.5 shrink-0 text-gray-500" />
        <p class="text-base">This form is just for members.</p>
      </div>

      <template v-else>
        <!-- ── Signature: the step plaque ───────────────────────────────────── -->
        <div v-if="s.isMultiStep.value" class="mb-8 rounded-xl bg-brand-25 p-5 ring-1 ring-brand-100">
          <div class="flex items-center gap-4">
            <!-- Brand tint as the surface; text stays neutral so it survives any org hue (incl. light
                 brands where brand-coloured text fails contrast). -->
            <span
              class="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 leading-none text-gray-900"
            >
              <span class="text-title-sm font-semibold tabular-nums">{{ stepNumber }}</span>
              <span class="mt-0.5 text-xs font-medium text-gray-500">of {{ s.totalSteps.value }}</span>
            </span>
            <div class="min-w-0">
              <p class="truncate text-xl font-semibold text-gray-900">{{ currentTitle }}</p>
              <p v-if="nextTitle" class="mt-1 truncate text-sm text-gray-500">Next: {{ nextTitle }}</p>
            </div>
          </div>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-gray-200" role="presentation">
            <div
              class="h-full rounded-full bg-brand-500 transition-all duration-300"
              :style="{ width: `${progressPct}%` }"
            />
          </div>
        </div>

        <!-- ── Payment-not-here notice (form still renders below, submit disabled) ── -->
        <div
          v-if="s.isPriced.value"
          class="mb-8 flex items-start gap-3 rounded-xl bg-warning-50 p-5 text-warning-800 ring-1 ring-warning-200"
        >
          <ShoppingCart :size="22" class="mt-0.5 shrink-0 text-warning-600" />
          <p class="text-base">This form needs a payment, which isn't set up here yet.</p>
        </div>

        <form class="space-y-10" novalidate @submit.prevent="s.submit()">
          <section v-for="section in s.visibleSections.value" :key="section.id" class="space-y-5">
            <div v-if="section.title && !s.isMultiStep.value">
              <h2 class="text-xl font-semibold text-gray-900">{{ section.title }}</h2>
              <p v-if="section.description" class="mt-1 text-base text-gray-600">{{ section.description }}</p>
            </div>
            <!-- In multi-step the title is already the plaque heading; show only the description here. -->
            <p v-else-if="section.description" class="text-base text-gray-600">
              {{ section.description }}
            </p>
            <div class="grid grid-cols-12 gap-5">
              <FieldCell
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

          <!-- Contact email lives on the last step (or the only page). Prefilled from the form's email
               field when it has one; always editable. -->
          <div v-if="s.needsGuestEmail.value && (!s.isMultiStep.value || s.isLastStep.value)">
            <label for="guest-email" class="mb-1.5 block text-base font-medium text-gray-800">
              Send my confirmation to
              <span class="text-danger-500">*</span>
            </label>
            <p class="mb-2 text-sm text-gray-500">We'll email you a copy and a link to edit your answers.</p>
            <div class="relative">
              <span
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-gray-300 px-4 text-gray-500"
              >
                <Mail :size="20" />
              </span>
              <input
                id="guest-email"
                :value="s.guestEmail.value"
                type="email"
                placeholder="your@email.com"
                class="min-h-control-lg w-full rounded-xl border bg-transparent py-3 pr-4 pl-14 text-base text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                :class="
                  s.errors.value[-1]
                    ? 'border-danger-400 focus:border-danger-400'
                    : 'border-gray-300 focus:border-brand-300'
                "
                @input="s.setGuestEmail(($event.target as HTMLInputElement).value)"
              />
            </div>
            <p v-if="s.errors.value[-1]" class="mt-1.5 text-sm text-danger-600">{{ s.errors.value[-1] }}</p>
          </div>

          <!-- ── Actions ──────────────────────────────────────────────────────── -->
          <!-- Mobile: a sticky full-bleed footer so Back/Continue are always in thumb reach as the form
               scrolls. sm+: settles back into the flow under a hairline divider. -->
          <div
            class="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:static sm:mx-0 sm:border-gray-100 sm:bg-transparent sm:px-0 sm:py-0 sm:pt-6"
          >
            <button
              v-if="s.isMultiStep.value && !s.isFirstStep.value"
              type="button"
              class="inline-flex min-h-control-lg cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 px-5 text-base font-medium text-gray-700 hover:bg-gray-50"
              @click="s.prevStep()"
            >
              <ChevronLeft :size="20" />
              Back
            </button>

            <button
              v-if="s.isMultiStep.value && !s.isLastStep.value"
              type="button"
              class="inline-flex min-h-control-lg flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 sm:flex-none sm:px-8"
              @click="s.nextStep()"
            >
              Continue
              <ChevronRight :size="20" />
            </button>
            <button
              v-else
              type="submit"
              :disabled="s.submitting.value || s.isPriced.value"
              class="inline-flex min-h-control-lg flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-8"
            >
              <Check v-if="!s.submitting.value" :size="20" />
              {{ s.submitting.value ? 'Submitting…' : s.form.submit_button_text || 'Submit' }}
            </button>
          </div>
        </form>
      </template>
    </template>
  </div>
</template>
