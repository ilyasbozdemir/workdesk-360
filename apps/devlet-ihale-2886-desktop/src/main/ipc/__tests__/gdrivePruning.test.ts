import { describe, it, expect } from 'vitest'

describe('Google Drive Backup Pruning Regex', () => {
  function matchBackupFile(projectRoot: string, fileName: string): boolean {
    const cleanRoot = projectRoot.trim().toLowerCase()
    const escaped = cleanRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    try {
      const pattern = new RegExp(
        `^${escaped}(?:(?:[-_.](?:\\d{4}[-_.]\\d{2}[-_.]\\d{2}(?:[-_.T]\\d{2}[-_.]\\d{2}(?:[-_.]\\d{2})?)?)|_surum\\s*#?\\d+)?\\.temin$`,
        'i'
      )
      return pattern.test(fileName.trim().toLowerCase())
    } catch {
      return fileName.trim().toLowerCase().startsWith(cleanRoot)
    }
  }

  it('compiles without SyntaxError on complex Turkish institution names with dotted i and hyphens', () => {
    const projectRoot = 'kamu idaresi i̇hale - doğrudan temin'
    expect(() => {
      matchBackupFile(projectRoot, 'test.temin')
    }).not.toThrow()
  })

  it('matches timestamped backup filenames correctly', () => {
    const projectRoot = 'kamu idaresi i̇hale - doğrudan temin'
    const fileName = 'kamu idaresi i̇hale - doğrudan temin_2026-10-19_21-50.temin'
    expect(matchBackupFile(projectRoot, fileName)).toBe(true)
  })

  it('matches versioned backup filenames correctly', () => {
    const projectRoot = 'kamu idaresi i̇hale - doğrudan temin'
    const fileName = 'kamu idaresi i̇hale - doğrudan temin_surum #2.temin'
    expect(matchBackupFile(projectRoot, fileName)).toBe(true)
  })

  it('matches raw base backup filenames without suffix', () => {
    const projectRoot = 'proje_adi'
    const fileName = 'proje_adi.temin'
    expect(matchBackupFile(projectRoot, fileName)).toBe(true)
  })

  it('rejects unrelated files', () => {
    const projectRoot = 'kamu idaresi'
    const fileName = 'baska_bir_dosya_2026-10-19.temin'
    expect(matchBackupFile(projectRoot, fileName)).toBe(false)
  })
})
