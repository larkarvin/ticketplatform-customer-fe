// Fields every whitelabel's footer/chrome needs. Each site's content.ts satisfies this; the
// rest of a content.ts is free-form and bespoke to that site.
export interface FooterLink {
  label: string
  to: string
}

export interface ChromeContent {
  // The whitelabel's own brand name (e.g. "SportSquad"), shown in the header/footer when no
  // specific organization branding has resolved. Never the generic app name.
  brandName: string
  contactEmail: string
  footerLinks: FooterLink[]
}

// A numbered section of a legal document. `paragraphs` render as prose; optional `bullets` render
// as a list beneath them.
export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

// A per-whitelabel legal document (Terms, Privacy Policy) rendered by the shared LegalPage via the
// `#whitelabel` alias. `companyLegalName` and `jurisdiction` are legal placeholders each deploy
// MUST set before launch (see each site's terms.ts / privacy.ts).
export interface LegalDocument {
  title: string
  brandName: string
  companyLegalName: string
  jurisdiction: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
}
