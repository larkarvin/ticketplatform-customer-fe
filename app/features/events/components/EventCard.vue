<!-- customer-fe/app/features/events/components/EventCard.vue -->
<!-- Home page listing card: cover image, title, date, location, "from {price}", links to the event page. -->
<script setup lang="ts">
import { Calendar, MapPin } from '#icons'
import { computed } from 'vue'
import { formatEventDate } from '../eventDate'
import { ticketEffectivePrice, ticketPriceLabel } from '../ticketPricing'
import type { PublicEventListItem } from '../types'

const props = withDefaults(defineProps<{ event: PublicEventListItem; past?: boolean }>(), { past: false })

const when = computed(() => formatEventDate(props.event.starts_at, props.event.ends_at, props.event.timezone))

const fromPrice = computed(() => {
  if (props.past) return null
  const { tickets } = props.event
  if (!tickets.length) return null
  const cheapest = tickets.reduce(
    (min, t) => (ticketEffectivePrice(t) < ticketEffectivePrice(min) ? t : min),
    tickets[0]!
  )
  return ticketPriceLabel(cheapest)
})
</script>

<template>
  <NuxtLink
    :to="`/e/${event.slug}`"
    class="flex min-h-tap flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition hover:shadow-xl dark:border-gray-700 dark:bg-gray-900"
  >
    <div class="w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        v-if="event.cover"
        :src="event.cover.url"
        :alt="event.title"
        loading="lazy"
        width="400"
        height="200"
        class="h-48 w-full object-cover"
        :class="{ 'opacity-60 grayscale': past }"
      />
      <div
        v-else
        class="flex h-48 items-center justify-center text-gray-300 dark:text-gray-600"
        :class="{ 'opacity-60 grayscale': past }"
      >
        <Calendar :size="48" aria-hidden="true" />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-5">
      <h2
        class="text-lg font-semibold"
        :class="past ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'"
      >
        {{ event.title }}
      </h2>

      <p class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <Calendar :size="16" class="shrink-0 text-gray-400" aria-hidden="true" />
        {{ when }}
      </p>

      <p v-if="event.location" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <MapPin :size="16" class="shrink-0 text-gray-400" aria-hidden="true" />
        {{ event.location }}
      </p>

      <p v-if="fromPrice" class="mt-auto pt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
        From {{ fromPrice }}
      </p>
    </div>
  </NuxtLink>
</template>
