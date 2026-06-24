// app/features/forms/composables/usePublicForm.ts
// Owns the form's client state: SSR fetch, answers, the inline error map (client + 422), and submit
// orchestration. No transport (services) or UI here.
import { isValidationError } from '#core/errors'
import { getFieldType } from '#core/field-engine/registry'
import type { Field } from '#core/field-engine/types'
import { isCollecting, validateAll } from '#core/field-engine/validation'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { variantLabel } from '~/features/forms/productLabels'
import { formsService } from '~/features/forms/services/forms.service'
import type {
  Form,
  PaymentBreakdown,
  ProductFieldInfo,
  ProductSelection,
  SubmitAnswers,
  SubmitResult,
} from '~/features/forms/types'

/** One reviewed answer (a field's label + its value in plain words). */
export interface ReviewItem {
  fieldId: number
  label: string
  value: string
}
/** A reviewed section: its heading, the step to jump to when editing, and its answered items. */
export interface ReviewGroup {
  stepIndex: number
  title: string
  items: ReviewItem[]
}

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

  // Restore any locally-saved draft once we're on the client (after hydration) and keep it saved as the
  // form is filled, so a refresh or back-navigation doesn't make the person retype. Registered before
  // the await so the lifecycle hook binds to this setup; `restoreDraft`/`saveDraft` are defined below.
  if (import.meta.client) onMounted(() => restoreDraft())

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
  // Collect a contact email on every guest-submittable form (prefilled from the email field when there
  // is one). Gating on guest-submittability — not the backend's `requires_guest_email`, which is false
  // for members-only forms — avoids a dead-end where a guest on a members-only-but-allow-non-members
  // form with no email field gets a 422 for an input that was never shown.
  const needsGuestEmail = computed(() => !form.members_only || form.allow_non_members)
  function setGuestEmail(value: string): void {
    guestEmailEdited.value = true
    guestEmail.value = value
    // Clear any prior contact-email error as the guest edits (mirrors setAnswer for field errors).
    if (errors.value[-1]) {
      errors.value = Object.fromEntries(Object.entries(errors.value).filter(([k]) => Number(k) !== -1))
    }
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

  // ── Paging: each section (field group) is a step, then a final Review step that's always present. ──
  const currentStep = ref(0)
  const sectionCount = computed(() => sections.value.length)
  const totalSteps = computed(() => sectionCount.value + 1)
  const reviewStepIndex = computed(() => sectionCount.value)
  const isReviewStep = computed(() => currentStep.value >= reviewStepIndex.value)
  const isMultiStep = computed(() => totalSteps.value > 1)
  // Only worth a step plaque when there's genuinely more than one section to page through; a single
  // section (it + Review) just shows the fields, no "Step 1 / Next: Review" chrome.
  const showStepper = computed(() => sectionCount.value > 1)
  const currentSection = computed(() => sections.value[currentStep.value] ?? null)
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value >= totalSteps.value - 1)
  // The renderer shows the current step's section while paging, and nothing on the Review step.
  const visibleSections = computed<Section[]>(() =>
    isReviewStep.value || !currentSection.value ? [] : [currentSection.value]
  )

  // The Review step's read-back: each section's answered fields in plain words, with the step to jump
  // back to for editing. Empty answers and display-only fields are skipped.
  function formatAnswer(field: Field, value: unknown): string {
    if (field.type === 'product') {
      const product = field.settings.product as ProductFieldInfo | undefined
      if (!Array.isArray(value) || !product) return ''
      // Show the product name alongside its variant ("1 × Shirt (Medium – Red)"). For a simple product
      // whose variant label is just the product name, don't repeat it.
      return (value as ProductSelection[])
        .map((sel) => {
          const v = product.variants.find((vr) => vr.id === sel.variant_id)
          if (!v) return null
          const variant = variantLabel(v)
          return product.name && variant !== product.name
            ? `${sel.quantity} × ${product.name} (${variant})`
            : `${sel.quantity} × ${variant}`
        })
        .filter((line): line is string => line !== null)
        .join(', ')
    }
    if (field.type === 'file' || field.type === 'image') {
      return uploads[field.id]?.filename ?? (value ? 'Uploaded' : '')
    }
    if (field.type === 'select') {
      const opt = field.options.find((o) => o.option_key === String(value))
      return opt?.label ?? (typeof value === 'string' ? value : '')
    }
    return typeof value === 'string' ? value : value == null ? '' : String(value)
  }
  const reviewGroups = computed<ReviewGroup[]>(() =>
    sections.value
      .map((sec, i) => ({
        stepIndex: i,
        title: sec.title || 'Your answers',
        items: sec.fields
          .filter((f) => isCollecting(f))
          .map((f) => ({ fieldId: f.id, label: f.label, value: formatAnswer(f, answers[String(f.id)]) }))
          .filter((it) => it.value !== ''),
      }))
      .filter((g) => g.items.length > 0)
  )

  // Server-authoritative price breakdown, fetched when a priced form reaches the Review step — and
  // again on return after an edit-back (re-entering the step re-runs it), so the total always matches
  // the current answers. Never computed on the client.
  const breakdown = ref<PaymentBreakdown | null>(null)
  const calcLoading = ref(false)
  async function refreshBreakdown(): Promise<void> {
    if (!isPriced.value) return
    calcLoading.value = true
    try {
      breakdown.value = await formsService.calculatePayment(slug, { ...answers })
    } catch {
      breakdown.value = null // api client toasts the failure; hide the breakdown rather than show stale
    } finally {
      calcLoading.value = false
    }
  }
  watch(isReviewStep, (onReview) => {
    if (onReview) void refreshBreakdown()
  })

  // ── Local draft ──────────────────────────────────────────────────────────────────────────────────
  // Persist the answers + contact email as the form is filled so a refresh or back-navigation doesn't
  // make the person retype; restored on load (see onMounted above) and cleared on a successful submit.
  // Keyed by slug, best-effort (storage may be unavailable).
  const draftKey = `form-draft:${slug}`
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function saveDraft(): void {
    if (!import.meta.client) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ answers, guestEmail: guestEmail.value }))
      } catch {
        // storage full / blocked — drafting is best-effort
      }
    }, 400)
  }
  function restoreDraft(): void {
    if (!import.meta.client) return
    const raw = localStorage.getItem(draftKey)
    if (!raw) return
    const saved = ((): { answers?: Record<string, unknown>; guestEmail?: string } | null => {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    })()
    if (!saved || typeof saved !== 'object') return
    if (saved.answers) {
      for (const [key, value] of Object.entries(saved.answers)) if (key in answers) answers[key] = value
    }
    if (typeof saved.guestEmail === 'string' && saved.guestEmail) setGuestEmail(saved.guestEmail)
  }
  function clearDraft(): void {
    if (saveTimer) clearTimeout(saveTimer)
    if (import.meta.client) localStorage.removeItem(draftKey)
  }
  // Serialise the answers so this stays a shallow watch (no deep watcher) yet reacts to any change.
  watch([() => JSON.stringify(answers), guestEmail], saveDraft)

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
      clearDraft() // submitted — drop the local draft so a return visit starts fresh
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
    showStepper,
    isReviewStep,
    reviewGroups,
    breakdown,
    calcLoading,
    isFirstStep,
    isLastStep,
    visibleSections,
    nextStep,
    prevStep,
    goToStep,
  }
}

export type PublicFormState = Awaited<ReturnType<typeof usePublicForm>>
