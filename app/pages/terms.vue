<!-- app/pages/terms.vue -->
<!-- Shared Terms route. Content is per-whitelabel: `#whitelabel/terms` resolves to the active
     site's terms.ts (sportsquad or catholic), so each brand serves its own Terms & Conditions. -->
<script setup lang="ts">
import { terms } from '#whitelabel/terms'
import LegalPage from '~/components/LegalPage.vue'

useHead({ title: 'Terms' })
</script>

<template>
  <LegalPage :doc="terms" />
</template>
