// Map public events to FullCalendar's event shape (pure — testable without FullCalendar).
import type { PublicEventListItem } from './types'

export interface CalendarEvent {
  title: string
  start: string
  end?: string
  url: string
}

export function toCalendarEvents(events: PublicEventListItem[]): CalendarEvent[] {
  return events.map((e) => ({
    title: e.title,
    start: e.starts_at,
    end: e.ends_at ?? undefined,
    url: `/e/${e.slug}`,
  }))
}
