#!/usr/bin/env node
/**
 * repair-firms.mjs
 * 
 * Doğrudan Temin ve Havuz Firmaları (TANIM_Firma & DATA_TeminFirma)
 * Otomatik Eşleştirme, ID Bağlama ve Sağlık Onarım Aracı.
 *
 * Hem standart ZIP tabanlı .temin arşivlerini hem de ham SQLite dosyalarını destekler.
 *
 * Kullanım:
 *   node scripts/repair-firms.mjs "C:\Yol\dosya.temin"
 *   node scripts/repair-firms.mjs C:\Yol\dosya.temin (boşluklu yollar otomatik birleştirilir)
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

export function repairFirmsInDb(db, dbName = 'Veritabanı') {
  console.log(`\n${c.bold(c.cyan('🔍 İnceleme Başlatılıyor:'))} ${dbName}`)

  // 1. Gerekli tabloların varlığını kontrol et
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name)
  if (!tables.includes('DATA_TeminFirma') || !tables.includes('TANIM_Firma')) {
    console.log(c.yellow(`⚠️  Gerekli tablolar (DATA_TeminFirma / TANIM_Firma) bulunamadı. Atlandı.`))
    return { success: false, reason: 'missing_tables' }
  }

  // 2. Yetim / ID'siz kayıtları tespit et (firma_id IS NULL veya firma_id = 0 veya TANIM_Firma'da karşılığı olmayanlar)
  const orphanRows = db.prepare(`
    SELECT df.id, df.temin_dosya_id, df.unvan, df.vergi_no, df.telefon, df.email, df.firma_id
    FROM DATA_TeminFirma df
    LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
    WHERE df.firma_id IS NULL 
       OR df.firma_id = 0 
       OR f.id IS NULL
  `).all()

  console.log(`📊 İncelenen DATA_TeminFirma satırları: Toplam ${c.bold(orphanRows.length)} adet ID'siz veya yetim firma kaydı tespit edildi.`)

  if (orphanRows.length === 0) {
    console.log(c.green(`✔ Tüm firma kayıtları geçerli bir TANIM_Firma.id değerine bağlı. Onarım gerekmiyor.`))
    return { success: true, matchedCount: 0, createdCount: 0, dossiersUpdated: 0 }
  }

  let matchedCount = 0
  let createdCount = 0
  let dossiersUpdated = 0

  const runTx = () => {
    // 3. Her yetim satır için TANIM_Firma eşleştirmesi yap
    for (const row of orphanRows) {
      const cleanUnvan = (row.unvan || '').trim()
      const cleanVkn = (row.vergi_no || '').trim()

      if (!cleanUnvan && !cleanVkn) {
        continue
      }

      // Adım A: Havuzda (TANIM_Firma) unvan (case-insensitive) veya VKN ile ara
      let matchedMasterFirm = null

      if (cleanVkn) {
        matchedMasterFirm = db.prepare(`
          SELECT id, unvan, vergi_no FROM TANIM_Firma
          WHERE vergi_no = ? AND vergi_no != ''
          LIMIT 1
        `).get(cleanVkn)
      }

      if (!matchedMasterFirm && cleanUnvan) {
        matchedMasterFirm = db.prepare(`
          SELECT id, unvan, vergi_no FROM TANIM_Firma
          WHERE LOWER(TRIM(unvan)) = LOWER(TRIM(?))
          LIMIT 1
        `).get(cleanUnvan)
      }

      let masterId = matchedMasterFirm?.id

      if (masterId) {
        // Mevcut havuza bağla
        db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = ?,
              unvan = COALESCE(NULLIF(unvan, ''), ?)
          WHERE id = ?
        `).run(masterId, matchedMasterFirm.unvan, row.id)
        matchedCount++
        console.log(`  ${c.green('✔ Eşleştirildi:')} "${cleanUnvan}" → Havuz ID: ${c.bold(masterId)} (${matchedMasterFirm.unvan})`)
      } else {
        // Adım B: Havuzda yoksa yeni TANIM_Firma oluştur ve ID'sini bağla
        const countRow = db.prepare('SELECT COUNT(*) as cnt FROM TANIM_Firma').get()
        const nextNum = (countRow?.cnt || 0) + 1
        const firmaKodu = nextNum.toString().padStart(4, '0')

        const insertRes = db.prepare(`
          INSERT INTO TANIM_Firma (firma_kodu, unvan, vergi_no, telefon, email, aktif_mi)
          VALUES (?, ?, ?, ?, ?, 1)
        `).run(
          firmaKodu,
          cleanUnvan || `Firma-${firmaKodu}`,
          cleanVkn || '',
          row.telefon || '',
          row.email || ''
        )

        masterId = insertRes.lastInsertRowid

        db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = ?
          WHERE id = ?
        `).run(masterId, row.id)
        createdCount++
        console.log(`  ${c.cyan('➕ Yeni Havuz Kaydı Açıldı & Bağlandı:')} "${cleanUnvan}" → Yeni ID: ${c.bold(masterId)} (Kod: ${firmaKodu})`)
      }

      // Adım C: Eğer bu dosyanın kazananıysa ve dosyadaki firma_id eksikse senkronize et
      const checkWinner = db.prepare(`
        SELECT kazandi_mi, kazanan_mi FROM DATA_TeminFirma WHERE id = ?
      `).get(row.id)

      if (checkWinner && (checkWinner.kazandi_mi === 1 || checkWinner.kazanan_mi === 1)) {
        const updateDosyaRes = db.prepare(`
          UPDATE DATA_TeminDosyasi
          SET firma_id = ?
          WHERE id = ? AND (firma_id IS NULL OR firma_id = 0 OR firma_id != ?)
        `).run(masterId, row.temin_dosya_id, masterId)

        if (updateDosyaRes.changes > 0) {
          dossiersUpdated++
          console.log(`    ${c.yellow('⚡ Dosya Yüklenicisi Güncellendi:')} Dosya ID: ${row.temin_dosya_id} → firma_id: ${masterId}`)
        }
      }
    }
  }

  if (typeof db.transaction === 'function') {
    db.transaction(runTx)()
  } else {
    runTx()
  }

  console.log(`\n${c.bold(c.green('🎉 Onarım Tamamlandı!'))}`)
  console.log(`  - Mevcut havuza bağlanan: ${c.bold(matchedCount)}`)
  console.log(`  - Yeni havuza kaydedilip bağlanan: ${c.bold(createdCount)}`)
  console.log(`  - Güncellenen dosya yüklenici referansı: ${c.bold(dossiersUpdated)}\n`)

  return { success: true, matchedCount, createdCount, dossiersUpdated }
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

      if (result.success && (result.matchedCount > 0 || result.createdCount > 0 || result.dossiersUpdated > 0)) {
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
      // PowerShell veya CMD'de tırnaksız boşluklu yollar girildiğinde argümanları birleştir
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
