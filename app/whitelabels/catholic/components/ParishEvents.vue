<!-- app/whitelabels/catholic/components/ParishEvents.vue — the arch "This week at the parish" panel:
     the live upcoming events as a warm bulletin (date chip + title + when/where). Reuses the events
     feature's date/price helpers; never reimplements date logic. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PublicEventListItem } from '~/features/events'
import { formatEventDateParts, formatEventWhen } from '~/features/events'

const props = withDefaults(
  defineProps<{
    heading: string
    empty: string
    events: PublicEventListItem[]
    error?: unknown
    limit?: number
  }>(),
  { error: undefined, limit: 3 }
)

function fromPrice(e: PublicEventListItem): string | null {
  if (!e.tickets.length) return null
  const cheapest = e.tickets.reduce((min, t) => (t.price < min.price ? t : min), e.tickets[0]!)
  return cheapest.price_formatted
}

const rows = computed(() =>
  props.events.slice(0, props.limit).map((e) => {
    const { day, month } = formatEventDateParts(e.starts_at, e.timezone)
    const tail = e.location ?? (fromPrice(e) ? `From ${fromPrice(e)}` : null)
    return {
      id: e.id,
      day,
      month,
      title: e.title,
      meta: tail ? `${formatEventWhen(e.starts_at, e.timezone)} · ${tail}` : formatEventWhen(e.starts_at, e.timezone),
    }
  })
)
</script>

<template>
  <div class="ct-frame">
    <div class="ct-frame-mat">
      <p class="ct-gold-text mb-6 text-center text-sm font-bold tracking-widest uppercase">{{ heading }}</p>

      <ul v-if="rows.length" class="divide-y divide-gray-200">
        <li v-for="row in rows" :key="row.id" class="flex gap-4 py-4">
          <div class="w-14 shrink-0 text-center">
            <div class="ct-display text-2xl leading-none font-semibold text-brand-600">{{ row.day }}</div>
            <div class="ct-gold-text mt-1 text-xs font-semibold tracking-wider uppercase">{{ row.month }}</div>
          </div>
          <div>
            <p class="ct-display text-lg font-semibold text-gray-900">{{ row.title }}</p>
            <p class="text-sm text-gray-600">{{ row.meta }}</p>
          </div>
        </li>
      </ul>

      <p v-else-if="error" class="py-6 text-center text-gray-600">
        We couldn't load events just now — please try again.
      </p>
      <p v-else class="py-6 text-center text-gray-600">{{ empty }}</p>
    </div>
  </div>
</template>
