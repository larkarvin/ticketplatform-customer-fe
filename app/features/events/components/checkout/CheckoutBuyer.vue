<!-- Checkout section: receipt email for the buyer (email only, no name). -->
<script setup lang="ts">
import { borderClass, controlClass } from '#core/field-engine/components/controls/inputClass'
import { Mail } from '#icons'

const props = defineProps<{
  buyer: { email: string; name?: string; phone?: string }
}>()

// buyer is a reactive object owned by the composable; mutate via local ref to satisfy
// the static-analysis prop-mutation lint check on a pass-by-reference reactive.
function setEmail(value: string): void {
  const buyer = props.buyer
  buyer.email = value
}
</script>

<template>
  <section class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your details</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">We'll send your order confirmation to this email address.</p>

    <div>
      <label for="buyer-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
        Email address
        <span class="text-danger-500">*</span>
      </label>
      <div class="relative">
        <input
          id="buyer-email"
          :value="buyer.email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
          :class="[controlClass, borderClass(false), 'pl-14']"
          @input="setEmail(($event.target as HTMLInputElement).value)"
        />
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-gray-300 px-4 text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          <Mail :size="20" />
        </span>
      </div>
    </div>
  </section>
</template>
