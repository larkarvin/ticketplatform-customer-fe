import { fileURLToPath } from 'node:url'

const isDev = process.env.NODE_ENV !== 'production'

// Customer-facing public app. Server-rendered (SSR) for SEO, social share cards, and fast first
// paint. Extends the shared fe-core layer (git submodule) for design tokens, the #icons alias, the
// DI API client (with org-subdomain injection), branding, and shared kernel code.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: isDev },

  ssr: true,

  extends: ['./fe-core'],

  modules: ['@nuxt/eslint', '@nuxt/image', '@pinia/nuxt'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  // Kernel modules live in the fe-core submodule. `#core` and `#icons` (defined here, against this
  // app's root) make them importable as `#core/api`, `#core/services/branding.service`, etc. — a
  // layer's own `~`/`@`/`#` aliases resolve against the consumer, so the consumer must declare them.
  alias: {
    '#core': fileURLToPath(new URL('./fe-core/app/core', import.meta.url)),
    '#icons': fileURLToPath(
      new URL(`./fe-core/app/icons/${process.env.NUXT_PUBLIC_ICON_SET || 'lucide'}/index.ts`, import.meta.url)
    ),
  },

  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Platform',
      orgLabel: process.env.NUXT_PUBLIC_ORG_LABEL || 'Organization',
      orgLabelPlural: process.env.NUXT_PUBLIC_ORG_LABEL_PLURAL || 'Organizations',
      memberLabel: process.env.NUXT_PUBLIC_MEMBER_LABEL || 'Member',
      memberLabelPlural: process.env.NUXT_PUBLIC_MEMBER_LABEL_PLURAL || 'Members',
      // Backend base URL incl. version prefix, e.g. http://localhost:8000/v1
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '',
      // Root domain used to parse the org subdomain from the request host.
      baseDomain: process.env.NUXT_PUBLIC_BASE_DOMAIN || 'localhost',
      // Dev/preview override: pretend we are on this org's subdomain when the host has none.
      devOrgSubdomain: process.env.NUXT_PUBLIC_DEV_ORG_SUBDOMAIN || '',
    },
  },

  vite: { server: { allowedHosts: true } },
})
