import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { request, verify, items, resend } = vi.hoisted(() => ({
  request: vi.fn(),
  verify: vi.fn(),
  items: vi.fn(),
  resend: vi.fn(),
}))
vi.mock('../services/recovery.service', () => ({
  recoveryService: { request, verify, items, resend },
}))

import { ApiError, ValidationError } from '#core/errors'
import { effectScope } from 'vue'
import { useRecovery } from './useRecovery'

type Recovery = ReturnType<typeof useRecovery>

/** Run the composable inside a scope so onScopeDispose (the cooldown timer) has a home. */
function mount(): { recovery: Recovery; stop: () => void } {
  const scope = effectScope()
  const recovery = scope.run(() => useRecovery()) as Recovery
  return { recovery, stop: () => scope.stop() }
}

/** The raw transport shape the API client rethrows untouched (410/429 are not ApiError). */
function transportError(statusCode: number, data?: Record<string, unknown>): unknown {
  return Object.assign(new Error(`[GET] "/recovery/items": ${statusCode}`), { statusCode, data })
}

const ROW = {
  type: 'order' as const,
  title: 'Parish Fair',
  reference: '1042',
  status: 'pending',
  url: 'https://site/orders/abc',
  created_at: '2026-07-14T09:00:00+00:00',
}

describe('useRecovery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    request.mockReset().mockResolvedValue({ message: 'neutral' })
    verify.mockReset().mockResolvedValue({ token: 'tok-123', expires_at: '2026-07-14T10:30:00+00:00' })
    items.mockReset().mockResolvedValue([ROW])
    resend.mockReset().mockResolvedValue({ message: 'A fresh link is on its way.' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at the ask step with nothing known', () => {
    const { recovery, stop } = mount()
    expect(recovery.step.value).toBe('ask')
    expect(recovery.items.value).toEqual([])
    expect(recovery.error.value).toBe('')
    stop()
  })

  it('rejects an address with no @ without spending a throttled request', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran'
    await recovery.submitEmail()
    expect(request).not.toHaveBeenCalled()
    expect(recovery.step.value).toBe('ask')
    expect(recovery.error.value).toBe('Please enter the email address you used.')
    stop()
  })

  it('submitEmail always lands on `sent` and starts the cooldown — the API never says whether it found anything', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = ' gran@example.com '
    await recovery.submitEmail()
    expect(request).toHaveBeenCalledWith('gran@example.com')
    expect(recovery.step.value).toBe('sent')
    expect(recovery.cooldown.value).toBe(60)
    expect(recovery.canResend.value).toBe(false)
    stop()
  })

  it('counts the resend cooldown down and re-enables resending', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    await recovery.submitEmail()
    vi.advanceTimersByTime(59_000)
    expect(recovery.cooldown.value).toBe(1)
    expect(recovery.canResend.value).toBe(false)
    vi.advanceTimersByTime(1_000)
    expect(recovery.cooldown.value).toBe(0)
    expect(recovery.canResend.value).toBe(true)
    stop()
  })

  it('rejects a code that is not 6 digits without spending a throttled verify', async () => {
    const { recovery, stop } = mount()
    recovery.code.value = '12ab'
    await recovery.submitCode()
    expect(verify).not.toHaveBeenCalled()
    expect(recovery.error.value).toBe('Please enter the 6-digit code from the email.')
    stop()
  })

  it('submitCode exchanges the code for a token, lists the items and reaches `listed`', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '123456'
    await recovery.submitCode()
    expect(verify).toHaveBeenCalledWith('gran@example.com', '123456')
    expect(items).toHaveBeenCalledWith('tok-123')
    expect(recovery.step.value).toBe('listed')
    expect(recovery.items.value).toEqual([ROW])
    expect(recovery.pending.value).toBe(false)
    stop()
  })

  it('accepts an item whose created_at is null (the API contract is nullable)', async () => {
    items.mockResolvedValue([{ ...ROW, created_at: null }])
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '123456'
    await recovery.submitCode()
    expect(recovery.step.value).toBe('listed')
    expect(recovery.items.value[0]?.created_at).toBeNull()
    stop()
  })

  it("surfaces the API's own message on a wrong code — a 422 is a ValidationError, whose message is on `.message`", async () => {
    verify.mockRejectedValue(new ValidationError({}, 'That code is not right.'))
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '000000'
    await recovery.submitCode()
    expect(recovery.error.value).toBe('That code is not right.')
    expect(recovery.step.value).toBe('ask')
    stop()
  })

  it('surfaces an ApiError message (also on `.message`, not `.data`)', async () => {
    verify.mockRejectedValue(new ApiError(409, 'Something specific from the API.'))
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '123456'
    await recovery.submitCode()
    expect(recovery.error.value).toBe('Something specific from the API.')
    stop()
  })

  it('turns a 429 into plain-words copy instead of transport noise', async () => {
    request.mockRejectedValue(transportError(429))
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    await recovery.submitEmail()
    expect(recovery.error.value).toBe('Too many tries. Please wait a minute, then try again.')
    expect(recovery.step.value).toBe('ask')
    stop()
  })

  it('a correct code whose subsequent items() call fails is NOT told the code was wrong', async () => {
    items.mockRejectedValue(transportError(500))
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '123456'
    await recovery.submitCode()
    expect(verify).toHaveBeenCalled()
    expect(recovery.error.value).not.toBe('That code is not right. Please check it and try again.')
    expect(recovery.error.value).toBe(
      'Your code was right, but we could not load your orders just now. Please try again.'
    )
    stop()
  })

  it('loadItems lists what a magic-link token owns', async () => {
    const { recovery, stop } = mount()
    await recovery.loadItems('tok-123')
    expect(items).toHaveBeenCalledWith('tok-123')
    expect(recovery.step.value).toBe('listed')
    expect(recovery.items.value).toEqual([ROW])
    stop()
  })

  it('loadItems on a 410 keeps the masked address so the guest can resend without retyping', async () => {
    items.mockRejectedValue(
      transportError(410, { message: 'This link has expired.', masked_email: 'g***@example.com' })
    )
    const { recovery, stop } = mount()
    await recovery.loadItems('tok-expired')
    expect(recovery.step.value).toBe('expired')
    expect(recovery.maskedEmail.value).toBe('g***@example.com')
    expect(recovery.error.value).toBe('')
    stop()
  })

  it('loadItems on a tampered token (422, no address) sends the guest back to the start', async () => {
    items.mockRejectedValue(new ValidationError({}, 'This link is not valid.'))
    const { recovery, stop } = mount()
    await recovery.loadItems('tampered')
    expect(recovery.step.value).toBe('ask')
    expect(recovery.maskedEmail.value).toBe('')
    expect(recovery.token.value).toBe('')
    expect(recovery.error.value).toBe('This link is not valid.')
    stop()
  })

  // The failure that cost a guest her still-valid link: a dropped mobile connection is not a verdict
  // on the token, so it must never burn it or be reported as a broken link.
  describe('a transient failure keeps the link alive', () => {
    it.each([
      ['a dropped connection (no status)', new Error('Failed to fetch')],
      ['a 500', transportError(500)],
      ['a 429', transportError(429)],
    ])('loadItems on %s keeps the token and lands on `failed`, not `ask`', async (_label, thrown) => {
      items.mockRejectedValue(thrown)
      const { recovery, stop } = mount()
      await recovery.loadItems('tok-live')
      expect(recovery.step.value).toBe('failed')
      // The whole point: the token is still good for another 25 minutes — retryable, not discarded.
      expect(recovery.token.value).toBe('tok-live')
      expect(recovery.error.value).not.toContain('not valid')
      stop()
    })

    it('tells a rate-limited guest to wait, rather than that her link is broken', async () => {
      items.mockRejectedValue(transportError(429))
      const { recovery, stop } = mount()
      await recovery.loadItems('tok-live')
      expect(recovery.error.value).toBe('Too many tries. Please wait a minute, then try again.')
      stop()
    })

    it('uses plain-words copy when the transport gives us nothing to say', async () => {
      items.mockRejectedValue(new Error('Failed to fetch'))
      const { recovery, stop } = mount()
      await recovery.loadItems('tok-live')
      expect(recovery.error.value).toBe('We could not check your link just now. Please try again.')
      stop()
    })

    it('retrying with the retained token succeeds once the network is back', async () => {
      items.mockRejectedValueOnce(transportError(500))
      const { recovery, stop } = mount()
      await recovery.loadItems('tok-live')
      expect(recovery.step.value).toBe('failed')

      await recovery.loadItems(recovery.token.value)
      expect(items).toHaveBeenLastCalledWith('tok-live')
      expect(recovery.step.value).toBe('listed')
      expect(recovery.items.value).toEqual([ROW])
      stop()
    })
  })

  it('resend after an expired link uses the token — the address rides inside it', async () => {
    items.mockRejectedValue(transportError(410, { masked_email: 'g***@example.com' }))
    const { recovery, stop } = mount()
    await recovery.loadItems('tok-expired')
    await recovery.resend()
    expect(resend).toHaveBeenCalledWith('tok-expired')
    expect(request).not.toHaveBeenCalled()
    expect(recovery.cooldown.value).toBe(60)
    stop()
  })

  it('resend without a token re-runs the original email request', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    await recovery.submitEmail()
    vi.advanceTimersByTime(60_000)
    await recovery.resend()
    expect(request).toHaveBeenCalledTimes(2)
    expect(resend).not.toHaveBeenCalled()
    stop()
  })

  it('never surfaces the API resend acknowledgement — a 200 there can mean nothing was sent at all', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    await recovery.submitEmail()
    vi.advanceTimersByTime(60_000)
    await recovery.resend()
    expect(recovery.error.value).toBe('')
    // No state anywhere claims delivery: `sent` is the same neutral step we were already on.
    expect(recovery.step.value).toBe('sent')
    stop()
  })

  it('ignores a resend while the cooldown is running', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    await recovery.submitEmail()
    await recovery.resend()
    expect(request).toHaveBeenCalledTimes(1)
    stop()
  })

  it('restart always gives the guest a clean way back — needed because a resend can silently send nothing', async () => {
    const { recovery, stop } = mount()
    recovery.email.value = 'gran@example.com'
    recovery.code.value = '123456'
    await recovery.submitCode()
    expect(recovery.step.value).toBe('listed')

    recovery.restart()
    expect(recovery.step.value).toBe('ask')
    expect(recovery.code.value).toBe('')
    expect(recovery.items.value).toEqual([])
    expect(recovery.cooldown.value).toBe(0)
    expect(recovery.canResend.value).toBe(true)
    // The address is kept on purpose — the guest should not have to retype it to start over.
    expect(recovery.email.value).toBe('gran@example.com')
    stop()
  })
})
