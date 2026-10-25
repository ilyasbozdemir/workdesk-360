import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  parseScope,
  getFileLines,
  isTestFile,
  countFile,
  countDir,
  resolvePackages,
  readWorkspacePatterns,
  sourceDirOf,
  sleepSync,
  areJsonObjectsEquivalent,
  acquireLock,
  releaseLock,
  RETRY_CODES,
  writeLocJsonAtomic,
  runCount,
  allowedExtensions,
  ignoredDirs
} = require('../count-loc.js')

describe('LOC Counter (count-loc.js) Kapsamlı Test Paketi', () => {
  let tempRoot: string

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  describe('1. Satır Ayrıştırma ve Normalizasyon Kuralları (getFileLines)', () => {
    it('boş dosya (0 bayt) için 0 satır döndürür', () => {
      expect(getFileLines('')).toEqual([])
      expect(getFileLines(null)).toEqual([])
      expect(getFileLines(undefined)).toEqual([])
    })

    it('satır sonu karakteri olmayan tek satırlık dosyayı 1 satır olarak sayar', () => {
      const res = getFileLines('const x = 1;')
      expect(res).toEqual(['const x = 1;'])
      expect(res.length).toBe(1)
    })

    it('LF ile biten tek satırlık dosyayı (Prettier standardı) 1 satır sayar, hayali boş satır üretmez', () => {
      const res = getFileLines('const x = 1;\n')
      expect(res).toEqual(['const x = 1;'])
      expect(res.length).toBe(1)
    })

    it('CRLF ile biten tek satırlık dosyayı (Windows standardı) 1 satır sayar', () => {
      const res = getFileLines('const x = 1;\r\n')
      expect(res).toEqual(['const x = 1;'])
      expect(res.length).toBe(1)
    })

    it('LF ve CRLF içeren çok satırlı dosyaları eşit sayıda satıra böler', () => {
      const lf = getFileLines('satir1\nsatir2\nsatir3\n')
      const crlf = getFileLines('satir1\r\nsatir2\r\nsatir3\r\n')
      expect(lf).toEqual(['satir1', 'satir2', 'satir3'])
      expect(crlf).toEqual(['satir1', 'satir2', 'satir3'])
      expect(lf.length).toBe(3)
      expect(crlf.length).toBe(3)
    })

    it('dosya sonundaki gerçek boş satırları (çift enter) doğru şekilde korur', () => {
      const res = getFileLines('satir1\n\n')
      expect(res).toEqual(['satir1', ''])
      expect(res.length).toBe(2)
    })

    it('yalnızca boşluk/tab içeren satırları satır olarak sayar fakat kod satırı saymaz', () => {
      const res = getFileLines('   \n\t\t\n')
      expect(res.length).toBe(2)
      let nonBlank = 0
      for (const line of res) {
        if (line.trim().length > 0) nonBlank++
      }
      expect(nonBlank).toBe(0)
    })
  })

  describe('2. Test Dosyası Sınıflandırması (isTestFile)', () => {
    it('__tests__ klasöründeki dosyaları test olarak tanır', () => {
      expect(isTestFile('src/renderer/src/screens/__tests__/Dosya.test.tsx')).toBe(true)
      expect(isTestFile('packages/document-templates/src/__tests__/registry.test.ts')).toBe(true)
    })

    it('.test.* ve .spec.* uzantılı dosyaları test olarak tanır', () => {
      expect(isTestFile('src/utils/math.test.ts')).toBe(true)
      expect(isTestFile('src/components/Button.spec.tsx')).toBe(true)
      expect(isTestFile('scripts/__tests__/version.test.ts')).toBe(true)
    })

    it('mock, fixture ve e2e dizinlerini test olarak tanır', () => {
      expect(isTestFile('src/renderer/src/__mocks__/api.ts')).toBe(true)
      expect(isTestFile('src/renderer/src/__fixtures__/sample.ts')).toBe(true)
      expect(isTestFile('apps/app-desktop/e2e/smoke.spec.ts')).toBe(true)
    })

    it('normal üretim dosyalarını test olarak sınıflandırmaz', () => {
      expect(isTestFile('src/renderer/src/screens/dosya/DosyaView.tsx')).toBe(false)
      expect(isTestFile('src/main/index.ts')).toBe(false)
      expect(isTestFile('packages/database/src/schema.ts')).toBe(false)
      expect(isTestFile('packages/document-templates/src/templates/LuzumMuzekkeresi.tsx')).toBe(
        false
      )
    })
  })

  describe('3. Dosya Sayımı ve Metrik Bütünlüğü (countFile)', () => {
    it('boş olmayan, boş satırları ve toplam satırları matematiksel olarak tutarlı hesaplar', () => {
      const filePath = path.join(tempRoot, 'sample.ts')
      fs.writeFileSync(
        filePath,
        'import React from "react"\n\nconst a = 1\n// aciklama\n\nexport default a\n'
      )
      const stat = countFile(filePath)
      expect(stat.lines).toBe(6)
      expect(stat.code).toBe(4) // nonBlank: import, const, // aciklama, export
      expect(stat.blank).toBe(2) // 2 boş satır
      expect(stat.lines).toBe(stat.code + stat.blank)
      expect(stat.isTest).toBe(false)
    })
  })

  describe('4. Dizin Tarama, Uzantı ve Hariç Tutma Filtreleri (countDir)', () => {
    it('izin verilen uzantıları (.ts, .tsx, .css, .html, .js, .jsx) dahil eder, diğerlerini (.json, .md, .png) eler', () => {
      const dir = path.join(tempRoot, 'src')
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'app.tsx'), 'const a = 1;\n')
      fs.writeFileSync(path.join(dir, 'style.css'), 'body { margin: 0; }\n')
      fs.writeFileSync(path.join(dir, 'index.html'), '<html></html>\n')
      fs.writeFileSync(path.join(dir, 'data.json'), '{"name": "test"}\n')
      fs.writeFileSync(path.join(dir, 'readme.md'), '# Readme\n')

      const acc = {
        files: 0,
        lines: 0,
        code: 0,
        blank: 0,
        testFiles: 0,
        testLines: 0,
        testCode: 0,
        prodFiles: 0,
        prodLines: 0,
        prodCode: 0
      }
      countDir(dir, acc)

      expect(acc.files).toBe(3) // app.tsx, style.css, index.html
      expect(acc.prodFiles).toBe(3)
      expect(acc.testFiles).toBe(0)
    })

    it('.d.ts ve minified (*.min.*) dosyaları hariç tutar', () => {
      const dir = path.join(tempRoot, 'src')
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'types.d.ts'), 'export type X = string;\n')
      fs.writeFileSync(path.join(dir, 'bundle.min.js'), 'console.log(1);\n')
      fs.writeFileSync(path.join(dir, 'valid.ts'), 'export const y = 2;\n')

      const acc = {
        files: 0,
        lines: 0,
        code: 0,
        blank: 0,
        testFiles: 0,
        testLines: 0,
        testCode: 0,
        prodFiles: 0,
        prodLines: 0,
        prodCode: 0
      }
      countDir(dir, acc)

      expect(acc.files).toBe(1)
      expect(acc.code).toBe(1)
    })

    it('hariç tutulan dizinleri (node_modules, dist, out, coverage, .git vb.) taramaz', () => {
      const dir = path.join(tempRoot, 'src')
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'index.ts'), 'export const a = 1;\n')

      for (const ign of [
        'node_modules',
        'dist',
        'out',
        'coverage',
        '.git',
        '.next',
        'dist-local'
      ]) {
        const sub = path.join(dir, ign)
        fs.mkdirSync(sub, { recursive: true })
        fs.writeFileSync(path.join(sub, 'ignored.ts'), 'console.log("ignore me");\n')
      }

      const acc = {
        files: 0,
        lines: 0,
        code: 0,
        blank: 0,
        testFiles: 0,
        testLines: 0,
        testCode: 0,
        prodFiles: 0,
        prodLines: 0,
        prodCode: 0
      }
      countDir(dir, acc)

      expect(acc.files).toBe(1) // yalnızca root index.ts
    })

    it('çıktı dosyasını (generated-loc.json veya .tmp) sayaca kazara dahil etmez', () => {
      const dir = path.join(tempRoot, 'src')
      fs.mkdirSync(dir, { recursive: true })
      const outputFile = path.join(dir, 'generated-loc.json')
      fs.writeFileSync(outputFile, '{"totalFiles": 999}\n')
      fs.writeFileSync(path.join(dir, 'temp.tmp'), 'temporary data\n')
      fs.writeFileSync(path.join(dir, 'code.ts'), 'const x = 10;\n')

      const acc = {
        files: 0,
        lines: 0,
        code: 0,
        blank: 0,
        testFiles: 0,
        testLines: 0,
        testCode: 0,
        prodFiles: 0,
        prodLines: 0,
        prodCode: 0
      }
      countDir(dir, acc, outputFile)

      expect(acc.files).toBe(1) // sadece code.ts
    })
  })

  describe('5. Atomik Yazma, Windows EPERM/EBUSY Dayanıklılığı ve Kilitleme (writeLocJsonAtomic)', () => {
    it('JSON dosyasını atomik olarak yazar ve geçersiz .tmp bırakmaz', () => {
      const target = path.join(tempRoot, 'out/generated-loc.json')
      const payload = { test: 123, status: 'ok' }

      const written = writeLocJsonAtomic(target, payload)

      expect(written).toBe(true)
      expect(fs.existsSync(target)).toBe(true)
      const read = JSON.parse(fs.readFileSync(target, 'utf-8'))
      expect(read.test).toBe(123)
      expect(read.status).toBe('ok')

      // out dizininde artık .tmp kalmamalı
      const files = fs.readdirSync(path.dirname(target))
      expect(files.filter((f) => f.endsWith('.tmp')).length).toBe(0)
    })

    it('JSON içeriği değişmediğinde dosyayı yeniden yazmayı atlar (no-op)', () => {
      const target = path.join(tempRoot, 'out/generated-loc.json')
      const locData1 = {
        totalFiles: 10,
        totalLines: 1000,
        codeLines: 800,
        nonBlankLines: 800,
        blankLines: 200,
        testFiles: 2,
        testLines: 200,
        testNonBlankLines: 150,
        prodFiles: 8,
        prodLines: 800,
        prodNonBlankLines: 650,
        timestamp: '2026-10-19T10:00:00.000Z',
        scope: 'app+deps',
        breakdown: [{ name: 'app-desktop', codeLines: 800 }]
      }

      // İlk yazma
      const write1 = writeLocJsonAtomic(target, locData1)
      expect(write1).toBe(true)

      const mtime1 = fs.statSync(target).mtimeMs

      // İkinci yazma: metrikler aynı fakat dinamik timestamp farklı
      const locData2 = {
        ...locData1,
        timestamp: '2026-10-19T10:05:00.000Z'
      }
      const write2 = writeLocJsonAtomic(target, locData2)
      expect(write2).toBe(false) // Yeniden yazma atlandı!
      expect(fs.statSync(target).mtimeMs).toBe(mtime1)

      // force: true olduğunda zorla yazar
      const writeForce = writeLocJsonAtomic(target, locData2, { force: true })
      expect(writeForce).toBe(true)

      // Metrik değiştiğinde yazar
      const locDataChanged = {
        ...locData1,
        codeLines: 850
      }
      const write3 = writeLocJsonAtomic(target, locDataChanged)
      expect(write3).toBe(true)
      const readChanged = JSON.parse(fs.readFileSync(target, 'utf-8'))
      expect(readChanged.codeLines).toBe(850)
    })

    it('areJsonObjectsEquivalent fonksiyonu timestamp hariç tüm metrikleri ve breakdown dizisini doğru karşılaştırır', () => {
      const base = {
        totalFiles: 10,
        totalLines: 100,
        codeLines: 80,
        nonBlankLines: 80,
        blankLines: 20,
        testFiles: 2,
        testLines: 20,
        testNonBlankLines: 15,
        prodFiles: 8,
        prodLines: 80,
        prodNonBlankLines: 65,
        timestamp: 'T1',
        scope: 'app',
        breakdown: [{ name: 'test', codeLines: 80 }]
      }

      expect(areJsonObjectsEquivalent(base, { ...base, timestamp: 'T2' })).toBe(true)
      expect(areJsonObjectsEquivalent(base, { ...base, totalFiles: 11 })).toBe(false)
      expect(areJsonObjectsEquivalent(base, { ...base, breakdown: [] })).toBe(false)
      expect(areJsonObjectsEquivalent({ a: 1 }, { a: 1 })).toBe(true)
      expect(areJsonObjectsEquivalent({ a: 1 }, { a: 2 })).toBe(false)
    })

    it('Windows dosya kilidi (EPERM / EBUSY / EACCES) durumunda yeniden dener ve başarıyla tamamlar', () => {
      const target = path.join(tempRoot, 'out/locked-test.json')
      const payload = { test: 'retry-test' }

      let attempts = 0
      const originalRenameSync = fs.renameSync
      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation((oldPath, newPath) => {
        attempts++
        if (attempts <= 2) {
          const err = new Error('EPERM: operation not permitted, rename')
          Object.assign(err, { code: 'EPERM' })
          throw err
        }
        return originalRenameSync(oldPath, newPath)
      })

      try {
        const result = writeLocJsonAtomic(target, payload, { maxRetries: 5, baseDelayMs: 2 })
        expect(result).toBe(true)
        expect(attempts).toBe(3)
        expect(fs.existsSync(target)).toBe(true)
      } finally {
        renameSpy.mockRestore()
      }
    })

    it('Yeniden denenemez hata kodlarında (örn: ENOSPC) hemen hata fırlatır, gecikmeli tekrar denemez', () => {
      const target = path.join(tempRoot, 'out/fatal-error-test.json')
      const payload = { test: 'fatal' }

      let attempts = 0
      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => {
        attempts++
        const err = new Error('ENOSPC: no space left on device')
        Object.assign(err, { code: 'ENOSPC' })
        throw err
      })

      try {
        expect(() => {
          writeLocJsonAtomic(target, payload, { maxRetries: 5, baseDelayMs: 2 })
        }).toThrow(/ENOSPC/)
        expect(attempts).toBe(1) // Hemen fırlatmalı, 5 kez beklememeli
      } finally {
        renameSpy.mockRestore()
      }
    })

    it('Tüm denemeler tükendiğinde geçici .tmp dosyasını temizler ve asıl hatayı korur', () => {
      const target = path.join(tempRoot, 'out/exhausted-test.json')
      const payload = { test: 'exhausted' }

      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => {
        const err = new Error('EBUSY: resource busy or locked')
        Object.assign(err, { code: 'EBUSY' })
        throw err
      })

      try {
        expect(() => {
          writeLocJsonAtomic(target, payload, { maxRetries: 2, baseDelayMs: 2 })
        }).toThrow(/EBUSY/)

        // Geçici dosya (.tmp) temizlenmiş olmalıdır
        const outDir = path.dirname(target)
        if (fs.existsSync(outDir)) {
          const remainingTmp = fs.readdirSync(outDir).filter((f) => f.endsWith('.tmp'))
          expect(remainingTmp.length).toBe(0)
        }
      } finally {
        renameSpy.mockRestore()
      }
    })

    it('acquireLock ve releaseLock süreçler arası çakışmayı ve stale (eski) kilitleri yönetir', () => {
      const lockFile = path.join(tempRoot, 'test.lock')

      // İlk kilit alımı başarılı olmalıdır
      const locked1 = acquireLock(lockFile, 100)
      expect(locked1).toBe(true)
      expect(fs.existsSync(lockFile)).toBe(true)

      // Kilit tutuluyorken ikinci alım zaman aşımına uğrar
      const locked2 = acquireLock(lockFile, 50)
      expect(locked2).toBe(false)

      // Kilit serbest bırakılır
      releaseLock(lockFile)
      expect(fs.existsSync(lockFile)).toBe(false)

      // Kilit serbest bırakıldıktan sonra tekrar alınabilmelidir
      const locked3 = acquireLock(lockFile, 100)
      expect(locked3).toBe(true)
      releaseLock(lockFile)

      // Stale lock testi: 15 saniye önceki bir kilit dosyası
      fs.writeFileSync(lockFile, '99999\n123456')
      const staleTime = (Date.now() - 15000) / 1000
      fs.utimesSync(lockFile, staleTime, staleTime)

      // acquireLock bayat kilidi tespit edip kırabilmeli ve yeni kilidi alabilmelidir
      const lockedStale = acquireLock(lockFile, 200)
      expect(lockedStale).toBe(true)
      releaseLock(lockFile)
    })

    it('sleepSync fonksiyonu belirlenen süre kadar senkron bekler', () => {
      const start = Date.now()
      sleepSync(20)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(15)
    })

    it('RETRY_CODES beklenen Windows hata kodlarını (EPERM, EBUSY, EACCES) içerir', () => {
      expect(RETRY_CODES.has('EPERM')).toBe(true)
      expect(RETRY_CODES.has('EBUSY')).toBe(true)
      expect(RETRY_CODES.has('EACCES')).toBe(true)
      expect(RETRY_CODES.has('ENOENT')).toBe(false)
      expect(RETRY_CODES.has('ENOSPC')).toBe(false)
    })
  })

  describe('6. Workspace ve Kapsam Çözümleme Testleri (resolvePackages)', () => {
    beforeEach(() => {
      // Mock workspace tree:
      // tempRoot/
      // ├── pnpm-workspace.yaml
      // ├── apps/
      // │   ├── app-desktop/ (package.json deps: @dt/database, @temin360/document-templates)
      // │   └── app-web/     (package.json)
      // └── packages/
      //     ├── database/
      //     └── document-templates/
      fs.writeFileSync(
        path.join(tempRoot, 'pnpm-workspace.yaml'),
        'packages:\n  - "apps/*"\n  - "packages/*"\n'
      )

      const appDesktopDir = path.join(tempRoot, 'apps/app-desktop')
      fs.mkdirSync(path.join(appDesktopDir, 'src'), { recursive: true })
      fs.writeFileSync(
        path.join(appDesktopDir, 'package.json'),
        JSON.stringify({
          name: 'app-desktop',
          dependencies: {
            '@dt/database': 'workspace:*',
            '@temin360/document-templates': 'workspace:*'
          }
        })
      )

      const appWebDir = path.join(tempRoot, 'apps/app-web')
      fs.mkdirSync(path.join(appWebDir, 'src'), { recursive: true })
      fs.writeFileSync(path.join(appWebDir, 'package.json'), JSON.stringify({ name: 'app-web' }))

      const dbDir = path.join(tempRoot, 'packages/database')
      fs.mkdirSync(path.join(dbDir, 'src'), { recursive: true })
      fs.writeFileSync(path.join(dbDir, 'package.json'), JSON.stringify({ name: '@dt/database' }))

      const docDir = path.join(tempRoot, 'packages/document-templates')
      fs.mkdirSync(path.join(docDir, 'src'), { recursive: true })
      fs.writeFileSync(
        path.join(docDir, 'package.json'),
        JSON.stringify({ name: '@temin360/document-templates' })
      )
    })

    it('--scope=app yalnızca ana uygulamayı (app-desktop) çözümler', () => {
      const appDesktopDir = path.join(tempRoot, 'apps/app-desktop')
      const pkgs = resolvePackages('app', tempRoot, appDesktopDir)
      expect(pkgs.length).toBe(1)
      expect(pkgs[0].name).toBe('app-desktop')
    })

    it('--scope=app+deps ana uygulamayı ve workspace bağımlılıklarını çözümler', () => {
      const appDesktopDir = path.join(tempRoot, 'apps/app-desktop')
      const pkgs = resolvePackages('app+deps', tempRoot, appDesktopDir)
      expect(pkgs.length).toBe(3)
      const names = pkgs.map((p: any) => p.name).sort()
      expect(names).toEqual(['@dt/database', '@temin360/document-templates', 'app-desktop'].sort())
    })

    it('--scope=repo tüm workspace paketlerini (app-web dahil) çözümler', () => {
      const appDesktopDir = path.join(tempRoot, 'apps/app-desktop')
      const pkgs = resolvePackages('repo', tempRoot, appDesktopDir)
      expect(pkgs.length).toBe(4)
      const names = pkgs.map((p: any) => p.name).sort()
      expect(names).toEqual(
        ['@dt/database', '@temin360/document-templates', 'app-desktop', 'app-web'].sort()
      )
    })

    it('src/ klasörü olmayan bir paketi kök dizini üzerinden taramaya devam eder', () => {
      const noSrcDir = path.join(tempRoot, 'packages/nosrc')
      fs.mkdirSync(noSrcDir, { recursive: true })
      fs.writeFileSync(path.join(noSrcDir, 'package.json'), JSON.stringify({ name: 'nosrc-pkg' }))
      const srcDir = sourceDirOf({ dir: noSrcDir })
      expect(srcDir).toBe(noSrcDir)
    })
  })

  describe('7. Gerçek Repo Sayımı ve JSON Şema Doğrulaması (runCount)', () => {
    it(
      'gerçek proje üzerinde runCount çalıştırıldığında paket toplamları genel toplama tam eşittir',
      () => {
        const result = runCount({ scope: 'app+deps' })

      expect(result.totalFiles).toBeGreaterThan(0)
      expect(result.totalLines).toBe(result.nonBlankLines + result.blankLines)
      expect(result.codeLines).toBe(result.nonBlankLines)
      expect(result.totalFiles).toBe(result.prodFiles + result.testFiles)
      expect(result.totalLines).toBe(result.prodLines + result.testLines)
      expect(result.nonBlankLines).toBe(result.prodNonBlankLines + result.testNonBlankLines)

      // Breakdown toplamları kontrolü
      const sumFiles = result.breakdown.reduce((acc: number, b: any) => acc + b.files, 0)
      const sumLines = result.breakdown.reduce((acc: number, b: any) => acc + b.totalLines, 0)
      const sumCode = result.breakdown.reduce((acc: number, b: any) => acc + b.codeLines, 0)
      const sumBlank = result.breakdown.reduce((acc: number, b: any) => acc + b.blankLines, 0)
      const sumTestFiles = result.breakdown.reduce((acc: number, b: any) => acc + b.testFiles, 0)
      const sumProdFiles = result.breakdown.reduce((acc: number, b: any) => acc + b.prodFiles, 0)

      expect(result.totalFiles).toBe(sumFiles)
      expect(result.totalLines).toBe(sumLines)
      expect(result.codeLines).toBe(sumCode)
      expect(result.blankLines).toBe(sumBlank)
      expect(result.testFiles).toBe(sumTestFiles)
      expect(result.prodFiles).toBe(sumProdFiles)

      // Var olan tüketicilerin beklediği alanların mevcudiyeti
      expect(typeof result.totalFiles).toBe('number')
      expect(typeof result.totalLines).toBe('number')
      expect(typeof result.codeLines).toBe('number')
      expect(typeof result.timestamp).toBe('string')
      expect(result.scope).toBe('app+deps')
      expect(Array.isArray(result.breakdown)).toBe(true)
    }, 30000)
  })
})

