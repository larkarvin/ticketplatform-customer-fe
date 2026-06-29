<!-- customer-fe/app/pages/e/[slug].vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { EventBanner, EventDetailsBody, EventHero, EventTicketList, usePublicEvent } from '~/features/events'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

function onBuy(_ticketId: number): void {
  // The purchase flow (checkout → order → payment) is the next slice; this is the entry point.
  toast.info('Ticket checkout is coming soon')
}
</script>

<template>
  <article>
    <!-- Full-width banner -->
    <EventBanner :event="event" />

    <!-- Two columns: event info (left) + sticky ticket card (right, overlapping the banner) -->
    <div class="mx-auto w-full max-w-5xl px-4">
      <div class="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div class="min-w-0 space-y-8 py-6 lg:py-8">
          <EventHero :event="event" />
          <EventDetailsBody :html="event.details" />
        </div>

        <aside class="pb-8 lg:py-8">
          <div class="lg:sticky lg:top-6 lg:-mt-[60px]">
            <EventTicketList :tickets="event.tickets" @buy="onBuy" />
          </div>
        </aside>
      </div>
    </div>
  </article>
</template>
