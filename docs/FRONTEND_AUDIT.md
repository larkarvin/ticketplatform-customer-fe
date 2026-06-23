# Frontend Audit — ticketplatform-customer-fe

**Audit date:** 2026-06-24  
**Auditor:** Frontend-developer agent  
**Codebase snapshot:** branch `main` @ `30385c3`  
**Scope:** All source files under `app/` and `fe-core/` (`.nuxt`, `node_modules`, `.output` excluded)

---

## 1. Executive Summary

The codebase is in good health for its stage. It is a Nuxt 4 / Vue 3 SSR app layered on a shared `fe-core` submodule. The feature surface is narrow (one production feature: public form fill/submit), but the architecture is clearly designed to carry a lot more without accumulating debt. The shared field engine, whitelabel theming system, and icon-adapter pattern are all production-quality foundations.

**Headline findings:**

1. **Dual icon libraries — resolved correctly.** Both `@tabler/icons-vue` and `lucide-vue-next` are present, but this is intentional whitelabelling. An adapter pattern in `fe-core/app/icons/` exposes a single `#icons` alias; the underlying library is switched per-tenant at deploy time via `NUXT_PUBLIC_ICON_SET`. No consumer imports either library directly. This is a feature, not a bug.

2. **`@pinia/colada`, `pinia`, and `@pinia/nuxt` — zero usage in this app.** All three are installed but not called anywhere in `app/` or `fe-core/`. The app fetches data with `useAsyncData` (Nuxt built-in) and stores nothing in global state. These are dead weight on the bundle.

3. **`@nuxt/image` — installed but never used.** All image rendering uses native `<img>` tags. The `<NuxtImg>` and `<NuxtPicture>` components are never called. Product images and org logos load without optimisation (no `srcset`, no lazy loading delegation, no CDN transforms).

4. **`vee-validate` and `yup` — partially used, structurally mismatched.** Three `fe-core` UI components (`FormInput`, `FormPasswordInput`, `FormCheckbox`) wrap VeeValidate's `<Field>`. But the actual form-fill feature — the only customer-facing form — does not use VeeValidate at all; it uses a bespoke, well-designed `validateField/validateAll` engine in `fe-core/app/core/field-engine/validation.ts`. The two validation approaches coexist without conflict, but the VeeValidate-backed components are not consumed by any page in this app. Yup is used only in `fe-core/app/core/utils/validation.ts` (password/email/name helpers for a staff auth flow that does not exist in this repo).

5. **`vue-sonner` — used but the `<Toaster>` mount point is missing.** `toast()` is called in two places (`client.ts` line 106, `usePublicForm.ts` line 180), but no `.vue` file mounts `<Toaster>`. Toasts will silently fail at runtime.

6. **No VueUse anywhere** — confirmed absent. Several manual implementations (focus trap in `useModalA11y.ts`, scroll-to-top in `usePublicForm.ts`) could be simplified with VueUse, but the current handwritten versions are correct and small enough not to be a problem.

**Summary counts:**

| Verdict | Count |
|---------|-------|
| KEEP | 8 |
| IMPROVE | 3 |
| PARK | 3 |
| REMOVE | 2 |

---

## 2. Per-Dependency Table

### Runtime Dependencies

