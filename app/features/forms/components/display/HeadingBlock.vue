<!-- display/HeadingBlock.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
defineProps<{ field: Field }>()
</script>
<template>
  <h2 class="text-xl font-semibold text-gray-900 dark:text-white/90">{{ field.label }}</h2>
</template>
