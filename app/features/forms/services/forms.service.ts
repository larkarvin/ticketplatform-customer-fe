// Public forms API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { Form, PaymentBreakdown, SubmissionDetail, SubmitAnswers, SubmitResult, UploadedMedia } from '../types'

export const formsService = {
  getPublicForm: (slug: string): Promise<Form> =>
    useApiClient()
      .get<{ data: Form }>(`/forms/public/${slug}`)
      .then((r) => r.data),

  submitForm: (slug: string, answers: SubmitAnswers): Promise<SubmitResult> =>
    useApiClient()
      .post<{ data: SubmitResult }>(`/forms/public/${slug}/submit`, answers)
      .then((r) => r.data),

  // Server-authoritative price breakdown for the current answers (keyed by field id).
  calculatePayment: (slug: string, data: Record<string, unknown>): Promise<PaymentBreakdown> =>
    useApiClient()
      .post<{ data: PaymentBreakdown }>(`/forms/public/${slug}/calculate`, { data })
      .then((r) => r.data),

  uploadFieldMedia: (slug: string, fieldId: number, file: File): Promise<UploadedMedia> => {
    const form = new FormData()
    form.append('file', file)
    return useApiClient()
      .post<{ data: UploadedMedia }>(`/forms/public/${slug}/fields/${fieldId}/upload`, form)
      .then((r) => r.data)
  },

  // Kick off payment for the order minted by submit. The /orders/{id}/pay endpoint is
  // order-generic (same one events use); forms call it directly to keep the feature sealed.
  initiatePayment: (publicId: string, redirectUrl: string): Promise<{ redirect_url?: string }> =>
    useApiClient()
      .post<{ data: { redirect_url?: string } }>(`/orders/${publicId}/pay`, { redirect_url: redirectUrl })
      .then((r) => r.data),

  getSubmission: (slug: string): Promise<SubmissionDetail> =>
    useApiClient()
      .get<{ data: SubmissionDetail }>(`/submissions/${slug}`)
      .then((r) => r.data),

  // Answers are keyed by field id (the endpoint validates by id, then maps to field_key).
  updateSubmission: (slug: string, answers: Record<string, unknown>): Promise<{ message: string }> =>
    useApiClient().put<{ message: string }>(`/submissions/${slug}`, answers),
}