| Dependency | Why added | Actually used? (evidence) | Removal difficulty | Replacement | Needed 24 mo? | Recommendation |
|---|---|---|---|---|---|---|
| `nuxt` | App framework | Yes — entire app | N/A (framework) | None | Yes | **KEEP** |
| `vue` | UI framework | Yes — all components | N/A (framework) | None | Yes | **KEEP** |
| `@tabler/icons-vue` | Whitelabel icon set B | Yes — via adapter only; re-exported in `fe-core/app/icons/tabler/index.ts` (line 6–76) | Low — swap env var | `lucide-vue-next` (set A) | Yes — for tenants preferring Tabler | **KEEP** |
| `lucide-vue-next` | Whitelabel icon set A (default) | Yes — via adapter only; re-exported in `fe-core/app/icons/lucide/index.ts` (line 4–75) | Low | `@tabler/icons-vue` (set B) | Yes — default icon set | **KEEP** |
| `dompurify` | Sanitise API-supplied HTML | Yes — `fe-core/app/core/field-engine/components/display/ParagraphBlock.vue:3`, `fe-core/app/core/components/ui/ConfirmModal.vue:43` | Medium — would need a replacement sanitiser | Native `Sanitizer` API (experimental, not yet safe) | Yes — untrusted HTML from API | **KEEP** |
| `vue-sonner` | Toast notifications | Partially — `toast()` is called in 2 files; `<Toaster>` is **never mounted** in any `.vue` file | Low to fix | None needed | Yes | **IMPROVE** — mount `<Toaster>` in `app.vue` or the default layout |
| `vee-validate` | Schema-driven form validation | Barely — `<Field>` used in 3 `fe-core` UI components (`FormInput.vue:59`, `FormPasswordInput.vue:139`, `FormCheckbox.vue:48`) that are **not consumed by any page in this app** | Low in this app (not used on pages); higher in fe-core | Native Vue reactivity + the existing field-engine validation | No for this app's current form surface | **PARK** — keep in `fe-core` for staff-app auth forms; do not adopt for customer form fields |
| `yup` | Validation schema DSL | Barely — only `fe-core/app/core/utils/validation.ts:4` (password/email helpers). No schema is built for any customer-facing page | Low — the helpers used are only 5 validators | Native regex + custom functions (already done in `field-engine/validation.ts`) | No for this app | **PARK** — keep in `fe-core` for staff auth schemas; do not extend for customer forms |
| `pinia` | Global state management | Zero — no `defineStore` call exists anywhere in `app/` or `fe-core/` | None (not used) | Nuxt `useState` / composables | Uncertain | **REMOVE** from this app's `package.json` |
| `@pinia/nuxt` | Nuxt plugin wrapper for Pinia | Zero — no Pinia store registered or used | None (not used) | Remove | Uncertain | **REMOVE** from this app's `package.json` |
| `@pinia/colada` | Pinia-based data-fetching (query/mutation cache) | Zero — no `useQuery`, `useMutation`, or `PiniaColada` call exists anywhere | None (not used) | `useAsyncData` (already in use) | Uncertain | **PARK** — evaluate when events/account features land; do not add until then |
| `@nuxt/image` | CDN-aware `<NuxtImg>` / `<NuxtPicture>` | Zero — no `<NuxtImg>` or `<NuxtPicture>` in any template; all images use native `<img>` (`ProductField.vue:83`, `ProductField.vue:116`, `default.vue:15`) | None (not used) | Native `<img>` (already in use) | Yes — product/event images will benefit | **IMPROVE** — not "remove", but activate it: replace raw `<img>` tags with `<NuxtImg>` |

### Dev Dependencies

| Dependency | Actually used? | Recommendation |
|---|---|---|
| `@nuxt/eslint` | Yes — `eslint.config.mjs:3` extends the generated Nuxt config | **KEEP** |
| `@tailwindcss/forms` | Yes — `fe-core/app/assets/css/main.css:6` (`@plugin '@tailwindcss/forms'`) | **KEEP** |
| `@tailwindcss/postcss` | Yes — PostCSS pipeline entry point for Tailwind v4 | **KEEP** |
| `@tailwindcss/typography` | Yes — `fe-core/app/assets/css/main.css:7` (`@plugin '@tailwindcss/typography'`) | **KEEP** |
| `@types/dompurify` | Yes — typed usage at `ParagraphBlock.vue:3`, `ConfirmModal.vue:43` | **KEEP** |
| `@types/node` | Yes — standard Nuxt requirement | **KEEP** |
| `@vue/test-utils` | Available but none of the 3 spec files use `mount`/`shallowMount` — all tests are unit tests mocking at the service layer. `vitest.config.ts` does not import it | **PARK** — will be needed for component tests |
| `eslint` | Yes — `eslint.config.mjs` | **KEEP** |
| `eslint-config-prettier` | Yes — via `eslint-plugin-prettier/recommended` | **KEEP** |
| `eslint-plugin-prettier` | Yes — `eslint.config.mjs:2` | **KEEP** |
| `happy-dom` | Yes — `vitest.config.ts:6` (`environment: 'happy-dom'`) | **KEEP** |
| `postcss` | Yes — required by `@tailwindcss/postcss` pipeline | **KEEP** |
| `prettier` | Yes — enforced via ESLint plugin | **KEEP** |
| `prettier-plugin-organize-imports` | Yes — `.prettierrc:13` | **KEEP** |
| `tailwindcss` | Yes — entire design system is Tailwind v4 CSS-first | **KEEP** |
| `typescript` | Yes — strict mode; all source files are `.ts`/`.vue` with `<script setup lang="ts">` | **KEEP** |
| `vitest` | Yes — `vitest.config.ts`, 3 spec files | **KEEP** |
| `vue-tsc` | Yes — `typecheck` script in `package.json:13` | **KEEP** |

