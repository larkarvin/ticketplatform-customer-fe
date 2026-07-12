<!-- app/whitelabels/catholic/Home.vue — CatholicTickets marketing home: a calm, reverent, dual-audience
     landing (hand-built, on the design-token system). Sits inside Chrome's `.ct` root. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PublicEventListItem } from '~/features/events'
import { staffLinks } from '../staffLinks'
import ClosingInvite from './components/ClosingInvite.vue'
import Faqs from './components/Faqs.vue'
import FeaturePillars from './components/FeaturePillars.vue'
import FeatureSpotlights from './components/FeatureSpotlights.vue'
import Hero from './components/Hero.vue'
import HowItWorks from './components/HowItWorks.vue'
import ParishEvents from './components/ParishEvents.vue'
import UseCases from './components/UseCases.vue'
import { home } from './content'

const props = defineProps<{ events: PublicEventListItem[]; error?: unknown; staffUrl: string }>()
const links = computed(() => staffLinks(props.staffUrl))
useHead({ title: 'Parish events, tickets & donations' })
</script>

<template>
  <div>
    <Hero
      :eyebrow="home.hero.eyebrow"
      :heading="home.hero.heading"
      :lead="home.hero.lead"
      :browse="home.hero.browse"
      :set-up="home.hero.setUp"
      :set-up-href="links.signUp"
    >
      <ParishEvents :heading="home.events.heading" :empty="home.events.empty" :events="events" :error="error" />
    </Hero>

    <FeaturePillars
      :eyebrow="home.pillars.eyebrow"
      :heading="home.pillars.heading"
      :subheading="home.pillars.subheading"
      :items="home.pillars.items"
    />

    <FeatureSpotlights :items="home.spotlights.items" />

    <UseCases
      :eyebrow="home.useCases.eyebrow"
      :heading="home.useCases.heading"
      :subheading="home.useCases.subheading"
      :items="home.useCases.items"
    />

    <HowItWorks :eyebrow="home.steps.eyebrow" :heading="home.steps.heading" :items="home.steps.items" />

    <Faqs :eyebrow="home.faqs.eyebrow" :heading="home.faqs.heading" :items="home.faqs.items" />

    <ClosingInvite
      :heading="home.invite.heading"
      :body="home.invite.body"
      :button="home.invite.button"
      :href="links.signUp"
    />
  </div>
</template>
