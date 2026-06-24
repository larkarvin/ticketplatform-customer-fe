import { registerFieldType } from '#core/field-engine/registry'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
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

  it('prefills the contact email from the form email field, then stops once the guest edits it', async () => {
    getPublicForm.mockResolvedValue(form({ fields: [field({ id: 5, type: 'email', label: 'Email' })] }))
    const s = await usePublicForm('s')
    // An email field means we still collect a contact email (to prefill), not skip it.
    expect(s.needsGuestEmail.value).toBe(true)
    s.setAnswer(5, 'a@b.com')
    await nextTick()
    expect(s.guestEmail.value).toBe('a@b.com')
    // Once the guest edits the destination, later field changes must not clobber it.
    s.setGuestEmail('me@home.com')
    s.setAnswer(5, 'c@d.com')
    await nextTick()
    expect(s.guestEmail.value).toBe('me@home.com')
  })

  it('still asks for a contact email when the form has no email field', async () => {
    getPublicForm.mockResolvedValue(form({ requires_guest_email: true, fields: [field({ id: 1, type: 'text' })] }))
    const s = await usePublicForm('s')
    expect(s.needsGuestEmail.value).toBe(true)
    expect(s.guestEmail.value).toBe('')
  })

  it('asks for a contact email on a members-only form that allows non-members (no email field)', async () => {
    getPublicForm.mockResolvedValue(
      form({
        members_only: true,
        allow_non_members: true,
        requires_guest_email: false,
        fields: [field({ id: 1, type: 'text' })],
      })
    )
    const s = await usePublicForm('s')
    expect(s.needsGuestEmail.value).toBe(true)
  })

  it('summarises a product selection in plain words for the review step', async () => {
    registerFieldType({ type: 'product', component: {}, collectsData: true, defaultValue: () => [] })
    getPublicForm.mockResolvedValue(
      form({
        fields: [
          field({
            id: 7,
            type: 'product',
            label: 'Shirt',
            settings: {
              product: {
                id: 1,
                name: 'Shirt',
                image: null,
                variants: [
                  {
                    id: 11,
                    name: 'M-Red',
                    sku: null,
                    is_active: true,
                    image: null,
                    attribute_values: [
                      { attribute: 'Size', value: 'Medium' },
                      { attribute: 'Color', value: 'Red' },
                    ],
                    prices: [],
                  },
                ],
              },
            },
          }),
        ],
      })
    )
    const s = await usePublicForm('s')
    s.setAnswer(7, [{ variant_id: 11, quantity: 2 }])
    const item = s.reviewGroups.value.flatMap((g) => g.items).find((it) => it.fieldId === 7)
    expect(item?.value).toBe('2 × Shirt (Medium – Red)')
  })

  it('clears the contact-email error when the guest edits the address', async () => {
    getPublicForm.mockResolvedValue(form({ requires_guest_email: true, fields: [field({ id: 1, type: 'text' })] }))
    const s = await usePublicForm('s')
    s.errors.value = { [-1]: 'Enter a valid email address' }
    s.setGuestEmail('a@b.com')
    expect(s.errors.value[-1]).toBeUndefined()
  })

  it('blocks submit and surfaces an inline error for a missing required field', async () => {
    getPublicForm.mockResolvedValue(form({ fields: [field({ id: 1, type: 'text', required: true })] }))
    const s = await usePublicForm('s')
    await s.submit()
    expect(submitForm).not.toHaveBeenCalled()
    expect(s.errors.value[1]).toBe('F is required')
  })
})
