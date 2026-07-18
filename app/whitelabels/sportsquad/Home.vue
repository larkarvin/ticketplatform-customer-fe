<!-- app/whitelabels/sportsquad/Home.vue — faithful in-app port (no iframe) of the RaceYa/Martex
     marketing template. The real page markup lives in ./site-body.html and is rendered here; the
     template's own stylesheets are loaded via useHead so it looks identical. The app chrome is
     hidden on this page (the template ships its own header/footer) and dark mode is disabled. -->
<script setup lang="ts">
import { useT } from '#core/i18n'
import { computed, onMounted } from 'vue'
import type { PublicEventListItem } from '~/features/events'
import { EventCard, EventListing } from '~/features/events'
import { staffLinks } from '../staffLinks'
import siteBody from './site-body.html?raw'

const props = defineProps<{ events: PublicEventListItem[]; error?: unknown; staffUrl: string }>()

const { t } = useT()

// Organizer sign in / sign up links (the staff app); fall back to home when the staff URL is unset.
const links = computed(() => staffLinks(props.staffUrl))

// With a single event, the hero returns to the template's two-column layout (marketing copy left,
// the one event card right). With none or several, it's the centered "Upcoming Events" grid.
const singleEvent = computed(() => (props.events.length === 1 ? props.events[0]! : null))

// The ported header/CTA anchors are static markup, so wire their auth links from staffLinks on mount.
onMounted(() => {
  const signin = links.value.signIn || '/'
  const signup = links.value.signUp || '/'
  document.querySelectorAll('[data-sq="signin"]').forEach((a) => a.setAttribute('href', signin))
  document.querySelectorAll('[data-sq="signup"]').forEach((a) => a.setAttribute('href', signup))
  // The "Find my order" footer link reuses the shared recovery copy so it can't drift from the
  // app-chrome footer link on every other page.
  document.querySelectorAll('[data-sq="recover"]').forEach((a) => {
    a.textContent = t('recovery.footerLink')
  })
})

const base = '/whitelabels/sportsquad/site'
useHead({
  link: [
    'css/flaticon.css',
    'css/menu.css',
    'css/magnific-popup.css',
    'css/owl.carousel.min.css',
    'css/owl.theme.default.min.css',
    'css/lunar.css',
    'css/animate.css',
    'style.css',
    'css/colors/magenta-theme.css',
  ].map((href) => ({ rel: 'stylesheet', href: `${base}/${href}` })),
  style: [
    {
      // Hide the app chrome on this page; keep light mode; reveal wow-animated blocks without the JS.
      innerHTML: [
        '.sq>header,.sq>footer{display:none!important}',
        '.sq{display:block!important;min-height:0!important}',
        '.wow{visibility:visible!important;opacity:1!important;animation:none!important}',
        // Opaque header matching the hero purple, so the white logo stays visible on scroll
        // (avoids the template's scroll-triggered color swap, which needed the stripped JS).
        '.sq-site .wsmainfull{background-color:#8e4ede!important}',
      ].join(''),
    },
  ],
})

// Social sharing / SEO meta for the marketing home. Absolute URLs are required by Open Graph, so
// build them from the configured site URL, falling back to the current request origin.
const siteUrl = ((useRuntimeConfig().public.siteUrl as string) || '').replace(/\/$/, '')
const origin = siteUrl || useRequestURL().origin
const shareTitle = 'SportSquad — Event Ticketing & Registration Forms'
const shareDescription =
  'Create events, sell tickets, and build custom registration forms with SportSquad — payments collected all in one place. Set up in minutes and share a single link.'
const shareImage = `${origin}${base}/images/og-sportsquad.png`

useSeoMeta({
  title: 'Event Ticketing & Registration Forms',
  description: shareDescription,
  ogSiteName: 'SportSquad',
  ogTitle: shareTitle,
  ogDescription: shareDescription,
  ogType: 'website',
  ogUrl: `${origin}/`,
  ogImage: shareImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'SportSquad — host events, sell tickets, and build forms',
  ogImageType: 'image/png',
  twitterCard: 'summary_large_image',
  twitterTitle: shareTitle,
  twitterDescription: shareDescription,
  twitterImage: shareImage,
})
useHead({ link: [{ rel: 'canonical', href: `${origin}/` }] })
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="sq-site" v-html="siteBody"></div>
  <!-- The live hero content fills the placeholder (#sq-hero-content) inside the ported markup. -->
  <ClientOnly>
    <Teleport to="#sq-hero-content">
      <!-- Single event → side-by-side hero -->
      <div v-if="singleEvent" class="grid items-center gap-12 md:grid-cols-2">
        <div class="hero-1-txt color--white">
          <h2 class="text-[44px] !font-bold leading-[1.2] !mb-[18px]">Host events and sell tickets effortlessly</h2>
          <p class="p-xl !mb-[28px]">
            Create your event, sell tickets, and build custom registration forms — with payments collected all in one
            place. Set up in minutes and share a single link.
          </p>
          <a :href="links.signUp || '/'" class="btn !rounded-[4px] btn--theme hover--tra-white">Post your events</a>
        </div>
        <EventCard :event="singleEvent" />
      </div>
      <!-- None or several → centered grid -->
      <div v-else>
        <h2 class="color--white !mb-[6px] text-center text-[42px] !font-bold leading-[1.2]">Upcoming Events</h2>
        <div class="mt-[40px]">
          <EventListing :events="events" :error="error" :heading="''" />
        </div>
        <div class="mt-[45px] flex flex-wrap items-center justify-center gap-6">
          <a href="/events" class="btn !rounded-[4px] btn--theme hover--tra-white">See all events</a>
          <a :href="links.signUp || '/'" class="color--white min-h-tap inline-flex items-center underline">
            Post your events
          </a>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
