import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  isSupportedFile,
  allExtensions,
  defaultFormat,
  allFormatsFilter,
  openDialogFilters,
  stripProjectExtension,
  PRIMARY_EXTENSION
} from '../fileFormats'

describe('File Formats Configuration & Validation (Strict .temin Standard)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should have .temin as primary default format with valid MIME type and ProgID', () => {
    expect(PRIMARY_EXTENSION).toBe('temin')
    expect(defaultFormat).toBeDefined()
    expect(defaultFormat.ext).toBe('temin')
    expect(defaultFormat.mimeType).toBe('application/x-temin')
    expect(defaultFormat.progId).toBe('Temin360.Document')
    expect(defaultFormat.isDefault).toBe(true)
    expect(allExtensions).toContain('temin')
    expect(allExtensions).toContain('hkmp')
    expect(allExtensions).toContain('tmn360')
  })

  it('should expose .temin in save filter and legacy formats in open filters', () => {
    expect(allFormatsFilter.extensions).toEqual(['temin'])
    expect(openDialogFilters[0].extensions).toEqual(['temin', 'hkmp', 'tmn360'])
  })

  it('should strip project extensions (.temin, .hkmp, .tmn360) accurately', () => {
    expect(stripProjectExtension('Belediye_Projesi.temin')).toBe('Belediye_Projesi')
    expect(stripProjectExtension('Belediye_Projesi.TEMIN')).toBe('Belediye_Projesi')
    expect(stripProjectExtension('Eski_Proje.hkmp')).toBe('Eski_Proje')
    expect(stripProjectExtension('Eski_Proje.HKMP')).toBe('Eski_Proje')
    expect(stripProjectExtension('Arsiv.tmn360')).toBe('Arsiv')
    expect(stripProjectExtension('Veri.dtal')).toBe('Veri.dtal')
    expect(stripProjectExtension('')).toBe('')
  })

  it('should return false for invalid or empty file paths', () => {
    expect(isSupportedFile('')).toBe(false)
    // @ts-expect-error testing runtime null safety
    expect(isSupportedFile(null)).toBe(false)
    // @ts-expect-error testing runtime undefined safety
    expect(isSupportedFile(undefined)).toBe(false)
    expect(isSupportedFile('-flag-arg')).toBe(false)
  })

  it('should return true for .temin and backward-compatible legacy project files (.hkmp, .tmn360)', () => {
    expect(isSupportedFile('C:\\Projects\\test.temin')).toBe(true)
    expect(isSupportedFile('/user/docs/file.TEMIN')).toBe(true)
    expect(isSupportedFile('"project.temin"')).toBe(true)
    expect(isSupportedFile('  "C:\\Data\\kurum.temin"  ')).toBe(true)
    // Backward compatibility: legacy files can be opened
    expect(isSupportedFile('/user/docs/file.hkmp')).toBe(true)
    expect(isSupportedFile('C:\\EskiVeri\\belediye.HKMP')).toBe(true)
    expect(isSupportedFile('archive.tmn360')).toBe(true)
  })

  it('should strictly reject other app extensions (İhale 360 and 2886) to prevent cross-app hijack', () => {
    expect(isSupportedFile('proje.ihale')).toBe(false)
    expect(isSupportedFile('ihale_dosyasi.ihale360')).toBe(false)
    expect(isSupportedFile('arsa_satisi.ihale2886')).toBe(false)
    expect(isSupportedFile('tasinmaz_kira.dihale')).toBe(false)
  })

  it('should return false for unsupported raw database or general file extensions', () => {
    expect(isSupportedFile('data.dtal')).toBe(false)
    expect(isSupportedFile('data.sqlite')).toBe(false)
    expect(isSupportedFile('data.db')).toBe(false)
    expect(isSupportedFile('project.dtm')).toBe(false)
    expect(isSupportedFile('document.docx')).toBe(false)
    expect(isSupportedFile('script.js')).toBe(false)
    expect(isSupportedFile('executable.exe')).toBe(false)
  })

  it('should NOT automatically accept arbitrary non-.temin files by raw SQLite or ZIP magic bytes', () => {
    const customFilePath = path.join(tempDir, 'mydata.customext')
    const sqliteHeader = Buffer.from('SQLite format 3\0', 'binary')
    fs.writeFileSync(customFilePath, sqliteHeader)
    expect(isSupportedFile(customFilePath)).toBe(false)

    const zipFilePath = path.join(tempDir, 'data.unknown')
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])
    fs.writeFileSync(zipFilePath, zipHeader)
    expect(isSupportedFile(zipFilePath)).toBe(false)
  })
})
