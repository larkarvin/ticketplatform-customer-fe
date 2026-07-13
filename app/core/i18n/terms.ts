import type { Term } from '#core/i18n'

// App base defaults for deploy-configurable nouns. The deploy env (NUXT_PUBLIC_TERMS) overrides
// these per whitelabel — e.g. sportsquad sets person → Participant/Participants; catholicchurch
// inherits the Attendee default. "Participant" (pre-purchase) and "Attendee" (post-purchase) are
// the same person and share this ONE key.
export const defaultTerms: Record<string, Term> = {
  person: { one: 'Attendee', many: 'Attendees' },
}
