// Global vitest setup: configure i18n once so component specs resolve real copy (the app's
// English catalog + default terms) instead of raw keys. Mirrors what app/plugins/i18n.ts does
// at runtime, minus the per-deploy env override.
import { configureI18n } from '#core/i18n'
import { en } from '~/core/i18n/en'
import { defaultTerms } from '~/core/i18n/terms'

configureI18n({ messages: en, terms: defaultTerms })
