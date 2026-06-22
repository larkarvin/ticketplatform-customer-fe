<!-- display/ParagraphBlock.vue — sanitized HTML body (content from API, not just this session) -->
<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
const props = defineProps<{ field: Field }>()
const html = computed(() => DOMPurify.sanitize(String(props.field.settings.content ?? ''), { FORBID_TAGS: ['img'] }))
</script>
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="prose prose-sm max-w-none text-gray-700 dark:prose-invert" v-html="html" />
</template>
