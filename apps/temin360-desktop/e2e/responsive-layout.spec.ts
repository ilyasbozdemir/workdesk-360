import { test, expect, Page } from '@playwright/test'
import fs from 'fs'
import {
  launchTestApp,
  takeE2EScreenshot,
  DESKTOP_TEST_FILE,
  TestAppInstance
} from './helpers/electronHelper'

/**
 * Küçük ekran / düşük çözünürlük / Windows ölçekleme (%125, %150) yerleşim testleri.
 *
 * Ölçekleme, gerçek işletim sistemi ölçeklemesinde pencerenin CSS piksel (DIP)
 * boyutunun küçülmesine denktir; bu yüzden hem eşdeğer DIP boyutları hem de
 * webContents zoom faktörü ile doğrulanır.
 */

interface Scenario {
  name: string
  width: number
  height: number
  zoom: number
}

const SCENARIOS: Scenario[] = [
  { name: '1024x600', width: 1024, height: 600, zoom: 1 },
  { name: '1280x720', width: 1280, height: 720, zoom: 1 },
  { name: '1366x768', width: 1366, height: 768, zoom: 1 },
  { name: '1920x1080', width: 1920, height: 1080, zoom: 1 },
  // 1366x768 ekranda %125 ve %150 ölçekleme (zoom faktörü ile)
  { name: '1366x768 @125%', width: 1366, height: 768, zoom: 1.25 },
  { name: '1366x768 @150%', width: 1366, height: 768, zoom: 1.5 },
  // 1024x600 ekranda %125 ölçekleme (eşdeğer DIP boyutu ~819x480)
  { name: '1024x600 @125% (819x480 DIP)', width: 819, height: 480, zoom: 1 },
  // Pencerenin inebileceği en küçük boyut
  { name: 'minimum pencere (800x420)', width: 800, height: 420, zoom: 1 }
]

async function resizeWindow(
  appInstance: TestAppInstance,
  { width, height, zoom }: Scenario
): Promise<void> {
  await appInstance.electronApp.evaluate(
    ({ BrowserWindow }, { width, height, zoom }) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win.isMaximized()) win.unmaximize()
      win.setContentSize(width, height)
      win.webContents.setZoomFactor(zoom)
    },
    { width, height, zoom }
  )
  // Yeniden boyutlandırma ve React yeniden yerleşimi için bekle
  await appInstance.page.waitForTimeout(500)
}

interface LayoutReport {
  viewport: { w: number; h: number }
  violations: string[]
  railShortcutCount: number
}

