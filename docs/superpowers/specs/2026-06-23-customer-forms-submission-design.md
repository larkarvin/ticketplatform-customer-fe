# Customer Forms Submission — Design

**Goal:** `/f/{slug}` on the customer (public, SSR, guest) app fetches a published form by slug, renders all its fields faithfully, lets a guest fill and submit it, and shows a success state — including file/image upload. Payment, conditional logic, multi-step navigation, and the `product`/`duration` field types are explicitly deferred.

This is the first customer-FE Forms cycle. It also delivers the customer-side **field renderer** (the staff field-engine is builder-only — read-only previews, no fillable inputs), kept feature-local until a second consumer needs it.

## Scope

**In:** fetch form by slug (SSR), render display + input fields, client validation, submit with guest email when required, staged file/image upload, success state, and the standard edge states (closed / members-only / not-found / priced-form guard).

**Out (deferred, noted where they touch the design):** payment (`calculate`/gateways/order flow), conditional field `logic` (show/hide), multi-step navigation (`field_groups` render as sections, not steps), the `product` and `duration` field types, the partial `validate` endpoint, and the edit-existing-submission page (`/submissions/{slug}`).

## Backend contract (already implemented; no API changes expected)

All public form endpoints exist under `api/v1/forms/public` (`auth.optional`). The client `baseURL` already includes `/v1`, so paths below are relative to that.

- **Fetch:** `GET /forms/public/{slug}` → `FormResource`. Returns (snake_case): `id, title, slug, description, price, processing_fee, surcharge_type, surcharge_value, currency, enabled, members_only, allow_non_members, requires_guest_email, submission_deadline, submit_button_text, fields[], field_groups[]`. Admin-visibility fields are already filtered out for guests.
  - **Field:** `id, field_group_id, field_key, type, label, placeholder, description, required, visibility ('public'|'readonly'|'admin'), min, max, allow_decimal, settings (incl. content / allowed_extensions / max_file_size), sort_order, col_span (12/6/4/3), logic, options[]`.
  - **Option (select):** `id, option_key, value, label, price|null, sort_order`.
  - **Field group:** `id, title, description, sort_order, fields[]`.
- **Submit:** `POST /forms/public/{slug}/submit`, body `{ [fieldId]: value, guest_email?, payment_gateway? }`.
  - **201:** `{ message, submission_id, submission_slug, edit_url, requires_payment, order_id?, order_number?, payment_total? }`.
  - **422:** `{ success:false, message, errors: { [fieldId]: string[] } }`.
- **File upload:** `POST /forms/public/{slug}/fields/{fieldId}/upload` (multipart `{ file }`) → `{ id, uuid, original_filename, url }`. The returned `uuid` is the field's submit value; `url` is a preview.

**Field types:** input — `text, email, textarea, phone, number, select, date, time, file, image`; display-only — `paragraph, heading, divider, spacer, decorative_image`; **deferred** — `duration, product` (render a muted "not available yet" note, excluded from submission).

## Architecture

A strict-layered `forms` feature in the customer app (`core/api` → service → composable → page → component):

```
app/features/forms/
  types.ts                      # Form, FieldGroup, Field, FieldOption, SubmitResult
  services/forms.service.ts     # getPublicForm / submitForm / uploadFieldMedia (plain, no reactivity)
  validation.ts                 # validateField(field, value), validateAll(...) — pure, metadata-driven
  composables/usePublicForm.ts  # SSR fetch + answers + errors + submit/upload orchestration + states
  components/
    FormRenderer.vue            # 2-col responsive grid; sections; submit; success / closed / payment-guard
    FormFieldCell.vue           # label, required *, description, control slot, inline error, col_span→span
    FieldControl.vue            # dispatcher: field.type → control (display-only render static)
    controls/                   # TextField EmailField TextareaField PhoneField NumberField
                                # DateField TimeField SelectField FileField ImageField
    display/                    # ParagraphBlock HeadingBlock Divider Spacer DecorativeImage
app/pages/f/[slug].vue          # thin: usePublicForm(slug) → loading / not-found / <FormRenderer>
```

