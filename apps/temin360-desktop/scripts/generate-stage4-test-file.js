// Ensure script runs with Electron's NODE_MODULE_VERSION to load better-sqlite3
if (!process.versions.electron) {
  try {
    const electronBinary = require('electron')
    const { execFileSync } = require('child_process')
    execFileSync(electronBinary, [__filename, ...process.argv.slice(2)], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    })
    process.exit(0)
  } catch (err) {
    console.error('Failed to respawn with Electron:', err.message)
    process.exit(1)
  }
}

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const Database = require('better-sqlite3')
const AdmZip = require('adm-zip')
const { initializeDatabase, CURRENT_SCHEMA_VERSION } = require('@dt/database')

const targetDir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage4-'))
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const isolatedTeminPath = path.join(targetDir, 'stage4-isolated.temin')
const tempDbPath = path.join(targetDir, 'database.sqlite')
const attachmentsDir = path.join(targetDir, 'attachments')
fs.mkdirSync(attachmentsDir, { recursive: true })

const expectedKurum = 'Aşama 4 Piyasa Fiyat ve Teklif Kurumu'
const expectedTeminNo = '2026/ASAMA4-E2E-001'
const expectedKonu = 'Aşama 4 Piyasa Fiyat Araştırması ve Teklif Yönetimi'

// 1. SQLite veritabanı oluştur
const db = new Database(tempDbPath)
initializeDatabase(db, expectedKurum, '1.0.0-rc.39', { seedTestData: true })

const insertDosya = db.prepare(`
  INSERT INTO DATA_TeminDosyasi (
    temin_no, konu, tur, ihale_sekli, status, butce_yili, hesaplama_esasi, created_at, updated_at
  ) VALUES (?, ?, 'mal', '22/d', 'hazirlik', 2026, 'Ortalama fiyat esasına göre', datetime('now'), datetime('now'))
`)
const insertResult = insertDosya.run(expectedTeminNo, expectedKonu)
const expectedDosyaId = Number(insertResult.lastInsertRowid)

// Kalem 1 ve Kalem 2'yi seed et (Aşama 3'ün tamamladığı durum)
const insertKalem = db.prepare(`
  INSERT INTO DATA_TeminKalem (
    temin_dosya_id, kalem_adi, aciklama, birim, miktar, kdv_orani, tipi, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`)
const kalem1Result = insertKalem.run(expectedDosyaId, 'A4 Fotokopi Kağıdı', '80 gr/m2 1. Hamur Beyaz', 'Kutu', 50, 20, 'Mal')
const kalem2Result = insertKalem.run(expectedDosyaId, 'Masaüstü Zımba', '24/6 No Metal Gövde Zımba Makinesi', 'Adet', 10, 20, 'Mal')

const insertKurum = db.prepare(`
  INSERT OR REPLACE INTO TANIM_Kurum (
    id, kurum_adi, ust_kurum_adi, il, ilce, harcama_birim_adi
  ) VALUES (1, ?, 'T.C.', 'Ankara', 'Çankaya', 'Bilgi İşlem Daire Başkanlığı')
`)
insertKurum.run(expectedKurum)

const insertAuth = db.prepare(`
  INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
`)
insertAuth.run('adminUsername', 'admin')
insertAuth.run('adminPassword', '123456')
insertAuth.run('isDisclaimerAccepted', 'true')
insertAuth.run('disclaimerHistory', JSON.stringify([new Date().toISOString()]))

db.pragma('wal_checkpoint(TRUNCATE)')
db.close()

// 2. meta.json
const meta = {
  dtal_version: '1.0',
  app_version: '1.0.0-rc.39',
  created_at: new Date().toISOString().split('T')[0],
  institution: expectedKurum,
  schema_version: CURRENT_SCHEMA_VERSION,
  platform: process.platform,
  file_version: 1,
  active_db_file: 'database.sqlite',
  updated_at: new Date().toISOString(),
  last_user_mutation_at: new Date().toISOString(),
  checksum_algorithm: 'sha256',
  app_metadata: {
    last_temin_id: expectedDosyaId,
    last_temin_no: expectedTeminNo,
    creator_app: 'temin360-stage4-e2e',
    system_version: '1.0.0'
  }
}

// 3. Manifest ve Checksum
const dbBuffer = fs.readFileSync(tempDbPath)
const dbHash = crypto.createHash('sha256').update(dbBuffer).digest('hex')
const metaBuffer = Buffer.from(JSON.stringify(meta, null, 2), 'utf-8')
const metaHash = crypto.createHash('sha256').update(metaBuffer).digest('hex')

const manifest = {
  format_version: '1.0',
  generator: 'temin360-stage4-e2e',
  generated_at: new Date().toISOString(),
  files: [
    { path: 'meta.json', size: metaBuffer.length, hash: metaHash },
    { path: 'database.sqlite', size: dbBuffer.length, hash: dbHash }
  ]
}

// 4. Zip (.temin) oluştur
const zip = new AdmZip()
zip.addFile('meta.json', metaBuffer)
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'))
zip.addLocalFile(tempDbPath)
zip.addLocalFolder(attachmentsDir, 'attachments')
zip.writeZip(isolatedTeminPath)

// 5. Bilgi çıktısı
const info = {
  isolatedTeminPath,
  targetDir,
  expectedDosyaId,
  expectedTeminNo,
  expectedKonu,
  expectedKurum,
  kalem1Id: Number(kalem1Result.lastInsertRowid),
  kalem2Id: Number(kalem2Result.lastInsertRowid)
}

const infoPath = path.join(targetDir, 'stage4-info.json')
fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8')
console.log(`STAGE4_INFO_PATH=${infoPath}`)
console.log(`[Stage 4 Setup] Dosya hazır: ${isolatedTeminPath}, ID: ${expectedDosyaId}`)
