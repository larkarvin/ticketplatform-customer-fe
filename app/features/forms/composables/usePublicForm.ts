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
  const { data, error } = await useAsyncData(`public-form:${slug}`, () => formsService.getPublicForm(slug))

  if (error.value || !data.value || !data.value.enabled) {
    throw createError({ statusCode: 404, statusMessage: 'Form not found', fatal: true })
  }
  const form = data.value as Form

  useHead({
    title: form.title,
    meta: [
      { property: 'og:title', content: form.title },
      ...(form.description ? [{ name: 'description', content: form.description }] : []),
    ],
  })

  // Ungrouped fields form an implicit leading section; groups follow. All sorted.
  const sections = computed<Section[]>(() => {
    const out: Section[] = []
    const ungrouped = form.fields.filter((f) => f.field_group_id === null).sort(bySort)
    if (ungrouped.length) out.push({ id: 'ungrouped', title: null, description: null, fields: ungrouped })
    for (const g of [...form.field_groups].sort(bySort)) {
      out.push({ id: `g-${g.id}`, title: g.title, description: g.description, fields: [...g.fields].sort(bySort) })
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
  }
}

export type PublicFormState = Awaited<ReturnType<typeof usePublicForm>>
