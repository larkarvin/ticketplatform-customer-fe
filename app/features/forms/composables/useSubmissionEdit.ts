// app/features/forms/composables/useSubmissionEdit.ts
// State for the submission edit page: SSR fetch, prefill (field_key → id), locked-field detection,
// and validate → PUT → redirect to the order hub. No transport/UI here.
import { isValidationError } from '#core/errors'
import type { Field } from '#core/field-engine/types'
import { isCollecting, validateAll } from '#core/field-engine/validation'
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { formsService } from '~/features/forms/services/forms.service'
import type { SubmissionDetail } from '~/features/forms/types'

const bySort = (a: Field, b: Field) => a.sort_order - b.sort_order

export async function useSubmissionEdit(slug: string) {
  const asyncDetail = useAsyncData(`submission:${slug}`, () => formsService.getSubmission(slug))
  const { data, error } = asyncDetail

  useHead(() => {
    const d = data.value
    return d ? { title: `Edit — ${d.form.title}` } : {}
  })

  await asyncDetail

  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Submission not found', fatal: true })
  }
  const detail = data.value as SubmissionDetail

  const fields = computed<Field[]>(() => [...detail.form.fields].sort(bySort))
  const lockedIds = new Set(detail.locked_field_ids)
  function isLocked(field: Field): boolean {
    return lockedIds.has(field.id)
  }

  // Prefill: form_data is keyed by field_key (UUID); the inputs key by field id.
  const answers = reactive<Record<string, unknown>>({})
  for (const f of fields.value) {
    if (!isCollecting(f)) continue
    answers[String(f.id)] = detail.form_data[f.field_key] ?? ''
  }

  const errors = ref<Record<number, string>>({})
  function setAnswer(fieldId: number, value: unknown): void {
    answers[String(fieldId)] = value
    if (errors.value[fieldId]) {
      errors.value = Object.fromEntries(Object.entries(errors.value).filter(([k]) => Number(k) !== fieldId))
    }
  }

  // A plain-words read-back for locked fields (select → option label, else the raw value).
  function formatLocked(field: Field): string {
    const value = answers[String(field.id)]
    if (field.type === 'select') {
      const opt = field.options.find((o) => o.option_key === String(value))
      return opt?.label ?? (typeof value === 'string' ? value : '')
    }
    return typeof value === 'string' ? value : value == null ? '' : String(value)
  }

  const editableFields = computed<Field[]>(() => fields.value.filter((f) => !isLocked(f) && isCollecting(f)))
  const submitting = ref(false)

  async function submit(): Promise<void> {
    if (submitting.value) return
    const clientErrors = validateAll(editableFields.value, answers)
    errors.value = clientErrors
    if (Object.keys(clientErrors).length) return
    submitting.value = true
    try {
      const payload = Object.fromEntries(editableFields.value.map((f) => [String(f.id), answers[String(f.id)]]))
      await formsService.updateSubmission(slug, payload)
      await navigateTo(detail.order_public_id ? `/orders/${detail.order_public_id}` : '/')
    } catch (e) {
      submitting.value = false
      if (isValidationError(e)) {
        const mapped: Record<number, string> = {}
        for (const [key, msg] of Object.entries(e.fields)) mapped[Number(key)] = msg
        errors.value = mapped
      } else {
        toast.error("Couldn't save your changes. Please try again.")
      }
    }
  }

  return { detail, fields, isLocked, formatLocked, answers, errors, setAnswer, submitting, submit }
}

export type SubmissionEditState = Awaited<ReturnType<typeof useSubmissionEdit>>
