// app/features/forms/composables/usePublicForm.ts
// Owns the form's client state: SSR fetch, answers, the inline error map (client + 422), and submit
// orchestration. No transport (services) or UI here.
import { isValidationError } from '#core/errors'
import { getFieldType } from '#core/field-engine/registry'
import type { Field } from '#core/field-engine/types'
import { isCollecting, validateAll } from '#core/field-engine/validation'
import { computed, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { formsService } from '~/features/forms/services/forms.service'
import type { Form, SubmitAnswers, SubmitResult } from '~/features/forms/types'

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

  // Seed answers for every collecting field; extensions (e.g. product) supply their own default value.
  const answers = reactive<Record<string, unknown>>({})
  for (const f of allFields.value) {
    if (!isCollecting(f)) continue
    const ext = getFieldType(f.type)
    answers[String(f.id)] = ext?.defaultValue ? ext.defaultValue() : ''
  }

  const errors = ref<Record<number, string>>({})

  // Every guest submission needs one contact email (where the confirmation + edit link go). When the
  // form has its own email field we treat that as the source and prefill the final step from it; the
  // guest can still edit the destination. With no email field they just type it. Either way the final
  // `guestEmail` is the single authoritative contact we submit.
  const guestEmail = ref('')
  const guestEmailEdited = ref(false)
  const emailField = computed(() => allFields.value.find((f) => f.type === 'email') ?? null)
  const detectedEmail = computed(() => {
    const v = emailField.value ? answers[String(emailField.value.id)] : ''
    return typeof v === 'string' ? v.trim() : ''
  })
  const needsGuestEmail = computed(() => form.requires_guest_email || !!emailField.value)
  function setGuestEmail(value: string): void {
    guestEmailEdited.value = true
    guestEmail.value = value
  }
  // Mirror the email field into the contact box until the guest types their own destination.
  watch(detectedEmail, (v) => !guestEmailEdited.value && (guestEmail.value = v), { immediate: true })

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

  // ── Multi-step paging: each section (field group) is a step. Single-section forms stay one page. ──
  const currentStep = ref(0)
  const totalSteps = computed(() => sections.value.length)
  const isMultiStep = computed(() => totalSteps.value > 1)
  const currentSection = computed(() => sections.value[currentStep.value] ?? null)
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value >= totalSteps.value - 1)
  // What the renderer shows: just the current step when paging, all sections otherwise.
  const visibleSections = computed<Section[]>(() =>
    isMultiStep.value ? (currentSection.value ? [currentSection.value] : []) : sections.value
  )

  // Validate just the current step's fields before advancing (errors show only for the visible step).
  function validateStep(): boolean {
    const section = currentSection.value
    errors.value = section ? validateAll(section.fields, answers) : {}
    if (Object.keys(errors.value).length) {
      focusFirstError()
      return false
    }
    return true
  }
  function scrollTop(): void {
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function nextStep(): void {
    if (isLastStep.value || !validateStep()) return
    currentStep.value++
    scrollTop()
  }
  function prevStep(): void {
    if (isFirstStep.value) return
    currentStep.value--
    scrollTop()
  }
  // Jump straight to an already-completed (earlier) step. Backward only — moving forward goes through
  // nextStep so each step is validated before it's left.
  function goToStep(index: number): void {
    if (index >= 0 && index < currentStep.value) {
      currentStep.value = index
      scrollTop()
    }
  }

  function setAnswer(fieldId: number, value: unknown): void {
    answers[String(fieldId)] = value
    if (errors.value[fieldId]) {
      errors.value = Object.fromEntries(Object.entries(errors.value).filter(([k]) => Number(k) !== fieldId))
    }
  }

  async function submit(): Promise<void> {
    if (submitting.value || isClosed.value || isPriced.value || membersOnlyBlocked.value) return
    // On a paged form, Enter / submit before the last step just advances.
    if (isMultiStep.value && !isLastStep.value) {
      nextStep()
      return
    }
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
        // guest_email is a non-numeric 422 key; route it to the -1 slot the template reads.
        const mapped: Record<number, string> = {}
        for (const [key, msg] of Object.entries(e.fields)) mapped[key === 'guest_email' ? -1 : Number(key)] = msg
        errors.value = mapped
        focusFirstError()
      } else {
        // 403/5xx/network are toasted by the api client; 400/404/409 are rethrown for us to message.
        toast.error("Couldn't submit your response. Please try again.")
      }
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
    setGuestEmail,
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
    currentStep,
    totalSteps,
    isMultiStep,
    isFirstStep,
    isLastStep,
    visibleSections,
    nextStep,
    prevStep,
    goToStep,
  }
}

export type PublicFormState = Awaited<ReturnType<typeof usePublicForm>>
