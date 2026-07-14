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
const token = ref('')
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
const loadItems = vi.fn()
const restart = vi.fn()

// Stub the composable — this spec is about what the page renders for a given state, not the state
// machine itself (that's useRecovery.spec.ts). Keep RecoveryList real; it isn't reachable at `sent`.
vi.mock('~/features/recovery', async () => {
  const actual = await vi.importActual<typeof import('~/features/recovery')>('~/features/recovery')
  return {
    ...actual,
    useRecovery: () => ({
      step,
      token,
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
      loadItems,
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

// The lockout this feature exists to close: a good, single-use code is consumed by verify(), then the
// listing drops transiently. The page must NOT leave the guest on the code field to re-submit the spent
// code (which would be told it is "wrong"); it must render the shared `failed` screen whose Try again
// re-lists with the retained token, with Start over still reachable.
describe('recover/index.vue — failed step (transient listing failure after a good code)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountAtFailed() {
    step.value = 'failed'
    token.value = 'retained-live-token'
    email.value = 'gran@example.com'
    code.value = '123456'
    error.value = ''
    pending.value = false
    cooldown.value = 0
    canResend.value = true
    return mount(RecoverPage, { global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } } })
  }

  it('renders the shared "could not check just now" screen, never a wrong-code message or the code field', () => {
    const w = mountAtFailed()
    expect(w.text()).toContain('We could not check your link just now')
    expect(w.text()).not.toContain('That code is not right')
    // The code input belongs to the `sent` step and must be gone here.
    expect(w.find('#recovery-code').exists()).toBe(false)
  })

  it('Try again re-lists with the retained token — it never re-submits the consumed code', async () => {
    const w = mountAtFailed()
    const retry = w.findAll('button').find((b) => b.text().includes('Try again'))
    expect(retry).toBeTruthy()
    await retry?.trigger('click')
    expect(loadItems).toHaveBeenCalledWith('retained-live-token')
    expect(submitCode).not.toHaveBeenCalled()
  })

  it('keeps Start over reachable, resetting the state machine in place', async () => {
    const w = mountAtFailed()
    const startOver = w.findAll('button').find((b) => b.text().includes('Start over'))
    expect(startOver).toBeTruthy()
    await startOver?.trigger('click')
    expect(restart).toHaveBeenCalled()
  })
})
