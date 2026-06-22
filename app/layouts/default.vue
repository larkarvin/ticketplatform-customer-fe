<script setup lang="ts">
// Consumer shell: header (org identity) / content / footer. Neutral grays for chrome, the brand var
// for identity. The max-w-5xl column frames the page (shell, not content); content stays left-aligned.
const { branding } = useTenant()
const config = useRuntimeConfig()
const orgName = computed(() => branding.value?.name || (config.public.appName as string))
const logo = computed(() => branding.value?.logoUrl || null)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-gray-900">
    <header class="border-b border-gray-100">
      <div class="mx-auto flex min-h-tap w-full max-w-5xl items-center px-4 py-3">
        <NuxtLink to="/" class="flex min-h-tap items-center gap-2">
          <img v-if="logo" :src="logo" :alt="orgName" class="h-8 w-auto" />
          <span v-else class="text-lg font-semibold" :style="{ color: 'var(--color-brand-500)' }">
            {{ orgName }}
          </span>
        </NuxtLink>
      </div>
    </header>

    <main class="w-full flex-1">
      <div class="mx-auto w-full max-w-5xl px-4 py-8">
        <slot />
      </div>
    </main>

    <footer class="border-t border-gray-100">
      <div class="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-gray-500">{{ orgName }}</div>
    </footer>
  </div>
</template>
