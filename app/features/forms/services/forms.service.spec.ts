import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get, post }) }))

import { formsService } from './forms.service'

describe('formsService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('getPublicForm unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: { id: 1, slug: 'x', title: 'X' } })
    const form = await formsService.getPublicForm('x')
    expect(get).toHaveBeenCalledWith('/forms/public/x')
    expect(form).toEqual({ id: 1, slug: 'x', title: 'X' })
  })

  it('submitForm posts answers to the submit endpoint', async () => {
    post.mockResolvedValue({ message: 'ok', submission_id: 7, requires_payment: false })
    const res = await formsService.submitForm('x', { '1': 'Jo', guest_email: 'a@b.co' })
    expect(post).toHaveBeenCalledWith('/forms/public/x/submit', { '1': 'Jo', guest_email: 'a@b.co' })
    expect(res.submission_id).toBe(7)
  })

  it('calculatePayment posts answers under a data envelope and unwraps the breakdown', async () => {
    post.mockResolvedValue({ data: { currency: 'USD', items: [], fees: [], subtotal: 0, fees_total: 0, total: 500 } })
    const res = await formsService.calculatePayment('x', { '1': 'Jo', '2': [{ variant_id: 5, quantity: 1 }] })
    expect(post).toHaveBeenCalledWith('/forms/public/x/calculate', {
      data: { '1': 'Jo', '2': [{ variant_id: 5, quantity: 1 }] },
    })
    expect(res.total).toBe(500)
  })

  it('uploadFieldMedia posts multipart FormData to the field upload endpoint', async () => {
    post.mockResolvedValue({ id: 3, uuid: 'abc', original_filename: 'f.png', url: '/u' })
    const file = new File(['x'], 'f.png', { type: 'image/png' })
    const media = await formsService.uploadFieldMedia('x', 9, file)
    const [url, body] = post.mock.calls[0] ?? []
    expect(url).toBe('/forms/public/x/fields/9/upload')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(media.uuid).toBe('abc')
  })
})
