<!-- Shared, presentational listing of public events: heading + responsive card grid, with error
     and empty states. The page owns the query (usePublicEvents) and passes events/error in, so
     this component stays SSR/context-free and unit-testable. -->
<script setup lang="ts">
import type { PublicEventListItem } from '../types'
import EventCard from './EventCard.vue'

withDefaults(
  defineProps<{
    events: PublicEventListItem[]
    error?: unknown
    heading?: string
    subheading?: string
  }>(),
  { error: undefined, heading: 'Upcoming events', subheading: '' }
)
</script>

<template>
  <section class="mx-auto w-full max-w-5xl px-4 py-8">
    <h1 v-if="heading" class="mb-2 text-3xl font-semibold">{{ heading }}</h1>
    <p v-if="subheading" class="mb-6 text-gray-500">{{ subheading }}</p>

    <p v-if="error" class="text-gray-500">Couldn't load events — please try again.</p>
    <div v-else-if="events.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="e in events" :key="e.id" :event="e" />
    </div>
    <p v-else class="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
      No upcoming events right now — check back soon.
    </p>
  </section>
</template>
