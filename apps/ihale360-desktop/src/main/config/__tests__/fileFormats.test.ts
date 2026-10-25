import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  isSupportedFile,
  allExtensions,
  defaultFormat,
  allFormatsFilter,
  perFormatFilters,
  stripProjectExtension,
  PRIMARY_EXTENSION
} from '../fileFormats'

describe('File Formats Configuration & Validation (İHALE 360 .ihale Standard)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ihale360-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should have .ihale as primary active format and include .ihale360', () => {
    expect(PRIMARY_EXTENSION).toBe('ihale')
    expect(defaultFormat).toBeDefined()
    expect(defaultFormat.ext).toBe('ihale')
    expect(defaultFormat.isDefault).toBe(true)
    expect(allExtensions).toEqual(['ihale', 'ihale360'])
  })

  it('should expose .ihale and .ihale360 in dialog filters', () => {
    expect(allFormatsFilter.extensions).toEqual(['ihale', 'ihale360'])
    expect(perFormatFilters).toHaveLength(2)
    expect(perFormatFilters[0].extensions).toEqual(['ihale'])
    expect(perFormatFilters[1].extensions).toEqual(['ihale360'])
  })

  it('should strip .ihale and .ihale360 project extensions accurately', () => {
    expect(stripProjectExtension('Hizmet_Alimi_Ihale.ihale')).toBe('Hizmet_Alimi_Ihale')
    expect(stripProjectExtension('Yapim_Isi.IHALE')).toBe('Yapim_Isi')
    expect(stripProjectExtension('Danismanlik_Ihale.ihale360')).toBe('Danismanlik_Ihale')
    expect(stripProjectExtension('Eski_Proje.temin')).toBe('Eski_Proje.temin')
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

  it('should return true for .ihale and .ihale360 project files', () => {
    expect(isSupportedFile('C:\\Projects\\ihale_2026.ihale')).toBe(true)
    expect(isSupportedFile('/user/docs/ihale_dosyasi.IHALE')).toBe(true)
    expect(isSupportedFile('"ihale_dosyasi.ihale360"')).toBe(true)
    expect(isSupportedFile('  "C:\\Data\\proje.ihale"  ')).toBe(true)
  })

  it('should reject non-ihale extensions as project files', () => {
    expect(isSupportedFile('/user/docs/file.hkmp')).toBe(false)
    expect(isSupportedFile('archive.tmn360')).toBe(false)
    expect(isSupportedFile('data.dtal')).toBe(false)
    expect(isSupportedFile('data.sqlite')).toBe(false)
    expect(isSupportedFile('data.db')).toBe(false)
    expect(isSupportedFile('document.docx')).toBe(false)
    expect(isSupportedFile('script.js')).toBe(false)
    expect(isSupportedFile('executable.exe')).toBe(false)
  })

  it('should NOT automatically accept arbitrary non-ihale files by raw SQLite or ZIP magic bytes', () => {
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
