# Forms

Public form fill + submit with file/image upload, validation, guest email support, and payment/member-only guards.

## What it does

**Route:** `/f/[slug]` — renders a published form via slug, collects answers, uploads media, and submits. Success panel shows the submission receipt + edit link. Closed/members-only/priced forms display guard messages; guest email is required if `requires_guest_email` is set and no email field exists in the form.

**Shipping includes:**
- SSR fetch by slug; not-found/404 handling; state guards (deadline, visibility, pricing).
- Client-side validation (required, email, number bounds, select options); backend 422 → inline error map.
- File/image upload with optimistic progress UI; submitted media UUID stored in answers.
- Inline error display per field; focus to first error on validation failure.
- Success confirmation with link to edit submission (deferred backend).

## The shared field engine lives in core

The fillable **field renderer** is in the shared layer — **`#core/field-engine`** — so other apps (e.g. a staff form preview) reuse it. This feature owns only the form-fill *submission* flow on top of it.

From core (`#core/field-engine`): neutral `types` (`Field`/`FieldGroup`/`FieldOption`), `validation` (`validateField`/`validateAll`/`isCollecting`), the `FieldControl` dispatcher + `FieldCell`, the generic controls (text/email/textarea/phone/number/select/date/time/duration/file+image) and display blocks, and a `registry` for custom field types.

Custom (domain) field types register into that registry — they don't go in core. Here, `plugins/field-types.ts` registers **`product`** (`ProductField.vue` + `defaultValue: () => []`); `product`'s submit value is `{ variant_id, quantity }[]`, built from the catalog embedded in `settings.product`.

## This feature (submission on top of the engine)

**`types.ts`** — form/submission DTOs: `Form`, `SubmitResult`, `UploadedMedia`, `SubmitAnswers`, and the product types. (`Field`/`FieldGroup` come from `#core/field-engine/types`.)

**`services/forms.service.ts`** — API calls only; no reactivity.
- `getPublicForm(slug)` — fetch form + structure.
- `submitForm(slug, answers)` — POST submission; throws 422 with field errors.
- `uploadFieldMedia(slug, fieldId, file)` — multipart upload; returns `UploadedMedia`.

**`composables/usePublicForm.ts`** — SSR fetch, answers/error state, multi-step wizard, submit + 422 mapping. **`components/FormRenderer.vue`** — the wizard chrome (stepper, Back/Next, guards, success) wrapping `#core` `FieldCell`s.

**`composables/usePublicForm.ts`** — **state, orchestration, no UI.** Wraps the service in Nuxt `useAsyncData` and composes the form's client state. Exports one async function:
- `usePublicForm(slug)` → returns `PublicFormState`: 
  - `form`, `sections` (grouped + sorted fields), `allFields`
  - `answers` (reactive, seeded for every collecting field), `errors` (ref, keyed by field ID)
  - `guestEmail`, `needsGuestEmail` (computed — true if `form.requires_guest_email` and no email field)
  - `isClosed`, `isPriced`, `membersOnlyBlocked` (guard computed bools)
  - `uploads` (reactive state per file field: `{ uploading, filename }`)
  - `submit()` — validate client-side, invalidate → 422, set error map, focus first error, or POST.
  - `setAnswer(fieldId, value)` — clear field's error on change.
  - `uploadFile(fieldId, file)` — async; updates answers + upload state; API failures already toasted.

**`components/FormRenderer.vue`** — layout only; wires `PublicFormState` to the form UI.
- Headers + descriptions per section.
- Guard messages (closed, members-only, priced, success).
- Grid layout (2-col on desktop, 1-col on mobile; col_span handled per field).
- Form + sections; submit button disabled if closed/priced/locked.
- Guest email input if needed.

## Extending: add a field type

One control + one map entry:

1. Create `components/controls/YourField.vue` — props: `{ field, modelValue, invalid? }`, emit `update:modelValue`, optional `upload` for file types. See `TextField.vue`, `SelectField.vue`, `FileField.vue` for patterns.

2. Add to `validation.ts` `COLLECTING_TYPES` if it collects user data. Add validation logic to `validateField()` if needed.

3. Register in `FieldControl.vue` `controls` or `displays` map:
   - Input: `{ yourType: YourField, … }`
   - Display-only (heading, divider, etc.): `displays` map.

4. Add the corresponding backend field type + validation + fixture in the API.

5. Test via `npm test` and `npm run verify`.

## Deferred (no-code-yet, not built-in):

- **Payment** — gateway integration; form with `price > 0` or priced options disables submit client-side; backend processes.
- **Conditional logic** — field visibility rules; `visibility: 'admin'` is rendered but not collected; readonly fields render values + skip input.
- **Multi-step** — field groups as pages; progress indicator; one-way flow (no back).
- **`product` and `duration` field types** — domain-specific inputs; stubbed as "not available yet".
- **Edit submission page** — `/f/[slug]/submissions/[submissionSlug]`; backend auth/fetch, form prefill, update endpoint.

## Testing

`services/forms.service.spec.ts` — API client mock; method calls return typed DTOs.
`validation.spec.ts` — pure validators; test matrix (required/optional, type-specific logic).
`components/FormRenderer.spec.ts` (Task 6) — render, state wiring, submit flow, error display.

Run `npm test` (Vitest) and `npm run verify` (gate).
