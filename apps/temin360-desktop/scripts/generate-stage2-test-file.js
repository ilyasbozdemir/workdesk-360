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

const targetDir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage2-'))
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const isolatedTeminPath = path.join(targetDir, 'stage2-isolated.temin')
const tempDbPath = path.join(targetDir, 'database.sqlite')
const attachmentsDir = path.join(targetDir, 'attachments')
fs.mkdirSync(attachmentsDir, { recursive: true })

const expectedKurum = 'Aşama 2 Doğrulama Kurumu'
const expectedTeminNo = '2026/ASAMA2-E2E-001'
const expectedKonu = 'Aşama 2 Gerçek Dosya Kimliği Doğrulama'

// 1. SQLite veritabanı oluştur
const db = new Database(tempDbPath)
initializeDatabase(db, expectedKurum, '1.0.0-rc.39', { seedTestData: true })

const insertDosya = db.prepare(`
  INSERT INTO DATA_TeminDosyasi (
    temin_no, konu, tur, ihale_sekli, status, butce_yili, created_at, updated_at
  ) VALUES (?, ?, 'mal', '22/d', 'hazirlik', 2026, datetime('now'), datetime('now'))
`)
const insertResult = insertDosya.run(expectedTeminNo, expectedKonu)
const expectedDosyaId = Number(insertResult.lastInsertRowid)

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
  warnings: []
}

const hashPayload = {
  dtal_version: meta.dtal_version,
  app_version: meta.app_version,
  schema_version: meta.schema_version,
  created_at: meta.created_at,
  institution: meta.institution,
  platform: meta.platform
}
const integrity_hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(hashPayload))
  .digest('hex')

const metaPath = path.join(targetDir, 'meta.json')
fs.writeFileSync(metaPath, JSON.stringify({ ...meta, integrity_hash }, null, 2), 'utf-8')

// 3. .temin ZIP paketi
const zip = new AdmZip()
zip.addLocalFile(tempDbPath)
zip.addLocalFile(metaPath)
zip.addLocalFolder(attachmentsDir, 'attachments')
zip.writeZip(isolatedTeminPath)

// 4. stage2-info.json
const info = {
  targetDir,
  isolatedTeminPath,
  expectedDosyaId,
  expectedTeminNo,
  expectedKonu,
  expectedKurum
}
const infoPath = path.join(targetDir, 'stage2-info.json')
fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8')

console.log('STAGE2_INFO_PATH=' + infoPath)
