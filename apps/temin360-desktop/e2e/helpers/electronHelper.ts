import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { execSync } from 'child_process'

export interface TestAppInstance {
  electronApp: ElectronApplication
  page: Page
  userDataDir: string
  consoleLogs: { type: string; text: string; location?: string }[]
  pageErrors: Error[]
  assertNoUnhandledErrors: () => void
  assertNoCriticalConsoleErrors: (extraAllowedPatterns?: (string | RegExp)[]) => void
  close: (options?: { assertNoErrors?: boolean }) => Promise<void>
}

export interface LaunchTestAppOptions {
  extraArgs?: string[]
  enableSingleInstanceLock?: boolean
  userDataDir?: string
}

export function resolveWindowsDesktopDir(): string {
  const customDir = process.env.E2E_DESKTOP_DIR ? process.env.E2E_DESKTOP_DIR.trim() : null
  if (customDir) {
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true })
    }
    return customDir
  }
  if (process.platform === 'win32') {
    try {
      const psOutput = execSync(
        'powershell -NoProfile -Command "[Environment]::GetFolderPath(\'Desktop\')"',
        { encoding: 'utf-8', timeout: 5000 }
      ).trim()
      if (psOutput && fs.existsSync(psOutput)) {
        return psOutput
      }
    } catch {
      // ignore
    }

    const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop')
    if (fs.existsSync(oneDriveDesktop)) return oneDriveDesktop

    const oneDriveMasaustu = path.join(os.homedir(), 'OneDrive', 'Masaüstü')
    if (fs.existsSync(oneDriveMasaustu)) return oneDriveMasaustu
  }

  const standardDesktop = path.join(os.homedir(), 'Desktop')
  if (!fs.existsSync(standardDesktop)) {
    fs.mkdirSync(standardDesktop, { recursive: true })
  }
  return standardDesktop
}

export const DESKTOP_DIR = resolveWindowsDesktopDir()
export const DESKTOP_TEST_DIR = path.join(DESKTOP_DIR, 'Temin360-E2E-Test')
export const DESKTOP_TEST_FILE = path.join(DESKTOP_TEST_DIR, 'e2e-test-kurumu.temin')
export const DESKTOP_SECOND_FILE = path.join(DESKTOP_TEST_DIR, 'e2e-ikinci-kurum.temin')
export const SCREENSHOTS_DIR = path.resolve(__dirname, '../../e2e-screenshots')

