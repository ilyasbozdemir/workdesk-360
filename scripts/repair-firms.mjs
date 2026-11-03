/**
 * repair-firms.mjs
 * 
 * Doğrudan Temin ve Havuz Firmaları (TANIM_Firma & DATA_TeminFirma)
 * Mükerrerleri Birleştirme (Deduplication), ID Bağlama ve Sağlık Onarım Aracı.
 *
 * Temin 360'ta hızlı ekle veya aktarımla oluşan kısa ad/eksik firma kartlarını
 * (örn: "GÖKŞEN" → "GÖKŞEN MÜHENDİSLİK MÜŞAVİRLİK...", "GÜL TES YAPI" → "GÜLTES YAPI...")
 * ana havuz kartlarıyla akıllıca birleştirir, dosyaların teklif ve kazanan ilişkilerini
 * gerçek ID'ye bağlar ve mükerrer kartları temizler.
 *
 * Kullanım:
 *   node scripts/repair-firms.mjs "C:\Yol\proje.temin"
 *   node scripts/repair-firms.mjs C:\Yol\proje.temin
 *   node scripts/repair-firms.mjs --all
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  magenta: (t) => `\x1b[35m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`
}

function getAdmZip() {
  try {
    const req = createRequire(path.join(rootDir, 'apps', 'temin360-desktop', 'package.json'))
    return req('adm-zip')
  } catch {
    const req = createRequire(path.join(rootDir, 'package.json'))
    return req('adm-zip')
  }
}

function isZipArchive(filePath) {
  try {
    const buf = Buffer.alloc(4)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, buf, 0, 4, 0)
    fs.closeSync(fd)
    return buf[0] === 0x50 && buf[1] === 0x4b // 'PK'
  } catch {
    return false
  }
}

async function openWritableSqlite(dbPath) {
  try {
    const req = createRequire(path.join(rootDir, 'packages', 'database', 'package.json'))
    const BS3 = req('better-sqlite3')
    return new BS3(dbPath, { fileMustExist: true })
  } catch {
    const { DatabaseSync } = await import('node:sqlite')
    return new DatabaseSync(dbPath)
  }
}

export function normalizeTr(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[iİıI]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]/g, '')
}

function cleanDigits(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

function getFirstWord(str) {
  if (!str) return ''
  return normalizeTr(str.trim().split(/\s+/)[0])
}

export function repairFirmsInDb(db, dbName = 'Veritabanı') {
  console.log(`\n${c.bold(c.cyan('🔍 İnceleme Başlatılıyor:'))} ${dbName}`)

  // 1. Tablo kontrolü
  const tableRows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()
  const tableNames = tableRows.map((r) => r.name)

  if (!tableNames.includes('DATA_TeminFirma') || !tableNames.includes('TANIM_Firma')) {
    console.log(c.yellow(`⚠️  Gerekli tablolar (DATA_TeminFirma / TANIM_Firma) bulunamadı. Atlandı.`))
    return { success: false, reason: 'missing_tables' }
  }

  const hasIhaleFirma = tableNames.includes('DATA_IhaleFirma')
  const hasIhaleDosya = tableNames.includes('DATA_IhaleDosyasi')
  const hasIletisimNotu = tableNames.includes('TANIM_FirmaIletisimNotu')

  let mergedStubCount = 0
  let assignedCodesCount = 0
  let matchedOrphanCount = 0
  let dossiersUpdated = 0

  const runAllRepairs = () => {
    // -------------------------------------------------------------
    // ADIM 1: Mükerrer / Taslak Firmaları Ana Havuza Birleştirme
    // -------------------------------------------------------------
    const allFirms = db.prepare('SELECT * FROM TANIM_Firma ORDER BY id ASC').all()
    
    // Master firmalar: firma_kodu dolu olanlar
    const masters = allFirms.filter((f) => f.firma_kodu && f.firma_kodu.trim() !== '')
    // Taslak/Eksik firmalar: firma_kodu olmayan veya boş olanlar
    const stubs = allFirms.filter((f) => !f.firma_kodu || f.firma_kodu.trim() === '')

    for (const stub of stubs) {
      const stubNorm = normalizeTr(stub.unvan)
      const stubPhone = cleanDigits(stub.telefon)
      const stubVkn = (stub.vergi_no || '').trim()

      let match = null
      let reason = ''

      // Kural A: VKN Eşleşmesi
      if (stubVkn) {
        match = masters.find((m) => (m.vergi_no || '').trim() === stubVkn)
        if (match) reason = `VKN Eşleşmesi (${stubVkn})`
      }

      // Kural B: Unvan benzerliği (Biri diğerinin başlangıcı veya tam eşit, min 4 karakter)
      if (!match && stubNorm.length >= 4) {
        match = masters.find((m) => {
          const mNorm = normalizeTr(m.unvan)
          if (mNorm === stubNorm) return true
          if (mNorm.startsWith(stubNorm) || stubNorm.startsWith(mNorm)) return true
          return false
        })
        if (match) reason = `Unvan Benzerliği ("${stub.unvan}" ↔ "${match.unvan}")`
      }

      // Kural C: Telefon eşleşmesi + Unvan ilk kelime kökü
      if (!match && stubPhone && stubPhone.length === 10) {
        const phoneMatches = masters.filter((m) => cleanDigits(m.telefon) === stubPhone)
        if (phoneMatches.length === 1) {
          const pm = phoneMatches[0]
          const stubWord = getFirstWord(stub.unvan)
          const masterWord = getFirstWord(pm.unvan)
          if (stubWord && masterWord && (stubWord.includes(masterWord) || masterWord.includes(stubWord))) {
            match = pm
            reason = `Telefon + Unvan Kökü (${stubPhone})`
          }
        }
      }

      if (match) {
        // EŞLEŞTİ -> Taslak firmayı master firmaya bağla ve birleştir
        console.log(`  ${c.magenta('🔗 Birleştiriliyor:')} Taslak #${stub.id} "${stub.unvan}" → Ana Havuz #${match.id} (${match.firma_kodu}) "${match.unvan}" [${reason}]`)

        // 1. DATA_TeminFirma yönlendir
        const dtfRes = db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = ?,
              unvan = ?,
              vergi_no = COALESCE(NULLIF(vergi_no, ''), ?)
          WHERE firma_id = ?
        `).run(match.id, match.unvan, match.vergi_no, stub.id)

        // 2. DATA_TeminDosyasi kazanan firma yönlendir
        const dtdRes = db.prepare(`
          UPDATE DATA_TeminDosyasi
          SET firma_id = ?
          WHERE firma_id = ?
        `).run(match.id, stub.id)

        if (dtdRes.changes > 0) {
          dossiersUpdated += dtdRes.changes
          console.log(`    ${c.yellow('⚡')} ${dtdRes.changes} adet dosya yüklenicisi Ana Havuz ID #${match.id}'ye güncellendi.`)
        }

        // 3. İhale tabloları varsa yönlendir
        if (hasIhaleFirma) {
          try {
            db.prepare('UPDATE DATA_IhaleFirma SET firma_id = ? WHERE firma_id = ?').run(match.id, stub.id)
          } catch {}
        }
        if (hasIhaleDosya) {
          try {
            db.prepare('UPDATE DATA_IhaleDosyasi SET firma_id = ? WHERE firma_id = ?').run(match.id, stub.id)
          } catch {}
        }
        if (hasIletisimNotu) {
          try {
            db.prepare('UPDATE TANIM_FirmaIletisimNotu SET firma_id = ? WHERE firma_id = ?').run(match.id, stub.id)
          } catch {}
        }

        // 4. Master firmada eksik telefon/email varsa taslaktan tamamla
        db.prepare(`
          UPDATE TANIM_Firma
          SET telefon = COALESCE(NULLIF(telefon, ''), ?),
              email = COALESCE(NULLIF(email, ''), ?),
              adres = COALESCE(NULLIF(adres, ''), ?)
          WHERE id = ?
        `).run(stub.telefon || null, stub.email || null, stub.adres || null, match.id)

        // 5. Mükerrer taslak kaydı sil
        db.prepare('DELETE FROM TANIM_Firma WHERE id = ?').run(stub.id)
        mergedStubCount++
      }
    }

    // -------------------------------------------------------------
    // ADIM 2: Kodu Eksik Kalan Gerçek Yeni Firmalara Sıralı Kod Ata
    // -------------------------------------------------------------
    const remainingStubs = db.prepare("SELECT * FROM TANIM_Firma WHERE firma_kodu IS NULL OR TRIM(firma_kodu) = '' ORDER BY id ASC").all()
    if (remainingStubs.length > 0) {
      // Mevcut en yüksek 4 haneli kodu bul
      const existingCodes = db.prepare("SELECT firma_kodu FROM TANIM_Firma WHERE firma_kodu GLOB '[0-9][0-9][0-9][0-9]'").all()
      let maxNum = 0
      for (const row of existingCodes) {
        const n = parseInt(row.firma_kodu, 10)
        if (!isNaN(n) && n > maxNum) maxNum = n
      }

      for (const stub of remainingStubs) {
        maxNum++
        const newCode = maxNum.toString().padStart(4, '0')
        db.prepare('UPDATE TANIM_Firma SET firma_kodu = ? WHERE id = ?').run(newCode, stub.id)
        assignedCodesCount++
        console.log(`  ${c.cyan('🏷️  Kod Atandı:')} Firma #${stub.id} "${stub.unvan}" → Kod: ${c.bold(newCode)}`)
      }
    }

    // -------------------------------------------------------------
    // ADIM 3: Yetim DATA_TeminFirma Kayıtlarını Eşleştirme (firma_id = 0 veya NULL)
    // -------------------------------------------------------------
    const orphanOffers = db.prepare(`
      SELECT df.id, df.temin_dosya_id, df.unvan, df.vergi_no, df.firma_id
      FROM DATA_TeminFirma df
      LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
      WHERE df.firma_id IS NULL OR df.firma_id = 0 OR f.id IS NULL
    `).all()

    for (const orphan of orphanOffers) {
      const cleanUnvan = (orphan.unvan || '').trim()
      const cleanVkn = (orphan.vergi_no || '').trim()
      if (!cleanUnvan && !cleanVkn) continue

      let master = null
      if (cleanVkn) {
        master = db.prepare("SELECT id, unvan, vergi_no FROM TANIM_Firma WHERE vergi_no = ? AND vergi_no != '' LIMIT 1").get(cleanVkn)
      }
      if (!master && cleanUnvan) {
        master = db.prepare("SELECT id, unvan, vergi_no FROM TANIM_Firma WHERE LOWER(TRIM(unvan)) = LOWER(TRIM(?)) LIMIT 1").get(cleanUnvan)
      }

      if (master) {
        db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = ?, unvan = COALESCE(NULLIF(unvan, ''), ?)
          WHERE id = ?
        `).run(master.id, master.unvan, orphan.id)
        matchedOrphanCount++
        console.log(`  ${c.green('✔ Yetim Teklif Bağlandı:')} "${cleanUnvan}" → Ana Havuz ID #${master.id} (${master.unvan})`)
      }
    }
  }

  if (typeof db.transaction === 'function') {
    db.transaction(runAllRepairs)()
  } else {
    runAllRepairs()
  }

  const totalActions = mergedStubCount + assignedCodesCount + matchedOrphanCount + dossiersUpdated

  if (totalActions === 0) {
    console.log(c.green(`✔ Tüm firma kartları ve dosya teklifleri mükemmel durumda. Onarım gerekmiyor.`))
  } else {
    console.log(`\n${c.bold(c.green('🎉 Onarım ve Birleştirme Başarıyla Tamamlandı!'))}`)
    console.log(`  - Ana havuza birleştirilip temizlenen mükerrer kartlar: ${c.bold(mergedStubCount)}`)
    console.log(`  - Yeni kod atanan bağımsız firmalar: ${c.bold(assignedCodesCount)}`)
    console.log(`  - Ana havuza bağlanan yetim teklifler: ${c.bold(matchedOrphanCount)}`)
    console.log(`  - Güncellenen dosya yüklenici referansları: ${c.bold(dossiersUpdated)}\n`)
  }

  return {
    success: true,
    mergedStubCount,
    assignedCodesCount,
    matchedOrphanCount,
    dossiersUpdated
  }
}

/**
 * Tek bir dosyayı (ZIP tabanlı .temin veya doğrudan .sqlite) onarır.
 */
