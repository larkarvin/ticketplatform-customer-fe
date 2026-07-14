<!-- customer-fe/app/features/recovery/components/RecoveryExpired.vue -->
<!--
  The "that link is past its 30 minutes" screen, in one place. BOTH entrances can land here: the magic
  link (/recover/{token}) on a genuine 410, and the 6-digit-code page (/recover) when its post-verify
  listing runs through the same shared loadItems() path and that path meets a 410 on a retry. A 410 is a
  verdict that the link timed out — never that the address is unknown — and because the API masks the
  address back to us we can offer a one-tap resend instead of making the guest retype it.

  Living in one component is what stops the two pages from drifting (the bug this closes: /recover had no
  `expired` branch at all, so that path rendered blank). Same masked-email vs no-email body, same resend
  cooldown, same "check your junk folder" line gated behind an actual resend press, same one-message rule.
  Each page supplies its own natural "Start over" control through the slot: /recover/{token} navigates to
  /recover; /recover (already there) resets the state machine in place.

  Honesty: resend answers 200 even when it sends nothing (three burnt codes), so nothing here may say an
  email is on its way, and Start over — a genuinely fresh request — is always kept alongside.
-->
<script setup lang="ts">
import Button from '#core/components/ui/Button.vue'
import { useT } from '#core/i18n'
import { ref } from 'vue'

defineProps<{ maskedEmail: string; error: string; canResend: boolean; cooldown: number }>()
const emit = defineEmits<{ resend: [] }>()

const { t } = useT()

// Only true after the guest has actually pressed resend. Until then, "check your junk folder" would be
// pointing them at an email that was never sent.
const resendPressed = ref(false)

function onResend(): void {
  resendPressed.value = true
  emit('resend')
}
</script>

<template>
  <section aria-live="polite">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.expiredHeading') }}</h1>
    <!-- Guard the masked address: if the 410 body ever omits it, fall back to a version of this
         sentence with no address rather than rendering a dangling "to ." -->
    <p class="mt-3 text-base text-gray-600 dark:text-gray-300">
      {{ maskedEmail ? t('recovery.expiredBody', { email: maskedEmail }) : t('recovery.expiredBodyNoEmail') }}
    </p>

    <p v-if="error" role="alert" class="mt-3 text-base text-danger-600">{{ error }}</p>

    <!-- Counts down rather than going dead, and promises nothing: after three wrong codes the API
         answers this cheerfully and sends nothing at all. -->
    <Button type="button" size="lg" class="min-h-tap mt-6 w-full" :disabled="!canResend" @click="onResend">
      {{ canResend ? t('recovery.resend') : t('recovery.resendIn', { seconds: cooldown }) }}
    </Button>

    <!-- Only appears once resend has actually been pressed — before that, "check your junk folder"
         would be pointing the guest at a message that was never sent. -->
    <p v-if="resendPressed" class="mt-6 text-base text-gray-500 dark:text-gray-400">
      {{ t('recovery.sentNothingArrived') }}
    </p>

    <!-- The real way out of the resend-sends-nothing dead end: a brand-new request. Supplied per-page:
         the token page navigates to /recover; the index page resets the state machine in place. -->
    <slot name="start-over" />
  </section>
</template>
