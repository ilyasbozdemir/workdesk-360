import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  workers: 1, // Electron pencereleri tekil çalıştırılır
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure'
  }
})
