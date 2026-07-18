// Map public events to FullCalendar's event shape (pure — testable without FullCalendar).
import type { PublicEventListItem } from './types'

export interface CalendarEvent {
  title: string
  start: string
  end?: string
  url: string
}

// FullCalendar defaults to the viewer's local timezone when placing events on the grid, but the
// rest of the site (see eventDate.ts) always renders event-local dates. Convert each timestamp to
// an event-local wall-clock string (no offset) so the day it lands on matches what's printed
// elsewhere. When an event has no timezone, pass the ISO string through unchanged — using the
// runtime's timezone for a "no timezone" event would make behavior depend on the machine running
// the code, which is not deterministic in tests or across servers.
function toEventLocal(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}`
}

function toCalendarTimestamp(iso: string, timeZone: string | null): string {
  return timeZone ? toEventLocal(iso, timeZone) : iso
}

export function toCalendarEvents(events: PublicEventListItem[]): CalendarEvent[] {
  return events.map((e) => ({
    title: e.title,
    start: toCalendarTimestamp(e.starts_at, e.timezone),
    end: e.ends_at ? toCalendarTimestamp(e.ends_at, e.timezone) : undefined,
    url: `/e/${e.slug}`,
  }))
}