export async function repairFile(filePath) {
  const resolvedPath = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(resolvedPath)) {
    console.error(c.red(`Hata: "${resolvedPath}" dosyası bulunamadı.`))
    return { success: false, reason: 'not_found' }
  }

  const stat = fs.statSync(resolvedPath)
  if (stat.isDirectory()) {
    console.error(c.red(`Hata: "${resolvedPath}" bir klasördür, lütfen dosya yolu belirtin.`))
    return { success: false, reason: 'is_directory' }
  }

  const isZip = isZipArchive(resolvedPath)
  if (isZip) {
    const AdmZipClass = getAdmZip()
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-repair-'))
    try {
      const zip = new AdmZipClass(resolvedPath)
      zip.extractAllTo(tempDir, true)

      let sqlitePath = path.join(tempDir, 'database.sqlite')
      if (!fs.existsSync(sqlitePath)) {
        const entries = fs.readdirSync(tempDir)
        const found = entries.find((e) => e.endsWith('.sqlite'))
        if (found) {
          sqlitePath = path.join(tempDir, found)
        } else {
          console.error(c.red(`Hata: "${resolvedPath}" arşivi içinde geçerli bir .sqlite veritabanı bulunamadı.`))
          return { success: false, reason: 'sqlite_not_found_in_zip' }
        }
      }

      const db = await openWritableSqlite(sqlitePath)
      let result
      try {
        result = repairFirmsInDb(db, path.basename(resolvedPath))
      } finally {
        if (typeof db.close === 'function') db.close()
      }

      const totalChanges = (result.mergedStubCount || 0) + (result.assignedCodesCount || 0) + (result.matchedOrphanCount || 0) + (result.dossiersUpdated || 0)

      if (result.success && totalChanges > 0) {
        // meta.json güncelle
        const metaPath = path.join(tempDir, 'meta.json')
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            meta.updated_at = new Date().toISOString()
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
          } catch {}
        }

        // Güvenlik yedeği al
        const backupPath = `${resolvedPath}.bak`
        fs.copyFileSync(resolvedPath, backupPath)
        console.log(c.dim(`  (Orijinal dosyanın güvenlik yedeği alındı: ${path.basename(backupPath)})`))

        // Güncellenmiş arşivi paketle
        const newZip = new AdmZipClass()
        newZip.addLocalFolder(tempDir)
        newZip.writeZip(resolvedPath)
        console.log(c.green(`  ✔ .temin paketi başarıyla güncellendi ve kaydedildi.`))
      }

      return result
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}
    }
  } else {
    const db = await openWritableSqlite(resolvedPath)
    try {
      return repairFirmsInDb(db, path.basename(resolvedPath))
    } finally {
      if (typeof db.close === 'function') db.close()
    }
  }
}

