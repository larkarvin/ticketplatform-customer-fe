<!-- Calendar-view stub for the public events browser. Task 4 replaces this with a real
     FullCalendar wrapper; the props signature below is the contract Task 4 must keep. -->
<script setup lang="ts">
import type { PublicEventListItem } from '../types'
defineProps<{ upcoming: PublicEventListItem[]; past: PublicEventListItem[] }>()
</script>

<template>
  <div data-test="calendar-stub" />
</template>
