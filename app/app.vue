<script setup lang="ts">
const { branding } = useTenant()
const config = useRuntimeConfig()

// Org name (when branding resolves) else the configured app name. Used as the title suffix so every
// page reads "<page> · <org>".
const appName = computed(() => branding.value?.name || (config.public.appName as string))
useHead(() => ({
  titleTemplate: (chunk?: string) => (chunk ? `${chunk} · ${appName.value}` : appName.value),
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
