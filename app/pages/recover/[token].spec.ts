// customer-fe/app/pages/recover/[token].spec.ts
//
// The magic-link landing page has exactly three outcomes, and each one has a way it can quietly go
// wrong: the list can drift from the code path's list, the expired screen can promise an email the
// API may never send, and the invalid screen can say something about an address it must know nothing
// about. Assert the rendered output for all three — plus that nothing is decided during SSR, which is
// what keeps the plain-ref state machine from hydrating into a mismatch.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RecoveryItem, RecoveryStep } from '~/features/recovery'

const useSeoMeta = vi.fn()
vi.stubGlobal('useSeoMeta', useSeoMeta)
vi.stubGlobal('useRoute', () => ({ params: { token: 'magic-token-123' } }))

const step = ref<RecoveryStep>('listed')
const token = ref('magic-token-123')
const items = ref<RecoveryItem[]>([])
const maskedEmail = ref('')
const error = ref('')
const cooldown = ref(0)
const canResend = ref(true)
const pending = ref(false)
const resend = vi.fn()

// Resolves on a microtask, like the real network call — so `checking` is still true on first render.
const loadItems = vi.fn(async () => {})

// Stub the state machine (covered by useRecovery.spec.ts); keep RecoveryList real so this spec proves
// the page really renders the shared list rather than a forked copy of its markup.
vi.mock('~/features/recovery', async () => {
  const actual = await vi.importActual<typeof import('~/features/recovery')>('~/features/recovery')
  return {
    ...actual,
    useRecovery: () => ({
      step,
      token,
      items,
      maskedEmail,
      error,
      pending,
      cooldown,
      canResend,
      loadItems,
      resend,
    }),
  }
})

import TokenPage from './[token].vue'

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}

function order(overrides: Partial<RecoveryItem> = {}): RecoveryItem {
  return {
    type: 'order',
    title: 'Spring Gala',
    reference: '1042',
    status: 'paid',
    url: 'https://example.test/orders/abc',
    created_at: null,
    ...overrides,
  }
}

function mountPage() {
  return mount(TokenPage, { global: { stubs } })
}

async function mountLoaded() {
  const w = mountPage()
  await flushPromises()
  return w
}

