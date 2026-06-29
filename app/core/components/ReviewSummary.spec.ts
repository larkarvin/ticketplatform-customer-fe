import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ReviewGroup } from '~/core/types/review'
import ReviewSummary from './ReviewSummary.vue'

const groups: ReviewGroup[] = [
  { editTarget: 0, title: "Who's coming", items: [{ key: 'a.0', label: 'GA · #1', value: 'Juan dela Cruz' }] },
]

describe('ReviewSummary', () => {
  it('renders group title + item label/value', () => {
    const w = mount(ReviewSummary, { props: { groups } })
    expect(w.text()).toContain("Who's coming")
    expect(w.text()).toContain('GA · #1')
    expect(w.text()).toContain('Juan dela Cruz')
  })

  it('emits edit with the group editTarget', async () => {
    const w = mount(ReviewSummary, { props: { groups } })
    await w.get('button').trigger('click')
    expect(w.emitted('edit')?.[0]).toEqual([0])
  })
})
