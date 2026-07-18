<script setup lang="ts">
import { EventsBrowser } from '~/features/events'

const siteUrl = ((useRuntimeConfig().public.siteUrl as string) || '').replace(/\/$/, '')
useHead({
  title: 'Events',
  link: siteUrl ? [{ rel: 'canonical', href: `${siteUrl}/events` }] : [],
})
useSeoMeta({ description: 'Browse upcoming events and get your tickets.' })
</script>

<template>
  <EventsBrowser view="list" />
</template>
