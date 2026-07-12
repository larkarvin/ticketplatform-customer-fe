<!-- customer-fe/app/pages/e/[slug]/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { CheckoutSelection } from '~/features/events'
import {
  EventBanner,
  EventDetailsBody,
  EventHero,
  EventTicketList,
  useEventSeo,
  usePublicEvent,
} from '~/features/events'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

const config = useRuntimeConfig()
const { branding } = useTenant()
useEventSeo(event, {
  siteUrl: config.public.siteUrl as string,
  orgName: config.public.appName as string,
  imageUrl: event.cover?.url ?? branding.value?.logoUrl ?? '',
})

function onCheckout(selection: CheckoutSelection[]): void {
  const q = selection.map((s) => `${s.ticket_id}:${s.quantity}`).join(',')
  void navigateTo(`/e/${slug.value}/checkout?tickets=${q}`)
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
            <EventTicketList :tickets="event.tickets" @checkout="onCheckout" />
          </div>
        </aside>
      </div>
    </div>
  </article>
</template>
