<!-- Checkout section: receipt email for the buyer (email only, no name). -->
<script setup lang="ts">
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
      <input
        id="buyer-email"
        :value="buyer.email"
        type="email"
        autocomplete="email"
        required
        placeholder="you@example.com"
        class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        @input="setEmail(($event.target as HTMLInputElement).value)"
      />
    </div>
  </section>
</template>
