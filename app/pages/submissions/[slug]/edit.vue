<script setup lang="ts">
import SubmissionEditor from '~/features/forms/components/SubmissionEditor.vue'
import { useSubmissionEdit } from '~/features/forms/composables/useSubmissionEdit'

definePageMeta({ layout: 'form' })

const route = useRoute()
const state = await useSubmissionEdit(String(route.params.slug))
</script>

<template>
  <SubmissionEditor :state="state" />
</template>
