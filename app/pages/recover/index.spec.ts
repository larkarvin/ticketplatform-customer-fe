// customer-fe/app/pages/recover/index.spec.ts
//
// This page's whole job is to stay honest about an enumeration-neutral API: it may never imply an
// address was (or wasn't) found, never promise an email was delivered, and must always leave a
// start-over path on screen (the only way out after three wrong codes). Nothing else asserted this —
// a refactor could reintroduce "We found your orders!" and every other spec would still pass.
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RecoveryItem, RecoveryStep } from '~/features/recovery'

const useSeoMeta = vi.fn()
vi.stubGlobal('useSeoMeta', useSeoMeta)

const step = ref<RecoveryStep>('sent')
const email = ref('gran@example.com')
const code = ref('')
const items = ref<RecoveryItem[]>([])
const error = ref('')
const pending = ref(false)
const cooldown = ref(60)
const canResend = ref(false)
const submitEmail = vi.fn()
const submitCode = vi.fn()
const resend = vi.fn()
const restart = vi.fn()

// Stub the composable — this spec is about what the page renders for a given state, not the state
// machine itself (that's useRecovery.spec.ts). Keep RecoveryList real; it isn't reachable at `sent`.
vi.mock('~/features/recovery', async () => {
  const actual = await vi.importActual<typeof import('~/features/recovery')>('~/features/recovery')
  return {
    ...actual,
    useRecovery: () => ({
      step,
      email,
      code,
      items,
      error,
      pending,
      cooldown,
      canResend,
      submitEmail,
      submitCode,
      resend,
      restart,
    }),
  }
})

import RecoverPage from './index.vue'

function mountAtSent() {
  step.value = 'sent'
  email.value = 'gran@example.com'
  code.value = ''
  error.value = ''
  pending.value = false
  cooldown.value = 60
  canResend.value = false
  return mount(RecoverPage, { global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } } })
}

describe('recover/index.vue — sent step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('never implies the address was found or not found', () => {
    const text = mountAtSent().text().toLowerCase()
    expect(text).not.toContain('we found')
    expect(text).not.toContain('not registered')
    expect(text).not.toContain("isn't registered")
    expect(text).not.toContain('no account')
  })

  it('never promises the email was delivered', () => {
    const text = mountAtSent().text().toLowerCase()
    expect(text).not.toContain('on its way')
  })

  it('always keeps a start-over control on screen — the only real way out of three wrong codes', () => {
    const w = mountAtSent()
    expect(w.text()).toContain('Start over with a different email address')
  })

  it('renders the neutral conditional copy instead of a confirmation', () => {
    const w = mountAtSent()
    expect(w.text()).toContain('If we have anything for')
  })
})
