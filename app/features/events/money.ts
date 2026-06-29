// Money formatting for the checkout — one place so the order summary and the pay bar agree.
// Renders "<CURRENCY> <amount>" with thousands separators and exactly two decimals (e.g. "PHP 1,350.00").
export function formatMoney(amount: number, currency: string): string {
  const n = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency} ${n}`
}
