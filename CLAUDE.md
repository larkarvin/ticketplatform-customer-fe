# CLAUDE.md — Customer FE (Nuxt 4 + Vue 3)

Public, guest-first frontend for **end customers** (public forms/checkout). Backend lives in `../api`
(Laravel) — read its `CLAUDE.md` and `docs/features/` for API behavior.

## Shared FE contract

**The shared FE engineering contract is [`../staff-fe/CLAUDE.md`](../staff-fe/CLAUDE.md) — follow it.**
That file is canonical for all the FE apps; everything in it applies here **except** where the deltas
below override it. In particular, follow it for:

- **Architecture** — strict layering (`pages → features → app/core → fe-core`), one-way deps, the
  feature-module contract (sealed modules, barrel-only public surface).
- **`core` is plumbing, `features` are meaning** — the three bars before anything enters `core`/`fe-core`.
- **Design tokens** — icons via `#icons` only; colors/typography/sizing via tokens in
  `fe-core/app/assets/css/main.css`; no hardcoded hex/chromatic utility/arbitrary `[Npx]`.
- **Terminology** — the tenant is the **Organization**; never `Club`/`raceya`/brand names.
- **TypeScript & quality gates** — `<script setup lang="ts">` only, no `any`, strict null/index access,
  `npm run verify` green before commit.
- **Error & feedback** — one failure → one user-visible message; the 422 → field-error mapper; toasts vs
  inline; success toasts raised by the owning composable.
- **Data fetching** — `@pinia/colada` queries/mutations owned by composables; services stay plain.
- **Naming, types, state & reactivity, testing** — as written there.

Don't restate those rules here — link, don't duplicate. If a shared rule and a delta below conflict, the
delta wins.

## Deltas for this repo (where customer-fe differs from staff-fe)

- **Rendering: SSR.** Nuxt **SSR app** (guest-first), **not** the SPA `ssr: false` model staff-fe uses.
  SSR-safety matters: no browser-only globals at module scope, hydration-safe state, branding resolved
  server-side.
- **Audience: non-technical seniors (60+) on mobile + desktop.** Public forms/checkout must be extra
  clear and forgiving — the "simplest is best" core principle applies even harder here.
- **Tenancy: path-based, public.** Organization is resolved from the **URL path**, not an `OrgSwitcher`
  + cookie + `X-Organization-Subdomain` header. No org-switching UI.
- **Guest-first / no auth gating.** The staff role-gating model (route + sidebar + action `can()` checks,
  `<feature>` middleware) does **not** apply to public guest flows. Account/auth only where a logged-in
  customer area genuinely exists.
- **Enforcement is per-repo.** staff-fe's enforcement map (eslint rules, `check:arch`, docs/feature
  inventory) lives in staff-fe. Honor the same *intent* here; this repo enforces via its own
  config/scripts (or, until they exist, treat those rules as 🔸 convention checked in review).
