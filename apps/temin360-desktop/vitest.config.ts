import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'src/renderer/src/testSetup.ts')],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', 'scripts/**/*.{test,spec}.{js,ts}'],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
