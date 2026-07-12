<!-- app/whitelabels/sportsquad/Chrome.vue — header/footer for the NON-home sportsquad pages. The home
     page hides this chrome (it ports the Martex template which brings its own header/footer). -->
<script setup lang="ts">
import { computed } from 'vue'
import { staffLinks } from '../staffLinks'
import { chrome } from './content'
import './style.css'

const props = defineProps<{ staffUrl: string; orgName: string; logoUrl?: string | null }>()
const links = computed(() => staffLinks(props.staffUrl))
const displayName = computed(() => props.orgName?.trim() || chrome.brandName)
</script>

<template>
  <div class="sq flex min-h-screen flex-col bg-white text-gray-900">
    <header class="border-b border-gray-100">
      <div class="mx-auto flex min-h-tap w-full max-w-5xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex min-h-tap items-center">
          <img v-if="logoUrl" :src="logoUrl" :alt="displayName" class="h-8 w-auto" />
          <span v-else class="sq-accent text-xl font-bold">{{ displayName }}</span>
        </NuxtLink>
        <nav v-if="links.enabled" class="flex items-center gap-4 text-sm">
          <span class="hidden text-gray-400 sm:inline">For organizers</span>
          <a :href="links.signIn" class="min-h-tap font-semibold text-gray-700">Sign in</a>
          <a :href="links.signUp" class="sq-accent-bg min-h-tap rounded-full px-4 py-2 font-semibold text-white">
            Sign up
          </a>
        </nav>
      </div>
    </header>

    <main class="w-full flex-1"><slot /></main>

    <footer class="border-t border-gray-100">
      <div
        class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>{{ displayName }}</span>
        <nav class="flex items-center gap-4">
          <NuxtLink v-for="l in chrome.footerLinks" :key="l.to" :to="l.to" class="min-h-tap">
            {{ l.label }}
          </NuxtLink>
          <a :href="`mailto:${chrome.contactEmail}`" class="min-h-tap">{{ chrome.contactEmail }}</a>
        </nav>
      </div>
    </footer>
  </div>
</template>
