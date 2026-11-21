import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@temin360/domain': fileURLToPath(new URL('../domain/src/index.ts', import.meta.url)),
    },
  },
})
