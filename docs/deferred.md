# Deferred / follow-ups

A running list of things intentionally deferred during development, so we can come back to them.
Newest at the bottom. Each item: what, why deferred, where it lives.

## Customer Forms (cycle 1) + product field

- **Payment / order flow.** Priced forms (a `price`, priced select options, or a `product` field) render
  but keep **submit gated** with a "payment isn't available here yet" banner. The whole calculate →
  gateway → order path is a future cycle. _Where:_ `usePublicForm` (`isPriced`), `FormRenderer` guard.
- **Conditional field logic.** Backend fields carry a `logic` (show/hide) object; the renderer ignores it
  (all fields always shown). _Where:_ `#core/field-engine` + `usePublicForm.sections`.
- **Edit an existing submission.** Backend has `GET/PUT /submissions/{slug}`; no FE page yet. The success
  panel links to `edit_url` but there's no editor. _Where:_ a new `pages/` route.
- **Currency-aware product pricing.** `ProductField` shows `prices[0]`; if a variant has multiple-currency
  prices it may not match the form's `currency`. Fixing needs the form currency threaded into the control
  (the neutral core dispatcher shouldn't carry money) — do it with the pricing/payment cycle.
  _Where:_ `app/features/forms/components/controls/ProductField.vue`.

## Tests

- **`ProductField` unit spec.** Selection logic (`setQty` total clamp, `variantImage` fallback, the
  stepper) is untested. Needs a `#icons` alias in `vitest.config.ts` + a `@vue/test-utils` mount.
  _Where:_ `app/features/forms/components/controls/`.
- **fe-core field-engine tests.** The shared engine (`FieldControl`, `FieldCell`, controls, `registry`)
  has **no tests in the `ticketplatform-fe-core` repo** — only `validation` is exercised, indirectly, via
  the customer repo's spec importing `#core`. fe-core has no vitest harness of its own.
- **Backend: embedded product `image`.** No test asserts the public form's product field embeds `image`
  as a resource (and `null` when absent). _Where:_ `ticketplatform-api` `FieldResource` / public-form test.

## Next cycles

- **Staff form preview.** Build a read-only preview in `ticketplatform-staff-fe` on top of
  `#core/field-engine` (feed it a form's fields). Bump staff's fe-core submodule first.
- **fe-core unit harness.** Stand up vitest in `ticketplatform-fe-core` so the engine is tested in its own
  repo rather than only through consumers.