async function collectLayoutReport(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const violations: string[] = []
    const vw = window.innerWidth
    const vh = window.innerHeight
    const TOL = 1.5

    const inViewport = (r: DOMRect): boolean =>
      r.left >= -TOL && r.top >= -TOL && r.right <= vw + TOL && r.bottom <= vh + TOL
    const overlap = (a: DOMRect, b: DOMRect): boolean =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
    const label = (el: Element): string =>
      (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40)

    // 1. Sayfa düzeyinde yatay/dikey taşma
    const root = document.documentElement
    if (root.scrollWidth > vw + TOL)
      violations.push(`sayfa yatay taşıyor (${root.scrollWidth}>${vw})`)
    if (root.scrollHeight > vh + TOL)
      violations.push(`sayfa dikey taşıyor (${root.scrollHeight}>${vh})`)

    // 2. Sol hızlı erişim menüsü
    const rail = document.querySelector('[data-testid="active-file-rail"]') as HTMLElement | null
    const scrollArea = document.querySelector('[data-testid="rail-scroll"]') as HTMLElement | null
    const footer = document.querySelector('[data-testid="rail-footer"]') as HTMLElement | null
    let railShortcutCount = 0
    if (!rail || !scrollArea || !footer) {
      violations.push('sol menü (rail) bulunamadı')
    } else {
      const railRect = rail.getBoundingClientRect()
      if (!inViewport(railRect)) violations.push('sol menü ekran dışında kalıyor')

      // Alt bölüm (ikincil bağlantılar + profil) her zaman görünür olmalı
      const footerItems = Array.from(footer.querySelectorAll('a'))
      if (footerItems.length < 4) violations.push(`alt menüde ${footerItems.length} öğe var (<4)`)
      footerItems.forEach((el) => {
        if (!inViewport(el.getBoundingClientRect())) {
          violations.push(`alt menü öğesi ekran dışında: ${label(el)}`)
        }
      })
      for (let i = 0; i < footerItems.length; i++) {
        for (let j = i + 1; j < footerItems.length; j++) {
          if (
            overlap(footerItems[i].getBoundingClientRect(), footerItems[j].getBoundingClientRect())
          ) {
            violations.push(
              `alt menü öğeleri üst üste biniyor: ${label(footerItems[i])} / ${label(footerItems[j])}`
            )
          }
        }
      }

      // Kaydırılabilir bölüm alt bölümle çakışmamalı
      if (scrollArea.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + TOL) {
        violations.push('kaydırılabilir menü alt bölümün üstüne biniyor')
      }
      const overflowY = getComputedStyle(scrollArea).overflowY
      const needsScroll = scrollArea.scrollHeight > scrollArea.clientHeight + 1
      if (needsScroll && overflowY !== 'auto' && overflowY !== 'scroll') {
        violations.push('menü sığmıyor ama kaydırılamıyor')
      }

      // Tüm ana öğelere kaydırarak erişilebilmeli
      const prevBehavior = scrollArea.style.scrollBehavior
      scrollArea.style.scrollBehavior = 'auto'
      const items = Array.from(scrollArea.querySelectorAll('a'))
      railShortcutCount = items.length + footerItems.length
      items.forEach((el) => {
        el.scrollIntoView({ behavior: 'instant', block: 'nearest' } as ScrollIntoViewOptions)
        const r = el.getBoundingClientRect()
        const sr = scrollArea.getBoundingClientRect()
        if (r.top < sr.top - TOL || r.bottom > sr.bottom + TOL || !inViewport(r)) {
          violations.push(`ana menü öğesine erişilemiyor: ${label(el)}`)
        }
      })
      // Üst öğeleri birbirinin üstüne binmemeli
      scrollArea.scrollTop = 0
      scrollArea.style.scrollBehavior = prevBehavior
      for (let i = 1; i < items.length; i++) {
        if (overlap(items[i - 1].getBoundingClientRect(), items[i].getBoundingClientRect())) {
          violations.push(`ana menü öğeleri üst üste biniyor: ${label(items[i])}`)
        }
      }
    }

    // 3. Üst başlıktaki etkileşimli öğeler yatayda pencere dışına taşmamalı
    document.querySelectorAll('header button, header a, header [role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      if (r.right > vw + TOL || r.left < -TOL) {
        violations.push(`üst başlık öğesi pencere dışında: ${label(el)}`)
      }
    })

    // 4. Alt bilgi çubuğu görünür olmalı
    const pageFooter = document.querySelector('footer') as HTMLElement | null
    if (pageFooter && !inViewport(pageFooter.getBoundingClientRect())) {
      violations.push('alt bilgi çubuğu ekran dışında')
    }

    // 5. Ana içerik alanı kullanılabilir olmalı
    const main = document.querySelector('main') as HTMLElement | null
    if (!main || main.getBoundingClientRect().height < 80) {
      violations.push('ana içerik alanı çok küçük/yok')
    }

    return { viewport: { w: vw, h: vh }, violations, railShortcutCount }
  })
}