export async function launchTestApp(
  argsOrOptions: string[] | LaunchTestAppOptions = []
): Promise<TestAppInstance> {
  let extraArgs: string[] = []
  let enableSingleInstanceLock = false
  let customUserDataDir: string | undefined

  if (Array.isArray(argsOrOptions)) {
    extraArgs = argsOrOptions
  } else {
    extraArgs = argsOrOptions.extraArgs || []
    enableSingleInstanceLock = argsOrOptions.enableSingleInstanceLock || false
    customUserDataDir = argsOrOptions.userDataDir
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  }

  const appDir = path.resolve(__dirname, '../..')
  const mainScript = path.join(appDir, 'out/main/index.js')
  const userDataDir =
    customUserDataDir || fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-e2e-session-'))

  const consoleLogs: { type: string; text: string; location?: string }[] = []
  const pageErrors: Error[] = []

  const defaultHeadlessFlags = [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox'
  ]

  const launchArgs = [
    mainScript,
    ...(enableSingleInstanceLock ? [] : ['--multi-instance']),
    `--user-data-dir=${userDataDir}`,
    ...defaultHeadlessFlags,
    ...extraArgs
  ]

  const cleanEnv = { ...process.env }
  delete cleanEnv.ELECTRON_RUN_AS_NODE

  const electronApp = await electron.launch({
    args: launchArgs,
    cwd: appDir,
    env: {
      ...cleanEnv,
      NODE_ENV: 'test',
      ELECTRON_ENABLE_LOGGING: '1'
    }
  })

  const page = await electronApp.firstWindow()

  // Track console logs and errors
  page.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    consoleLogs.push({
      type,
      text,
      location: msg.location()?.url
    })
    if (type === 'error') {
      console.error(`[RENDERER CONSOLE ERROR] ${text}`)
    }
  })

  page.on('pageerror', (err) => {
    pageErrors.push(err)
    console.error(`[RENDERER UNHANDLED ERROR] ${err.message}`)
  })

  const assertNoUnhandledErrors = (): void => {
    if (pageErrors.length > 0) {
      const messages = pageErrors.map((e) => e.stack || e.message).join('\n---\n')
      throw new Error(
        `[E2E ASSERTION FAILED] Renderer sürecinde ${pageErrors.length} adet beklenmeyen JavaScript hatası (pageerror) tespit edildi:\n${messages}`
      )
    }
  }

  const assertNoCriticalConsoleErrors = (extraAllowedPatterns: (string | RegExp)[] = []): void => {
    const defaultAllowed = [
      'Failed to load resource: net::ERR_FILE_NOT_FOUND',
      'Failed to load resource: net::ERR_INVALID_URL',
      'favicon.ico',
      'Electron Security Warning'
    ]
    const allAllowed = [...defaultAllowed, ...extraAllowedPatterns]
    const criticalErrors = consoleLogs.filter(
      (log) =>
        log.type === 'error' &&
        !allAllowed.some((pattern) =>
          typeof pattern === 'string' ? log.text.includes(pattern) : pattern.test(log.text)
        )
    )
    if (criticalErrors.length > 0) {
      const messages = criticalErrors
        .map((l) => `${l.text} (${l.location || 'unknown'})`)
        .join('\n')
      throw new Error(
        `[E2E ASSERTION FAILED] Renderer konsolunda ${criticalErrors.length} adet kritik hata tespit edildi:\n${messages}`
      )
    }
  }

  const close = async (options?: { assertNoErrors?: boolean }): Promise<void> => {
    try {
      if (options?.assertNoErrors !== false) {
        assertNoUnhandledErrors()
      }
    } finally {
      try {
        if (electronApp) {
          await electronApp.close()
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.warn('Error while closing Electron app:', msg)
      } finally {
        try {
          if (userDataDir && fs.existsSync(userDataDir)) {
            fs.rmSync(userDataDir, { recursive: true, force: true })
          }
        } catch {
          // Geçici test dizini silme hatası ihmal edilebilir
        }
      }
    }
  }

  return {
    electronApp,
    page,
    userDataDir,
    consoleLogs,
    pageErrors,
    assertNoUnhandledErrors,
    assertNoCriticalConsoleErrors,
    close
  }
}

export function cleanTestArtifacts(): void {
  if (fs.existsSync(DESKTOP_TEST_DIR)) {
    try {
      const files = fs.readdirSync(DESKTOP_TEST_DIR)
      for (const file of files) {
        if (
          file.endsWith('.lock') ||
          file.includes('temp') ||
          file.includes('kalicilik') ||
          file.includes('izolasyon')
        ) {
          try {
            fs.unlinkSync(path.join(DESKTOP_TEST_DIR, file))
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

export async function mockOpenFileDialog(
  electronApp: ElectronApplication,
  targetFilePath: string
): Promise<void> {
  await electronApp.evaluate(async ({ dialog }, filePath) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [filePath]
    })
  }, targetFilePath)
}

export async function mockSaveFileDialog(
  electronApp: ElectronApplication,
  targetFilePath: string
): Promise<void> {
  await electronApp.evaluate(async ({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({
      canceled: false,
      filePath
    })
  }, targetFilePath)
}

export async function takeE2EScreenshot(page: Page, fileName: string): Promise<string> {
  const screenshotPath = path.join(SCREENSHOTS_DIR, fileName)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`📸 Ekran görüntüsü kaydedildi: ${screenshotPath}`)
  return screenshotPath
}
