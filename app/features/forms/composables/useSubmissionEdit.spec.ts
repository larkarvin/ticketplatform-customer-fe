import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { SubmissionDetail } from '~/features/forms/types'

const { getSubmission, updateSubmission } = vi.hoisted(() => ({
  getSubmission: vi.fn(),
  updateSubmission: vi.fn(),
}))
vi.mock('~/features/forms/services/forms.service', () => ({
  formsService: { getSubmission, updateSubmission },
}))

beforeEach(() => {
  getSubmission.mockReset()
  updateSubmission.mockReset()
  vi.stubGlobal('useAsyncData', (_k: string, handler: () => Promise<unknown>) => {
    const data = ref<unknown>(null)
    const error = ref<unknown>(null)
    const promise = Promise.resolve()
      .then(handler)
      .then((d) => {
        data.value = d
      })
      .catch((e) => {
        error.value = e
      })
    return Object.assign(promise, { data, error })
  })
  vi.stubGlobal('useHead', () => {})
  vi.stubGlobal('createError', (o: { statusMessage?: string }) => new Error(o.statusMessage ?? 'error'))
  vi.stubGlobal('navigateTo', vi.fn())
})

import { useSubmissionEdit } from './useSubmissionEdit'

function detail(p: Partial<SubmissionDetail> = {}): SubmissionDetail {
  return {
    id: 1,
    slug: 'sub-1',
    edit_url: '/e',
    email: 'a@b.com',
    submitter_name: 'A',
    form_data: {},
    total_amount: null,
    status: 'pending',
    locked_field_ids: [],
    order_public_id: 'ord-1',
    form: {
      id: 1,
      title: 'T',
      slug: 's',
      description: null,
      price: 0,
      surcharge_type: 'none',
      surcharge_value: 0,
      currency: 'USD',
      enabled: true,
      members_only: false,
      allow_non_members: true,
      requires_guest_email: false,
      submission_deadline: null,
      submit_button_text: 'Save',
      fields: [],
      field_groups: [],
    },
    ...p,
  }
}

const textField = (id: number, key: string) => ({
  id,
  field_group_id: null,
  field_key: key,
  type: 'text',
  label: `F${id}`,
  placeholder: null,
  description: null,
  required: false,
  visibility: 'public' as const,
  min: null,
  max: null,
  allow_decimal: null,
  settings: {},
  sort_order: 0,
  col_span: 12,
  options: [],
})

describe('useSubmissionEdit', () => {
  it('prefills answers by mapping field_key-keyed form_data to field id', async () => {
    getSubmission.mockResolvedValue(
      detail({
        form: { ...detail().form, fields: [textField(1, 'key-1'), textField(2, 'key-2')] },
        form_data: { 'key-1': 'Alice', 'key-2': 'Bob' },
      })
    )
    const s = await useSubmissionEdit('sub-1')
    expect(s.answers['1']).toBe('Alice')
    expect(s.answers['2']).toBe('Bob')
  })

  it('marks fields in locked_field_ids as locked', async () => {
    getSubmission.mockResolvedValue(
      detail({
        form: { ...detail().form, fields: [textField(1, 'key-1'), textField(2, 'key-2')] },
        locked_field_ids: [2],
      })
    )
    const s = await useSubmissionEdit('sub-1')
    expect(s.isLocked(s.fields.value[0]!)).toBe(false)
    expect(s.isLocked(s.fields.value[1]!)).toBe(true)
  })

  it('submits only unlocked answers and redirects to the order hub', async () => {
    getSubmission.mockResolvedValue(
      detail({
        form: { ...detail().form, fields: [textField(1, 'key-1'), textField(2, 'key-2')] },
        form_data: { 'key-1': 'Alice', 'key-2': 'Bob' },
        locked_field_ids: [2],
      })
    )
    updateSubmission.mockResolvedValue({ message: 'Submission updated successfully' })
    const s = await useSubmissionEdit('sub-1')
    s.setAnswer(1, 'Alice edited')
    await s.submit()
    expect(updateSubmission).toHaveBeenCalledWith('sub-1', { '1': 'Alice edited' })
    expect(navigateTo).toHaveBeenCalledWith('/orders/ord-1')
  })
})
