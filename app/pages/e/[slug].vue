<!-- customer-fe/app/pages/e/[slug].vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { usePublicEvent } from '~/features/events'
import EventDetailsBody from '~/features/events/components/EventDetailsBody.vue'
import EventHero from '~/features/events/components/EventHero.vue'
import EventTicketList from '~/features/events/components/EventTicketList.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)
</script>

<template>
  <article class="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
    <EventHero :event="event" />
    <EventDetailsBody :html="event.details" />
    <EventTicketList :tickets="event.tickets" />
  </article>
</template>