test.describe('E2E: Küçük ekran ve ölçekleme için responsive yerleşim', () => {
  let appInstance: TestAppInstance

  test.beforeAll(async () => {
    test.setTimeout(120000)
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page } = appInstance

    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('text=E2E Otomasyon Test Kurumu').first()).toBeVisible({
      timeout: 20000
    })

    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      await page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
        .click()
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    // Sol menü yalnızca aktif bir dosya seçiliyken görünür: dosya kaydını garanti edip
    // aktif dosya olarak ayarla (oturum durumu yeniden yüklemede korunur).
    await page.evaluate(async () => {
      localStorage.setItem('temin_splash_enabled', 'false')
      // @ts-expect-error electron IPC renderer API
      await window.electron.ipcRenderer.invoke(
        'db:run',
        "INSERT OR IGNORE INTO DATA_TeminDosyasi (id, temin_no, konu, tur, ihale_sekli) VALUES (1, '2026/E2E-01', 'Responsive Test Dosyası', 'mal', '22/d')"
      )
      sessionStorage.setItem('workspace_dosya_id', '1')
    })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const acceptBtn = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click()
    }
    await expect(page.locator('[data-testid="active-file-rail"]')).toBeVisible({ timeout: 20000 })
  })

  test.afterAll(async () => {
    if (appInstance) await appInstance.close()
  })

  for (const scenario of SCENARIOS) {
    test(`Yerleşim bozulmamalı: ${scenario.name}`, async () => {
      await resizeWindow(appInstance, scenario)
      const report = await collectLayoutReport(appInstance.page)
      const safeName = scenario.name.replace(/[^a-z0-9]+/gi, '_')
      await takeE2EScreenshot(appInstance.page, `responsive-${safeName}.png`)
      expect(
        report.violations,
        `${scenario.name} (viewport ${report.viewport.w}x${report.viewport.h}): ${report.violations.join(' | ')}`
      ).toEqual([])
      expect(report.railShortcutCount).toBeGreaterThanOrEqual(14)

      // Somut görünürlük doğrulaması: Kurum alanı ve alt profil/ayarlar öğeleri
      // viewport sınırları içinde olmalı, taşmamalı ve tıklanabilir olmalıdır.
      const profile = appInstance.page.locator('[data-testid="rail-profile"]')
      await expect(profile).toBeVisible()
      const pBox = await profile.boundingBox()
      expect(pBox).not.toBeNull()
      expect(pBox!.x).toBeGreaterThanOrEqual(-1)
      expect(pBox!.y).toBeGreaterThanOrEqual(-1)
      expect(pBox!.y + pBox!.height).toBeLessThanOrEqual(report.viewport.h + 2)

      const footer = appInstance.page.locator('[data-testid="rail-footer"]')
      await expect(footer).toBeVisible()
      const fBox = await footer.boundingBox()
      expect(fBox).not.toBeNull()
      expect(fBox!.y + fBox!.height).toBeLessThanOrEqual(report.viewport.h + 2)

      const firstFooterLink = footer.locator('a').first()
      await expect(firstFooterLink).toBeVisible()
      await expect(firstFooterLink).toBeEnabled()
    })
  }

  test('Profil/kurum öğesi kurum adını içermeli ve tooltip pencere içinde kalmalı (minimum pencere)', async () => {
    const { page } = appInstance
    await resizeWindow(appInstance, SCENARIOS[SCENARIOS.length - 1])

    const profile = page.locator('[data-testid="rail-profile"]')
    await expect(profile).toBeVisible()
    await expect(profile).toHaveAttribute('aria-label', /E2E Otomasyon Test Kurumu/)

    const acceptBtn = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await acceptBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await acceptBtn.click()
    }
    await page.keyboard.press('Escape')
    await profile.hover({ force: true })
    const tooltip = page.locator('[role="tooltip"]').first()
    await expect(tooltip).toBeVisible()
    const box = await tooltip.boundingBox()
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.w + 1)
    expect(box!.y + box!.height).toBeLessThanOrEqual(vp.h + 1)
  })

  test('Pencere yeniden boyutlandırıldığında yerleşim bozulmamalı', async () => {
    const sequence: Scenario[] = [
      SCENARIOS[3], // 1920x1080
      SCENARIOS[0], // 1024x600
      SCENARIOS[2], // 1366x768
      SCENARIOS[7], // 800x420
      SCENARIOS[1] // 1280x720
    ]
    for (const step of sequence) {
      await resizeWindow(appInstance, step)
      const report = await collectLayoutReport(appInstance.page)
      expect(report.violations, `yeniden boyutlandırma: ${step.name}`).toEqual([])
    }
  })

  test('Pencere minimum boyutu küçük ekranlara izin vermeli', async () => {
    const min = await appInstance.electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].getMinimumSize()
    )
    expect(min[0]).toBeLessThanOrEqual(800)
    expect(min[1]).toBeLessThanOrEqual(420)
  })
})
