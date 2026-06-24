<script setup lang="ts">
import FormRenderer from '~/features/forms/components/FormRenderer.vue'
import { usePublicForm } from '~/features/forms/composables/usePublicForm'

definePageMeta({ layout: 'form' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const state = await usePublicForm(slug.value)
</script>

<template>
  <FormRenderer :state="state" />
</template>
