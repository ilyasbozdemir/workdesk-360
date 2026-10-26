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

describe('File Formats Configuration & Validation (DEVLET İHALE 2886 .ihale2886 Standard)', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devlet2886-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should have .ihale2886 as primary active format and include .dihale with MIME and ProgID', () => {
    expect(PRIMARY_EXTENSION).toBe('ihale2886')
    expect(defaultFormat).toBeDefined()
    expect(defaultFormat.ext).toBe('ihale2886')
    expect(defaultFormat.mimeType).toBe('application/x-ihale2886')
    expect(defaultFormat.progId).toBe('DevletIhale2886.Document')
    expect(defaultFormat.isDefault).toBe(true)
    expect(allExtensions).toEqual(['ihale2886', 'dihale'])
  })

  it('should expose .ihale2886 and .dihale in dialog filters', () => {
    expect(allFormatsFilter.extensions).toEqual(['ihale2886', 'dihale'])
    expect(perFormatFilters).toHaveLength(2)
    expect(perFormatFilters[0].extensions).toEqual(['ihale2886'])
    expect(perFormatFilters[1].extensions).toEqual(['dihale'])
  })

  it('should strip .ihale2886 and .dihale project extensions accurately', () => {
    expect(stripProjectExtension('Belediye_Kira_Ihale.ihale2886')).toBe('Belediye_Kira_Ihale')
    expect(stripProjectExtension('Satis_Ihale.IHALE2886')).toBe('Satis_Ihale')
    expect(stripProjectExtension('Mulk_Kiralama.dihale')).toBe('Mulk_Kiralama')
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

  it('should return true for .ihale2886 and .dihale project files', () => {
    expect(isSupportedFile('C:\\Projects\\ihale2886_2026.ihale2886')).toBe(true)
    expect(isSupportedFile('/user/docs/tasinmaz_ihalesi.IHALE2886')).toBe(true)
    expect(isSupportedFile('"ihale_dosyasi.dihale"')).toBe(true)
    expect(isSupportedFile('  "C:\\Data\\proje.ihale2886"  ')).toBe(true)
  })

  it('should reject non-2886 extensions as project files', () => {
    expect(isSupportedFile('/user/docs/file.hkmp')).toBe(false)
    expect(isSupportedFile('archive.tmn360')).toBe(false)
    expect(isSupportedFile('data.dtal')).toBe(false)
    expect(isSupportedFile('data.sqlite')).toBe(false)
    expect(isSupportedFile('data.db')).toBe(false)
    expect(isSupportedFile('document.docx')).toBe(false)
    expect(isSupportedFile('script.js')).toBe(false)
    expect(isSupportedFile('executable.exe')).toBe(false)
  })

  it('should NOT automatically accept arbitrary non-2886 files by raw SQLite or ZIP magic bytes', () => {
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