---

## 3. Architecture & DX Notes

### 3.1 Folder Structure

```
ticketplatform-customer-fe/
├── app/                          # Customer app source (Nuxt 4 app dir)
│   ├── app.vue                   # Shell: title template, useTenant
│   ├── composables/
│   │   ├── useTenant.ts          # Subdomain resolve + branding fetch
│   │   └── useTenantState.ts     # Shared ref for subdomain string
│   ├── error.vue                 # 404/500 full-screen page
│   ├── features/
│   │   └── forms/                # Only shipping feature
│   │       ├── components/
│   │       │   ├── FormRenderer.vue        # Wizard chrome
│   │       │   └── controls/
│   │       │       ├── ProductField.vue    # Domain field type
│   │       │       └── QuantityStepper.vue # Mobile-first quantity control
│   │       ├── composables/
│   │       │   └── usePublicForm.ts        # All form state + submit orchestration
│   │       ├── services/
│   │       │   └── forms.service.ts        # HTTP calls only
│   │       ├── types.ts                    # DTOs (Form, SubmitResult, …)
│   │       └── validation.spec.ts / usePublicForm.spec.ts / forms.service.spec.ts
│   ├── layouts/default.vue       # Consumer shell (header/main/footer)
│   ├── pages/
│   │   ├── index.vue             # Discovery landing (stub)
│   │   ├── e/[slug].vue          # Event detail (stub)
│   │   └── f/[slug].vue          # Form fill — only live page
│   └── plugins/
│       ├── api.ts                # Provides $api (guest, no token)
│       └── field-types.ts        # Registers 'product' field type
│
└── fe-core/                      # Shared submodule (also used by staff app)
    └── app/
        ├── assets/css/main.css   # Tailwind v4 CSS-first config + all design tokens
        ├── core/
        │   ├── api/              # DI HTTP client (createApiClient)
        │   ├── components/ui/    # Shared UI components (Button, Modal, inputs…)
        │   ├── composables/      # useInputClasses, useModalA11y, useAppLabels, useConfirm
        │   ├── field-engine/     # The shared field renderer (types, registry, validation, controls)
        │   ├── services/         # branding.service.ts
        │   ├── types/            # branding.ts
        │   └── utils/            # colorUtils.ts, validation.ts
        └── icons/
            ├── lucide/index.ts   # Adapter: lucide → canonical names
            └── tabler/index.ts   # Adapter: tabler → canonical names
```

The separation of `fe-core` from `app/` is well-executed. Core knows nothing about the customer domain; the customer app imports from `#core` and `#icons` aliases only.

### 3.2 The Shared Field Engine

Located at `fe-core/app/core/field-engine/`. This is the most architecturally interesting part of the codebase.

**How it works:**

- `types.ts` — neutral `Field`, `FieldGroup`, `FieldOption` interfaces (no domain coupling).
- `registry.ts` — a `Map<string, FieldTypeExtension>` allowing apps to register custom field types (component + optional defaultValue + optional validate). Domain types stay out of core.
- `validation.ts` — pure functions `validateField(field, value)` and `validateAll(fields, answers)`. No external library dependency. Handles required, email format, number bounds/decimals, duration regex, select key membership. Extension types delegate to their own `validate` fn or a generic required check.
- `FieldControl.vue` — dispatcher. Routes `field.type` to the right control component (built-in map, display map, or registered extension).
- `FieldCell.vue` — one grid cell: label + required marker + description + the control + inline error. Implements the 12-col `col_span` mapping.
- **Controls** (10 built-in): `TextField`, `EmailField`, `TextareaField`, `PhoneField`, `NumberField`, `SelectField`, `DateField`, `TimeField`, `DurationField`, `FileField`.
- **Display blocks** (5): `ParagraphBlock` (DOMPurify-sanitised), `HeadingBlock`, `Divider`, `Spacer`, `DecorativeImage`.

