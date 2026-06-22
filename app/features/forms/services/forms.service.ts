// Public forms API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { Form, SubmitAnswers, SubmitResult, UploadedMedia } from '../types'

export const formsService = {
  getPublicForm: (slug: string): Promise<Form> =>
    useApiClient()
      .get<{ data: Form }>(`/forms/public/${slug}`)
      .then((r) => r.data),

  submitForm: (slug: string, answers: SubmitAnswers): Promise<SubmitResult> =>
    useApiClient().post<SubmitResult>(`/forms/public/${slug}/submit`, answers),

  uploadFieldMedia: (slug: string, fieldId: number, file: File): Promise<UploadedMedia> => {
    const form = new FormData()
    form.append('file', file)
    return useApiClient().post<UploadedMedia>(`/forms/public/${slug}/fields/${fieldId}/upload`, form)
  },
}