**Boundaries:** controls are plain controlled components (`modelValue` in, `update:modelValue` out) — no vee-validate; the dispatcher isolates type→component so a new type is one control + one map entry; the page holds no logic.

## Data flow

1. `pages/f/[slug].vue` calls `usePublicForm(slug)` and renders `<FormRenderer>`, passing form + bindings.
2. `usePublicForm`:
   - `useAsyncData('public-form:'+slug, () => getPublicForm(slug))` for the SSR fetch. A 404 (or `enabled=false`) throws `createError({ statusCode: 404 })` → `error.vue`. Sets per-page title/OG from `title`/`description`.
   - `sections` computed: ungrouped `fields` (field_group_id null) form an implicit leading section; `field_groups` follow. Everything sorted by `sort_order`. Fields within a section sorted by `sort_order`.
   - `answers = reactive<Record<number, unknown>>` seeded with empty defaults for collecting, non-readonly, supported fields.
   - `errors = ref<Record<number, string>>` — the single inline-error map, filled by both client validation and backend 422.
   - `guestEmail = ref('')` shown only when `requires_guest_email` and the form has no `email` field.
   - `uploadFile(fieldId, file)`: per-field uploading flag + preview; calls `uploadFieldMedia`, stores returned `uuid` as `answers[fieldId]`.
   - `submit()`: `validateAll` → if any error, set map + focus first error, stop. Else POST answers (+ `guest_email` when applicable). 201 → `submitted` result (success panel). 422 → merge `errors`. Other failures → one toast (api-client default).
   - `isClosed` (deadline passed), `isPriced` (`price > 0` or any priced option/surcharge), `membersOnly` (+ guest) drive banners; `isPriced` disables submit with the payment-deferred notice.

## Validation (metadata-driven)

`validateField(field, value): string | null` — `required` (non-empty), `email` (format), `number` (finite; `allow_decimal`; `min`/`max`), `phone` (light pattern), `select` (value ∈ option keys), `file`/`image` (uuid present when required). Display-only, `readonly`, and deferred types are skipped. `validateAll` returns the id→message map; the same map receives backend 422 messages (first message per field). Errors clear on field edit and on the next submit. Backend remains authoritative; client checks only avoid obvious round-trips. Honors the platform invariant: one message per failure — inline for field/422, toast for global (5xx/network) via the api client.

## Layout & rendering

- Responsive grid `grid grid-cols-1 sm:grid-cols-2 gap-4`. Each `FormFieldCell` maps `col_span`: `12` → `sm:col-span-2` (full row); `6`/`4`/`3` → `sm:col-span-1` (half). Mobile stacks to one column (mobile-first).
- Sections render an optional heading (`group.title`) + description above their grid.
- Display-only types render as static content (sanitized HTML for `paragraph`, per the staff preview's DOMPurify approach).
- Tokens only (brand vars + neutral grays); 16px body; `min-h-tap` (44px) controls.

## States & a11y

Loading skeleton (client nav), not-found → 404 page, closed (deadline/`enabled=false`) notice, members-only notice (auth deferred), priced-form payment-deferred banner with disabled submit, submitting (disabled button + label), success panel (confirmation + `edit_url` link), per-field inline errors. Real `<label for>`, required marked, errors linked via `aria-describedby`, focus the first error on failed submit, semantic controls only.

## Testing

Pure units get specs: `validation.ts` (each rule + skips) and the `service` (mock the api client: correct paths, submit payload shape keyed by id, 422 surfaced as `ValidationError`, upload multipart). Component/composable rendering verified by running the page against the dev backend (render check per the plan's tasks).

## Definition of done

`/f/{slug}` SSR-renders a real published form, a guest can fill every supported field (incl. file/image upload), client + 422 validation show inline, a free form submits and shows the success panel, a priced form shows the payment-deferred guard, and missing/closed forms show the right state. `npm run typecheck` 0 · `npm run lint` 0/0 · `format:dirty` run · validation + service specs pass.
