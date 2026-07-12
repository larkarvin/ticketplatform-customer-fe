<script setup lang="ts">
import ConfirmModal from '#core/components/ui/ConfirmModal.vue'
import { chrome as whitelabel } from '#whitelabel/content'
import { Toaster } from 'vue-sonner'

const { branding } = useTenant()

// Org name (when branding resolves) else the active whitelabel's brand name (SportSquad /
// CatholicTickets) — never the generic app name. Used as the title suffix so every page reads
// "<page> · <brand>".
const appName = computed(() => branding.value?.name || whitelabel.brandName)
useHead(() => ({
  titleTemplate: (chunk?: string) => (chunk ? `${chunk} · ${appName.value}` : appName.value),
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-center" :rich-colors="true" />
  <ConfirmModal />
</template>
