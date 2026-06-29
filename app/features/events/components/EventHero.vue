<!-- customer-fe/app/features/events/components/EventHero.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, MapPin } from '#icons'
import { formatEventDate } from '../eventDate'
import type { PublicEvent } from '../types'

const props = defineProps<{ event: PublicEvent }>()
const when = computed(() => formatEventDate(props.event.starts_at, props.event.ends_at, props.event.timezone))
</script>

<template>
  <header class="space-y-4">
    <div class="overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
      <img
        v-if="event.cover"
        :src="event.cover.url"
        :alt="event.title"
        class="h-full max-h-96 w-full object-cover"
      />
      <div v-else class="flex h-48 items-center justify-center text-gray-400">
        <Calendar :size="48" />
      </div>
    </div>

    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ event.title }}</h1>

    <div class="space-y-1 text-base text-gray-600 dark:text-gray-300">
      <p class="flex items-center gap-2">
        <Calendar :size="18" class="shrink-0 text-gray-400" />
        {{ when }}
      </p>
      <p v-if="event.location" class="flex items-center gap-2">
        <MapPin :size="18" class="shrink-0 text-gray-400" />
        <span>{{ event.location }}<template v-if="event.location_details"> · {{ event.location_details }}</template></span>
      </p>
    </div>
  </header>
</template>
