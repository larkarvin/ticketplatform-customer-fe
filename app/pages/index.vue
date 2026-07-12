<script setup lang="ts">
import { useAppLabels } from '#core/composables/useAppLabels'
import { EventCard, usePublicEvents } from '~/features/events'

useHead({ title: 'Events' })
const { events, error } = usePublicEvents()
const { org } = useAppLabels()
</script>

<template>
  <section class="mx-auto w-full max-w-5xl px-4 py-8">
    <h1 class="mb-2 text-3xl font-semibold">Upcoming events</h1>
    <p class="mb-6 text-gray-500">Browse what's on with this {{ org }}.</p>

    <p v-if="error" class="text-gray-500">Couldn't load events — please try again.</p>
    <div v-else-if="events.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="e in events" :key="e.id" :event="e" />
    </div>
    <p
      v-else
      class="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900"
    >
      No upcoming events right now — check back soon.
    </p>
  </section>
</template>