describe('recover/[token].vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    step.value = 'listed'
    token.value = 'magic-token-123'
    items.value = []
    maskedEmail.value = ''
    error.value = ''
    cooldown.value = 0
    canResend.value = true
    pending.value = false
  })

  it('decides nothing before the client has asked — the first render is the same on the server and in the browser', () => {
    step.value = 'listed'
    items.value = [order()]
    const w = mountPage()
    // onMounted has fired but its await has not resolved: still the neutral "checking" screen.
    expect(w.text()).toContain('Opening your link')
    expect(w.text()).not.toContain('Spring Gala')
  })

  it('loads with the token from the URL', async () => {
    await mountLoaded()
    expect(loadItems).toHaveBeenCalledWith('magic-token-123')
  })

  describe('listed', () => {
    it('renders the recovered rows through the shared list', async () => {
      items.value = [
        order(),
        order({ type: 'submission', reference: '', status: 'submitted', url: 'https://x/y/edit' }),
      ]
      const w = await mountLoaded()
      expect(w.text()).toContain('What we have for that address')
      expect(w.findAll('li')).toHaveLength(2)
      expect(w.findAll('li a').map((a) => a.attributes('href'))).toEqual([
        'https://example.test/orders/abc',
        'https://x/y/edit',
      ])
    })

    it('states plainly that nothing was found when the address owns nothing', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain("We couldn't find anything for that address")
      expect(w.findAll('li')).toHaveLength(0)
    })
  })

  describe('expired (410)', () => {
    beforeEach(() => {
      step.value = 'expired'
      maskedEmail.value = 'g***@example.com'
    })

    it('names the masked address the API gave back on the 410', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain('That link has expired')
      expect(w.text()).toContain('g***@example.com')
    })

    it('offers a resend without retyping the address, and never promises it arrives', async () => {
      const w = await mountLoaded()
      const button = w.find('button')
      expect(button.text()).toContain('Send another email')
      await button.trigger('click')
      expect(resend).toHaveBeenCalled()
      expect(w.text().toLowerCase()).not.toContain('on its way')
      expect(w.text().toLowerCase()).not.toContain("we've sent")
    })

    it('falls back to a version of the sentence with no address when the 410 body omits masked_email, instead of a dangling "to ."', async () => {
      maskedEmail.value = ''
      const w = await mountLoaded()
      expect(w.text()).not.toContain('to .')
      expect(w.text()).toContain('Our links work for 30 minutes')
    })

    it('does not suggest checking junk/spam before the guest has pressed resend', async () => {
      const w = await mountLoaded()
      expect(w.text()).not.toContain('Nothing yet?')
    })

    it('shows the junk/spam hint only after resend has actually been pressed', async () => {
      const w = await mountLoaded()
      expect(w.text()).not.toContain('Nothing yet?')
      await w.find('button').trigger('click')
      expect(w.text()).toContain('Nothing yet?')
    })

    it('keeps a genuinely fresh request on screen — resend can silently send nothing after three wrong codes', async () => {
      const w = await mountLoaded()
      const startOver = w.findAll('a').find((a) => a.attributes('href') === '/recover')
      expect(startOver?.text()).toContain('Start over with a different email address')
    })
  })

  // A dropped mobile connection is not a broken link. Telling her it is would make her throw away a
  // token that still has 25 minutes on it — and, on a 429, walk straight back into the throttle.
  describe('transient failure (offline / 5xx / 429)', () => {
    beforeEach(() => {
      step.value = 'failed'
    })

    it('never calls the link broken, and offers another attempt with the retained (not the route) token', async () => {
      token.value = 'retained-live-token'
      const w = await mountLoaded()
      expect(w.text()).toContain('We could not check your link just now')
      expect(w.text()).not.toContain('That link did not work')

      loadItems.mockClear()
      const retry = w.findAll('button').find((b) => b.text().includes('Try again'))
      expect(retry).toBeTruthy()
      await retry?.trigger('click')
      // Fix 3: retries with the token the composable retained from the failed check, not a second
      // copy of the route param — proving the exported `token` is actually used, not dead surface.
      expect(loadItems).toHaveBeenCalledWith('retained-live-token')
    })

    it('shows the wait message on a 429 instead of discarding it', async () => {
      error.value = 'Too many tries. Please wait a minute, then try again.'
      const w = await mountLoaded()
      expect(w.find('[role="alert"]').text()).toContain('Too many tries')
    })

    // Fix 1: on offline/5xx the composable now leaves error.value empty (the body copy already says
    // this in calm words), so the red alert line must not render — the explanation appears once.
    it('renders the explanation once on offline/5xx — no duplicated red alert', async () => {
      error.value = ''
      const w = await mountLoaded()
      expect(w.text()).toContain('We could not check your link just now')
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })

    // Fix 2: a 429 must not leave "Try again" immediately tappable — that walks her straight back
    // into the throttle. The page reuses the composable's existing cooldown/canResend, no 2nd timer.
    describe('429 disables Try again for the cooldown, using the existing cooldown state', () => {
      it('disables Try again while the cooldown is running, visibly (not colour alone)', async () => {
        error.value = 'Too many tries. Please wait a minute, then try again.'
        cooldown.value = 60
        canResend.value = false
        const w = await mountLoaded()
        const retry = w.findAll('button').find((b) => b.text().toLowerCase().includes('try again'))
        expect(retry?.attributes('disabled')).toBeDefined()
        expect(retry?.text()).toContain('60')
        expect(retry?.classes()).toContain('min-h-tap')
      })

      it('re-enables Try again once the cooldown elapses', async () => {
        error.value = 'Too many tries. Please wait a minute, then try again.'
        cooldown.value = 0
        canResend.value = true
        const w = await mountLoaded()
        const retry = w.findAll('button').find((b) => b.text().includes('Try again'))
        expect(retry?.attributes('disabled')).toBeUndefined()
      })
    })

    it('still keeps a fresh start one tap away, in case the network is truly gone', async () => {
      const w = await mountLoaded()
      const startOver = w.findAll('a').find((a) => a.attributes('href') === '/recover')
      expect(startOver?.text()).toContain('Start over with a different email address')
    })

    it('keeps Start over reachable even while the 429 cooldown disables Try again', async () => {
      error.value = 'Too many tries. Please wait a minute, then try again.'
      cooldown.value = 60
      canResend.value = false
      const w = await mountLoaded()
      const startOver = w.findAll('a').find((a) => a.attributes('href') === '/recover')
      expect(startOver?.text()).toContain('Start over with a different email address')
    })

    it('says nothing about whether the address exists, and shows no list', async () => {
      items.value = [order()]
      const w = await mountLoaded()
      const text = w.text().toLowerCase()
      expect(text).not.toContain('@')
      expect(text).not.toContain('what we have for that address')
      expect(w.findAll('li')).toHaveLength(0)
    })
  })

  describe('invalid / tampered', () => {
    beforeEach(() => {
      // A token we cannot trust drops the state machine back to `ask` with no address at all.
      step.value = 'ask'
      error.value = 'That link is not valid. Please enter your email address to start again.'
    })

    it('explains the dead link and points at a fresh start', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain('That link did not work')
      expect(w.find('a').attributes('href')).toBe('/recover')
    })

    it('leaks nothing about whether the address exists, and shows no list', async () => {
      items.value = [order()]
      const w = await mountLoaded()
      const text = w.text().toLowerCase()
      expect(text).not.toContain('@')
      expect(text).not.toContain('we found')
      expect(text).not.toContain('what we have for that address')
      expect(w.findAll('li')).toHaveLength(0)
    })
  })
})
