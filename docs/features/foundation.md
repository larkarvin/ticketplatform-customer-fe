# Foundation

The spine every later customer-FE cycle drops onto: the shared layer link, the SSR app shell, the tenancy seam, and branding. Spec: `ticketplatform-staff-fe/docs/superpowers/specs/2026-06-21-customer-fe-foundation-design.md`; plan: `…/plans/2026-06-21-customer-fe-foundation.md`.

## What shipped

- **Layer link** — extends `ticketplatform-fe-core` (submodule `./fe-core`) for tokens, `#icons`, the DI API client (subdomain injection), color math, validation helpers. Net-new in the layer this cycle: `PublicBranding` type, `branding.service.ts` (`fetchPublicBranding`), SSR-safe `brandingToCssVars`, and `useAppLabels`.
- **SSR app** — Nuxt 4 `ssr: true`; `#core`/`#icons` aliases; public runtimeConfig (`apiUrl`, `baseDomain`, labels, …).
- **Guest API client** — `plugins/api.ts` provides `$api` with no token; `getSubdomain` reads `useTenantState`.
- **Tenancy** — `useTenant()` resolves the org from the host subdomain (dev override supported), fetches branding on the server, and applies `:root` brand vars + favicon via `useHead`.
- **Shell + states** — `layouts/default.vue` (header/content/footer), `error.vue` (404 incl. unknown org, 500), `pages/index.vue` (discovery landing placeholder).
- **Path routing** — `/e/[slug]` and `/f/[slug]` SSR stubs with per-page title/OG.

## Out of scope (later cycles)

The shared **field renderer**, **events** (discovery + detail + registration), **forms** rendering/submission, **registration**, **payment**, and **my-tickets / account linking**. Backend slug-resolution endpoints for `/e` and `/f` are also deferred to the Events/Forms cycles — the stubs render from the path param only. Design direction (Airbnb-style discovery, checkout flow) is recorded in the spec, not built here.
