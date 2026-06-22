# Customer Forms Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/f/{slug}` on the customer app fetches a published form by slug (SSR), renders all supported fields in a mobile-first 2-column grid, lets a guest fill and submit it (including file/image upload), and shows a success state.

**Architecture:** A strict-layered `forms` feature in the customer app (`#core/api` → service → composable → page → component). A feature-local field renderer dispatches on `field.type` to plain controlled controls (no vee-validate); a pure metadata-driven validator produces an inline error map that backend 422 errors also feed. Spec: `docs/superpowers/specs/2026-06-23-customer-forms-submission-design.md`.

**Tech Stack:** Nuxt 4 (SSR), Vue 3 `<script setup lang="ts">`, Tailwind 4 (tokens), `#core/api` DI client, vitest + @vue/test-utils + happy-dom (added here), vue-sonner.

## Global Constraints

- SSR is ON. All code SSR-safe: no unguarded `window`/`document`/`localStorage`; client-only effects in `onMounted`/`useHead`/`import.meta.client`.
- `<script setup lang="ts">` only. **No `any`**, no `@ts-ignore`/`@ts-nocheck`, no blanket `eslint-disable`. Guard nullable/indexed access (`noUncheckedIndexedAccess`).
- Colors via brand CSS vars / neutral grays only — no literal hex, no chromatic utilities like `text-red-500`. Icons only from `#icons`. 16px body; 44px min tap target (`min-h-tap`).
- Strict layering: `#core/api` → service (plain typed DTOs, no reactivity) → composable (state + orchestration) → page (thin) → component (UI only). No layer skipped.
- Guest-first: no auth wall, no role-gating.
- One failure → one user-visible message: inline (persistent) for field/422 errors; toast (transient) for global 5xx/network (handled by the api client). Success toast/panel owned by the composable, never the service.
- Feature dirs are NOT auto-imported — import feature files explicitly (relative within the feature; `~/features/forms/...` from the page; `#core/...` for the layer).
- Per-task DoD: `npm run typecheck` 0 errors, `npm run lint` 0 errors/0 warnings, `npm run format:dirty` run, plus the task's test/render check.

**API contract (paths relative to the `/v1` baseURL):**
- `GET /forms/public/{slug}` → `{ data: Form }` (snake_case fields).
- `POST /forms/public/{slug}/submit`, body `{ [fieldId]: value, guest_email? }` → 201 `{ message, submission_id, submission_slug, edit_url, requires_payment, order_id?, order_number?, payment_total? }`; 422 normalized by the api client to `ValidationError.fields: Record<string,string>` keyed by field id.
- `POST /forms/public/{slug}/fields/{fieldId}/upload` (multipart `file`) → `{ id, uuid, original_filename, url }`.

**Supported field types:** input — `text, email, textarea, phone, number, select, date, time, file, image`; display-only — `paragraph, heading, divider, spacer, decorative_image`; deferred (render a muted "not available yet" note, excluded from submission) — `duration, product`.

---

### Task 1: Test harness (vitest)

**Files:**
- Modify: `/var/www/ticketplatform-customer-fe/package.json`
- Create: `/var/www/ticketplatform-customer-fe/vitest.config.ts`
- Create: `/var/www/ticketplatform-customer-fe/app/features/forms/sanity.spec.ts` (temporary)

**Interfaces:**
- Produces: `npm test` runs vitest over `app/**/*.spec.ts`.

- [ ] **Step 1: Add test deps + scripts to `package.json`** — add to `devDependencies`: `"@vue/test-utils": "^2.4.11"`, `"happy-dom": "^20.10.6"`, `"vitest": "^4.1.9"`. Add to `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['app/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '#core': fileURLToPath(new URL('./fe-core/app/core', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: Write a sanity spec**

```ts
// app/features/forms/sanity.spec.ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Install + run**

Run: `cd /var/www/ticketplatform-customer-fe && npm install && npm test`
Expected: install completes; vitest runs; 1 passed.

- [ ] **Step 5: Delete the sanity spec, commit**

```bash
cd /var/www/ticketplatform-customer-fe
rm app/features/forms/sanity.spec.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test harness to customer-fe"
```

---

### Task 2: Form domain types + public forms service

**Files:**
- Create: `/var/www/ticketplatform-customer-fe/app/features/forms/types.ts`
- Create: `/var/www/ticketplatform-customer-fe/app/features/forms/services/forms.service.ts`
- Test: `/var/www/ticketplatform-customer-fe/app/features/forms/services/forms.service.spec.ts`

**Interfaces:**
- Produces:
  - Types `Form`, `FieldGroup`, `Field`, `FieldOption`, `SubmitResult`, `UploadedMedia`, `SubmitAnswers`.
  - `formsService.getPublicForm(slug: string): Promise<Form>`
  - `formsService.submitForm(slug: string, answers: SubmitAnswers): Promise<SubmitResult>`
  - `formsService.uploadFieldMedia(slug: string, fieldId: number, file: File): Promise<UploadedMedia>`

- [ ] **Step 1: Write the types**

