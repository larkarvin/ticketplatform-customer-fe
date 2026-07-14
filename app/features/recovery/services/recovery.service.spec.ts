import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get, post }) }))

import { recoveryService } from './recovery.service'

describe('recoveryService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('request posts the address (the org rides in the client header, never the body)', async () => {
    post.mockResolvedValue({ message: 'If we have that email on file, your orders are on their way to it.' })
    await recoveryService.request('gran@example.com')
    expect(post).toHaveBeenCalledWith('/recovery/request', { email: 'gran@example.com' })
  })

  it('verify posts the address + code and returns the listing token', async () => {
    post.mockResolvedValue({ token: 'tok-123', expires_at: '2026-07-14T10:30:00+00:00' })
    const r = await recoveryService.verify('gran@example.com', '123456')
    expect(post).toHaveBeenCalledWith('/recovery/verify', { email: 'gran@example.com', code: '123456' })
    expect(r.token).toBe('tok-123')
  })

  it('items sends the token as a query param and unwraps the resource collection', async () => {
    const row = {
      type: 'order',
      title: 'Parish Fair',
      reference: '1042',
      status: 'pending',
      url: 'https://site/orders/abc',
      created_at: '2026-07-14T09:00:00+00:00',
    }
    get.mockResolvedValue({ data: [row] })
    const r = await recoveryService.items('tok-123')
    expect(get).toHaveBeenCalledWith('/recovery/items', { query: { token: 'tok-123' } })
    expect(r).toEqual([row])
  })

  it('resend posts the token', async () => {
    post.mockResolvedValue({ message: 'A fresh link is on its way.' })
    await recoveryService.resend('tok-123')
    expect(post).toHaveBeenCalledWith('/recovery/resend', { token: 'tok-123' })
  })
})
