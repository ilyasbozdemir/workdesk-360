import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface StoragePaths {
  baseDir: string
  documentsDir: string
  dataDir: string
  configPath: string
  dbPath: string
  isPortable: boolean
  isFallbackAppData: boolean
  fallbackReason?: string | null
}

let cachedPaths: StoragePaths | null = null

function testWritable(dirPath: string): boolean {
  const testFile = path.join(dirPath, `.arsiv360_write_test_${Date.now()}`)
  try {
    fs.writeFileSync(testFile, 'test', 'utf-8')
    fs.unlinkSync(testFile)
    return true
  } catch {
    return false
  }
}

export function getStoragePaths(): StoragePaths {
  if (cachedPaths) return cachedPaths

  const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_DIR)
  const candidateBase =
    process.env.PORTABLE_EXECUTABLE_DIR ||
    (app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath())

  const baseDir = path.resolve(candidateBase)
  const documentsDir = path.join(baseDir, 'Belgeler')

  // Belgeler dizini yoksa oluştur
  try {
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true })
    }
  } catch (err) {
    console.error('Belgeler klasörü oluşturulamadı:', err)
  }

  // Base dizininde yazma izni testi yap
  const canWriteBase = testWritable(baseDir)

  let dataDir = baseDir
  let isFallbackAppData = false
  let fallbackReason: string | null = null

  if (!canWriteBase) {
    isFallbackAppData = true
    fallbackReason = 'Taşınabilir dizinde yazma izni bulunamadı. Veriler geçici olarak AppData dizininde saklanıyor.'
    dataDir = path.join(app.getPath('userData'), 'Arsiv360')
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
    } catch (e) {
      console.error('AppData Arsiv360 dizini oluşturulamadı:', e)
    }
  }

  const configPath = path.join(dataDir, 'arsiv360.config.json')
  const dbPath = path.join(dataDir, 'arsiv360.db')

  cachedPaths = {
    baseDir,
    documentsDir,
    dataDir,
    configPath,
    dbPath,
    isPortable,
    isFallbackAppData,
    fallbackReason
  }

  return cachedPaths
}

