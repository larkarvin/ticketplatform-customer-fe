// Fields every whitelabel's footer/chrome needs. Each site's content.ts satisfies this; the
// rest of a content.ts is free-form and bespoke to that site.
export interface FooterLink {
  label: string
  to: string
}

export interface ChromeContent {
  contactEmail: string
  footerLinks: FooterLink[]
}
