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
})

describe('ParticipantCard', () => {
  it('renders the configured field label (not a hardcoded one)', () => {
    const w = mount(ParticipantCard, { props: base() })
    expect(w.text()).toContain('Runner name')
  })

  it('emits copy-from-above', async () => {
    const w = mount(ParticipantCard, { props: { ...base(), index: 1 } })
    await w.get('[data-test=copy-above]').trigger('click')
    expect(w.emitted('copy-from-above')).toBeTruthy()
  })
})
