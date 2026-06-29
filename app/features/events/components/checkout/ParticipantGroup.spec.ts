import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicTicket } from '../../types'
import ParticipantGroup from './ParticipantGroup.vue'

const ticket = (over = {}): PublicTicket =>
  ({
    id: 9,
    name: 'Group',
    admits_per_ticket: 3,
    ask_group_name: true,
    group_name_label: 'Team name',
    collect_details_later: false,
    participant_fields: [
      {
        id: 1,
        field_key: 'name',
        type: 'text',
        label: 'Name',
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
      },
    ],
    ...over,
  }) as unknown as PublicTicket
const instance = () => ({
  uid: '9-1',
  ticket_id: 9,
  participants: [{ field_data: {} }, { field_data: {} }, { field_data: {} }],
})
const base = () => ({
  ticket: ticket(),
  instance: instance(),
  instanceNumber: 1,
  identityKey: 'name',
  errors: {},
})

describe('ParticipantGroup', () => {
  it('renders a member card per admit and an optional team-name input', () => {
    const w = mount(ParticipantGroup, { props: base() })
    expect(w.text()).toContain('Team name')
    expect(w.findAllComponents({ name: 'ParticipantCard' })).toHaveLength(3)
  })

  it('collect_details_later renders collapsed with no member cards', () => {
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: ticket({ collect_details_later: true }) } })
    expect(w.findAllComponents({ name: 'ParticipantCard' })).toHaveLength(0)
    expect(w.text()).toContain('after payment')
  })

  it('trash emits remove with the instance uid', async () => {
    const w = mount(ParticipantGroup, { props: base() })
    await w.get('[data-test=remove-group]').trigger('click')
    expect(w.emitted('remove')?.[0]).toEqual(['9-1'])
  })
})
