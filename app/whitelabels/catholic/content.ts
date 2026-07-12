import type { ChromeContent } from '../types'

export const chrome: ChromeContent = {
  brandName: 'CatholicTickets',
  contactEmail: 'hello@catholictickets.com',
  footerLinks: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
}

// Copy for the CatholicTickets marketing home. Data only — components own their icons/markup.
export const home = {
  hero: {
    eyebrow: 'Welcome to your parish, online',
    heading: 'Gather your community with grace.',
    lead: 'Sell tickets, collect donations, and open registrations — in one calm, simple place your whole parish can use.',
    browse: 'Browse upcoming events',
    setUp: 'Set up your parish',
  },
  events: {
    heading: 'Upcoming at the parish',
    empty: 'No upcoming gatherings yet — check back soon.',
  },
  pillars: {
    eyebrow: 'Everything your parish needs',
    heading: 'Run it all from one place',
    subheading: 'No technical skills required — built for parish volunteers and staff.',
    items: [
      { icon: 'donations', title: 'Donations', body: 'Collect offerings and building-fund gifts in a few taps.' },
      { icon: 'tickets', title: 'Events & Tickets', body: 'Create an event and sell tickets in minutes.' },
      { icon: 'forms', title: 'Registration Forms', body: 'Sign-ups for retreats, classes, and ministries.' },
      { icon: 'manage', title: 'Easy to manage', body: 'One calm dashboard for everything you run.' },
    ],
  },
  steps: {
    eyebrow: 'Simple from the start',
    heading: 'How it works',
    items: [
      { numeral: 'I', title: 'Create your event', body: 'Add the details and set ticket types in minutes.' },
      { numeral: 'II', title: 'Share one link', body: 'Your people book on any phone or computer.' },
      { numeral: 'III', title: 'Welcome everyone', body: 'Payments land securely; tickets arrive by email.' },
    ],
  },
  spotlights: {
    items: [
      {
        visual: 'forms',
        eyebrow: 'Registration forms',
        title: 'Sign-ups without the paperwork',
        body: 'Open registrations for retreats, classes, and ministries — with just the questions you need.',
        points: ['Custom questions per event', 'See who has signed up', 'Gentle reminders by email'],
      },
      {
        visual: 'checkin',
        eyebrow: 'Event day',
        title: 'A calm welcome at the door',
        body: 'Check people in from a phone — no lines, no clipboards, no fuss.',
        points: ['Scan tickets in a moment', 'See who has arrived', 'Works on any phone'],
      },
    ],
  },
  useCases: {
    eyebrow: 'Made for parish life',
    heading: 'One place for every gathering',
    subheading: 'However your parish comes together, CatholicTickets is ready.',
    items: [
      { title: 'Fundraiser dinners', body: 'Sell seats and whole tables.' },
      { title: 'Retreats & missions', body: 'Open registrations with ease.' },
      { title: 'Parish festivals', body: 'Tickets, meal passes, and more.' },
      { title: 'Sacrament classes', body: 'Enroll families in a few taps.' },
      { title: 'Concerts & recitals', body: 'Reserved or general seating.' },
      { title: 'Second collections', body: 'Give to any cause or appeal.' },
      { title: 'Youth group trips', body: 'Forms and payment in one.' },
      { title: 'Raffles & appeals', body: 'Sell entries online.' },
    ],
  },
  faqs: {
    eyebrow: 'Questions & answers',
    heading: 'Everything you might wonder',
    items: [
      {
        q: 'How do payments work?',
        a: 'Your people pay by card and the money goes to your parish account. Every gift and ticket is recorded for you.',
      },
      {
        q: 'Do we need any technical skills?',
        a: 'None. If you can write an email, you can set up an event — most parishes are ready in a few minutes.',
      },
      {
        q: 'Can we collect donations and registrations too?',
        a: 'Yes — donations, ticketed events, and registration forms all live in one place, under one calm dashboard.',
      },
      {
        q: 'How does check-in work on the day?',
        a: 'Open the event on any phone and scan tickets at the door. You will see who has arrived in real time.',
      },
      {
        q: 'Is our parishioners’ data private?',
        a: 'Always. Their details stay with your parish and are never sold or shared.',
      },
    ],
  },
  invite: {
    heading: 'Ready to gather your parish?',
    body: 'Set up your parish today — it only takes a few minutes.',
    button: 'Set up your parish',
  },
}
