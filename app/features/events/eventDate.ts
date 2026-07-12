// Format an event's date/time in its own timezone (SSR-safe — pure Intl, no browser globals).
export function formatEventDate(startsAt: string, endsAt: string | null, timeZone: string | null): string {
  const tz = timeZone ?? undefined
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz,
  })
  const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })

  const start = new Date(startsAt)
  const date = dateFmt.format(start)
  const time = timeFmt.format(start)

  if (!endsAt) return `${date} · ${time}`

  const end = new Date(endsAt)
  if (dateFmt.format(end) === date) return `${date} · ${time} – ${timeFmt.format(end)}`
  return `${date} ${time} – ${dateFmt.format(end)} ${timeFmt.format(end)}`
}

/** Day-number + short-month parts (in the event's timezone) — for a compact date chip. */
export function formatEventDateParts(startsAt: string, timeZone: string | null): { day: string; month: string } {
  const tz = timeZone ?? undefined
  const at = new Date(startsAt)
  return {
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: tz }).format(at),
    month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: tz }).format(at),
  }
}

/** Short "Sat · 5:00 PM" (weekday + time) in the event's timezone — for a compact listing row. */
export function formatEventWhen(startsAt: string, timeZone: string | null): string {
  const tz = timeZone ?? undefined
  const at = new Date(startsAt)
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(at)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(at)
  return `${weekday} · ${time}`
}
