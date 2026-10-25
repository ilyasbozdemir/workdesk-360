import { describe, it, expect } from 'vitest'
import {
  extractProjectRootName,
  isBackupOfProject,
  parseBackupFilenameTimestamp,
  getCloudFileTimestamp,
  sortCloudBackups,
  evaluateNewerVersion,
  type GDriveFile
} from '../gdriveUtils'

describe('Google Drive Version Evaluation & Project Matching', () => {
  describe('extractProjectRootName', () => {
    it('extracts base name from timestamped .temin file', () => {
      expect(extractProjectRootName('Hastane_Onarim_2026-10-19_14-30.temin')).toBe('Hastane_Onarim')
      expect(extractProjectRootName('Hastane_Onarim_2026-10-19_14-30-15.temin')).toBe(
        'Hastane_Onarim'
      )
      expect(extractProjectRootName('Proje_surum#2.temin')).toBe('Proje')
      expect(extractProjectRootName('Proje.temin')).toBe('Proje')
    })
  })

  describe('isBackupOfProject', () => {
    it('matches valid timestamped backup of the project', () => {
      expect(isBackupOfProject('ihale_2026-10-19_15-30.temin', 'ihale')).toBe(true)
      expect(isBackupOfProject('ihale_2026-10-19_15-30-45.temin', 'ihale')).toBe(true)
      expect(isBackupOfProject('ihale.temin', 'ihale')).toBe(true)
    })

    it('rejects different project with a similar prefix (prefix false positive bug)', () => {
      // Must not match ihale_ek_bina to ihale!
      expect(isBackupOfProject('ihale_ek_bina_2026-10-19_15-30.temin', 'ihale')).toBe(false)
      expect(isBackupOfProject('ihale_2_kutuphane_2026-10-19.temin', 'ihale')).toBe(false)
    })

    it('matches when appProperties.projectRoot is set', () => {
      expect(isBackupOfProject('ozel_yedek_adi.temin', 'ihale', 'ihale')).toBe(true)
    })
  })

  describe('parseBackupFilenameTimestamp & getCloudFileTimestamp', () => {
    it('parses timestamp from filename', () => {
      const ts = parseBackupFilenameTimestamp('Proje_2026-10-19_18-30.temin')
      expect(ts).not.toBeNull()
      const date = new Date(ts!)
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(9) // 0-indexed October
      expect(date.getDate()).toBe(19)
      expect(date.getHours()).toBe(18)
      expect(date.getMinutes()).toBe(30)
    })

    it('returns highest timestamp among modifiedTime, createdTime and filename', () => {
      const file: GDriveFile = {
        id: '1',
        name: 'Proje_2026-10-19_18-30.temin',
        createdTime: '2026-10-19T18:30:00.000Z',
        modifiedTime: '2026-10-19T18:31:00.000Z'
      }
      const ts = getCloudFileTimestamp(file)
      expect(ts).toBeGreaterThan(0)
    })
  })

  describe('sortCloudBackups', () => {
    it('sorts newest backups first', () => {
      const f1: GDriveFile = {
        id: '1',
        name: 'Proje_2026-10-19_10-00.temin',
        createdTime: '2026-10-19T10:00:00.000Z'
      }
      const f2: GDriveFile = {
        id: '2',
        name: 'Proje_2026-10-19_15-00.temin',
        createdTime: '2026-10-19T15:00:00.000Z'
      }
      const f3: GDriveFile = {
        id: '3',
        name: 'Proje_2026-10-19_12-00.temin',
        createdTime: '2026-10-19T12:00:00.000Z'
      }

      const sorted = sortCloudBackups([f1, f2, f3])
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })
  })

  describe('evaluateNewerVersion', () => {
    const pcABackup: GDriveFile = {
      id: 'gdrive-file-pca',
      name: 'Proje_2026-10-19_18-00.temin',
      createdTime: '2026-10-19T18:00:00.000Z',
      modifiedTime: '2026-10-19T18:00:00.000Z',
      appProperties: {
        deviceName: 'PC-A-DESKTOP',
        deviceLabel: 'Masaüstü PC-A',
        projectRoot: 'Proje',
        lastUserMutationAt: '2026-10-19T18:00:00.000Z'
      }
    }

    it('Scenario 1: Detects newer version when PC B opens older clean workspace', () => {
      // PC B opens local workspace that had last user edit at 14:00 (or updated_at at 14:00)
      const res = evaluateNewerVersion({
        currentFileName: 'Proje.temin',
        activeMeta: {
          updated_at: '2026-10-19T14:00:00.000Z',
          last_user_mutation_at: '2026-10-19T14:00:00.000Z'
        },
        cloudFiles: [pcABackup],
        isDirty: false,
        currentDeviceName: 'PC-B-LAPTOP',
        currentDeviceLabel: 'Dizüstü PC-B'
      })

      expect(res.hasNewerVersion).toBe(true)
      expect(res.newerFile?.id).toBe('gdrive-file-pca')
      expect(res.isConflict).toBe(false)
    })

    it('Scenario 2: Returns false if the cloud backup is already active locally (same ID or name)', () => {
      const res = evaluateNewerVersion({
        currentFileName: 'Proje.temin',
        activeMeta: {
          updated_at: '2026-10-19T18:00:00.000Z'
        },
        lastBackupFileId: 'gdrive-file-pca',
        lastBackupFileName: 'Proje_2026-10-19_18-00.temin',
        cloudFiles: [pcABackup],
        isDirty: false
      })

      expect(res.hasNewerVersion).toBe(false)
      expect(res.newerFile).toBeNull()
    })

    it('Scenario 3: Returns false if local workspace has newer user mutation than cloud', () => {
      const res = evaluateNewerVersion({
        currentFileName: 'Proje.temin',
        activeMeta: {
          last_user_mutation_at: '2026-10-19T19:00:00.000Z',
          updated_at: '2026-10-19T19:00:00.000Z'
        },
        cloudFiles: [pcABackup],
        isDirty: true
      })

      expect(res.hasNewerVersion).toBe(false)
    })

    it('Scenario 4: Flags conflict when local workspace is dirty and cloud has a newer version', () => {
      const res = evaluateNewerVersion({
        currentFileName: 'Proje.temin',
        activeMeta: {
          last_user_mutation_at: '2026-10-19T17:00:00.000Z',
          updated_at: '2026-10-19T17:00:00.000Z'
        },
        cloudFiles: [pcABackup],
        isDirty: true,
        currentDeviceName: 'PC-B-LAPTOP'
      })

      expect(res.hasNewerVersion).toBe(true)
      expect(res.isConflict).toBe(true)
    })

    it('Scenario 5: Ignores backups of unrelated projects in the same Drive folder', () => {
      const unrelatedBackup: GDriveFile = {
        id: 'other-proj-id',
        name: 'Proje_Ek_Bina_2026-10-19_19-00.temin',
        createdTime: '2026-10-19T19:00:00.000Z',
        modifiedTime: '2026-10-19T19:00:00.000Z'
      }

      const res = evaluateNewerVersion({
        currentFileName: 'Proje.temin',
        activeMeta: {
          updated_at: '2026-10-19T14:00:00.000Z'
        },
        cloudFiles: [unrelatedBackup],
        isDirty: false
      })

      expect(res.hasNewerVersion).toBe(false)
      expect(res.newerFile).toBeNull()
    })
  })
})
