import { describe, it, expect } from 'vitest'
import {
  applyPassword,
  savePasswordToHistory,
  scrubPasswordHistory,
  resolveSystemUserDisplayName
} from '../dbAuthHandlers'

// Mock for better-sqlite3 Database supporting transactions and atomic rollbacks
class MockDb {
  private store: Map<string, string> = new Map()
  public shouldFailOnStatement: string | null = null

  transaction(fn: (...args: any[]) => any) {
    return (...args: any[]) => {
      const snapshot = new Map(this.store)
      try {
        const result = fn(...args)
        return result
      } catch (err) {
        this.store.clear()
        for (const [k, v] of snapshot) {
          this.store.set(k, v)
        }
        throw err
      }
    }
  }

  prepare(sql: string) {
    const self = this
    return {
      run(...args: any[]) {
        if (
          self.shouldFailOnStatement &&
          (sql.includes(self.shouldFailOnStatement) || args.includes(self.shouldFailOnStatement))
        ) {
          throw new Error(`Simulated database failure on statement: ${sql}`)
        }
        if (sql.includes('DELETE FROM settings WHERE key = ?')) {
          const keyToDelete = args[0]
          self.store.delete(keyToDelete)
          return { changes: 1 }
        }
        if (sql.includes("VALUES ('passwordHistory', ?)")) {
          self.store.set('passwordHistory', args[0])
          return { changes: 1 }
        }
        if (sql.includes('INSERT OR REPLACE INTO settings')) {
          const [k, v] = args
          self.store.set(k, v)
          return { changes: 1 }
        }
        return { changes: 0 }
      },
      get(arg?: any) {
        if (sql.includes("WHERE key = 'passwordHistory'")) {
          const val = self.store.get('passwordHistory')
          return val !== undefined ? { value: val } : undefined
        }
        if (sql.includes("WHERE key = 'adminPassword'")) {
          const val = self.store.get('adminPassword')
          return val !== undefined ? { value: val } : undefined
        }
        if (sql.includes("WHERE key = 'additionalUsers'")) {
          const val = self.store.get('additionalUsers')
          return val !== undefined ? { value: val } : undefined
        }
        if (sql.includes('WHERE key = ?')) {
          const val = self.store.get(arg)
          return val !== undefined ? { value: val } : undefined
        }
        return undefined
      },
      all(...args: any[]) {
        if (sql.includes('SELECT key FROM settings WHERE')) {
          if (sql.includes('userDevices')) {
            return Array.from(self.store.keys())
              .filter((k) => k.startsWith('userDevices_'))
              .map((key) => ({ key }))
          }
          if (args.length === 0) {
            return Array.from(self.store.keys())
              .filter((k) => k.startsWith('pcPass_'))
              .map((key) => ({ key }))
          }
          // SQL: (key LIKE 'pcPass!_' || ? || '!_%' ESCAPE '!') OR (key = 'pcPass_' || ?)
          // args[0] is escapedUser, args[1] is user
          const rawUser = args[1] || (args[0] ? args[0].replace(/!(.)/g, '$1') : '')
          const prefix = `pcPass_${rawUser}_`
          const exact = `pcPass_${rawUser}`
          return Array.from(self.store.keys())
            .filter((k) => k === exact || k.startsWith(prefix))
            .map((key) => ({ key }))
        }
        return Array.from(self.store.entries()).map(([key, value]) => ({ key, value }))
      }
    }
  }

  getRawStore() {
    return this.store
  }
}

