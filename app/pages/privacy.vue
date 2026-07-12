<!-- app/pages/privacy.vue -->
<!-- Shared Privacy route. Content is per-whitelabel: `#whitelabel/privacy` resolves to the active
     site's privacy.ts (sportsquad or catholic), so each brand serves its own Privacy Policy. -->
<script setup lang="ts">
import { privacy } from '#whitelabel/privacy'
import LegalPage from '~/components/LegalPage.vue'

useHead({ title: 'Privacy' })
</script>

<template>
  <LegalPage :doc="privacy" />
</template>
