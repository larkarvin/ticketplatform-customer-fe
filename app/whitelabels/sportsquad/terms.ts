// app/whitelabels/sportsquad/terms.ts
// SportSquad Terms & Conditions. Defensively drafted around the core posture: SportSquad is a
// technology PLATFORM that connects event Organizers with Attendees — it does NOT sell tickets,
// process or hold payments, or run the events themselves.
//
// ⚠️ LEGAL PLACEHOLDERS — set these before launch (and have counsel review the whole document):
//   - COMPANY_LEGAL_NAME: the registered legal entity that operates SportSquad.
//   - JURISDICTION: the governing-law country/state whose courts hear disputes.
//   - LAST_UPDATED: the effective date shown to users.
// This file is content only; it is not legal advice.
import type { LegalDocument } from '../types'

const BRAND = 'SportSquad'
const COMPANY_LEGAL_NAME = '[SportSquad legal entity — set before launch]'
const JURISDICTION = '[jurisdiction — set before launch]'
const LAST_UPDATED = '12 July 2026'
const CONTACT_EMAIL = 'hello@sportsquad.io'

export const terms: LegalDocument = {
  title: 'Terms & Conditions',
  brandName: BRAND,
  companyLegalName: COMPANY_LEGAL_NAME,
  jurisdiction: JURISDICTION,
  lastUpdated: LAST_UPDATED,
  intro: [
    `These Terms & Conditions ("Terms") govern your access to and use of the ${BRAND} website, applications, and related services (together, the "Platform"), operated by ${COMPANY_LEGAL_NAME} ("${BRAND}", "we", "us", or "our"). By accessing the Platform, browsing events, buying or registering for tickets, making a donation, or creating an organizer account, you agree to these Terms. If you do not agree, do not use the Platform.`,
    `Please read the sections on payments, disclaimers, assumption of risk, and limitation of liability carefully — they define what ${BRAND} is and is not responsible for.`,
  ],
  sections: [
    {
      heading: '1. What SportSquad is (and is not)',
      paragraphs: [
        `${BRAND} is a technology platform only. We provide software that lets independent event organizers ("Organizers") publish events, sell tickets, collect registrations, and accept payments and donations from attendees and buyers ("Attendees" or "you").`,
        `${BRAND} is not the organizer, promoter, host, owner, or operator of any event listed on the Platform, and is not the seller, merchant, or issuer of any ticket, registration, or product. Every event and every ticket is created, priced, described, delivered, and controlled solely by the Organizer.`,
        `Any contract for a ticket, registration, product, or admission is entered into directly between you and the Organizer. ${BRAND} is not a party to that contract and acts only as a venue and facilitator that connects Organizers and Attendees.`,
      ],
    },
    {
      heading: '2. Payments — we do not process or hold your money',
      paragraphs: [
        `${BRAND} does not process, collect, hold, escrow, disburse, or control payments. All payments are handled by third-party payment processors and/or paid directly to the Organizer. ${BRAND} is not the merchant of record for any transaction.`,
        `When you pay for a ticket, registration, product, or donation, you are paying the Organizer through their chosen payment provider, subject to that provider's own terms and privacy policy. Your card, banking, and payment details are collected and processed by those providers — not by ${BRAND}.`,
        `${BRAND} is not responsible for, and disclaims all liability arising from, payment processing errors, declined or duplicate charges, currency conversion, fraud, chargebacks, failed or delayed settlement, taxes, or any act or omission of a payment processor or Organizer relating to your payment. Any platform or service fee shown at checkout is charged for use of the Platform and is separate from the amounts payable to the Organizer.`,
      ],
    },
    {
      heading: '3. Refunds, cancellations, changes, and postponements',
      paragraphs: [
        `All refunds, exchanges, credits, and cancellation decisions are the sole responsibility of the Organizer and are governed by the Organizer's own policies. ${BRAND} does not issue refunds and cannot compel an Organizer to do so.`,
        `Organizers may cancel, reschedule, relocate, postpone, or change any event or ticket at their discretion. ${BRAND} is not responsible for any such change, for any event that fails to take place, or for the quality, safety, or conduct of any event.`,
        `If an event is cancelled or changed, or if you wish to request a refund, you must contact the Organizer directly. ${BRAND}'s role is limited to providing the technology; any remedy is between you and the Organizer.`,
      ],
    },
    {
      heading: '4. Tickets, registrations, and admission',
      paragraphs: [
        `A ticket or registration is a limited, revocable licence granted by the Organizer, subject to the Organizer's and the venue's rules. Admission, entry, eligibility, age limits, and any conditions of participation are determined and enforced by the Organizer and the venue — not by ${BRAND}.`,
        `${BRAND} is not responsible for lost, stolen, duplicated, invalid, or unauthorised tickets, for refused or revoked admission, or for any resale of tickets. You must not copy, resell, or transfer tickets except as the Organizer expressly permits.`,
      ],
    },
    {
      heading: '5. Assumption of risk — sporting and physical activity',
      paragraphs: [
        `Many events on ${BRAND} involve races, games, training, and other physical or sporting activity that carries inherent risks, including risk of physical injury, illness, or, in rare cases, death. ${BRAND} does not organise, supervise, inspect, or control any event, venue, equipment, course, or activity.`,
        `You are solely responsible for determining whether you are medically and physically fit to participate, for following the Organizer's and venue's safety instructions, and for any waiver, medical, insurance, or eligibility requirements the Organizer imposes. You voluntarily assume all risks associated with attending or participating in any event.`,
        `To the maximum extent permitted by law, ${BRAND} is not liable for any injury, harm, loss, or damage to any person or property arising out of or connected with any event, activity, venue, or Organizer.`,
      ],
    },
    {
      heading: '6. Organizer responsibilities',
      paragraphs: [
        `If you use the Platform as an Organizer, you are solely responsible for your events and your account, and you represent and warrant that:`,
      ],
      bullets: [
        'your event listings, pricing, and descriptions are accurate, lawful, and not misleading;',
        'you hold all licences, permits, insurance, and consents required to run your events and sell tickets;',
        'you comply with all applicable laws, including consumer-protection, tax, event-safety, health, data-protection, and payment rules;',
        'you set and honour your own refund, cancellation, and delivery policies, and resolve attendee disputes directly;',
        'you are responsible for collecting and remitting all applicable taxes and for your relationship with your payment provider;',
        'you protect and lawfully handle any personal data you collect from attendees, acting as the data controller for that data;',
        'you will not use the Platform for fraudulent, unlawful, or high-risk activities, or in any way that harms attendees or third parties.',
      ],
    },
    {
      heading: '7. Attendee responsibilities',
      paragraphs: [
        `You agree to provide accurate information, to use the Platform only for lawful purposes, and to comply with the Organizer's terms for any event you attend. Any dispute about an event, ticket, product, payment, or refund is between you and the Organizer. You are responsible for keeping your order confirmation and any access link secure.`,
      ],
    },
    {
      heading: '8. Donations',
      paragraphs: [
        `Where an event or Organizer accepts donations through the Platform, those donations are made to and received by the Organizer, not by ${BRAND}. ${BRAND} does not hold donated funds, does not guarantee how donations are used, and does not provide tax or receipting advice. Any donation receipt or tax treatment is the responsibility of the Organizer.`,
      ],
    },
    {
      heading: '9. Acceptable use',
      paragraphs: [`You agree not to, and not to permit anyone else to:`],
      bullets: [
        'use the Platform for any unlawful, fraudulent, harmful, or deceptive purpose;',
        'post content that is false, infringing, defamatory, obscene, hateful, or that violates any person’s rights;',
        'interfere with, disrupt, probe, or attempt to gain unauthorised access to the Platform, its systems, or other users’ data;',
        'scrape, harvest, or bulk-download data, or use bots or automated means except as we expressly permit;',
        'circumvent fees, security, or access controls, or resell or exploit the Platform without our written consent.',
      ],
    },
    {
      heading: '10. Content and intellectual property',
      paragraphs: [
        `The Platform, including its software, design, text, and trademarks, is owned by ${BRAND} or its licensors and is protected by law. We grant you a limited, non-exclusive, non-transferable, revocable licence to use the Platform for its intended purpose.`,
        `You retain ownership of content you submit (such as event listings or images) but grant ${BRAND} a worldwide, royalty-free licence to host, display, and use that content to operate and promote the Platform. You are responsible for your content and must have the rights to it. We may remove any content or event, and suspend any account, at our discretion, including where we believe these Terms or the law have been broken.`,
      ],
    },
    {
      heading: '11. Third-party services',
      paragraphs: [
        `The Platform relies on and links to third-party services, including payment processors, email delivery, maps, and analytics. Your use of those services is subject to their own terms, and ${BRAND} is not responsible for them or for any third-party website or content.`,
      ],
    },
    {
      heading: '12. Privacy',
      paragraphs: [
        `Our handling of personal data is described in our Privacy Policy. Where you buy a ticket or register for an event, the Organizer also receives your information and acts as an independent controller of that data under its own privacy practices, for which ${BRAND} is not responsible.`,
      ],
    },
    {
      heading: '13. Disclaimer of warranties',
      paragraphs: [
        `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. ${BRAND} does not warrant that the Platform will be uninterrupted, secure, error-free, or that any event, Organizer, listing, or information is accurate, lawful, safe, or as described. You use the Platform and attend events at your own risk.`,
      ],
    },
    {
      heading: '14. Limitation of liability',
      paragraphs: [
        `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${BRAND} AND ITS OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE PLATFORM, ANY EVENT, ANY ORGANIZER, ANY PAYMENT, OR THESE TERMS.`,
        `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${BRAND}'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) THE TOTAL PLATFORM FEES YOU PAID TO ${BRAND} IN THE THREE (3) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) USD 100. Because ${BRAND} does not sell tickets or hold payments, it is not liable for the price of any ticket, product, donation, or event. Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.`,
      ],
    },
    {
      heading: '15. Indemnification',
      paragraphs: [
        `You agree to indemnify, defend, and hold harmless ${BRAND} and its officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or connected with your use of the Platform, your events or content, your breach of these Terms, or your violation of any law or third-party right.`,
      ],
    },
    {
      heading: '16. Suspension and termination',
      paragraphs: [
        `We may suspend, restrict, or terminate your access to the Platform at any time, with or without notice, including where we believe you have breached these Terms or created risk or legal exposure for ${BRAND} or others. You may stop using the Platform at any time. Sections that by their nature should survive termination (including payments, disclaimers, liability, and indemnity) will survive.`,
      ],
    },
    {
      heading: '17. Force majeure',
      paragraphs: [
        `${BRAND} is not liable for any failure or delay caused by events beyond its reasonable control, including acts of God, natural disasters, epidemics, war, civil unrest, strikes, failures of utilities, internet or third-party services, or governmental action.`,
      ],
    },
    {
      heading: '18. Changes to the Platform and these Terms',
      paragraphs: [
        `We may modify or discontinue the Platform, and may update these Terms, at any time. Where required, we will take reasonable steps to notify you of material changes. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.`,
      ],
    },
    {
      heading: '19. Governing law and disputes',
      paragraphs: [
        `These Terms are governed by the laws of ${JURISDICTION}, without regard to conflict-of-laws rules. Before bringing any formal claim, you agree to first contact us and attempt to resolve the dispute informally. Subject to applicable law, you and ${BRAND} submit to the exclusive jurisdiction of the courts of ${JURISDICTION}, and, to the extent permitted by law, each party waives any right to participate in a class or representative action.`,
      ],
    },
    {
      heading: '20. General',
      paragraphs: [
        `If any provision of these Terms is found unenforceable, the remaining provisions stay in effect. These Terms are the entire agreement between you and ${BRAND} regarding the Platform and supersede prior agreements. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them as part of a merger, acquisition, or sale of assets.`,
      ],
    },
    {
      heading: '21. Contact us',
      paragraphs: [
        `Questions about these Terms can be sent to ${CONTACT_EMAIL}. Questions about a specific event, ticket, payment, or refund should be directed to the Organizer of that event.`,
      ],
    },
  ],
}
