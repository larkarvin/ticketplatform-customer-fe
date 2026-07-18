<script setup lang="ts">
import { EventsBrowser } from '~/features/events'

const siteUrl = ((useRuntimeConfig().public.siteUrl as string) || '').replace(/\/$/, '')
useHead({
  title: 'Event calendar',
  link: siteUrl ? [{ rel: 'canonical', href: `${siteUrl}/events/calendar` }] : [],
})
useSeoMeta({ description: 'See all events on a monthly calendar.' })
</script>

<template>
  <EventsBrowser view="calendar" />
</template>
