// app/whitelabels/catholic/privacy.ts
// CatholicTickets Privacy Policy. Same platform-only posture as the Terms: CatholicTickets operates
// the technology; Organizers (parishes, groups, individuals) independently control the attendee data
// they collect, and payment data is handled by third-party processors — not by CatholicTickets.
//
// ⚠️ LEGAL PLACEHOLDERS — set these before launch (and have counsel review the whole document):
//   - COMPANY_LEGAL_NAME, JURISDICTION, LAST_UPDATED (see terms.ts).
// This file is content only; it is not legal advice.
import type { LegalDocument } from '../types'

const BRAND = 'CatholicTickets'
const COMPANY_LEGAL_NAME = '[CatholicTickets legal entity — set before launch]'
const JURISDICTION = '[jurisdiction — set before launch]'
const LAST_UPDATED = '12 July 2026'
const CONTACT_EMAIL = 'hello@catholictickets.com'

export const privacy: LegalDocument = {
  title: 'Privacy Policy',
  brandName: BRAND,
  companyLegalName: COMPANY_LEGAL_NAME,
  jurisdiction: JURISDICTION,
  lastUpdated: LAST_UPDATED,
  intro: [
    `This Privacy Policy explains how ${COMPANY_LEGAL_NAME} ("${BRAND}", "we", "us", or "our") handles personal data when you use the ${BRAND} website, applications, and related services (the "Platform"). It should be read together with our Terms & Conditions.`,
    `${BRAND} is a technology platform and is not a church, parish, or diocese. When you reserve a ticket, register for an event, or make a donation, the event organizer ("Organizer") — such as a parish, ministry, group, or individual — also receives your information and decides how to use it as an independent controller. This Policy covers our own processing; for what an Organizer does with your data, please contact the Organizer.`,
  ],
  sections: [
    {
      heading: '1. Who is responsible for your data',
      paragraphs: [
        `${BRAND} is the controller of personal data processed to operate the Platform (for example, organizer accounts and Platform usage). For attendee and donor data submitted through an event, the Organizer is an independent controller and is responsible for its own use of that data under its own privacy practices.`,
      ],
    },
    {
      heading: '2. Information we collect',
      paragraphs: [`We collect:`],
      bullets: [
        'Account information — for Organizers, such as name, email, and login credentials;',
        'Registration and donation information you provide — such as name, email, and any details an event asks for (which may include date of birth or other fields the Organizer defines);',
        'Order and communication records — confirmations, receipts, and messages relating to your bookings or donations;',
        'Technical and usage data — such as IP address, device and browser type, and pages viewed, collected to run and secure the Platform;',
        'Content you submit — such as event listings and images (for Organizers).',
      ],
    },
    {
      heading: '3. Payment and donation data',
      paragraphs: [
        `${BRAND} does not collect or store your full card or bank details. Payments and donations are processed by third-party payment providers and paid to the Organizer; those providers collect and handle your payment information under their own privacy policies. We may receive limited confirmation data (such as whether a payment succeeded and a reference), but not your full payment credentials.`,
      ],
    },
    {
      heading: '4. How we use your data',
      paragraphs: [`We use personal data to:`],
      bullets: [
        'provide, operate, and improve the Platform and process registrations, orders, and donations;',
        'send transactional messages such as confirmations, receipts, and important notices;',
        'provide support and respond to your enquiries;',
        'maintain security, prevent fraud and abuse, and enforce our Terms;',
        'comply with legal obligations and protect our legal rights.',
      ],
    },
    {
      heading: '5. Legal bases',
      paragraphs: [
        `Where applicable law requires a legal basis, we rely on: performance of a contract (to provide the Platform and process your bookings); our legitimate interests (to secure, operate, and improve the Platform); your consent (where we ask for it, which you may withdraw); and compliance with legal obligations.`,
      ],
    },
    {
      heading: '6. How we share data',
      paragraphs: [`We share personal data only as needed:`],
      bullets: [
        'with the Organizer of an event you register for or donate to, who receives your data as an independent controller;',
        'with service providers who process data on our behalf (such as hosting, email delivery, and payment providers), under appropriate safeguards;',
        'where required by law, regulation, legal process, or to protect rights, safety, and the integrity of the Platform;',
        'in connection with a merger, acquisition, financing, or sale of assets, subject to this Policy.',
      ],
    },
    {
      heading: '7. We do not sell your data',
      paragraphs: [`${BRAND} does not sell your personal data and does not share it for third-party advertising.`],
    },
    {
      heading: '8. Cookies and local storage',
      paragraphs: [
        `The Platform uses only strictly necessary and functional storage. We use your browser's local storage to remember things like a partly-completed checkout or form so you don't lose your progress, and to keep essential settings. These are required for the Platform to work and are not used to track you across other websites.`,
        `We do not currently use advertising or third-party tracking cookies. If we introduce analytics or other non-essential cookies in the future, we will update this Policy and, where required, ask for your consent first.`,
      ],
    },
    {
      heading: '9. Data retention',
      paragraphs: [
        `We keep personal data for as long as needed to provide the Platform, to comply with legal, tax, and accounting obligations, to resolve disputes, and to enforce our agreements. Organizers determine how long they keep the attendee and donor data they control.`,
      ],
    },
    {
      heading: '10. Security',
      paragraphs: [
        `We use reasonable technical and organisational measures to protect personal data. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.`,
      ],
    },
    {
      heading: '11. International transfers',
      paragraphs: [
        `Your data may be processed in countries other than your own, including where our service providers operate. Where required, we take steps to ensure appropriate safeguards are in place for such transfers.`,
      ],
    },
    {
      heading: '12. Your rights',
      paragraphs: [
        `Subject to applicable law, you may have rights to access, correct, update, delete, restrict, or object to the processing of your personal data, to data portability, and to withdraw consent. You may also have the right to complain to a data-protection authority.`,
        `To exercise rights over data held by ${BRAND}, contact us at ${CONTACT_EMAIL}. For data held by an Organizer (such as your event registration or donation details), please contact that Organizer directly, as they control that data.`,
      ],
    },
    {
      heading: '13. Children',
      paragraphs: [
        `The Platform is not directed to children, and we do not knowingly collect personal data from children without appropriate consent. Where an event involves minors, the Organizer is responsible for obtaining any required parental or guardian consent for the data it collects.`,
      ],
    },
    {
      heading: '14. Third-party services and links',
      paragraphs: [
        `The Platform relies on and may link to third-party services (such as payment providers and maps). Their handling of your data is governed by their own privacy policies, and ${BRAND} is not responsible for them.`,
      ],
    },
    {
      heading: '15. Changes to this Policy',
      paragraphs: [
        `We may update this Policy from time to time. Where changes are material, we will take reasonable steps to notify you. The "Last updated" date above shows when this Policy last changed.`,
      ],
    },
    {
      heading: '16. Contact us',
      paragraphs: [`For questions about this Policy or your personal data, contact us at ${CONTACT_EMAIL}.`],
    },
  ],
}
