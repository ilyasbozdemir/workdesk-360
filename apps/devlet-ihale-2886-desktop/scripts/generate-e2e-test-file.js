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
const { initializeDatabase, CURRENT_SCHEMA_VERSION, getAppSchemaMax } = require('@dt/database')

function resolveWindowsDesktopDir() {
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process')
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

const desktopDir = resolveWindowsDesktopDir()
const targetDir = path.join(desktopDir, 'Temin360-E2E-Test')
const targetFile = path.join(targetDir, 'e2e-test-kurumu.temin')
const secondTargetFile = path.join(targetDir, 'e2e-ikinci-kurum.temin')
const fallbackDir = path.join(os.homedir(), 'Desktop', 'Temin360-E2E-Test')

function generateE2ETestFile(
  customTargetFile = targetFile,
  institutionName = 'E2E Otomasyon Test Kurumu',
  dosyaNo = '2026/E2E-01',
  konu = 'Playwright E2E Test Alımı'
) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-e2e-build-'))
  const tempDbPath = path.join(tempDir, 'database.sqlite')
  const attachmentsDir = path.join(tempDir, 'attachments')
  fs.mkdirSync(attachmentsDir, { recursive: true })

  const db = new Database(tempDbPath)

  // Initialize SQLite schema and tables via @dt/database
  initializeDatabase(db, institutionName, '1.0.0-beta.1', 'devlet-ihale-2886-desktop')

  // Seed sample data for E2E verification
  const hasTeminTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='DATA_TeminDosyasi'").get()
  if (hasTeminTable) {
    const insertDosya = db.prepare(`
      INSERT INTO DATA_TeminDosyasi (
        temin_no, konu, tur, ihale_sekli, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    insertDosya.run(dosyaNo, konu, 'mal', '22/d')
  }

  const insertBirim = db.prepare(`
    INSERT OR IGNORE INTO TANIM_Birim (
      ad, kisa_ad
    ) VALUES (?, ?)
  `)
  insertBirim.run('Bilgi İşlem Daire Başkanlığı', 'BİDB')

  // Seed admin credentials so lock screen has configured credentials
  const insertAuth = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
  `)
  insertAuth.run('adminUsername', 'admin')
  insertAuth.run('adminPassword', '123456')

  // Checkpoint database
  db.pragma('wal_checkpoint(TRUNCATE)')
  db.close()

  // Generate metadata conforming to WorkspaceMeta
  const appSchemaVersion = getAppSchemaMax ? getAppSchemaMax('devlet-ihale-2886-desktop') : 1
  const meta = {
    dtal_version: '1.0',
    app_version: '1.0.0-beta.1',
    created_at: new Date().toISOString().split('T')[0],
    institution: institutionName,
    schema_version: appSchemaVersion,
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
  meta.integrity_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  const metaPath = path.join(tempDir, 'meta.json')
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')

  // Package into .temin ZIP archive
  const zip = new AdmZip()
  zip.addLocalFile(tempDbPath)
  zip.addLocalFile(metaPath)
  zip.addLocalFolder(attachmentsDir, 'attachments')
  zip.writeZip(customTargetFile)

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
  } catch (e) {
    console.warn('Temp clean warning:', e.message)
  }

  console.log('✅ E2E Test dosyası başarıyla oluşturuldu:')
  console.log('Konum:', customTargetFile)
  console.log('Dosya boyutu:', fs.statSync(customTargetFile).size, 'bytes')
  console.log('Kurum adı:', institutionName)
  console.log('Şema sürümü:', CURRENT_SCHEMA_VERSION)

  // Validation
  validateGeneratedFile(customTargetFile)

  // Eğer yönlendirilmiş masaüstü (OneDrive vb.) standart Desktop yolundan farklıysa oraya da kopyala
  if (fallbackDir !== targetDir) {
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
      const mirroredPath = path.join(fallbackDir, path.basename(customTargetFile))
      fs.copyFileSync(customTargetFile, mirroredPath)
      console.log('Ayna kopya oluşturuldu:', mirroredPath)
    } catch (e) {
      console.warn('Ayna kopya oluşturulamadı:', e.message)
    }
  }

  return customTargetFile
}

function validateGeneratedFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Oluşturulan dosya bulunamadı: ${filePath}`)
  }

  const zip = new AdmZip(filePath)
  const metaEntry = zip.getEntry('meta.json')
  const dbEntry = zip.getEntry('database.sqlite')

  if (!metaEntry || !dbEntry) {
    throw new Error('Geçersiz TEMİN 360 arşivi: meta.json veya database.sqlite eksik.')
  }

  const meta = JSON.parse(metaEntry.getData().toString('utf-8'))
  if (meta.schema_version !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Şema sürümü uyuşmazlığı: ${meta.schema_version} !== ${CURRENT_SCHEMA_VERSION}`)
  }

  console.log('✅ Dosya doğrulandı: meta.json ve database.sqlite sağlam.')
}

function cleanupStaleLocksAndArchives(dir = targetDir) {
  if (fs.existsSync(dir)) {
    try {
      const entries = fs.readdirSync(dir)
      for (const file of entries) {
        if (
          file.endsWith('.lock') ||
          file.includes('temp') ||
          file.includes('kalicilik') ||
          file.includes('izolasyon')
        ) {
          try {
            fs.unlinkSync(path.join(dir, file))
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

if (require.main === module) {
  cleanupStaleLocksAndArchives(targetDir)
  if (fallbackDir !== targetDir) {
    cleanupStaleLocksAndArchives(fallbackDir)
  }
  generateE2ETestFile()
  generateE2ETestFile(
    secondTargetFile,
    'E2E İkinci Test Kurumu',
    '2026/E2E-02',
    'İkinci Dosya Test Alımı'
  )
}

module.exports = {
  generateE2ETestFile,
  validateGeneratedFile,
  targetFile,
  secondTargetFile,
  targetDir
}