// CLI yürütme
const isDirectCli = process.argv[1] && (path.resolve(process.argv[1]) === __filename || process.argv[1].endsWith('repair-firms.mjs'))
if (isDirectCli) {
  const rawArgs = process.argv.slice(2)
  if (rawArgs.length > 0) {
    if (rawArgs[0] === '--all') {
      const files = []
      const scanDir = (dir) => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const e of entries) {
            const full = path.join(dir, e.name)
            if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'out') {
              scanDir(full)
            } else if (e.isFile() && (e.name.endsWith('.temin') || (e.name.endsWith('.sqlite') && !e.name.includes('corrupt')))) {
              files.push(full)
            }
          }
        } catch {}
      }
      scanDir(rootDir)
      console.log(`Bulunan dosya sayısı: ${files.length}`)
      for (const f of files) {
        try {
          await repairFile(f)
        } catch (err) {
          console.error(`Hata (${f}):`, err.message)
        }
      }
    } else {
      let targetPath = rawArgs.join(' ')
      if (!fs.existsSync(targetPath) && fs.existsSync(rawArgs[0])) {
        targetPath = rawArgs[0]
      }
      await repairFile(targetPath)
    }
  } else {
    console.log(`
${c.bold('📦 Doğrudan Temin Firma Eşleştirme ve Onarım Aracı')}

Kullanım:
  node scripts/repair-firms.mjs "C:\\Yol\\proje.temin"
  node scripts/repair-firms.mjs C:\\Yol\\proje.temin (boşluklu yollar otomatik desteklenir)
  node scripts/repair-firms.mjs --all

Örnek:
  node scripts/repair-firms.mjs "C:\\Users\\ilyas bozdemir\\Desktop\\Güneyyurt Belediyesi İhale - Doğrudan Temin.temin"
`)
  }
}