```ts
// app/features/forms/types.ts
// DTOs for the public form endpoints (snake_case as returned by the API).
export interface FieldOption {
  id: number
  option_key: string
  value: string
  label: string
  price: number | null
  sort_order: number
}

export interface Field {
  id: number
  field_group_id: number | null
  field_key: string
  type: string
  label: string
  placeholder: string | null
  description: string | null
  required: boolean
  visibility: 'public' | 'readonly' | 'admin'
  min: number | null
  max: number | null
  allow_decimal: boolean | null
  settings: Record<string, unknown>
  sort_order: number
  col_span: number
  options: FieldOption[]
}

export interface FieldGroup {
  id: number
  title: string
  description: string | null
  sort_order: number
  fields: Field[]
}

export interface Form {
  id: number
  title: string
  slug: string
  description: string | null
  price: number
  surcharge_type: string
  surcharge_value: number
  currency: string
  enabled: boolean
  members_only: boolean
  allow_non_members: boolean
  requires_guest_email: boolean
  submission_deadline: string | null
  submit_button_text: string
  fields: Field[]
  field_groups: FieldGroup[]
}

export interface SubmitResult {
  message: string
  submission_id: number
  submission_slug: string
  edit_url: string
  requires_payment: boolean
}

export interface UploadedMedia {
  id: number
  uuid: string
  original_filename: string
  url: string
}

/** Answers keyed by field id, plus optional guest email. */
export type SubmitAnswers = Record<string, unknown> & { guest_email?: string }
```

- [ ] **Step 2: Write the failing service test**

```ts
// app/features/forms/services/forms.service.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get, post }) }))

import { formsService } from './forms.service'

describe('formsService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('getPublicForm unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: { id: 1, slug: 'x', title: 'X' } })
    const form = await formsService.getPublicForm('x')
    expect(get).toHaveBeenCalledWith('/forms/public/x')
    expect(form).toEqual({ id: 1, slug: 'x', title: 'X' })
  })

  it('submitForm posts answers to the submit endpoint', async () => {
    post.mockResolvedValue({ message: 'ok', submission_id: 7, requires_payment: false })
    const res = await formsService.submitForm('x', { '1': 'Jo', guest_email: 'a@b.co' })
    expect(post).toHaveBeenCalledWith('/forms/public/x/submit', { '1': 'Jo', guest_email: 'a@b.co' })
    expect(res.submission_id).toBe(7)
  })

  it('uploadFieldMedia posts multipart FormData to the field upload endpoint', async () => {
    post.mockResolvedValue({ id: 3, uuid: 'abc', original_filename: 'f.png', url: '/u' })
    const file = new File(['x'], 'f.png', { type: 'image/png' })
    const media = await formsService.uploadFieldMedia('x', 9, file)
    const [url, body] = post.mock.calls[0]
    expect(url).toBe('/forms/public/x/fields/9/upload')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(media.uuid).toBe('abc')
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- forms.service`
Expected: FAIL — cannot find module `./forms.service`.

- [ ] **Step 4: Write the service**

```ts
// app/features/forms/services/forms.service.ts
// Public forms API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { Form, SubmitAnswers, SubmitResult, UploadedMedia } from '../types'

export const formsService = {
  getPublicForm: (slug: string): Promise<Form> =>
    useApiClient()
      .get<{ data: Form }>(`/forms/public/${slug}`)
      .then((r) => r.data),

  submitForm: (slug: string, answers: SubmitAnswers): Promise<SubmitResult> =>
    useApiClient().post<SubmitResult>(`/forms/public/${slug}/submit`, answers),

  uploadFieldMedia: (slug: string, fieldId: number, file: File): Promise<UploadedMedia> => {
    const form = new FormData()
    form.append('file', file)
    return useApiClient().post<UploadedMedia>(`/forms/public/${slug}/fields/${fieldId}/upload`, form)
  },
}
```

- [ ] **Step 5: Run the tests, verify pass**

Run: `npm test -- forms.service`
Expected: 3 passed.

- [ ] **Step 6: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck
git add app/features/forms/types.ts app/features/forms/services/forms.service.ts app/features/forms/services/forms.service.spec.ts
git commit -m "feat(forms): public forms service + domain types"
```

---

### Task 3: Metadata-driven validation

**Files:**
- Create: `/var/www/ticketplatform-customer-fe/app/features/forms/validation.ts`
- Test: `/var/www/ticketplatform-customer-fe/app/features/forms/validation.spec.ts`

**Interfaces:**
- Consumes: `Field` (Task 2).
- Produces:
  - `COLLECTING_TYPES: Set<string>` and `isCollecting(field: Field): boolean` (collecting, non-readonly, supported).
  - `validateField(field: Field, value: unknown): string | null`
  - `validateAll(fields: Field[], answers: Record<string, unknown>): Record<number, string>`

- [ ] **Step 1: Write the failing test**

```ts
// app/features/forms/validation.spec.ts
import { describe, expect, it } from 'vitest'
import type { Field } from './types'
import { validateAll, validateField } from './validation'

function field(p: Partial<Field>): Field {
  return {
    id: 1, field_group_id: null, field_key: 'k', type: 'text', label: 'Name',
    placeholder: null, description: null, required: false, visibility: 'public',
    min: null, max: null, allow_decimal: null, settings: {}, sort_order: 0,
    col_span: 12, options: [], ...p,
  }
}

