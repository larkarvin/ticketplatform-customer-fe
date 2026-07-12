<!-- app/whitelabels/sportsquad/Chrome.vue — placeholder, replaced in Tasks 6–7 -->
<script setup lang="ts">
defineProps<{ staffUrl: string; orgName: string; logoUrl?: string | null }>()
</script>

<template>
  <div><slot /></div>
</template>
