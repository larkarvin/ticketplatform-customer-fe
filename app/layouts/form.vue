<script setup lang="ts">
// Focused chrome for the public form-filling task. On phones the form IS the page: full-bleed white,
// no gutter, no card — every pixel goes to the form. From `sm` up it becomes a calm sheet floating on
// a soft brand-tinted ground. Identity is carried by the brand colour, not a name: the org logo shows
// when there is one; otherwise the chrome stays quiet. Light-only (customer-fe has no dark toggle).
const { branding } = useTenant()
const orgName = computed(() => branding.value?.name || '')
const logo = computed(() => branding.value?.logoUrl || null)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-gray-900 sm:bg-brand-25">
    <header v-if="logo" class="px-4 pt-6 pb-2 sm:pt-8">
      <NuxtLink to="/" class="mx-auto flex min-h-tap max-w-2xl items-center justify-center">
        <img :src="logo" :alt="orgName" class="h-9 w-auto" />
      </NuxtLink>
    </header>

    <main class="w-full flex-1">
      <div class="mx-auto w-full max-w-2xl sm:px-4 sm:py-10">
        <slot />
      </div>
    </main>

    <div class="sm:pb-10" />
  </div>
</template>
