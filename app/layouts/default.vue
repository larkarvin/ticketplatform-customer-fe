<script setup lang="ts">
// The active whitelabel owns the header/footer chrome. staffUrl + orgName are threaded in so
// Chrome stays a pure, unit-testable component (no Nuxt auto-imports of its own): staffUrl lets
// it build organizer sign in/up links (hidden when unset); orgName carries the resolved branding.
import Chrome from '#whitelabel/Chrome.vue'
import { computed } from 'vue'

const config = useRuntimeConfig()
const staffUrl = config.public.staffUrl as string
const { branding } = useTenant()
// Only the RESOLVED organization name (empty when no org branding). Chrome falls back to the
// whitelabel's own brand name in that case — never the generic app name ("Platform").
const orgName = computed(() => branding.value?.name || '')
// Logo when the org has one, else null → Chrome falls back to the org name as text. No org has a
// logo yet, so this renders names today; drop-in image support once logos exist.
const logoUrl = computed(() => branding.value?.logoUrl || null)
</script>

<template>
  <Chrome :staff-url="staffUrl" :org-name="orgName" :logo-url="logoUrl">
    <slot />
  </Chrome>
</template>
