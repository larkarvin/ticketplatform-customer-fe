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

  // ── Status pill (live completion) ──────────────────────────────────────────

  it('status pill counts unmet fields, then turns Complete when valid', async () => {
    const w = mount(ParticipantCard, { props: base() })
    expect(w.get('[data-test=card-status]').text()).toContain('1 to add')
    expect(w.get('[data-test=card-status]').classes()).not.toContain('bg-success-100')

    await w.setProps({ participant: { field_data: { name: 'Juan' } } })
    expect(w.get('[data-test=card-status]').text()).toContain('Complete')
    expect(w.get('[data-test=card-status]').classes()).toContain('bg-success-100')
  })

  // ── Progressive disclosure ─────────────────────────────────────────────────

  it('first card (index 0) starts open; later cards start collapsed and toggle open', async () => {
    const open = mount(ParticipantCard, { props: { ...base(), index: 0 } })
    expect(open.get('[data-test=card-body]').attributes('style') ?? '').not.toContain('display: none')

    const collapsed = mount(ParticipantCard, { props: { ...base(), index: 1 } })
    expect(collapsed.get('[data-test=card-body]').attributes('style') ?? '').toContain('display: none')
    await collapsed.get('[data-test=card-toggle]').trigger('click')
    expect(collapsed.get('[data-test=card-body]').attributes('style') ?? '').not.toContain('display: none')
  })

  // ── On-leave inline validation ─────────────────────────────────────────────

  it('does not show a live error until focus leaves the card', async () => {
    const w = mount(ParticipantCard, { props: base() })
    expect(w.text()).not.toContain('is required')
    await w.get('[data-test=card-body]').trigger('focusout')
    expect(w.text()).toContain('Runner name is required')
  })

  it('always shows a submit error passed via the errors prop, even before any blur', () => {
    const w = mount(ParticipantCard, {
      props: { ...base(), errors: { '9-1.0.name': 'Runner name is required' } },
    })
    expect(w.text()).toContain('Runner name is required')
  })
})
