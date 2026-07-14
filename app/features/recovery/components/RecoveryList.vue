<!-- customer-fe/app/features/recovery/components/RecoveryList.vue -->
<!--
  The recovered list, in one place: both ways in — typing the 6-digit code on /recover, and opening the
  emailed magic link on /recover/{token} — end here, so the heading, the empty state and the rows live
  in a single component instead of being copied into two pages that would then drift.

  This list is only ever reached with a valid token, so — unlike the "we've sent an email" step — it
  MAY state plainly that nothing was found: by this point we really did look.
-->
<script setup lang="ts">
import { useT } from '#core/i18n'
import type { RecoveryItem } from '../types'
import RecoveryItemCard from './RecoveryItemCard.vue'

defineProps<{ items: RecoveryItem[] }>()

const { t } = useT()
</script>

<template>
  <section aria-live="polite">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('recovery.listHeading') }}</h1>

    <p v-if="items.length === 0" class="mt-3 text-base text-gray-600 dark:text-gray-300">
      {{ t('recovery.listEmpty') }}
    </p>

    <ul v-else class="mt-6 space-y-4">
      <li v-for="item in items" :key="item.url">
        <RecoveryItemCard :item="item" />
      </li>
    </ul>
  </section>
</template>