describe('dbAuthHandlers password management and multi-device invalidation', () => {
  it('clears all stale pcPass entries across different machines when password is changed', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // Pre-populate old passwords on multiple machines
    store.set('adminUsername', 'admin')
    store.set('adminPassword', 'oldHashedAdminPassword')
    store.set('pcPass_admin_DESKTOP-OFFICE', 'oldHashedAdminPassword')
    store.set('pcPass_admin_LAPTOP-REMOTE', 'oldHashedAdminPassword')
    store.set('pcPass_admin_TABLET-WORK', 'oldHashedAdminPassword')
    store.set('pcPass_operator_OTHER-PC', 'operatorPassword') // Another user

    // Now admin changes password on current machine "LAPTOP-HOME"
    applyPassword(db, 'admin', 'YeniGucluSifre2026!', 'LAPTOP-HOME')

    // 1. Current machine key must exist and not match old password
    expect(store.has('pcPass_admin_LAPTOP-HOME')).toBe(true)
    expect(store.get('pcPass_admin_LAPTOP-HOME')).not.toBe('oldHashedAdminPassword')

    // 2. All previous machine keys for admin must be completely wiped out
    expect(store.has('pcPass_admin_DESKTOP-OFFICE')).toBe(false)
    expect(store.has('pcPass_admin_LAPTOP-REMOTE')).toBe(false)
    expect(store.has('pcPass_admin_TABLET-WORK')).toBe(false)

    // 3. Other users are strictly untouched
    expect(store.has('pcPass_operator_OTHER-PC')).toBe(true)
  })

  it('rolls back all changes atomically if an error occurs during applyPassword transaction', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // Initial state
    store.set('adminUsername', 'admin')
    store.set('adminPassword', 'originalPasswordHash')
    store.set('pcPass_admin_PC-ORIGINAL', 'originalPasswordHash')

    // Force failure during additionalUsers insertion
    db.shouldFailOnStatement = 'additionalUsers'

    expect(() => {
      applyPassword(db, 'admin', 'YeniSifreDenemesi!', 'NEW-PC')
    }).toThrow(/Simulated database failure/)

    // Entire state must be rolled back!
    expect(store.get('adminPassword')).toBe('originalPasswordHash')
    expect(store.get('pcPass_admin_PC-ORIGINAL')).toBe('originalPasswordHash')
    expect(store.has('pcPass_admin_NEW-PC')).toBe(false)
  })

  it('does not delete device credentials of users with similar names (e.g. admin vs admin_backup vs admin2)', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // Register other user in additionalUsers
    const additional = [
      { username: 'admin_backup' },
      { username: 'admin2' }
    ]
    store.set('additionalUsers', JSON.stringify(additional))

    // Pre-populate keys for admin and other similarly-named users
    store.set('pcPass_admin_PC1', 'adminHash')
    store.set('pcPass_admin_backup_PC1', 'backupHash')
    store.set('pcPass_admin2_PC1', 'admin2Hash')

    // Apply password only for "admin"
    applyPassword(db, 'admin', 'YeniGucluAdmin1!', 'PC2')

    // "admin" keys updated
    expect(store.has('pcPass_admin_PC1')).toBe(false)
    expect(store.has('pcPass_admin_PC2')).toBe(true)

    // "admin_backup" and "admin2" must remain intact
    expect(store.has('pcPass_admin_backup_PC1')).toBe(true)
    expect(store.has('pcPass_admin2_PC1')).toBe(true)
  })

  it('saves strictly audit-only data to passwordHistory without password or passwordHash', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    savePasswordToHistory(db, 'admin', 'GizliParola123!', 'TEST-PC')

    const raw = store.get('passwordHistory')
    expect(raw).toBeDefined()
    const history = JSON.parse(raw!)
    expect(history.length).toBe(1)
    expect(history[0].username).toBe('admin')
    expect(history[0].hostname).toBe('TEST-PC')
    expect(history[0].createdAt).toBeDefined()
    // CRITICAL: No password or passwordHash in history!
    expect(history[0].password).toBeUndefined()
    expect(history[0].passwordHash).toBeUndefined()
    expect(raw).not.toContain('GizliParola123!')
  })

  it('scrubs legacy plain passwords and hashes from existing passwordHistory', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // Legacy history containing password and passwordHash
    const legacyHistory = [
      {
        id: '1',
        username: 'admin',
        password: 'eski_plain_sifre',
        passwordHash: 'hash_abc123',
        hostname: 'OLD-PC',
        createdAt: '2025-01-01'
      }
    ]
    store.set('passwordHistory', JSON.stringify(legacyHistory))

    scrubPasswordHistory(db)

    const cleaned = JSON.parse(store.get('passwordHistory')!)
    expect(cleaned[0].username).toBe('admin')
    expect(cleaned[0].hostname).toBe('OLD-PC')
    expect(cleaned[0].password).toBeUndefined()
    expect(cleaned[0].passwordHash).toBeUndefined()
  })

  it('safely resolves system display name with sanitization, length limits, and fallback without shell', () => {
    // 1. Valid username formatting
    const name = resolveSystemUserDisplayName('mehmet.ozdemir')
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
    expect(name.length).toBeLessThanOrEqual(50)

    // 2. Empty fallback
    const emptyFallback = resolveSystemUserDisplayName('')
    expect(typeof emptyFallback).toBe('string')
    expect(emptyFallback.length).toBeGreaterThan(0)

    // 3. Sanitizes weird characters and extra spaces
    const sanitized = resolveSystemUserDisplayName('ali   veli\n\tdemir')
    expect(sanitized).not.toContain('\n')
    expect(sanitized).not.toContain('\t')
  })

  it('throws an error if db does not support transactions', () => {
    const dbWithoutTx = { prepare: () => ({ run: () => {} }) }
    expect(() => {
      applyPassword(dbWithoutTx as any, 'admin', 'Pass123!', 'PC1')
    }).toThrow(/transaction support is required/)
  })

  it('preserves similarly-named user credentials even when additionalUsers is corrupted or missing', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // additionalUsers is corrupted invalid JSON
    store.set('additionalUsers', '{corrupted_json_string')

    // Pre-populate keys for admin and other similarly-named users
    store.set('pcPass_admin_PC1', 'adminHash')
    store.set('pcPass_admin_backup_PC1', 'backupHash')
    store.set('pcPass_admin2_PC1', 'admin2Hash')

    // Apply password only for "admin"
    applyPassword(db, 'admin', 'YeniGucluAdmin1!', 'PC2')

    // "admin" keys updated
    expect(store.has('pcPass_admin_PC1')).toBe(false)
    expect(store.has('pcPass_admin_PC2')).toBe(true)

    // "admin_backup" and "admin2" MUST remain intact even though additionalUsers was corrupted!
    expect(store.has('pcPass_admin_backup_PC1')).toBe(true)
    expect(store.has('pcPass_admin2_PC1')).toBe(true)
    expect(store.get('pcPass_admin_backup_PC1')).toBe('backupHash')
    expect(store.get('pcPass_admin2_PC1')).toBe('admin2Hash')
  })

  it('maintains userDevices explicit data model when updating passwords', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    applyPassword(db, 'admin', 'Pass123!', 'OFFICE-1')
    expect(store.get('userDevices_admin')).toBe(JSON.stringify(['OFFICE-1']))

    applyPassword(db, 'admin', 'Pass456!', 'OFFICE-2')
    expect(store.get('userDevices_admin')).toBe(JSON.stringify(['OFFICE-2']))
    expect(store.has('pcPass_admin_OFFICE-1')).toBe(false)
    expect(store.has('pcPass_admin_OFFICE-2')).toBe(true)
  })

  it('correctly handles hostnames containing multiple underscores (e.g. PC_WORK_1_OFFICE) and preserves similarly-named accounts', () => {
    const db = new MockDb()
    const store = db.getRawStore()

    // Setup another user in userDevices
    store.set('userDevices_admin_backup', JSON.stringify(['PC_WORK_1_OFFICE']))
    store.set('additionalUsers', JSON.stringify([{ username: 'admin_backup' }]))

    // Both users have keys on a PC with multiple underscores in hostname
    store.set('pcPass_admin_PC_WORK_1_OFFICE', 'adminOldHash')
    store.set('pcPass_admin_backup_PC_WORK_1_OFFICE', 'backupHash')

    // Admin updates password on a new PC
    applyPassword(db, 'admin', 'NewPass123!', 'NEW_LAPTOP_2')

    // Admin's old multi-underscore device key must be deleted
    expect(store.has('pcPass_admin_PC_WORK_1_OFFICE')).toBe(false)
    expect(store.has('pcPass_admin_NEW_LAPTOP_2')).toBe(true)

    // admin_backup's key on the same multi-underscore PC must be strictly preserved!
    expect(store.has('pcPass_admin_backup_PC_WORK_1_OFFICE')).toBe(true)
    expect(store.get('pcPass_admin_backup_PC_WORK_1_OFFICE')).toBe('backupHash')
  })
})

