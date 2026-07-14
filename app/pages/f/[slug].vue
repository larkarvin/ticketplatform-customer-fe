<script setup lang="ts">
import { useT } from '#core/i18n'
import FormRenderer from '~/features/forms/components/FormRenderer.vue'
import { usePublicForm } from '~/features/forms/composables/usePublicForm'

definePageMeta({ layout: 'form' })

const { t } = useT()

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const state = await usePublicForm(slug.value)
</script>

<template>
  <div>
    <!-- Quiet, subordinate to the form's own primary submit CTA — for the guest about to submit twice. -->
    <p class="mb-3 px-4 text-sm text-gray-500 sm:px-0">
      <NuxtLink to="/recover" class="inline-flex min-h-tap items-center text-brand-600 hover:underline">
        {{ t('recovery.alreadyRegistered') }}
      </NuxtLink>
    </p>
    <FormRenderer :state="state" />
  </div>
</template>
