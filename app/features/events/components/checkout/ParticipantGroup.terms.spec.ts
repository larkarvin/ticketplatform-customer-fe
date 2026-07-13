// Proves the per-deploy person term flips the same code between whitelabels, driven only by the
// NUXT_PUBLIC_TERMS env dictionary — the core promise of the copy-config mechanism.
import { configureI18n, parseTerms, type Term } from '#core/i18n'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { en } from '~/core/i18n/en'
import { defaultTerms } from '~/core/i18n/terms'
import type { PublicTicket } from '../../types'
import ParticipantGroup from './ParticipantGroup.vue'

function deploy(termsJson?: string): void {
  const terms: Record<string, Term> = { ...defaultTerms, ...parseTerms(termsJson) }
  configureI18n({ messages: en, terms })
}

const groupTicket = (over: Partial<PublicTicket> = {}): PublicTicket =>
  ({
    id: 9,
    name: 'Group',
    admits_per_ticket: 5,
    ask_group_name: false,
    group_name_label: 'Team name',
    collect_details_later: false,
    participant_type: 'group',
    min_participants: 1,
    max_participants: 5,
    participant_fields: [],
    ...over,
  }) as unknown as PublicTicket

const instance = () => ({ uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }, { field_data: {} }] })

const props = (ticket: PublicTicket) => ({
  ticket,
  instance: instance(),
  instanceNumber: 1,
  identityKey: null,
  errors: {},
  defaultOpen: true,
})

afterEach(() => deploy()) // restore base default (Attendee) for other specs

describe('ParticipantGroup — per-deploy person term', () => {
  it('renders "Attendee" on the catholicchurch deploy (base default, no env)', () => {
    deploy()
    const w = mount(ParticipantGroup, { props: props(groupTicket()) })
    expect(w.find('[data-test="add-participant"]').text()).toBe('Add Attendee')
  })

  it('renders "Participant" on the sportsquad deploy (env override)', () => {
    deploy('{"person":["Participant","Participants"]}')
    const w = mount(ParticipantGroup, { props: props(groupTicket()) })
    expect(w.find('[data-test="add-participant"]').text()).toBe('Add Participant')
  })

  it('uses the plural term in the collect-later summary', () => {
    deploy('{"person":["Participant","Participants"]}')
    const w = mount(ParticipantGroup, { props: props(groupTicket({ collect_details_later: true })) })
    expect(w.find('[data-test="body"]').text()).toContain("2 Participants — you'll add names after payment")
  })

  it('lets a per-deploy copy override change wording without touching code', () => {
    const terms: Record<string, Term> = { ...defaultTerms, ...parseTerms('{"person":["Runner","Runners"]}') }
    configureI18n({ messages: en, terms, overrides: { checkout: { person: { add: 'Register a {person}' } } } })
    const w = mount(ParticipantGroup, { props: props(groupTicket()) })
    expect(w.find('[data-test="add-participant"]').text()).toBe('Register a Runner')
  })
})
