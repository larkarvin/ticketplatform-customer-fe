// app/whitelabels/sportsquad/content.ts
import type { ChromeContent } from '../types'

export const chrome: ChromeContent = {
  contactEmail: 'hello@sportsquad.io',
  footerLinks: [{ label: 'Terms', to: '/terms' }],
}

export const home = {
  eventsHeading: 'Upcoming events',
  eventsSubheading: 'Grab your spot before it sells out.',
  pitch: {
    title: 'Run your events on SportSquad',
    body: 'From race day to league night — set up ticketing in minutes and get paid fast.',
  },
  steps: [
    { title: 'Create your event', body: 'Add details and ticket types in minutes.' },
    { title: 'Share the link', body: 'One link your squad can open on any device.' },
    { title: 'Get paid', body: 'Secure payments in, tickets out by email instantly.' },
  ],
  values: [
    { stat: 'Minutes', label: 'to set up and sell' },
    { stat: 'Secure', label: 'payments via Stripe & Xendit' },
    { stat: 'Scannable', label: 'tickets for fast entry' },
  ],
  ctaTitle: 'Ready for game day?',
  ctaButton: 'List your events',
}
