<!--
  "I lost my order email" — ask for the address, then wait for the emailed link or the 6-digit code.

  The honesty constraint, in one place: the API answers a known address and an unknown one identically,
  and after three wrong codes a resend still answers cheerfully while sending nothing. So this page can
  never claim an email was found or delivered — it says "IF we have anything for that address" — and it
  always keeps "Start over" (a genuinely fresh request) on screen, because that is the only real way out
  of the three-strikes dead end.
-->
<script setup lang="ts">
import Button from '#core/components/ui/Button.vue'
import { useT } from '#core/i18n'
import { RecoveryCheckFailed, RecoveryExpired, RecoveryList, useRecovery } from '~/features/recovery'

const { t } = useT()

const {
  step,
  token,
  email,
  code,
  items,
  maskedEmail,
  error,
  pending,
  cooldown,
  canResend,
  submitEmail,
  submitCode,
  resend,
  loadItems,
  restart,
} = useRecovery()

useSeoMeta({ title: () => t('recovery.pageTitle') })

// Paste-friendly: a code copied out of the email as "123 456" (or with a stray newline) is still the
// right code. Strip everything that isn't a digit rather than rejecting the guest for a space.
function onCodeInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  code.value = raw.replace(/\D/g, '').slice(0, 6)
}

// The listing dropped after a good code, not the code itself — so retry the LISTING with the token the
// composable retained from verify(), never re-run submitCode (that would re-submit the already-consumed
// code and be told, wrongly, that it is not right).
function onRetry(): void {
  void loadItems(token.value)
}
</script>

<template>
  <article class="mx-auto w-full max-w-md px-4 py-10">
    <!-- ASK -->
    <section v-if="step === 'ask'">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.heading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.intro') }}</p>

      <!-- Native inputs, not FormInput/BaseInput: neither forwards `autocomplete`/`inputmode` to the
           real <input> (their fall-through attrs land on the wrapper <div>), and both hardcode 14px
           text — below the 16px floor this audience needs. -->
      <form class="mt-6" novalidate @submit.prevent="submitEmail">
        <label for="recovery-email" class="block text-base font-medium text-gray-700 dark:text-gray-300">
          {{ t('recovery.emailLabel') }}
        </label>
        <p id="recovery-email-hint" class="mt-1 text-base text-gray-500 dark:text-gray-400">
          {{ t('recovery.emailHint') }}
        </p>
        <input
          id="recovery-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          aria-describedby="recovery-email-hint"
          class="min-h-tap mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-base text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />

        <p v-if="error" role="alert" class="mt-3 text-base text-danger-600">{{ error }}</p>

        <Button type="submit" size="lg" class="min-h-tap mt-6 w-full" :disabled="pending">
          {{ t('recovery.submit') }}
        </Button>
      </form>
    </section>

    <!-- SENT — we asked; we do NOT know whether anything was found, or whether mail actually went out. -->
    <section v-else-if="step === 'sent'" aria-live="polite">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.sentHeading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.sentBody', { email }) }}</p>

      <form class="mt-6" novalidate @submit.prevent="submitCode">
        <label for="recovery-code" class="block text-base font-medium text-gray-700 dark:text-gray-300">
          {{ t('recovery.codeLabel') }}
        </label>
        <p id="recovery-code-hint" class="mt-1 text-base text-gray-500 dark:text-gray-400">
          {{ t('recovery.codeHint') }}
        </p>
        <!-- One field, not six boxes: six fight paste and screen readers, while `one-time-code` lets the
             phone offer the code straight from the email. -->
        <input
          id="recovery-code"
          :value="code"
          type="text"
          name="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          aria-describedby="recovery-code-hint"
          class="min-h-tap mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-2xl tracking-widest text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          @input="onCodeInput"
        />

        <p v-if="error" role="alert" class="mt-3 text-base text-danger-600">{{ error }}</p>

        <!-- Never disabled on a short code: a dead button reads as broken. Press it and you get words. -->
        <Button type="submit" size="lg" class="min-h-tap mt-6 w-full" :disabled="pending">
          {{ t('recovery.codeSubmit') }}
        </Button>
      </form>

      <!-- Counts down instead of going dead, and says "send another email" rather than promising one
           arrives — after three wrong codes the API sends nothing at all. -->
      <Button
        type="button"
        variant="outline"
        size="lg"
        class="min-h-tap mt-4 w-full"
        :disabled="!canResend"
        @click="resend()"
      >
        {{ canResend ? t('recovery.resend') : t('recovery.resendIn', { seconds: cooldown }) }}
      </Button>

      <p class="mt-6 text-base text-gray-500 dark:text-gray-400">{{ t('recovery.sentNothingArrived') }}</p>

      <!-- Always present: the resend above may silently do nothing, and a fresh request is the only
           way back from that. -->
      <button
        type="button"
        class="min-h-tap mt-2 text-base font-medium text-brand-600 underline hover:text-brand-700"
        @click="restart()"
      >
        {{ t('recovery.startOver') }}
      </button>
    </section>

    <!-- LISTED — a valid token; we really did look, so this may speak plainly. -->
    <RecoveryList v-else-if="step === 'listed'" :items="items" />

    <!-- FAILED — the code was accepted (and spent), but loading the orders dropped (offline / 5xx / 429).
         The token is untouched, so we keep it and offer another go at the LISTING — never back to the code
         field, where the consumed code would be told it is wrong. Shared with /recover/{token}. -->
    <RecoveryCheckFailed
      v-else-if="step === 'failed'"
      :error="error"
      :can-resend="canResend"
      :cooldown="cooldown"
      :pending="pending"
      @retry="onRetry"
    >
      <template #start-over>
        <!-- Already on /recover, so a fresh start resets the state machine in place rather than navigating. -->
        <button
          type="button"
          class="min-h-tap mt-2 text-base font-medium text-brand-600 underline hover:text-brand-700"
          @click="restart()"
        >
          {{ t('recovery.startOver') }}
        </button>
      </template>
    </RecoveryCheckFailed>

    <!-- EXPIRED — 410: this page's post-verify listing runs through the SAME shared loadItems() as the
         magic link, and that path can reach a genuine 410 on a retry (a good code, a transient failure,
         then >30 min later a Try again). Without this branch that path rendered blank — the dead end this
         fix closes. Shared component with /recover/{token} so the expired screen cannot drift again. -->
    <RecoveryExpired
      v-else-if="step === 'expired'"
      :masked-email="maskedEmail"
      :error="error"
      :can-resend="canResend"
      :cooldown="cooldown"
      @resend="resend"
    >
      <template #start-over>
        <!-- Already on /recover, so a fresh start resets the state machine in place rather than navigating. -->
        <button
          type="button"
          class="min-h-tap mt-2 text-base font-medium text-brand-600 underline hover:text-brand-700"
          @click="restart()"
        >
          {{ t('recovery.startOver') }}
        </button>
      </template>
    </RecoveryExpired>

    <!-- DEFENSIVE FALLBACK — no known `step` reaches here, but if the state machine ever grows a value
         this page has no branch for, a blank page is the worst outcome for a 60+ guest. Render a safe,
         neutral way out (a fresh request) instead of nothing. -->
    <section v-else aria-live="polite">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.invalidHeading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.invalidBody') }}</p>

      <button
        type="button"
        class="min-h-tap mt-6 flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-base font-semibold text-white hover:bg-brand-700"
        @click="restart()"
      >
        {{ t('recovery.startOver') }}
      </button>
    </section>
  </article>
</template>
