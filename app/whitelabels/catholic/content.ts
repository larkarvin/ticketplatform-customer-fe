import type { ChromeContent } from '../types'

export const chrome: ChromeContent = {
  brandName: 'CatholicTickets',
  contactEmail: 'hello@catholictickets.com',
  footerLinks: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
}

export const home = {
  eventsHeading: 'Upcoming events',
  eventsSubheading: 'Find a celebration near you and reserve your place.',
  pitch: {
    title: 'Run your parish events with ease',
    body: 'Sell tickets, collect registrations, and welcome your community — all in one calm, simple place.',
  },
  steps: [
    { title: 'Create your event', body: 'Add the details and set your ticket types in minutes.' },
    { title: 'Share the link', body: 'Send one link — your people book on any phone or computer.' },
    { title: 'Get paid', body: 'Payments land securely; everyone gets their ticket by email.' },
  ],
  ctaTitle: 'Ready to host your next event?',
  ctaButton: 'List your events',
}