The `product` field type is registered in `app/plugins/field-types.ts` (line 9), which correctly separates domain vocabulary from the neutral core.

**What vee-validate does NOT do here:** The entire field-engine validation stack is custom (`validateField`/`validateAll` in `validation.ts`). VeeValidate is used only in `fe-core`'s generic UI input components (`FormInput`, `FormPasswordInput`, `FormCheckbox`), which are staff-app auth form helpers that happen to live in the shared layer. They are not used by any field-engine control or customer-facing page.

**Multi-step wizard:** `usePublicForm.ts` implements it natively (lines 99–141): `currentStep`, `totalSteps`, `isMultiStep`, `nextStep/prevStep/goToStep`, per-step validation before advance, scroll-to-top. `FormRenderer.vue` renders the progress dots and Back/Next buttons. The form is schema-driven: the API returns `field_groups` which become steps; a form with one group or no groups stays single-page.

### 3.3 Whitelabel / Theming

The theming system is sophisticated and SSR-safe:

1. **Design tokens** live in `fe-core/app/assets/css/main.css` as a Tailwind v4 `@theme` block (lines 21–246). Color families (`brand`, `success`, `warning`, `danger`, `info`, `secondary`, `tertiary`) use CSS custom properties so per-org branding overrides them without touching compiled CSS.
2. **Runtime branding** is fetched per-tenant in `useTenant.ts` via `fetchPublicBranding`. On the server, `brandingToCssVars()` generates a `:root{…}` string injected via `useHead` so the **first paint is already branded** — no FOUC.
3. **Color scale generation** — `colorUtils.ts` converts an org's hex `primary_color` to a 12-step HSL scale (lines 88–115), writing all `--color-brand-{step}` vars. This eliminates the need to ship per-org stylesheets.
4. **Font** — `NUXT_PUBLIC_ICON_SET` switches icon packs; font is per-org from branding API, selected from an allowlisted map in `colorUtils.ts` (lines 130–165). The default is Outfit (loaded via `@import` in `main.css:1`). Web fonts outside the allowlist silently fall back to Outfit (defence-in-depth against raw org-supplied font names being injected into CSS values).
5. **Dark mode** — class-based (`.dark` on `<html>`), driven by the org's `default_theme` setting or OS preference. `applyTheme()` in `colorUtils.ts` handles this.

The `--tap-min: 2.75rem` CSS variable and the `min-h-tap` / `min-w-tap` Tailwind utilities (`main.css:260–265`) explicitly enforce 44px minimum touch targets — an accessibility-conscious decision appropriate for the 60+ mobile audience.

### 3.4 Testing Setup

- **Framework:** Vitest 4 with happy-dom environment (`vitest.config.ts:6`)
- **Aliases:** `#core` → `fe-core/app/core`, `~` / `@` → `app/` (`vitest.config.ts:11–14`)
- **Nuxt auto-import stubs:** tests manually stub `useAsyncData`, `useHead`, `createError` (`usePublicForm.spec.ts:13–29`) — correct approach for running outside a Nuxt runtime
- **Three spec files:**
  - `validation.spec.ts` — pure unit tests for `validateField`/`validateAll` (13 cases, full type matrix)
  - `forms.service.spec.ts` — service layer tests mocking `useApiClient` (3 cases)
  - `usePublicForm.spec.ts` — composable tests mocking `formsService` (3 cases: grouping, seeding, validation guard)
- **No component tests** — `@vue/test-utils` is installed but unused; `FormRenderer.vue` and all field controls have no mount-level tests
- **Coverage:** Quantitative coverage is not configured (no `coverage` section in `vitest.config.ts`)

### 3.5 Lint / Format Tooling

