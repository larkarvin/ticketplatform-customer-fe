<!-- app/whitelabels/catholic/Home.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PublicEventListItem } from '~/features/events'
import { EventListing } from '~/features/events'
import { staffLinks } from '../staffLinks'
import HowItWorks from './components/HowItWorks.vue'
import OrganizerPitch from './components/OrganizerPitch.vue'
import SignupCta from './components/SignupCta.vue'
import { home } from './content'

const props = defineProps<{ events: PublicEventListItem[]; error?: unknown; staffUrl: string }>()
const links = computed(() => staffLinks(props.staffUrl))
useHead({ title: 'Events' })
</script>

<template>
  <div>
    <EventListing :events="events" :error="error" :heading="home.eventsHeading" :subheading="home.eventsSubheading" />
    <OrganizerPitch :title="home.pitch.title" :body="home.pitch.body" />
    <HowItWorks :steps="home.steps" />
    <SignupCta :title="home.ctaTitle" :button="home.ctaButton" :href="links.signUp" :enabled="links.enabled" />
  </div>
</template>
