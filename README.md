# ticketplatform-customer-fe

The **public, customer-facing** frontend for the platform — where guests discover events, fill forms, and (later) register and pay. **Nuxt 4, SSR on** (`ssr: true`) for SEO, social share cards, and fast first paint. **Guest-first:** no auth wall, no role-gating.

## Shared layer (fe-core)

Shared kernel code lives in the **`ticketplatform-fe-core`** Nuxt layer, vendored as a git **submodule** at `./fe-core` and consumed via `extends: ['./fe-core']`. It provides the design tokens, the `#icons` alias, the DI API client (with org-subdomain injection), branding (color math + public service), validation helpers, and `useAppLabels`. Imports use the `#core` / `#icons` aliases (declared in `nuxt.config.ts`).

Nuxt does **not** auto-install a path layer's dependencies, so this app lists the shared runtime deps in its own `package.json`.

## Running locally

```bash
git submodule update --init --recursive   # first clone only
cp .env.example .env                       # then set NUXT_PUBLIC_API_URL etc.
npm install
npm run dev                                # http://localhost:3000
```

Quality gates: `npm run typecheck` · `npm run lint` · `npm run format:dirty`.

## Tenancy seam

The current org is resolved from the **request host subdomain** (`acme.example.com` → `acme`), parsed against `NUXT_PUBLIC_BASE_DOMAIN`. On plain `localhost` (no subdomain), set `NUXT_PUBLIC_DEV_ORG_SUBDOMAIN` to test an org. `useTenant()` sets the SSR tenant state, fetches that org's public branding, and injects the brand CSS vars + favicon via `useHead`. The API client reads the tenant state through its `getSubdomain` option and sends `X-Organization-Subdomain` on org-scoped calls.

Routing is **path-based** for now: `/e/{slug}` (events), `/f/{slug}` (forms). Per-org subdomains/custom domains are a later concern; the seam (`getSubdomain`) is the single place that would change.
