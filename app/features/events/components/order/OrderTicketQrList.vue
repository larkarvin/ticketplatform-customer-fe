<!-- Attendee ticket QR codes: one per attendee, for door check-in. Presentational — the <img src>
     points at the guest QR endpoint (public, no auth); the image itself is generated server-side. -->
<script setup lang="ts">
import { useT } from '#core/i18n'
import { computed } from 'vue'
import type { PublicOrder } from '../../types'

const { t, term } = useT()

const props = defineProps<{ order: PublicOrder; publicId: string }>()

const config = useRuntimeConfig()

const attendees = computed(() => props.order.items.flatMap((item) => item.attendees ?? []))

function qrSrc(attendeeId: number): string {
  return `${config.public.apiUrl}/orders/${props.publicId}/participants/${attendeeId}/qr`
}
</script>

<template>
  <section v-if="attendees.length > 0" class="mt-8">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.yourTickets') }}</h2>
    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ t('orderHub.tickets.hint') }}</p>

    <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <figure
        v-for="a in attendees"
        :key="a.id"
        class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <img
          :src="qrSrc(a.id)"
          :alt="t('orderHub.tickets.qrAlt', { person: term('person', { lower: true }), id: a.id })"
          width="180"
          height="180"
          loading="lazy"
        />
      </figure>
    </div>
  </section>
</template>
