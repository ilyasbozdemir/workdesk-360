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

const targetDir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage6-'))
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const isolatedTeminPath = path.join(targetDir, 'stage6-isolated.temin')
const tempDbPath = path.join(targetDir, 'database.sqlite')
const attachmentsDir = path.join(targetDir, 'attachments')
fs.mkdirSync(attachmentsDir, { recursive: true })

const expectedKurum = 'T.C. Ankara Valiliği İl Sağlık Müdürlüğü'
const expectedTeminNo = '2026/ASAMA6-LIFECYCLE-001'
const expectedKonu = 'Aşama 6 Tam Yaşam Döngüsü Donanım ve Sistem Alımı'

// 1. SQLite veritabanı oluştur (Aşama 6 için temiz, izole veritabanı)
const db = new Database(tempDbPath)
initializeDatabase(db, expectedKurum, '1.0.0-rc.40', { seedTestData: true })

const insertDosya = db.prepare(`
  INSERT INTO DATA_TeminDosyasi (
    temin_no, konu, tur, ihale_sekli, status, butce_yili, hesaplama_esasi, harcama_birimi, created_at, updated_at
  ) VALUES (?, ?, 'mal', '22/d', 'hazirlik', 2026, 'Ortalama fiyat esasına göre', 'Bilgi İşlem Şube Müdürlüğü', datetime('now'), datetime('now'))
`)
const insertResult = insertDosya.run(expectedTeminNo, expectedKonu)
const expectedDosyaId = Number(insertResult.lastInsertRowid)

const insertKurum = db.prepare(`
  INSERT OR REPLACE INTO TANIM_Kurum (
    id, kurum_adi, ust_kurum_adi, il, ilce, harcama_birim_adi
  ) VALUES (1, ?, 'T.C.', 'Ankara', 'Çankaya', 'Bilgi İşlem Şube Müdürlüğü')
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
  app_version: '1.0.0-rc.40',
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
    creator_app: 'temin360-stage6-e2e',
    system_version: '1.0.0'
  }
}

// 3. Manifest ve Checksum
const dbBuffer = fs.readFileSync(tempDbPath)
const hash = crypto.createHash('sha256').update(dbBuffer).digest('hex')

const manifest = {
  manifest_version: '1.0',
  created_at: new Date().toISOString(),
  files: {
    'database.sqlite': {
      size: dbBuffer.length,
      checksum: hash,
      required: true
    },
    'meta.json': {
      size: Buffer.byteLength(JSON.stringify(meta, null, 2)),
      checksum: crypto.createHash('sha256').update(JSON.stringify(meta, null, 2)).digest('hex'),
      required: true
    }
  }
}

// 4. .temin Zip Paketini Oluştur
const zip = new AdmZip()
zip.addLocalFile(tempDbPath)
zip.addFile('meta.json', Buffer.from(JSON.stringify(meta, null, 2), 'utf-8'))
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'))
zip.writeZip(isolatedTeminPath)

// Geçici sqlite dosyasını sil (paketlendi)
try {
  fs.unlinkSync(tempDbPath)
} catch (e) {}

// Test için bilgileri kaydet
const info = {
  isolatedTeminPath,
  expectedDosyaId,
  expectedTeminNo,
  expectedKonu,
  expectedKurum
}
fs.writeFileSync(path.join(targetDir, 'stage6-info.json'), JSON.stringify(info, null, 2), 'utf-8')

console.log(`[Stage 6 Generator] Başarıyla oluşturuldu: ${isolatedTeminPath}`)
