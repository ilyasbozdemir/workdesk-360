import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Global test timeout: Electron launch + DB init + migration + window show için yeterli süre.
  // Her test için bireysel timeout test.setTimeout() ile override edilebilir.
  timeout: 120000,
  expect: {
    timeout: 20000
  },
  fullyParallel: false,
  workers: 1, // Electron pencereleri tekil çalıştırılır
  retries: process.env.CI ? 1 : 0, // CI'da geçici flaky başarısızlıklar için 1 retry
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-report', open: 'never' }],
    // CI'da GitHub Actions log formatı
    ...(process.env.CI ? ([['github']] as const) : [])
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure'
  }
})
