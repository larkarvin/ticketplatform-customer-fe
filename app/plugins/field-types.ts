// plugins/field-types.ts
// Register the app's domain-specific field types into the shared engine registry. Runs on server +
// client before render, so the dispatcher/validator/seed see `product` during SSR and hydration.
// "product" is domain vocabulary, so it lives here (a feature extension), not in the neutral core.
import { registerFieldType } from '#core/field-engine/registry'
import ProductField from '~/features/forms/components/controls/ProductField.vue'

export default defineNuxtPlugin(() => {
  registerFieldType({
    type: 'product',
    component: ProductField,
    collectsData: true,
    defaultValue: () => [], // submit value is an array of { variant_id, quantity }
  })
})
