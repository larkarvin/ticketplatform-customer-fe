<!-- customer-fe/app/features/events/components/EventBanner.vue -->
<!-- Full-width hero banner: the event cover image, or a neutral fallback when none is set. -->
<script setup lang="ts">
import { Calendar } from '#icons'
import type { PublicEvent } from '../types'

defineProps<{ event: PublicEvent }>()
</script>

<template>
  <div class="w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
    <img
      v-if="event.cover"
      :src="event.cover.url"
      :alt="event.title"
      class="h-56 w-full object-cover sm:h-72 lg:h-[26rem]"
    />
    <div v-else class="flex h-56 items-center justify-center text-gray-300 sm:h-72 lg:h-[26rem] dark:text-gray-600">
      <Calendar :size="64" aria-hidden="true" />
    </div>
  </div>
</template>
