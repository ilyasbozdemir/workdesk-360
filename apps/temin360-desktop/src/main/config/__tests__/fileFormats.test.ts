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

  it('should have .temin as single active format', () => {
    expect(PRIMARY_EXTENSION).toBe('temin')
    expect(defaultFormat).toBeDefined()
    expect(defaultFormat.ext).toBe('temin')
    expect(defaultFormat.isDefault).toBe(true)
    expect(allExtensions).toEqual(['temin'])
  })

  it('should only expose .temin in dialog filters', () => {
    expect(allFormatsFilter.extensions).toEqual(['temin'])
    expect(perFormatFilters).toHaveLength(1)
    expect(perFormatFilters[0].extensions).toEqual(['temin'])
  })

  it('should strip only .temin project extension accurately', () => {
    expect(stripProjectExtension('Belediye_Projesi.temin')).toBe('Belediye_Projesi')
    expect(stripProjectExtension('Belediye_Projesi.TEMIN')).toBe('Belediye_Projesi')
    // Legacy extensions are no longer treated as project extensions
    expect(stripProjectExtension('Eski_Proje.hkmp')).toBe('Eski_Proje.hkmp')
    expect(stripProjectExtension('Veri.dtal')).toBe('Veri.dtal')
    expect(stripProjectExtension('Arsiv.tmn360')).toBe('Arsiv.tmn360')
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

  it('should return true ONLY for .temin project files', () => {
    expect(isSupportedFile('C:\\Projects\\test.temin')).toBe(true)
    expect(isSupportedFile('/user/docs/file.TEMIN')).toBe(true)
    expect(isSupportedFile('"project.temin"')).toBe(true)
    expect(isSupportedFile('  "C:\\Data\\kurum.temin"  ')).toBe(true)
  })

  it('should reject legacy extensions as project files', () => {
    expect(isSupportedFile('/user/docs/file.hkmp')).toBe(false)
    expect(isSupportedFile('archive.tmn360')).toBe(false)
    expect(isSupportedFile('data.dtal')).toBe(false)
    expect(isSupportedFile('data.sqlite')).toBe(false)
    expect(isSupportedFile('data.db')).toBe(false)
    expect(isSupportedFile('project.dtm')).toBe(false)
    expect(isSupportedFile('project.dte')).toBe(false)
    expect(isSupportedFile('project.dta')).toBe(false)
    expect(isSupportedFile('  "project.dtal"  ')).toBe(false)
  })

  it('should return false for unsupported file extensions', () => {
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
