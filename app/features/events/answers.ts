// app/features/events/answers.ts
// Shared semantics for "did the buyer actually answer this checkout field". An answer counts as present
// only when it's a positive selection: a non-empty array, a true boolean, a non-zero number, or a
// non-blank string. Falsy-but-typed values (false, 0, '') and null/undefined/[] are absent — an order
// whose only "extras" are these has nothing to price. Used by both the empty-order zero-total guard
// (useCheckoutTotals) and the "is the order checkout-able" gate (checkout page hasExtras) so the two
// can never disagree about whether an order is empty.
export function hasAnswer(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0 && !Number.isNaN(v)
  if (typeof v === 'string') return v.trim() !== ''
  return v !== null && v !== undefined
}
