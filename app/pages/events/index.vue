<script setup lang="ts">
import { EventsBrowser } from '~/features/events'

const siteUrl = useRuntimeConfig().public.siteUrl as string
useHead({ title: 'Events', link: [{ rel: 'canonical', href: `${siteUrl}/events` }] })
</script>

<template>
  <EventsBrowser view="list" />
</template>
