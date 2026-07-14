<!-- customer-fe/app/features/recovery/components/RecoveryCheckFailed.vue -->
<!--
  The "we could not check just now" screen, in one place. BOTH entrances can land here: the magic link
  (/recover/{token}) when the check drops, and the 6-digit code (/recover) when the listing that follows
  a just-accepted — and now CONSUMED — code drops. The failure is a verdict on the request, never on the
  token, so this copy must never call the link/code broken: it offers another attempt (which re-runs the
  LISTING, not a re-verify of the spent code), and keeps a genuinely fresh start available alongside.

  Living in one component is what stops the two pages from drifting — the same body copy, the same 429
  cooldown behaviour on "Try again", the same one-message-per-failure rule. Each page supplies its own
  natural "Start over" control through the slot: /recover/{token} navigates to /recover; /recover (already
  there) resets the state machine in place.
-->
<script setup lang="ts">
import Button from '#core/components/ui/Button.vue'
import { useT } from '#core/i18n'

defineProps<{ error: string; canResend: boolean; cooldown: number; pending: boolean }>()
defineEmits<{ retry: [] }>()

const { t } = useT()
</script>

<template>
  <section aria-live="polite">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.checkFailedHeading') }}</h1>
    <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.checkFailedBody') }}</p>

    <!-- The reason, when there is a more specific one — notably a 429, which means "wait a minute", not
         "broken". On a plain offline/5xx the composable leaves this empty so the calm body copy above is
         not repeated in a red alert. -->
    <p v-if="error" role="alert" class="mt-3 text-base text-danger-600">{{ error }}</p>

    <!-- On a 429 the composable starts the same cooldown resend uses: disable the button and say so in
         words (not just a dimmed colour) until it elapses, so "Try again" cannot walk straight back into
         the throttle. -->
    <Button
      type="button"
      size="lg"
      class="min-h-tap mt-6 w-full"
      :disabled="pending || !canResend"
      @click="$emit('retry')"
    >
      {{ canResend ? t('recovery.checkFailedRetry') : t('recovery.checkFailedRetryIn', { seconds: cooldown }) }}
    </Button>

    <!-- Kept alongside the retry: if the network is truly gone, a fresh request is still the way out. -->
    <slot name="start-over" />
  </section>
</template>
