// @ts-check
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import withNuxt from './.nuxt/eslint.config.mjs'

// Customer app lint: Nuxt's recommended config + Prettier, with the no-`any` gate. The staff app's
// architecture-enforcement rules (layer boundaries, token/icon bans) can be ported here if the
// customer app grows enough features to need them.
export default withNuxt(eslintPluginPrettier, {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