describe('validateField', () => {
  it('flags required empties', () => {
    expect(validateField(field({ required: true }), '')).toBe('Name is required')
    expect(validateField(field({ required: true }), 'Jo')).toBeNull()
  })
  it('checks email format', () => {
    expect(validateField(field({ type: 'email' }), 'nope')).toBe('Enter a valid email address')
    expect(validateField(field({ type: 'email' }), 'a@b.co')).toBeNull()
  })
  it('checks number incl. min/max and decimals', () => {
    expect(validateField(field({ type: 'number' }), 'x')).toBe('Enter a number')
    expect(validateField(field({ type: 'number', allow_decimal: false }), '1.5')).toBe('Enter a whole number')
    expect(validateField(field({ type: 'number', min: 5 }), '3')).toBe('Must be at least 5')
    expect(validateField(field({ type: 'number', max: 5 }), '7')).toBe('Must be at most 5')
    expect(validateField(field({ type: 'number' }), '4')).toBeNull()
  })
  it('checks select value is a known option', () => {
    const f = field({ type: 'select', options: [{ id: 1, option_key: 'a', value: 'a', label: 'A', price: null, sort_order: 0 }] })
    expect(validateField(f, 'b')).toBe('Choose one of the options')
    expect(validateField(f, 'a')).toBeNull()
  })
  it('skips display-only and readonly fields', () => {
    expect(validateField(field({ type: 'paragraph', required: true }), '')).toBeNull()
    expect(validateField(field({ visibility: 'readonly', required: true }), '')).toBeNull()
  })
})

