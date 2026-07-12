import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['app/**/*.spec.ts', 'server/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '#core': fileURLToPath(new URL('./fe-core/app/core', import.meta.url)),
      '#icons': fileURLToPath(
        new URL(`./fe-core/app/icons/${process.env.NUXT_PUBLIC_ICON_SET || 'lucide'}/index.ts`, import.meta.url)
      ),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
})
