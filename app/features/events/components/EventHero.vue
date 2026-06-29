<!-- customer-fe/app/features/events/components/EventHero.vue -->
<!-- Event header: title + date/time + location. The cover image is rendered separately as the
     full-width EventBanner above the two-column content. -->
<script setup lang="ts">
import { Calendar, MapPin } from '#icons'
import { computed } from 'vue'
import { formatEventDate } from '../eventDate'
import type { PublicEvent } from '../types'

const props = defineProps<{ event: PublicEvent }>()
const when = computed(() => formatEventDate(props.event.starts_at, props.event.ends_at, props.event.timezone))
</script>

<template>
  <header class="space-y-3">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ event.title }}</h1>

    <div class="space-y-1 text-base text-gray-600 dark:text-gray-300">
      <p class="flex items-center gap-2">
        <Calendar :size="18" class="shrink-0 text-gray-400" aria-hidden="true" />
        {{ when }}
      </p>
      <p v-if="event.location" class="flex items-center gap-2">
        <MapPin :size="18" class="shrink-0 text-gray-400" aria-hidden="true" />
        <span>
          {{ event.location }}
          <template v-if="event.location_details">· {{ event.location_details }}</template>
        </span>
      </p>
    </div>
  </header>
</template>
