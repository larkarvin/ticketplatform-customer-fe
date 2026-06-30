import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicTicket } from '../../types'
import ParticipantGroup from './ParticipantGroup.vue'

const ticket = (over: Partial<PublicTicket> = {}): PublicTicket =>
  ({
    id: 9,
    name: 'Group',
    admits_per_ticket: 3,
    ask_group_name: true,
    group_name_label: 'Team name',
    collect_details_later: false,
    participant_type: 'single',
    min_participants: 1,
    max_participants: 1,
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
  defaultOpen: true,
})

describe('ParticipantGroup', () => {
  it('renders a member card per participant and an optional group-name input', () => {
    const w = mount(ParticipantGroup, { props: base() })
    expect(w.text()).toContain('Team name')
    expect(w.findAllComponents({ name: 'ParticipantCard' })).toHaveLength(3)
  })

  it('header toggle button flips aria-expanded and shows/hides body', async () => {
    const w = mount(ParticipantGroup, { props: { ...base(), defaultOpen: true } })
    const toggle = w.get('[data-test=toggle]')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    // v-show=true: no display:none inline style
    expect(w.get('[data-test=body]').attributes('style') ?? '').not.toContain('display: none')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    // v-show=false: display:none set as inline style
    expect(w.get('[data-test=body]').attributes('style') ?? '').toContain('display: none')
  })

  it('badge reads as plain-language readiness and turns success when everyone is valid', () => {
    const w1 = mount(ParticipantGroup, {
      props: {
        ...base(),
        instance: { uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }] },
        defaultOpen: true,
      },
    })
    const badge1 = w1.get('[data-test=badge]')
    expect(badge1.text()).toBe('Needs details')
    expect(badge1.classes()).not.toContain('bg-success-100')

    const w2 = mount(ParticipantGroup, {
      props: {
        ...base(),
        instance: { uid: '9-1', ticket_id: 9, participants: [{ field_data: { name: 'Alice' } }] },
        defaultOpen: true,
      },
    })
    const badge2 = w2.get('[data-test=badge]')
    expect(badge2.text()).toBe('Ready')
    expect(badge2.classes()).toContain('bg-success-100')
    expect(badge2.classes()).toContain('text-success-700')
  })

  it('multi-person badge counts how many are ready', () => {
    const t = ticket({ participant_type: 'group', min_participants: 1, max_participants: 3 })
    const inst = { uid: '9-1', ticket_id: 9, participants: [{ field_data: { name: 'Alice' } }, { field_data: {} }] }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    expect(w.get('[data-test=badge]').text()).toBe('1 of 2 ready')
  })

  it('shows Add Participant button for group ticket under max; emits add-participant with uid', async () => {
    const t = ticket({ participant_type: 'group', min_participants: 1, max_participants: 3 })
    const inst = { uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }] }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    const btn = w.get('[data-test=add-participant]')
    await btn.trigger('click')
    expect(w.emitted('add-participant')?.[0]).toEqual(['9-1'])
  })

  it('hides Add Participant for single ticket', () => {
    const w = mount(ParticipantGroup, { props: base() })
    expect(w.find('[data-test=add-participant]').exists()).toBe(false)
  })

  it('hides Add Participant for group ticket at max', () => {
    const t = ticket({ participant_type: 'group', min_participants: 1, max_participants: 2 })
    const inst = { uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }, { field_data: {} }] }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    expect(w.find('[data-test=add-participant]').exists()).toBe(false)
  })

  it('card remove emits remove-participant with uid and index', async () => {
    const t = ticket({ participant_type: 'group', min_participants: 1, max_participants: 3 })
    const inst = { uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }, { field_data: {} }] }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    const removeButtons = w.findAll('[data-test=remove]')
    expect(removeButtons.length).toBeGreaterThan(0)
    await removeButtons[0]!.trigger('click')
    expect(w.emitted('remove-participant')?.[0]).toEqual(['9-1', 0])
  })

  it('copy copies every field, including email', async () => {
    const t = ticket({
      participant_type: 'group',
      min_participants: 1,
      max_participants: 3,
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
        {
          id: 2,
          field_key: 'email',
          type: 'email',
          label: 'Email',
          required: false,
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
          sort_order: 1,
        },
      ],
    })
    const participants = [{ field_data: { name: 'Alice', email: 'alice@example.com' } }, { field_data: {} }]
    const inst = { uid: '9-1', ticket_id: 9, participants }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    const copyButtons = w.findAll('[data-test=copy-above]')
    expect(copyButtons.length).toBeGreaterThan(0)
    await copyButtons[0]!.trigger('click')
    expect(participants[1]!.field_data['name']).toBe('Alice')
    expect(participants[1]!.field_data['email']).toBe('alice@example.com')
  })

  it('copy includes a non-email-keyed field whose type is email', async () => {
    const t = ticket({
      participant_type: 'group',
      min_participants: 1,
      max_participants: 3,
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
        {
          id: 2,
          field_key: 'contact_email',
          type: 'email',
          label: 'Contact email',
          required: false,
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
          sort_order: 1,
        },
      ],
    })
    const participants = [{ field_data: { name: 'Bob', contact_email: 'bob@example.com' } }, { field_data: {} }]
    const inst = { uid: '9-1', ticket_id: 9, participants }
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, instance: inst, defaultOpen: true } })
    const copyButtons = w.findAll('[data-test=copy-above]')
    expect(copyButtons.length).toBeGreaterThan(0)
    await copyButtons[0]!.trigger('click')
    expect(participants[1]!.field_data['name']).toBe('Bob')
    expect(participants[1]!.field_data['contact_email']).toBe('bob@example.com')
  })

  it('collect_details_later renders collapsed summary with no participant cards', () => {
    const t = ticket({ collect_details_later: true })
    const w = mount(ParticipantGroup, { props: { ...base(), ticket: t, defaultOpen: true } })
    expect(w.findAllComponents({ name: 'ParticipantCard' })).toHaveLength(0)
    expect(w.text()).toContain('after payment')
  })

  it('trash button emits remove with the instance uid', async () => {
    const w = mount(ParticipantGroup, { props: base() })
    await w.get('[data-test=remove-group]').trigger('click')
    expect(w.emitted('remove')?.[0]).toEqual(['9-1'])
  })
})
