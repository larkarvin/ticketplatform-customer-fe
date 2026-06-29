import type { Field } from '#core/field-engine/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { CartParticipant } from '../../types'
import ParticipantCard from './ParticipantCard.vue'

const nameField: Field = {
  id: 1,
  field_key: 'name',
  type: 'text',
  label: 'Runner name',
  required: true,
  col_span: 12,
  options: [],
  visibility: 'public',
  field_group_id: null,
  placeholder: null,
  description: null,
  min: null,
  max: null,
  allow_decimal: null,
  settings: {},
  sort_order: 0,
}

const base = () => ({
  fields: [nameField],
  participant: { field_data: {} } as CartParticipant,
  index: 0,
  identityKey: 'name',
  errors: {},
  errorPrefix: '9-1.0',
  title: 'Participant 1',
  canCopy: false,
  canRemove: false,
})

describe('ParticipantCard', () => {
  it('renders the title prop', () => {
    const w = mount(ParticipantCard, { props: { ...base(), title: 'Participant 3' } })
    expect(w.text()).toContain('Participant 3')
  })

  it('renders the configured field label (not a hardcoded one)', () => {
    const w = mount(ParticipantCard, { props: base() })
    expect(w.text()).toContain('Runner name')
  })

  it('shows Copy button only when canCopy=true', () => {
    const withCopy = mount(ParticipantCard, { props: { ...base(), canCopy: true } })
    const withoutCopy = mount(ParticipantCard, { props: { ...base(), canCopy: false } })
    expect(withCopy.find('[data-test=copy-above]').exists()).toBe(true)
    expect(withoutCopy.find('[data-test=copy-above]').exists()).toBe(false)
  })

  it('emits copy-from-above when Copy button clicked', async () => {
    const w = mount(ParticipantCard, { props: { ...base(), canCopy: true } })
    await w.get('[data-test=copy-above]').trigger('click')
    expect(w.emitted('copy-from-above')).toBeTruthy()
  })

  it('shows Remove button only when canRemove=true', () => {
    const withRemove = mount(ParticipantCard, { props: { ...base(), canRemove: true } })
    const withoutRemove = mount(ParticipantCard, { props: { ...base(), canRemove: false } })
    expect(withRemove.find('[data-test=remove]').exists()).toBe(true)
    expect(withoutRemove.find('[data-test=remove]').exists()).toBe(false)
  })

  it('emits remove when Remove button clicked', async () => {
    const w = mount(ParticipantCard, { props: { ...base(), canRemove: true } })
    await w.get('[data-test=remove]').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
  })

  it('shows neither Copy nor Remove when both false', () => {
    const w = mount(ParticipantCard, { props: base() })
    expect(w.find('[data-test=copy-above]').exists()).toBe(false)
    expect(w.find('[data-test=remove]').exists()).toBe(false)
  })
})
