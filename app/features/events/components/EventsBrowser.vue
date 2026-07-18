<!-- Public events browser: one component behind /events (list) and /events/calendar.
     The pill toggle navigates between the two REAL urls so each view is linkable.

     Note: the upcoming list is rendered inline here (EventCard grid + its own error/empty
     states) rather than via <EventListing>. EventListing renders its own
     `<section class="mx-auto w-full max-w-5xl px-4 py-8">` wrapper and a default "Upcoming
     events" heading; nesting that inside this component's own identical wrapper doubles the
     padding and re-centers a narrower box inside the already-centered page, which is visibly
     wrong. Inlining the grid (matching the past section's markup) keeps one wrapper and lets
     this component own the single page-level heading. -->
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { usePublicEvents } from '../composables/usePublicEvents'
import EventCard from './EventCard.vue'

const props = defineProps<{ view: 'list' | 'calendar' }>()

const { upcoming, past, pending, error, refresh } = usePublicEvents()
const isCalendar = computed(() => props.view === 'calendar')

// Lazy so the list view never pays FullCalendar's bundle weight.
const EventsCalendar = defineAsyncComponent(() => import('./EventsCalendar.vue'))
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="text-3xl font-semibold">Events</h1>
      <nav class="flex rounded-full border border-gray-200 p-1 text-sm font-medium" aria-label="Events view">
        <NuxtLink
          to="/events"
          data-test="toggle-list"
          :aria-current="!isCalendar ? 'page' : undefined"
          class="min-h-tap inline-flex items-center rounded-full px-4"
          :class="!isCalendar ? 'bg-gray-900 text-white' : 'text-gray-600'"
        >
          List
        </NuxtLink>
        <NuxtLink
          to="/events/calendar"
          data-test="toggle-calendar"
          :aria-current="isCalendar ? 'page' : undefined"
          class="min-h-tap inline-flex items-center rounded-full px-4"
          :class="isCalendar ? 'bg-gray-900 text-white' : 'text-gray-600'"
        >
          Calendar
        </NuxtLink>
      </nav>
    </div>

    <template v-if="!isCalendar">
      <div v-if="error">
        <p class="text-gray-500">Couldn't load events — please try again.</p>
        <button
          type="button"
          data-test="retry-list"
          class="min-h-tap mt-3 rounded-lg border border-gray-300 px-4 font-medium text-gray-700 disabled:opacity-60"
          :disabled="pending"
          @click="refresh()"
        >
          {{ pending ? 'Loading…' : 'Try again' }}
        </button>
      </div>
      <template v-else>
        <h2 class="mb-4 text-xl font-semibold">Upcoming events</h2>
        <div v-if="upcoming.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="e in upcoming" :key="e.id" :event="e" />
        </div>
        <p v-else class="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          No upcoming events right now — check back soon.
        </p>

        <section v-if="past.length" class="mt-10">
          <h2 class="mb-4 text-xl font-semibold text-gray-500">Past events</h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <EventCard v-for="e in past" :key="e.id" :event="e" :past="true" />
          </div>
        </section>
      </template>
    </template>

    <div v-else data-test="calendar-pane">
      <div v-if="error">
        <p class="text-gray-500">Couldn't load events — please try again.</p>
        <button
          type="button"
          data-test="retry-calendar"
          class="min-h-tap mt-3 rounded-lg border border-gray-300 px-4 font-medium text-gray-700 disabled:opacity-60"
          :disabled="pending"
          @click="refresh()"
        >
          {{ pending ? 'Loading…' : 'Try again' }}
        </button>
      </div>
      <ClientOnly v-else>
        <EventsCalendar :upcoming="upcoming" :past="past" />
        <template #fallback>
          <div class="h-96 animate-pulse rounded-xl border border-gray-200 bg-gray-50" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
