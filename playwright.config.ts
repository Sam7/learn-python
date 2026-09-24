import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Pyodide is initialized inside every browser context. Serializing the
  // suite avoids competing CDN/runtime downloads and keeps readiness tests
  // deterministic on local and Vercel-like machines.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5187',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', grepInvert: /@tablet/, use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-ipad-landscape', grep: /@tablet/, use: { ...devices['iPad Pro 11 landscape'] } },
    { name: 'webkit-ipad-portrait', grep: /@tablet/, use: { ...devices['iPad Pro 11'] } },
  ],
})