describe('validateAll', () => {
  it('returns a map of id -> first error', () => {
    const fields = [field({ id: 1, required: true }), field({ id: 2, type: 'email', required: true })]
    const errors = validateAll(fields, { '1': '', '2': 'bad' })
    expect(errors).toEqual({ 1: 'Name is required', 2: 'Enter a valid email address' })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- validation`
Expected: FAIL — cannot find module `./validation`.

- [ ] **Step 3: Write the validator**

```ts
// app/features/forms/validation.ts
// Pure, metadata-driven validation. The backend remains authoritative (422); these checks only
// avoid obvious round-trips. Display-only, readonly, and deferred types collect no data.
import type { Field } from './types'

export const COLLECTING_TYPES = new Set<string>([
  'text', 'email', 'textarea', 'phone', 'number', 'select', 'date', 'time', 'file', 'image',
])

export function isCollecting(field: Field): boolean {
  return field.visibility !== 'readonly' && field.visibility !== 'admin' && COLLECTING_TYPES.has(field.type)
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateField(field: Field, value: unknown): string | null {
  if (!isCollecting(field)) return null

  if (field.required && isEmpty(value)) return `${field.label} is required`
  if (isEmpty(value)) return null // optional + empty → fine

  if (field.type === 'email' && typeof value === 'string' && !EMAIL_RE.test(value.trim())) {
    return 'Enter a valid email address'
  }

  if (field.type === 'number') {
    const n = Number(value)
    if (typeof value !== 'string' || value.trim() === '' || !Number.isFinite(n)) return 'Enter a number'
    if (field.allow_decimal === false && !Number.isInteger(n)) return 'Enter a whole number'
    if (field.min !== null && n < field.min) return `Must be at least ${field.min}`
    if (field.max !== null && n > field.max) return `Must be at most ${field.max}`
  }

  if (field.type === 'select') {
    const keys = field.options.map((o) => o.option_key)
    if (!keys.includes(String(value))) return 'Choose one of the options'
  }

  return null
}

export function validateAll(fields: Field[], answers: Record<string, unknown>): Record<number, string> {
  const errors: Record<number, string> = {}
  for (const field of fields) {
    const msg = validateField(field, answers[String(field.id)])
    if (msg) errors[field.id] = msg
  }
  return errors
}
```

- [ ] **Step 4: Run the tests, verify pass**

Run: `npm test -- validation`
Expected: all passed.

- [ ] **Step 5: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck
git add app/features/forms/validation.ts app/features/forms/validation.spec.ts
git commit -m "feat(forms): metadata-driven field validation"
```

---

### Task 4: Display blocks + input controls

**Files:**
- Create: `app/features/forms/components/display/ParagraphBlock.vue`, `HeadingBlock.vue`, `Divider.vue`, `Spacer.vue`, `DecorativeImage.vue`
- Create: `app/features/forms/components/controls/TextField.vue`, `EmailField.vue`, `TextareaField.vue`, `PhoneField.vue`, `NumberField.vue`, `DateField.vue`, `TimeField.vue`, `SelectField.vue`

**Interfaces:**
- Consumes: `Field`, `FieldOption` (Task 2).
- Produces: each control takes `:field` (Field), `:modelValue` (unknown), `:invalid` (boolean) and emits `update:modelValue`. Display blocks take only `:field`. File/image controls are added in Task 7.

- [ ] **Step 1: Write the shared input class constant** — create `app/features/forms/components/controls/inputClass.ts`

```ts
// Shared control classes — token-styled, 44px tap target, branded focus, red-free.
export const controlClass =
  'min-h-tap w-full rounded-lg border bg-transparent px-4 py-2.5 text-base text-gray-900 ' +
  'placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ' +
  'dark:text-white/90 dark:placeholder:text-white/30'
export function borderClass(invalid: boolean): string {
  return invalid
    ? 'border-danger-400 focus:border-danger-400 dark:border-danger-700'
    : 'border-gray-300 focus:border-brand-300 dark:border-gray-700'
}
```

- [ ] **Step 2: Write the text-like controls** — `TextField.vue` (template shows pattern; `EmailField`, `PhoneField` are identical with `type="email"`/`type="tel"`; `TextareaField` uses `<textarea rows="4">`; `DateField`/`TimeField` use `type="date"`/`type="time"`)

```vue
<!-- controls/TextField.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
import { borderClass, controlClass } from './inputClass'
const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <input
    :id="`field-${props.field.id}`"
    :value="(props.modelValue as string) ?? ''"
    type="text"
    :placeholder="props.field.placeholder ?? ''"
    :class="[controlClass, borderClass(props.invalid ?? false)]"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

Create `EmailField.vue`, `PhoneField.vue`, `DateField.vue`, `TimeField.vue` identically, changing only the `type` attribute to `email`, `tel`, `date`, `time` respectively. Create `TextareaField.vue` replacing `<input>` with `<textarea rows="4" :class="[controlClass, borderClass(props.invalid ?? false)]" />` (same value/placeholder/emit). Create `NumberField.vue` with `type="number"`, plus `:step="props.field.allow_decimal === false ? '1' : 'any'"`, `:min`/`:max` bound from `props.field.min`/`max` when non-null.

- [ ] **Step 3: Write `SelectField.vue`** (priced options show the price inline; submit sends `option_key`)

```vue
<!-- controls/SelectField.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
import { borderClass, controlClass } from './inputClass'
const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const optionLabel = (label: string, price: number | null) =>
  price ? `${label} (+${price})` : label
</script>
<template>
  <select
    :id="`field-${props.field.id}`"
    :value="(props.modelValue as string) ?? ''"
    :class="[controlClass, borderClass(props.invalid ?? false)]"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="" disabled>{{ props.field.placeholder ?? 'Choose…' }}</option>
    <option v-for="o in props.field.options" :key="o.id" :value="o.option_key">
      {{ optionLabel(o.label, o.price) }}
    </option>
  </select>
</template>
```

- [ ] **Step 4: Write the display blocks**

```vue
<!-- display/ParagraphBlock.vue — sanitized HTML body (content from API, not just this session) -->
<script setup lang="ts">
import DOMPurify from 'dompurify'
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
const props = defineProps<{ field: Field }>()
const html = computed(() => DOMPurify.sanitize(String(props.field.settings.content ?? ''), { FORBID_TAGS: ['img'] }))
</script>
<template>
  <div class="prose prose-sm max-w-none text-gray-700 dark:prose-invert" v-html="html" />
</template>
```

```vue
<!-- display/HeadingBlock.vue -->
<script setup lang="ts">
import type { Field } from '~/features/forms/types'
defineProps<{ field: Field }>()
</script>
<template>
  <h2 class="text-xl font-semibold text-gray-900 dark:text-white/90">{{ field.label }}</h2>
</template>
```

```vue
<!-- display/Divider.vue -->
<template>
  <hr class="border-gray-200 dark:border-gray-700" />
</template>
```

```vue
<!-- display/Spacer.vue -->
<template>
  <div class="h-6" />
</template>
```

```vue
<!-- display/DecorativeImage.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
const props = defineProps<{ field: Field }>()
const src = computed(() => (props.field.settings.url as string | undefined) ?? null)
</script>
<template>
  <img v-if="src" :src="src" :alt="field.label" class="w-full rounded-lg object-cover" />
</template>
```

- [ ] **Step 5: Add the `dompurify` dependency**

Run: `cd /var/www/ticketplatform-customer-fe && npm install dompurify@^3.2.0 && npm install -D @types/dompurify@^3.0.5`

- [ ] **Step 6: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck
git add app/features/forms/components package.json package-lock.json
git commit -m "feat(forms): display blocks and input controls"
```

---

### Task 5: Field dispatcher + field cell

**Files:**
- Create: `app/features/forms/components/FieldControl.vue`
- Create: `app/features/forms/components/FormFieldCell.vue`

**Interfaces:**
- Consumes: all controls + display blocks (Task 4), `Field` (Task 2), `isCollecting` (Task 3).
- Produces:
  - `FieldControl`: `:field`, `:modelValue`, `:invalid` in; `update:modelValue` out. Renders the right control/display for `field.type`; unknown/deferred types render a muted note.
  - `FormFieldCell`: `:field`, `:modelValue`, `:error` (string | undefined) in; `update:modelValue` out. Renders label/required/description, the control, the inline error, and the `col_span`→grid-span class via a `cellClass` computed.

- [ ] **Step 1: Write `FieldControl.vue` (dispatcher)**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
import DecorativeImage from './display/DecorativeImage.vue'
import Divider from './display/Divider.vue'
import HeadingBlock from './display/HeadingBlock.vue'
import ParagraphBlock from './display/ParagraphBlock.vue'
import Spacer from './display/Spacer.vue'
import DateField from './controls/DateField.vue'
import EmailField from './controls/EmailField.vue'
import NumberField from './controls/NumberField.vue'
import PhoneField from './controls/PhoneField.vue'
import SelectField from './controls/SelectField.vue'
import TextField from './controls/TextField.vue'
import TextareaField from './controls/TextareaField.vue'
import TimeField from './controls/TimeField.vue'

const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [unknown] }>()

const controls: Record<string, unknown> = {
  text: TextField, email: EmailField, textarea: TextareaField, phone: PhoneField,
  number: NumberField, select: SelectField, date: DateField, time: TimeField,
}
const displays: Record<string, unknown> = {
  paragraph: ParagraphBlock, heading: HeadingBlock, divider: Divider, spacer: Spacer,
  decorative_image: DecorativeImage,
}
const control = computed(() => controls[props.field.type] ?? null)
const display = computed(() => displays[props.field.type] ?? null)
</script>

<template>
  <component :is="display" v-if="display" :field="field" />
  <component
    :is="control"
    v-else-if="control"
    :field="field"
    :model-value="modelValue"
    :invalid="invalid"
    @update:model-value="emit('update:modelValue', $event)"
  />
  <p v-else class="text-sm text-gray-400">This field type isn't available yet.</p>
</template>
```

> File/image types fall through to the "not available yet" note here; Task 7 adds their controls to this dispatcher.

- [ ] **Step 2: Write `FormFieldCell.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '~/features/forms/types'
import { isCollecting } from '~/features/forms/validation'
import FieldControl from './FieldControl.vue'

const props = defineProps<{ field: Field; modelValue: unknown; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [unknown] }>()

// col_span 12 → full row; 6/4/3 → half (2-col max). Mobile stacks (grid-cols-1).
const cellClass = computed(() => (props.field.col_span >= 12 ? 'sm:col-span-2' : 'sm:col-span-1'))
const showLabel = computed(() => isCollecting(props.field))
</script>

<template>
  <div :class="cellClass">
    <label v-if="showLabel" :for="`field-${field.id}`" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
      {{ field.label }}
      <span v-if="field.required" class="text-danger-500">*</span>
    </label>
    <p v-if="showLabel && field.description" class="mb-1 text-xs text-gray-500 dark:text-gray-400">
      {{ field.description }}
    </p>
    <FieldControl
      :field="field"
      :model-value="modelValue"
      :invalid="!!error"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="error" :id="`field-${field.id}-error`" class="mt-1 text-sm text-danger-600 dark:text-danger-400">
      {{ error }}
    </p>
  </div>
</template>
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck
git add app/features/forms/components/FieldControl.vue app/features/forms/components/FormFieldCell.vue
git commit -m "feat(forms): field dispatcher and field cell (label/error/col_span)"
```

---

### Task 6: usePublicForm composable + FormRenderer + page

**Files:**
- Create: `app/features/forms/composables/usePublicForm.ts`
- Create: `app/features/forms/components/FormRenderer.vue`
- Modify: `app/pages/f/[slug].vue`

**Interfaces:**
- Consumes: `formsService` (Task 2), `validateAll`/`isCollecting` (Task 3), `FormFieldCell` (Task 5), `isValidationError` from `#core/errors`.
- Produces:
  - `usePublicForm(slug: string)` → `{ form, sections, answers, errors, guestEmail, needsGuestEmail, isClosed, isPriced, membersOnlyBlocked, submitting, submitted, submit, setAnswer }` (file upload added in Task 7).
  - `FormRenderer` consumes the composable's return via props; renders sections + grid + submit + states.

- [ ] **Step 1: Write `usePublicForm.ts`**

```ts
// app/features/forms/composables/usePublicForm.ts
// Owns the form's client state: SSR fetch, answers, the inline error map (client + 422), and submit
// orchestration. No transport (services) or UI here.
import { isValidationError } from '#core/errors'
import { computed, reactive, ref } from 'vue'
import { formsService } from '~/features/forms/services/forms.service'
import type { Field, Form, SubmitAnswers, SubmitResult } from '~/features/forms/types'
import { isCollecting, validateAll } from '~/features/forms/validation'

interface Section {
  id: string
  title: string | null
  description: string | null
  fields: Field[]
}

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export async function usePublicForm(slug: string) {
  const { data, error } = await useAsyncData(`public-form:${slug}`, () => formsService.getPublicForm(slug))

  if (error.value || !data.value || !data.value.enabled) {
    throw createError({ statusCode: 404, statusMessage: 'Form not found', fatal: true })
  }
  const form = data.value as Form

  useHead({
    title: form.title,
    meta: [
      { property: 'og:title', content: form.title },
      ...(form.description ? [{ name: 'description', content: form.description }] : []),
    ],
  })

  // Ungrouped fields form an implicit leading section; groups follow. All sorted.
  const sections = computed<Section[]>(() => {
    const out: Section[] = []
    const ungrouped = form.fields.filter((f) => f.field_group_id === null).sort(bySort)
    if (ungrouped.length) out.push({ id: 'ungrouped', title: null, description: null, fields: ungrouped })
    for (const g of [...form.field_groups].sort(bySort)) {
      out.push({ id: `g-${g.id}`, title: g.title, description: g.description, fields: [...g.fields].sort(bySort) })
    }
    return out
  })

  const allFields = computed<Field[]>(() => sections.value.flatMap((s) => s.fields))

  // Seed answers for every collecting field.
  const answers = reactive<Record<string, unknown>>({})
  for (const f of allFields.value) {
    if (isCollecting(f)) answers[String(f.id)] = ''
  }

  const errors = ref<Record<number, string>>({})
  const guestEmail = ref('')
  const needsGuestEmail = computed(
    () => form.requires_guest_email && !allFields.value.some((f) => f.type === 'email')
  )

  const now = Date.now()
  const isClosed = computed(
    () => !!form.submission_deadline && new Date(form.submission_deadline).getTime() < now
  )
  const isPriced = computed(
    () => form.price > 0 || allFields.value.some((f) => f.options.some((o) => (o.price ?? 0) > 0))
  )
  const membersOnlyBlocked = computed(() => form.members_only && !form.allow_non_members)

  const submitting = ref(false)
  const submitted = ref<SubmitResult | null>(null)

  function setAnswer(fieldId: number, value: unknown): void {
    answers[String(fieldId)] = value
    if (errors.value[fieldId]) {
      const next = { ...errors.value }
      delete next[fieldId]
      errors.value = next
    }
  }

  async function submit(): Promise<void> {
    if (submitting.value || isClosed.value || isPriced.value || membersOnlyBlocked.value) return
    const clientErrors = validateAll(allFields.value, answers)
    if (needsGuestEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.value.trim())) {
      clientErrors[-1] = 'Enter a valid email address'
    }
    errors.value = clientErrors
    if (Object.keys(clientErrors).length) {
      focusFirstError()
      return
    }
    submitting.value = true
    try {
      const payload: SubmitAnswers = { ...answers }
      if (needsGuestEmail.value) payload.guest_email = guestEmail.value.trim()
      submitted.value = await formsService.submitForm(slug, payload)
    } catch (e) {
      if (isValidationError(e)) {
        const mapped: Record<number, string> = {}
        for (const [key, msg] of Object.entries(e.fields)) mapped[Number(key)] = msg
        errors.value = mapped
        focusFirstError()
      }
      // 5xx/network already toasted by the api client.
    } finally {
      submitting.value = false
    }
  }

  function focusFirstError(): void {
    if (!import.meta.client) return
    void nextTick(() => {
      const firstId = Object.keys(errors.value)[0]
      if (firstId) document.getElementById(`field-${firstId}`)?.focus()
    })
  }

  return {
    form,
    sections,
    answers,
    errors,
    guestEmail,
    needsGuestEmail,
    isClosed,
    isPriced,
    membersOnlyBlocked,
    submitting,
    submitted,
    submit,
    setAnswer,
  }
}

export type PublicFormState = Awaited<ReturnType<typeof usePublicForm>>
```

- [ ] **Step 2: Write `FormRenderer.vue`**

```vue
<script setup lang="ts">
import type { PublicFormState } from '~/features/forms/composables/usePublicForm'
import FormFieldCell from './FormFieldCell.vue'
const props = defineProps<{ state: PublicFormState }>()
const s = props.state
</script>

<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white/90">{{ s.form.title }}</h1>
      <p v-if="s.form.description" class="mt-1 text-gray-500 dark:text-gray-400">{{ s.form.description }}</p>
    </header>

    <!-- Success panel replaces the form once submitted -->
    <div
      v-if="s.submitted.value"
      class="rounded-xl border border-success-200 bg-success-50 p-6 text-success-800 dark:border-success-900 dark:bg-success-500/10 dark:text-success-200"
    >
      <p class="font-medium">Thanks! Your response was submitted.</p>
      <a v-if="s.submitted.value.edit_url" :href="s.submitted.value.edit_url" class="mt-1 inline-block text-sm underline">
        View or edit your response
      </a>
    </div>

    <template v-else>
      <p
        v-if="s.isClosed.value"
        class="rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        This form is closed and no longer accepting responses.
      </p>
      <p
        v-else-if="s.membersOnlyBlocked.value"
        class="rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        This form is for members only.
      </p>
      <template v-else>
        <p
          v-if="s.isPriced.value"
          class="rounded-lg bg-warning-50 p-4 text-sm text-warning-800 dark:bg-warning-500/10 dark:text-warning-200"
        >
          This form requires payment, which isn't available here yet.
        </p>

        <form class="space-y-8" novalidate @submit.prevent="s.submit()">
          <section v-for="section in s.sections.value" :key="section.id" class="space-y-3">
            <div v-if="section.title">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white/90">{{ section.title }}</h2>
              <p v-if="section.description" class="text-sm text-gray-500 dark:text-gray-400">{{ section.description }}</p>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormFieldCell
                v-for="field in section.fields"
                :key="field.id"
                :field="field"
                :model-value="s.answers[String(field.id)]"
                :error="s.errors.value[field.id]"
                @update:model-value="s.setAnswer(field.id, $event)"
              />
            </div>
          </section>

          <div v-if="s.needsGuestEmail.value">
            <label for="guest-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Your email <span class="text-danger-500">*</span>
            </label>
            <input
              id="guest-email"
              v-model="s.guestEmail.value"
              type="email"
              class="min-h-tap w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-base text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
            />
            <p v-if="s.errors.value[-1]" class="mt-1 text-sm text-danger-600 dark:text-danger-400">{{ s.errors.value[-1] }}</p>
          </div>

          <button
            type="submit"
            :disabled="s.submitting.value || s.isPriced.value"
            class="min-h-tap rounded-lg px-6 text-base font-medium text-white disabled:opacity-60"
            :style="{ backgroundColor: 'var(--color-brand-500)' }"
          >
            {{ s.submitting.value ? 'Submitting…' : s.form.submit_button_text || 'Submit' }}
          </button>
        </form>
      </template>
    </template>
  </div>
</template>
```

- [ ] **Step 3: Wire the page** — replace `app/pages/f/[slug].vue`

```vue
<script setup lang="ts">
import FormRenderer from '~/features/forms/components/FormRenderer.vue'
import { usePublicForm } from '~/features/forms/composables/usePublicForm'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const state = await usePublicForm(slug.value)
</script>

<template>
  <FormRenderer :state="state" />
</template>
```

- [ ] **Step 4: Render-verify against the dev backend** (needs the API up and a real published public form slug; discover one if unsure: `curl -s "$NUXT_PUBLIC_API_URL/forms/public" -H "X-Organization-Subdomain: <sub>"`)

```bash
cd /var/www/ticketplatform-customer-fe
NUXT_PUBLIC_API_URL=http://localhost:8000/v1 NUXT_PUBLIC_DEV_ORG_SUBDOMAIN=<sub> \
  sh -c '(npm run dev >/tmp/cfe.log 2>&1 &) && sleep 8 && curl -s http://localhost:3000/f/<form-slug> | grep -o "<h1[^>]*>[^<]*</h1>" | head -1; curl -s -o /dev/null -w "missing=%{http_code}\n" http://localhost:3000/f/__nope__; pkill -f "nuxt dev"'
```
Expected: the form's title `<h1>` is server-rendered for a real slug; an unknown slug returns `404`. If the backend is unavailable, instead confirm `npm run typecheck` passes and revisit the live check during integration.

- [ ] **Step 5: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck && npm run lint
git add app/features/forms/composables/usePublicForm.ts app/features/forms/components/FormRenderer.vue "app/pages/f/[slug].vue"
git commit -m "feat(forms): usePublicForm + renderer + page wiring (submit, validation, states)"
```

---

### Task 7: File & image upload

**Files:**
- Create: `app/features/forms/components/controls/FileField.vue`
- Modify: `app/features/forms/components/FieldControl.vue` (register file/image)
- Modify: `app/features/forms/composables/usePublicForm.ts` (add `uploadFile` + per-field upload state)
- Modify: `app/features/forms/validation.ts` — already includes file/image in `COLLECTING_TYPES`; add a required-upload check.

**Interfaces:**
- Consumes: `formsService.uploadFieldMedia` (Task 2).
- Produces:
  - composable adds `uploadFile(fieldId: number, file: File): Promise<void>` (stores returned `uuid` as the answer) and `uploads: Record<number, { uploading: boolean; filename: string | null }>`.
  - `FileField` props: `:field`, `:modelValue` (the uuid | ''), `:invalid`, `:uploading`, `:filename`; emits `select` (File) and `clear`.

- [ ] **Step 1: Add required-upload validation** — in `validation.ts`, inside `validateField`, before the final `return null`, add:

```ts
  if ((field.type === 'file' || field.type === 'image') && field.required && isEmpty(value)) {
    return `${field.label} is required`
  }
```

(Required-empty is already caught by the generic `required` check at the top; this is a no-op guard kept for clarity if the generic check changes. Skip if redundant in your reading.)

- [ ] **Step 2: Write `FileField.vue`**

```vue
<script setup lang="ts">
import { Loader2, Upload, X } from '#icons'
import type { Field } from '~/features/forms/types'
import { borderClass } from './inputClass'
const props = defineProps<{
  field: Field
  modelValue: unknown
  invalid?: boolean
  uploading?: boolean
  filename?: string | null
}>()
const emit = defineEmits<{ select: [File]; clear: [] }>()
const accept = () => (props.field.type === 'image' ? 'image/*' : undefined)
function onChange(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <label
      :class="[
        'flex min-h-tap cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-gray-600 hover:border-brand-500 dark:text-gray-300',
        borderClass(props.invalid ?? false),
      ]"
    >
      <input :id="`field-${field.id}`" type="file" :accept="accept()" class="sr-only" @change="onChange" />
      <Loader2 v-if="uploading" :size="18" class="animate-spin text-brand-500" />
      <Upload v-else :size="18" class="text-gray-400" />
      <span>{{ uploading ? 'Uploading…' : 'Choose a file' }}</span>
    </label>
    <p v-if="filename && !uploading" class="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      {{ filename }}
      <button type="button" class="text-gray-400 hover:text-danger-600" aria-label="Remove file" @click="emit('clear')">
        <X :size="14" />
      </button>
    </p>
  </div>
</template>
```

- [ ] **Step 3: Register file/image in `FieldControl.vue`** — import `FileField` and handle the two types explicitly (they need extra props/events the generic control branch doesn't pass). Replace the dispatcher template's control branch with:

```vue
  <FileField
    v-else-if="field.type === 'file' || field.type === 'image'"
    :field="field"
    :model-value="modelValue"
    :invalid="invalid"
    :uploading="upload?.uploading"
    :filename="upload?.filename"
    @select="emit('upload', $event)"
    @clear="emit('update:modelValue', '')"
  />
```

Add to `FieldControl`'s props `upload?: { uploading: boolean; filename: string | null }` and to its emits `upload: [File]`; import `FileField from './controls/FileField.vue'`. Thread `:upload` and `@upload` through `FormFieldCell` (add the same prop/emit and pass to `FieldControl`), and in `FormRenderer` pass `:upload="s.uploads[field.id]"` and `@upload="s.uploadFile(field.id, $event)"` on `FormFieldCell`.

- [ ] **Step 4: Add upload state to `usePublicForm.ts`**

```ts
  const uploads = reactive<Record<number, { uploading: boolean; filename: string | null }>>({})
  async function uploadFile(fieldId: number, file: File): Promise<void> {
    uploads[fieldId] = { uploading: true, filename: file.name }
    try {
      const media = await formsService.uploadFieldMedia(slug, fieldId, file)
      setAnswer(fieldId, media.uuid)
      uploads[fieldId] = { uploading: false, filename: media.original_filename }
    } catch {
      uploads[fieldId] = { uploading: false, filename: null }
      // api client already toasted the failure
    }
  }
```

Add `uploads` and `uploadFile` to the composable's returned object.

- [ ] **Step 5: Typecheck + commit**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck && npm run lint && npm test
git add app/features/forms
git commit -m "feat(forms): file and image upload (staged media -> uuid)"
```

---

### Task 8: Quality gates, feature doc, foundation update

**Files:**
- Create: `app/features/forms/README.md`
- Modify: `docs/features/foundation.md` (move Forms from out-of-scope to shipped, with a pointer)

**Interfaces:**
- Produces: green gates + a short feature doc.

- [ ] **Step 1: Write `app/features/forms/README.md`** — one screen: what it does (`/f/{slug}` public form fill + submit incl. upload), the layer order (service → validation → composable → renderer), the dispatcher extension point (add a type = one control + one `FieldControl` map entry), and the explicit deferrals (payment, conditional logic, multi-step, `product`/`duration`, edit-submission page).

- [ ] **Step 2: Update `docs/features/foundation.md`** — under the out-of-scope list, note Forms rendering/submission is now shipped (link `app/features/forms/README.md`); leave events/payment/etc. deferred.

- [ ] **Step 3: Run the full gate**

```bash
cd /var/www/ticketplatform-customer-fe && npm run typecheck && npm run lint && npm test && npm run format:dirty
```
Expected: typecheck 0, lint 0/0, all specs pass.

- [ ] **Step 4: Commit**

```bash
cd /var/www/ticketplatform-customer-fe
git add app/features/forms/README.md docs/features/foundation.md
git commit -m "docs(forms): feature README + foundation inventory update"
```

---

## Self-review

**Spec coverage:** fetch-by-slug + SSR → Task 6 (`usePublicForm` `useAsyncData`, page); render display + input fields → Tasks 4–5; layout (col_span→2-col max, mobile-first) → Task 5 (`cellClass`) + Task 6 (grid); validation (metadata + 422 into one map) → Task 3 + Task 6 (`submit`); submit + guest email → Task 6; file/image upload → Task 7; states (not-found/closed/members-only/priced-guard/success) → Task 6; deferred `duration`/`product` muted note → Task 5 dispatcher; types snake_case → Task 2; a11y (label/aria/focus-first-error/44px) → Tasks 5–6; testing (service + validation specs, render checks) → Tasks 2, 3, 6; tokens/no-`any`/SSR-safe → global + per task.

**Placeholder scan:** No "TBD/TODO". The Task 4 "create identically, changing only the `type`" is explicit (exact attribute values listed) — acceptable per DRY. Live render checks (Task 6/7) carry an explicit fallback when the backend is down.

**Type consistency:** `Form`/`Field`/`FieldOption`/`SubmitResult`/`UploadedMedia`/`SubmitAnswers` (Task 2) are used unchanged in services, validation, composable, and components. `validateField`/`validateAll`/`isCollecting` (Task 3) signatures match call sites in Task 6. `usePublicForm` returns the exact members `FormRenderer` reads (`form`, `sections`, `answers`, `errors`, `guestEmail`, `needsGuestEmail`, `isClosed`, `isPriced`, `membersOnlyBlocked`, `submitting`, `submitted`, `submit`, `setAnswer`, plus `uploads`/`uploadFile` from Task 7). Control prop/emit shape (`field`/`modelValue`/`invalid` → `update:modelValue`) is uniform across Tasks 4–5.
