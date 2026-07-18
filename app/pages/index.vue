<script setup lang="ts">
import Home from '#whitelabel/Home.vue'
import { usePublicEvents } from '~/features/events'

const { events, error } = usePublicEvents('upcoming')
const staffUrl = useRuntimeConfig().public.staffUrl as string
</script>

<template>
  <Home :events="events" :error="error" :staff-url="staffUrl" />
</template>
