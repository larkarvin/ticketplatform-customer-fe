// app/features/forms/composables/usePublicForm.ts
// Owns the form's client state: SSR fetch, answers, the inline error map (client + 422), and submit
// orchestration. No transport (services) or UI here.
import { isValidationError } from '#core/errors'
import { computed, reactive, ref } from 'vue'
import { formsService } from '~/features/forms/services/forms.service'
import type { Field, Form, SubmitAnswers, SubmitResult } from '~/features/forms/types'
import { isCollecting, validateAll } from '~/features/forms/validation'

interface Section {
  id: string
  title: string | null
  description: string | null
  fields: Field[]
}

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export async function usePublicForm(slug: string) {
  // Nuxt composables (useAsyncData, useHead) MUST be called synchronously before any await — after an
  // await the setup context is lost and they throw "composable called outside setup". So set them up
  // first (useHead reads `data` reactively once it resolves), then await the fetch.
  const asyncForm = useAsyncData(`public-form:${slug}`, () => formsService.getPublicForm(slug))
  const { data, error } = asyncForm

  useHead(() => {
    const f = data.value
    if (!f) return {}
    return {
      title: f.title,
      meta: [
        { property: 'og:title', content: f.title },
        ...(f.description ? [{ name: 'description', content: f.description }] : []),
      ],
    }
  })

  await asyncForm

  if (error.value || !data.value || !data.value.enabled) {
    throw createError({ statusCode: 404, statusMessage: 'Form not found', fatal: true })
  }
  const form = data.value as Form

  // The API returns fields FLAT in form.fields (each carrying a field_group_id) and field_groups as
  // metadata only (no nested fields). Build sections by grouping the flat fields on field_group_id:
  // ungrouped (null) first, then one section per group in sort order.
  const sections = computed<Section[]>(() => {
    const out: Section[] = []
    const ungrouped = form.fields.filter((f) => f.field_group_id === null).sort(bySort)
    if (ungrouped.length) out.push({ id: 'ungrouped', title: null, description: null, fields: ungrouped })
    for (const g of [...form.field_groups].sort(bySort)) {
      const fields = form.fields.filter((f) => f.field_group_id === g.id).sort(bySort)
      if (fields.length) out.push({ id: `g-${g.id}`, title: g.title, description: g.description, fields })
    }
    return out
  })

  const allFields = computed<Field[]>(() => sections.value.flatMap((s) => s.fields))

  // Seed answers for every collecting field.
  const answers = reactive<Record<string, unknown>>({})
  for (const f of allFields.value) {
    if (isCollecting(f)) answers[String(f.id)] = ''
  }

  const errors = ref<Record<number, string>>({})
  const guestEmail = ref('')
  const needsGuestEmail = computed(() => form.requires_guest_email && !allFields.value.some((f) => f.type === 'email'))

  const now = Date.now()
  const isClosed = computed(() => !!form.submission_deadline && new Date(form.submission_deadline).getTime() < now)
  const isPriced = computed(
    () => form.price > 0 || allFields.value.some((f) => f.options.some((o) => (o.price ?? 0) > 0))
  )
  const membersOnlyBlocked = computed(() => form.members_only && !form.allow_non_members)

  const uploads = reactive<Record<number, { uploading: boolean; filename: string | null }>>({})
  async function uploadFile(fieldId: number, file: File): Promise<void> {
    uploads[fieldId] = { uploading: true, filename: file.name }
    try {
      const media = await formsService.uploadFieldMedia(slug, fieldId, file)
      setAnswer(fieldId, media.uuid)
      uploads[fieldId] = { uploading: false, filename: media.original_filename }
    } catch {
      uploads[fieldId] = { uploading: false, filename: null }
      // api client already toasted the failure
    }
  }

  const submitting = ref(false)
  const submitted = ref<SubmitResult | null>(null)

  function setAnswer(fieldId: number, value: unknown): void {
    answers[String(fieldId)] = value
    if (errors.value[fieldId]) {
      errors.value = Object.fromEntries(Object.entries(errors.value).filter(([k]) => Number(k) !== fieldId))
    }
  }

  async function submit(): Promise<void> {
    if (submitting.value || isClosed.value || isPriced.value || membersOnlyBlocked.value) return
    const clientErrors = validateAll(allFields.value, answers)
    if (needsGuestEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.value.trim())) {
      clientErrors[-1] = 'Enter a valid email address'
    }
    errors.value = clientErrors
    if (Object.keys(clientErrors).length) {
      focusFirstError()
      return
    }
    submitting.value = true
    try {
      const payload: SubmitAnswers = { ...answers }
      if (needsGuestEmail.value) payload.guest_email = guestEmail.value.trim()
      submitted.value = await formsService.submitForm(slug, payload)
    } catch (e) {
      if (isValidationError(e)) {
        const mapped: Record<number, string> = {}
        for (const [key, msg] of Object.entries(e.fields)) mapped[Number(key)] = msg
        errors.value = mapped
        focusFirstError()
      }
      // 5xx/network already toasted by the api client.
    } finally {
      submitting.value = false
    }
  }

  function focusFirstError(): void {
    if (!import.meta.client) return
    void nextTick(() => {
      const firstId = Object.keys(errors.value)[0]
      if (firstId) document.getElementById(`field-${firstId}`)?.focus()
    })
  }

  return {
    form,
    sections,
    answers,
    errors,
    guestEmail,
    needsGuestEmail,
    isClosed,
    isPriced,
    membersOnlyBlocked,
    submitting,
    submitted,
    submit,
    setAnswer,
    uploads,
    uploadFile,
  }
}

export type PublicFormState = Awaited<ReturnType<typeof usePublicForm>>
