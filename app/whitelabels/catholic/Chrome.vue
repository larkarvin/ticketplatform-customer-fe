<!-- app/whitelabels/catholic/Chrome.vue — warm parchment header/footer for the CatholicTickets
     whitelabel. The `.ct` root applies the design-token layer (theme.css) to the whole app. -->
<script setup lang="ts">
import { computed } from 'vue'
import { staffLinks } from '../staffLinks'
import BrandLogo from './components/BrandLogo.vue'
import { chrome } from './content'
import './theme.css'

// Pure component: orgName + logoUrl + staffUrl come from the layout (which has Nuxt context), so
// Chrome uses no Nuxt auto-imports and stays unit-testable.
const props = defineProps<{ staffUrl: string; orgName: string; logoUrl?: string | null }>()
const links = computed(() => staffLinks(props.staffUrl))
// Resolved org name if present, otherwise this whitelabel's brand name (never "Platform").
const displayName = computed(() => props.orgName?.trim() || chrome.brandName)
</script>

<template>
  <div class="ct flex min-h-screen flex-col">
    <header class="ct-header sticky top-0 z-40 border-b border-gray-200">
      <div class="mx-auto flex min-h-tap w-full max-w-6xl items-center justify-between px-6 py-3">
        <NuxtLink to="/" class="ct-focus flex min-h-tap items-center">
          <img v-if="logoUrl" :src="logoUrl" :alt="displayName" class="h-9 w-auto" />
          <span v-else-if="orgName" class="ct-display text-lg font-semibold text-brand-600">{{ orgName }}</span>
          <BrandLogo v-else />
        </NuxtLink>
        <nav class="flex items-center gap-3 text-sm sm:gap-5">
          <a
            :href="links.signIn || '/'"
            class="ct-focus min-h-tap inline-flex items-center font-medium text-gray-700 transition hover:text-brand-600"
          >
            Sign in
          </a>
          <a
            :href="links.signUp || '/'"
            class="ct-focus min-h-tap inline-flex items-center rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
          >
            Set up your parish
          </a>
        </nav>
      </div>
    </header>

    <main class="w-full flex-1"><slot /></main>

    <footer class="ct-stone border-t border-gray-200">
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="ct-display text-base font-semibold text-brand-600">{{ displayName }}</span>
        <nav class="flex items-center gap-5">
          <NuxtLink
            v-for="l in chrome.footerLinks"
            :key="l.to"
            :to="l.to"
            class="ct-focus min-h-tap transition hover:text-brand-600"
          >
            {{ l.label }}
          </NuxtLink>
          <a :href="`mailto:${chrome.contactEmail}`" class="ct-focus min-h-tap transition hover:text-brand-600">
            {{ chrome.contactEmail }}
          </a>
        </nav>
      </div>
    </footer>
  </div>
</template>
