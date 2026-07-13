import { configureI18n, parseMessages, parseTerms, type Term } from '#core/i18n'
import { en as appMessages } from '~/core/i18n/en'
import { defaultTerms } from '~/core/i18n/terms'

// Boot i18n before any component renders: catalog = fe-core base ← app catalog ← per-deploy
// override; terms = app defaults ← deploy env. SSR-safe — every value is a per-deploy constant
// read from runtimeConfig, so the fe-core registry singleton is correct across requests.
export default defineNuxtPlugin(() => {
  const { public: pub } = useRuntimeConfig()
  const terms: Record<string, Term> = { ...defaultTerms, ...parseTerms(pub.terms) }
  configureI18n({
    messages: appMessages,
    overrides: parseMessages(pub.copyOverrides),
    terms,
  })
})
