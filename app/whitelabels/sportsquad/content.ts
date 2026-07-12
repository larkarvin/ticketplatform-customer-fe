// app/whitelabels/sportsquad/content.ts
// Chrome (header/footer) content for the non-home sportsquad pages. The home page is a full port of
// the RaceYa/Martex template (see Home.vue) and does not use anything here.
import type { ChromeContent } from '../types'

export const chrome: ChromeContent = {
  brandName: 'SportSquad',
  contactEmail: 'hello@sportsquad.io',
  footerLinks: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
}
