<!-- Client-only FullCalendar wrapper (loaded lazily by EventsBrowser). Month grid on
     desktop, per-day agenda (listMonth) on small screens — month grids are unusable on
     phones and our audience is mobile-heavy. Styled after TailAdmin Pro's calendar. -->
<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toCalendarEvents } from '../calendarEvents'
import type { PublicEventListItem } from '../types'

const props = defineProps<{ upcoming: PublicEventListItem[]; past: PublicEventListItem[] }>()

// This component only ever renders client-side (ClientOnly + async import), so
// matchMedia is safe here.
const mq = window.matchMedia('(min-width: 768px)')
const isDesktop = ref(mq.matches)
const onChange = (e: MediaQueryListEvent): void => {
  isDesktop.value = e.matches
}
onMounted(() => mq.addEventListener('change', onChange))
onBeforeUnmount(() => mq.removeEventListener('change', onChange))

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

// FullCalendar only reads `initialView` once at construction — resetOptions ignores
// later changes to it. Drive view switching through the calendar API instead so an
// already-mounted calendar reacts to viewport crossings (resize/tablet rotation).
watch(isDesktop, (desktop) => {
  calendarRef.value?.getApi().changeView(desktop ? 'dayGridMonth' : 'listMonth')
})

const events = computed(() => toCalendarEvents([...props.past, ...props.upcoming]))

const options = computed(() => ({
  plugins: [dayGridPlugin, listPlugin],
  initialView: isDesktop.value ? 'dayGridMonth' : 'listMonth',
  headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
  events: events.value,
  height: 'auto',
  // Navigate in-app instead of the default full page load FullCalendar does for `url`.
  eventClick: (info: { jsEvent: MouseEvent; event: { url: string } }) => {
    info.jsEvent.preventDefault()
    navigateTo(info.event.url)
  },
  noEventsContent: 'No events this month',
}))
</script>

<template>
  <div class="events-calendar rounded-xl border border-gray-200 bg-white p-4">
    <FullCalendar ref="calendarRef" :options="options" />
  </div>
</template>

<style scoped>
/* TailAdmin-flavored FullCalendar theming via CSS vars (FullCalendar v6 exposes these). */
.events-calendar :deep(.fc) {
  --fc-border-color: var(--color-gray-200, #e5e7eb);
  --fc-today-bg-color: var(--color-brand-50, #eff6ff);
  --fc-event-bg-color: var(--color-brand-500, #3b82f6);
  --fc-event-border-color: var(--color-brand-500, #3b82f6);
  --fc-button-bg-color: var(--color-brand-500, #3b82f6);
  --fc-button-border-color: var(--color-brand-500, #3b82f6);
  --fc-button-active-bg-color: var(--color-brand-600, #2563eb);
  --fc-button-hover-bg-color: var(--color-brand-600, #2563eb);
  font-size: 0.875rem;
}
.events-calendar :deep(.fc .fc-toolbar-title) {
  font-size: 1.125rem;
  font-weight: 600;
}
.events-calendar :deep(.fc .fc-button) {
  min-height: 44px;
  text-transform: capitalize;
}
</style>
