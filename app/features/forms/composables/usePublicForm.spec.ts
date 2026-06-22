import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Form } from '~/features/forms/types'

const { getPublicForm, submitForm } = vi.hoisted(() => ({ getPublicForm: vi.fn(), submitForm: vi.fn() }))
vi.mock('~/features/forms/services/forms.service', () => ({
  formsService: { getPublicForm, submitForm, uploadFieldMedia: vi.fn() },
}))

// Stub the Nuxt auto-imports usePublicForm relies on (it runs outside a Nuxt app here).
beforeEach(() => {
  getPublicForm.mockReset()
  submitForm.mockReset()
  vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
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
})

import { usePublicForm } from './usePublicForm'

function field(p: Partial<Form['fields'][number]>): Form['fields'][number] {
  return {
    id: 1,
    field_group_id: null,
    field_key: 'k',
    type: 'text',
    label: 'F',
    placeholder: null,
    description: null,
    required: false,
    visibility: 'public',
    min: null,
    max: null,
    allow_decimal: null,
    settings: {},
    sort_order: 0,
    col_span: 12,
    options: [],
    ...p,
  }
}

function form(p: Partial<Form>): Form {
  return {
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
    submit_button_text: 'Submit',
    fields: [],
    field_groups: [],
    ...p,
  }
}

describe('usePublicForm', () => {
  it('groups flat fields by field_group_id into ordered sections (ungrouped first)', async () => {
    getPublicForm.mockResolvedValue(
      form({
        fields: [
          field({ id: 1, field_group_id: 10, sort_order: 0 }),
          field({ id: 2, field_group_id: null, sort_order: 0 }),
          field({ id: 3, field_group_id: 20, sort_order: 0 }),
        ],
        field_groups: [
          { id: 20, title: 'Two', description: null, sort_order: 2, fields: [] },
          { id: 10, title: 'One', description: null, sort_order: 1, fields: [] },
        ],
      })
    )
    const s = await usePublicForm('s')
    expect(s.sections.value.map((sec) => sec.id)).toEqual(['ungrouped', 'g-10', 'g-20'])
    expect(s.sections.value[1]?.fields.map((f) => f.id)).toEqual([1])
    expect(s.isMultiStep.value).toBe(true)
  })

  it('seeds answers only for collecting fields', async () => {
    getPublicForm.mockResolvedValue(
      form({ fields: [field({ id: 1, type: 'text' }), field({ id: 2, type: 'paragraph' })] })
    )
    const s = await usePublicForm('s')
    expect(s.answers['1']).toBe('')
    expect('2' in s.answers).toBe(false)
  })

  it('blocks submit and surfaces an inline error for a missing required field', async () => {
    getPublicForm.mockResolvedValue(form({ fields: [field({ id: 1, type: 'text', required: true })] }))
    const s = await usePublicForm('s')
    await s.submit()
    expect(submitForm).not.toHaveBeenCalled()
    expect(s.errors.value[1]).toBe('F is required')
  })
})
