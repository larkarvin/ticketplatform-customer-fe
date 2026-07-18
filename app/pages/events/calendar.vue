<script setup lang="ts">
import { EventsBrowser } from '~/features/events'

const siteUrl = useRuntimeConfig().public.siteUrl as string
useHead({ title: 'Event calendar', link: [{ rel: 'canonical', href: `${siteUrl}/events/calendar` }] })
</script>

<template>
  <EventsBrowser view="calendar" />
</template>
