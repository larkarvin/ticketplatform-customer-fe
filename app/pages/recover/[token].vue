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
import { useT } from '#core/i18n'
import { onMounted, ref } from 'vue'
import { RecoveryCheckFailed, RecoveryExpired, RecoveryList, useRecovery } from '~/features/recovery'

const { t } = useT()
const route = useRoute()
const routeToken = String(route.params.token)

const {
  step,
  token: retainedToken,
  items,
  maskedEmail,
  error,
  pending,
  cooldown,
  canResend,
  loadItems,
  resend,
} = useRecovery()

// True until the client has actually asked the API. Keeps the server render and the first client
// render identical (see note 1 above) — the outcome is only ever decided in the browser.
const checking = ref(true)

onMounted(async () => {
  await loadItems(routeToken)
  checking.value = false
})

// The check failed, not the link — so retry with the SAME token the composable retained, rather than
// sending her back to the start with a link that probably still has 25 minutes left on it.
function onRetry(): void {
  void loadItems(retainedToken.value)
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

    <!-- EXPIRED — 410: genuine link, out of time. We know the masked address, so we can act on it.
         Shared with /recover's own post-verify 410-on-retry path so the two cannot drift. -->
    <RecoveryExpired
      v-else-if="step === 'expired'"
      :masked-email="maskedEmail"
      :error="error"
      :can-resend="canResend"
      :cooldown="cooldown"
      @resend="resend"
    >
      <template #start-over>
        <NuxtLink
          to="/recover"
          class="min-h-tap mt-2 inline-flex items-center text-base font-medium text-brand-600 underline hover:text-brand-700"
        >
          {{ t('recovery.startOver') }}
        </NuxtLink>
      </template>
    </RecoveryExpired>

    <!-- FAILED — the request never came back (offline / 5xx / 429). The token is untouched and probably
         still has time left on it, so nothing here may call the link broken: offer another go. Shared
         with /recover's own post-verify transient failure so the two cannot drift. -->
    <RecoveryCheckFailed
      v-else-if="step === 'failed'"
      :error="error"
      :can-resend="canResend"
      :cooldown="cooldown"
      :pending="pending"
      @retry="onRetry"
    >
      <template #start-over>
        <NuxtLink
          to="/recover"
          class="min-h-tap mt-2 inline-flex items-center text-base font-medium text-brand-600 underline hover:text-brand-700"
        >
          {{ t('recovery.startOver') }}
        </NuxtLink>
      </template>
    </RecoveryCheckFailed>

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
