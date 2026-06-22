<!-- display/DecorativeImage.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
const props = defineProps<{ field: Field }>()
const src = computed(() => (props.field.settings.url as string | undefined) ?? null)
</script>
<template>
  <img v-if="src" :src="src" :alt="field.label" class="w-full rounded-lg object-cover" />
</template>