- **ESLint:** `@nuxt/eslint` recommended + `eslint-plugin-prettier/recommended` + `@typescript-eslint/no-explicit-any: error` (`eslint.config.mjs:11`) — no implicit `any` enforced at lint level in addition to the TypeScript compiler
- **Prettier:** `.prettierrc` — no semicolons, single quotes, 120-char print width, `prettier-plugin-organize-imports` auto-sorts imports
- **Scripts:** `lint`, `lint:fix`, `format:dirty` (formats only git-dirty files — efficient in CI), `typecheck`
- **No pre-commit hooks** visible in the repo (no `.husky/` or `lint-staged` config) — a gap

### 3.6 Type Safety

- TypeScript is strict (delegated to Nuxt's generated tsconfigs which enable `strict: true`)
- `no-explicit-any` enforced at ESLint level
- All `.vue` files use `<script setup lang="ts">` with typed `defineProps` and `defineEmits`
- `fe-core/app/core/field-engine/types.ts` uses `settings: Record<string, unknown>` (line 27) — intentionally permissive since settings are field-type-specific and validated downstream
- The `BrandingConfig` type in `colorUtils.ts` (line 296) is derived from the `defaultBranding` constant via `typeof` — pragmatic but means the type is tied to the default values object rather than a declared interface

---

## 4. Maintainability & Scalability Risks

### 4.1 Missing Toaster Mount — Bug in Production

**Severity: High**

`toast.error(...)` is called in `fe-core/app/core/api/client.ts` (line 106, 108, 110) and `app/features/forms/composables/usePublicForm.ts` (line 180), but `<Toaster>` from `vue-sonner` is not mounted anywhere in the template tree. Toasts will silently do nothing. Network errors, 403s, and submit failures will give users no feedback — a serious UX failure for the 60+ audience who may already be uncertain about whether their actions worked.

**Fix:** Add `<Toaster />` to `app/app.vue` or `app/layouts/default.vue`.

### 4.2 Pinia / Colada in package.json with Zero Usage

**Severity: Medium**

`pinia`, `@pinia/nuxt`, and `@pinia/colada` are listed as runtime dependencies and ship in the bundle even if tree-shaken. More importantly, they add maintenance cost (version bumps, security scans, contributor confusion). If a future developer sees `@pinia/nuxt` in `package.json`, they may assume stores exist and look for them — a DX tax.

Removal is safe today: `grep -r defineStore` and `grep -r useQuery` both return zero matches.

### 4.3 @nuxt/image Installed But Images Unoptimised

**Severity: Medium** (higher once event/product imagery proliferates)

Product images in `ProductField.vue` and the org logo in `default.vue` use native `<img>` tags without `loading="lazy"`, `width/height`, or responsive `srcset`. For an audience on mobile, this means full-size images on small viewports. `@nuxt/image` is already a dependency — activating it costs only replacing `<img>` with `<NuxtImg>`.

### 4.4 Two Validation Systems in fe-core — Risk of Divergence

**Severity: Low-Medium**

`fe-core` contains two unconnected validation approaches:
- `fe-core/app/core/field-engine/validation.ts` — custom, pure, schema-driven, well-tested
- `fe-core/app/core/utils/validation.ts` + VeeValidate — Yup-based, designed for staff auth forms

These do not conflict today because VeeValidate components are only used in staff-app auth flows (not consumed by any page in this customer app). The risk is future developers adding new customer form validation using VeeValidate by reaching for the existing `<FormInput>` wrapper — which would fight the field engine's error-state model.

The field engine's validation is the right approach for this app. The VeeValidate components are correctly parked in `fe-core` for the staff app.

### 4.5 No Pre-commit Hooks

**Severity: Low**

No Husky / lint-staged configuration means lint errors can reach `main`. The `format:dirty` script exists but is opt-in. This is acceptable at current team size but worth addressing before the team grows.

### 4.6 No Component-Level Tests

**Severity: Low** (high once more pages ship)

`FormRenderer.vue`, `ProductField.vue`, and `QuantityStepper.vue` have no mount-level tests. The README (`app/features/forms/README.md:81`) references a planned `FormRenderer.spec.ts`. `@vue/test-utils` is installed. The gap is acknowledged; it is not yet a debt.

### 4.7 fe-core CSS Contains Staff-App Artifacts

**Severity: Low**

`fe-core/app/assets/css/main.css` contains sidebar layout classes (`.sidebar:hover`, `.w-sidebar-expanded`, `.menu-item`, etc., lines 294–470) and third-party library overrides for `apexcharts`, `simplebar`, `flatpickr`, and `prism` (lines 571–651) that are irrelevant to this customer app. This increases the CSS bundle size unnecessarily. Since this is a shared stylesheet, the correct fix is in the staff app, not here, but it is worth noting.

### 4.8 FormPasswordInput Inlines SVG Icons Instead of #icons

**Severity: Low** (DX / consistency)

`fe-core/app/core/components/ui/inputs/FormPasswordInput.vue` (lines 63–101) uses raw inline SVG for the eye/eye-off toggle instead of importing `Eye`/`EyeOff` from `#icons`. This bypasses the icon adapter system and makes the component immune to whitelabel icon switching. The `#icons` adapter exports both `Eye` and `EyeOff` from `fe-core/app/icons/lucide/index.ts:27-28`.

---

## 5. Prioritised Action List

Items are ordered by impact vs. effort. Each is tied to a recommendation above.

### Quick wins (hours)

**[Q1] Mount `<Toaster>` in app.vue — fixes a silent bug**

`app/app.vue` should add `<Toaster position="top-right" />` (or equivalent). This is a one-line fix but prevents real user-facing failures: network errors and submit failures currently produce no feedback.

```
File: app/app.vue
Action: Import Toaster from 'vue-sonner' and add to template
Tied to: vue-sonner → IMPROVE
```

**[Q2] Remove `pinia`, `@pinia/nuxt`, `@pinia/colada` from package.json**

```bash
npm remove pinia @pinia/nuxt @pinia/colada
```

Zero code changes needed. Reduces install size, eliminates version-bump noise, and removes developer confusion about whether stores exist.

```
Files: package.json only
Tied to: pinia → REMOVE, @pinia/nuxt → REMOVE, @pinia/colada → PARK
```

**[Q3] Fix FormPasswordInput to use #icons for Eye/EyeOff**

Replace inline SVG in `fe-core/app/core/components/ui/inputs/FormPasswordInput.vue` lines 63–101 with:
```ts
import { Eye, EyeOff } from '#icons'
```
Keeps the icon adapter contract intact so Tabler tenants get the correct icon variant.

```
File: fe-core/app/core/components/ui/inputs/FormPasswordInput.vue
Tied to: icon system consistency
```

---

### Medium-effort improvements (days)

**[M1] Activate @nuxt/image for product and logo images**

Replace native `<img>` in:
- `app/features/forms/components/controls/ProductField.vue` (lines 83–88, 116–120)
- `app/layouts/default.vue` (line 15)

With `<NuxtImg>` including `loading="lazy"`, `width`, `height`, and `sizes` props. Add a provider config in `nuxt.config` if images are served from a CDN. This is already in `dependencies`.

```
Tied to: @nuxt/image → IMPROVE
Audience impact: High — product images on mobile for 60+ users
```

**[M2] Add pre-commit hooks (Husky + lint-staged)**

Wire `lint-staged` to run ESLint + Prettier on staged `.vue`/`.ts` files. Prevents `main` accumulating lint debt as the codebase grows.

```
Files: package.json, .husky/pre-commit, .lintstagedrc.json (new)
Tied to: DX gap noted in §4.5
```

**[M3] Add vitest coverage reporting**

Add `coverage: { provider: 'v8', reporter: ['text', 'html'] }` to `vitest.config.ts`. The existing tests cover the validation engine well; coverage reporting makes gaps visible as new pages ship.

```
File: vitest.config.ts
Tied to: testing gap noted in §3.4
```

---

### Longer-term (next feature cycle)

**[L1] Add FormRenderer component tests**

The README references a planned `FormRenderer.spec.ts`. When the Events feature ships, component tests for `FormRenderer`, `ProductField`, and `QuantityStepper` become important. Use `@vue/test-utils` (already installed) with `mount()` + happy-dom. Test: field rendering, submit flow, step navigation, error display.

```
Tied to: @vue/test-utils → PARK (activate when component tests are added)
```

**[L2] Evaluate @pinia/colada when Events or Account features land**

The Events (discovery + detail) and Account (my-tickets) cycles will likely need a query cache. Re-evaluate `@pinia/colada` at that point against `useAsyncData` for SSR cases and React Query alternatives for SPA-style client mutations.

```
Tied to: @pinia/colada → PARK
```

**[L3] Document the VeeValidate/Yup boundary**

Add a comment in `fe-core/app/core/components/ui/inputs/FormInput.vue` and `fe-core/app/core/utils/validation.ts` clarifying that these are staff-app auth helpers and should not be used for field-engine-rendered forms. Prevents the two validation systems from accidentally merging as the team grows.

```
Files: fe-core/app/core/components/ui/inputs/FormInput.vue, fe-core/app/core/utils/validation.ts
Tied to: §4.4 divergence risk
```

---

## Appendix: Evidence Reference

| Claim | File | Lines |
|---|---|---|
| Icon adapter (lucide) | `fe-core/app/icons/lucide/index.ts` | 1–75 |
| Icon adapter (tabler) | `fe-core/app/icons/tabler/index.ts` | 1–76 |
| `#icons` used in customer app | `app/features/forms/components/controls/QuantityStepper.vue` | 6 |
| `#icons` used in fe-core | `fe-core/app/core/components/ui/Modal.vue` | 59 |
| No `defineStore` in repo | grep result | 0 matches |
| No `useQuery` / PiniaColada in repo | grep result | 0 matches |
| No `<NuxtImg>` in repo | grep result | 0 matches |
| Raw `<img>` in ProductField | `app/features/forms/components/controls/ProductField.vue` | 83, 116 |
| `toast()` call — api client | `fe-core/app/core/api/client.ts` | 106, 108, 110 |
| `toast()` call — composable | `app/features/forms/composables/usePublicForm.ts` | 180 |
| No `<Toaster>` mount | grep across all `.vue` | 0 matches |
| VeeValidate `<Field>` in FormInput | `fe-core/app/core/components/ui/inputs/FormInput.vue` | 59 |
| VeeValidate `<Field>` in FormPasswordInput | `fe-core/app/core/components/ui/inputs/FormPasswordInput.vue` | 139 |
| VeeValidate `<Field>` in FormCheckbox | `fe-core/app/core/components/ui/inputs/FormCheckbox.vue` | 48 |
| Yup import | `fe-core/app/core/utils/validation.ts` | 4 |
| DOMPurify in ParagraphBlock | `fe-core/app/core/field-engine/components/display/ParagraphBlock.vue` | 3, 7 |
| DOMPurify in ConfirmModal | `fe-core/app/core/components/ui/ConfirmModal.vue` | 43 |
| Field engine validation (no library) | `fe-core/app/core/field-engine/validation.ts` | 1–80 |
| Field engine registry | `fe-core/app/core/field-engine/registry.ts` | 1–35 |
| Product type registration | `app/plugins/field-types.ts` | 9–14 |
| Multi-step wizard state | `app/features/forms/composables/usePublicForm.ts` | 99–141 |
| `min-h-tap` utility (44px touch target) | `fe-core/app/assets/css/main.css` | 260–265 |
| Whitelabel CSS vars injected SSR | `app/composables/useTenant.ts` | 39–47 |
| `brandingToCssVars` (SSR-safe) | `fe-core/app/core/utils/colorUtils.ts` | 232–253 |
| Sidebar CSS in shared stylesheet | `fe-core/app/assets/css/main.css` | 294–470 |
| `@tailwindcss/forms` plugin | `fe-core/app/assets/css/main.css` | 6 |
| `@tailwindcss/typography` plugin | `fe-core/app/assets/css/main.css` | 7 |
| Vitest happy-dom environment | `vitest.config.ts` | 6 |
| No `@vue/test-utils` usage | grep across spec files | 0 matches |
| FormPasswordInput inline SVG | `fe-core/app/core/components/ui/inputs/FormPasswordInput.vue` | 63–101 |
