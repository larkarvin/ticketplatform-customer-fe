<!--
  What the button in the recovery email opens. The token in the URL is the whole credential, so this
  page never asks for anything — it just reports one of four outcomes:

    listed   — the token is good: hand the rows to the same RecoveryList the code path renders.
    expired  — a genuine link past its 30 minutes. The API answers 410 with the address MASKED, which
               is the only reason we can offer a one-tap resend instead of making the guest retype it.
    failed   — the CHECK failed (offline, a dropped mobile connection, a 5xx, a 429). That is a verdict
               on the request, not on the token: the link is very likely still good, so we keep it and
               offer another attempt rather than telling her it is broken.
    invalid  — a tampered/garbage token names nobody, so the only way on is a fresh request at /recover.

  Two constraints shape the rest:

  1. SSR. `useRecovery()` holds its state in plain refs, which do NOT cross the server→client boundary.
     Fetching during setup would render `listed` on the server and then hydrate back to the composable's
     initial `ask` — a mismatch. So the load happens in `onMounted` (client only): the server and the
     first client render both show the "checking" state, and the outcome replaces it afterwards.
  2. Honesty. Resend answers 200 even when it sends nothing (three burnt codes), so the expired screen
     never says an email is on its way, and always keeps a genuinely fresh request one tap away.
-->
<script setup lang="ts">
import Button from '#core/components/ui/Button.vue'
import { useT } from '#core/i18n'
import { onMounted, ref } from 'vue'
import { RecoveryList, useRecovery } from '~/features/recovery'

const { t } = useT()
const route = useRoute()
const token = String(route.params.token)

const { step, items, maskedEmail, error, pending, cooldown, canResend, loadItems, resend } = useRecovery()

// True until the client has actually asked the API. Keeps the server render and the first client
// render identical (see note 1 above) — the outcome is only ever decided in the browser.
const checking = ref(true)

// Only true after the guest has actually pressed resend. Until then, "check your junk folder" would
// be pointing them at an email that was never sent.
const resendPressed = ref(false)

onMounted(async () => {
  await loadItems(token)
  checking.value = false
})

function onResend(): void {
  resendPressed.value = true
  resend()
}

// The check failed, not the link — so retry with the SAME token rather than sending her back to the
// start with a link that probably still has 25 minutes left on it.
function onRetry(): void {
  void loadItems(token)
}

// A token in the URL: never index it, and never leak it in a referrer.
useSeoMeta({ title: () => t('recovery.pageTitle'), robots: 'noindex, nofollow' })
</script>

<template>
  <article class="mx-auto w-full max-w-md px-4 py-10">
    <!-- CHECKING — the only thing the server can honestly render. -->
    <section v-if="checking" aria-live="polite">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.linkCheckingHeading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.linkCheckingBody') }}</p>
    </section>

    <!-- LISTED — same component the 6-digit-code path renders, so the two entrances cannot drift. -->
    <RecoveryList v-else-if="step === 'listed'" :items="items" />

    <!-- EXPIRED — 410: genuine link, out of time. We know the masked address, so we can act on it. -->
    <section v-else-if="step === 'expired'" aria-live="polite">
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

      <!-- The real way out of the resend-sends-nothing dead end: a brand-new request. -->
      <NuxtLink
        to="/recover"
        class="min-h-tap mt-2 inline-flex items-center text-base font-medium text-brand-600 underline hover:text-brand-700"
      >
        {{ t('recovery.startOver') }}
      </NuxtLink>
    </section>

    <!-- FAILED — the request never came back (offline / 5xx / 429). The token is untouched and probably
         still has time left on it, so nothing here may call the link broken: offer another go. -->
    <section v-else-if="step === 'failed'" aria-live="polite">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.checkFailedHeading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.checkFailedBody') }}</p>

      <!-- The reason, when we have a more specific one — notably a 429, which means "wait a minute",
           not "your link is broken". Discarding it is what sent the guest round the throttle again. -->
      <p v-if="error" role="alert" class="mt-3 text-base text-danger-600">{{ error }}</p>

      <Button type="button" size="lg" class="min-h-tap mt-6 w-full" :disabled="pending" @click="onRetry">
        {{ t('recovery.checkFailedRetry') }}
      </Button>

      <!-- Kept alongside the retry: if the network is truly gone, a fresh request is still the way out. -->
      <NuxtLink
        to="/recover"
        class="min-h-tap mt-2 inline-flex items-center text-base font-medium text-brand-600 underline hover:text-brand-700"
      >
        {{ t('recovery.startOver') }}
      </NuxtLink>
    </section>

    <!-- INVALID — a token we cannot trust names nobody. Say nothing about any address; just start again. -->
    <section v-else aria-live="polite">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.invalidHeading') }}</h1>
      <p class="mt-3 text-base text-gray-600 dark:text-gray-300">{{ t('recovery.invalidBody') }}</p>

      <NuxtLink
        to="/recover"
        class="min-h-tap mt-6 flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-base font-semibold text-white hover:bg-brand-700"
      >
        {{ t('recovery.startOver') }}
      </NuxtLink>
    </section>
  </article>
</template>
