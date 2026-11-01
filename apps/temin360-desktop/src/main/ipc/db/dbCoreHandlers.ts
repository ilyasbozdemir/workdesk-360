import { ipcMain } from 'electron'
import {
  workspaceManager,
  ensureSchemaIntegrity,
  extractTableAndAction
} from '../../database/workspace'
import { validateSqlQuery } from '../utils/sqlGuard'
import { withSchemaRetry } from '../utils/schemaRetry'

import { handleDbTransaction, executeDbTransaction } from './dbTransaction'

export { handleDbTransaction, executeDbTransaction }

/**
 * Veritabanı Temel SQL Çalıştırma ve Sorgulama IPC İşleyicileri
 * SQLite veritabanı üzerinde SELECT, INSERT, UPDATE, DELETE ve TRANSACTION işlemlerini
 * şema kurtarma ve SQL güvenlik kontrolleri ile birlikte yürütür.
 */
export function registerDbCoreHandlers(): void {
  /**
   * SELECT Sorgusu Çalıştırma İşleyicisi (`db:query`)
   * @param sql Çalıştırılacak SQL SELECT sorgusu
   * @param params Sorgu parametreleri
   * @returns İşlem sonucu ve veri satırları listesi
   */
  ipcMain.handle('db:query', async (_, sqlOrPayload: any, maybeParams: any[] = []) => {
    const sql = typeof sqlOrPayload === 'string' ? sqlOrPayload : sqlOrPayload?.sql
    const params = typeof sqlOrPayload === 'string' ? maybeParams : (sqlOrPayload?.params || maybeParams || [])
    try {
      validateSqlQuery(sql, params)
      const executeQuery = async () => {
        const db = workspaceManager.getDb()
        const stmt = db.prepare(sql)
        // Defansif kontrol: Eğer çağrılan ifade veri döndürmeyen bir sorgu ise (UPDATE, INSERT, DELETE vb.)
        // better-sqlite3 "This statement does not return data. Use run() instead" hatası fırlatır.
        if (!stmt.reader) {
          const info = stmt.run(...params)
          const changes = Number(info.changes ?? 0)
          if (changes > 0) {
            const { tableName, action } = extractTableAndAction(sql)
            workspaceManager.recordMutation(tableName, action, changes)
            if (workspaceManager.isDirty()) {
              workspaceManager.saveDebounced(1000)
            }
          }
          return {
            success: true,
            data: [],
            lastInsertRowid: info.lastInsertRowid,
            changes: info.changes
          }
        }
        const rows = stmt.all(...params)
        return { success: true, data: rows }
      }

      return await withSchemaRetry(
        executeQuery,
        async () => {
          const db = workspaceManager.getDb()
          ensureSchemaIntegrity(db)
        },
        sql
      )
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /**
   * INSERT, UPDATE, DELETE İşlem Çalıştırma İşleyicisi (`db:run`)
   * @param sql Çalıştırılacak DML SQL ifadesi
   * @param params Sorgu parametreleri
   * @returns Son eklenen satır ID'si ve etkilenen satır sayısı
   */
  ipcMain.handle('db:run', async (_, sql: string, params: any[] = []) => {
    try {
      validateSqlQuery(sql, params)
      const executeRun = async () => {
        const db = workspaceManager.getDb()
        const stmt = db.prepare(sql)
        const info = stmt.run(...params)
        const changes = Number(info.changes ?? 0)
        if (changes > 0) {
          const { tableName, action } = extractTableAndAction(sql)
          workspaceManager.recordMutation(tableName, action, changes)
          if (workspaceManager.isDirty()) {
            workspaceManager.saveDebounced(1000)
          }
        }
        return { success: true, lastInsertRowid: info.lastInsertRowid, changes: info.changes }
      }

      return await withSchemaRetry(
        executeRun,
        async () => {
          const db = workspaceManager.getDb()
          ensureSchemaIntegrity(db)
        },
        sql
      )
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Alternatif SQL İfadesi Çalıştırma İşleyicisi (`db:execute`)
   * @param sql Çalıştırılacak SQL ifadesi
   * @param params Parametreler dizisi veya değişken argümanlar
   */
  ipcMain.handle('db:execute', async (_, sql: string, ...params: any[]) => {
    try {
      const actualParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
      validateSqlQuery(sql, actualParams)
      const executeStmt = async () => {
        const db = workspaceManager.getDb()
        const stmt = db.prepare(sql)
        const info = stmt.run(...actualParams)
        const changes = Number(info.changes ?? 0)
        if (changes > 0) {
          const { tableName, action } = extractTableAndAction(sql)
          workspaceManager.recordMutation(tableName, action, changes)
          if (workspaceManager.isDirty()) {
            workspaceManager.saveDebounced(1000)
          }
        }
        return { success: true, lastInsertRowid: info.lastInsertRowid, changes: info.changes }
      }

      return await withSchemaRetry(
        executeStmt,
        async () => {
          const db = workspaceManager.getDb()
          ensureSchemaIntegrity(db)
        },
        sql
      )
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Çoklu Sorgu Tranzaksiyonu (Transaction) İşleyicisi (`db:transaction`)
   * @param queries Çalıştırılacak SQL ve parametre nesneleri dizisi
   * @returns Tranzaksiyon sonucu ve toplam değişen satır sayısı
   */
  ipcMain.handle('db:transaction', async (_, queries: { sql: string; params?: any[] }[]) => {
    return handleDbTransaction(workspaceManager.getDb(), queries, {
      validateSql: true,
      onMutation: (tableName, action, count) => {
        workspaceManager.recordMutation(tableName, action, count)
      },
      onSave: () => {
        if (workspaceManager.isDirty()) {
          workspaceManager.save()
        }
      }
    })
  })

  /**
   * Teftiş ve Güvenlik Denetim Günlüğü İşleyicisi (`audit:get-history`)
   */
  ipcMain.handle(
    'audit:get-history',
    async (_, filter?: { recordId?: number; tableName?: string; limit?: number }) => {
      try {
        const db = workspaceManager.getDb()
        const { getAuditHistory } = await import('@dt/database')
        return getAuditHistory(db, filter)
      } catch (err: any) {
        console.warn('[IPC] audit:get-history error:', err?.message || err)
        return []
      }
    }
  )

  /**
   * Blokzincir Denetim Zinciri Bütünlük Doğrulayıcısı (`audit:verify-chain`)
   * Varsayılan olarak veritabanı durumunu değiştirmeden doğrular.
   */
  ipcMain.handle(
    'audit:verify-chain',
    async (_event, options?: { autoSeal?: boolean; allowPendingUnhashed?: boolean }) => {
      try {
        const db = workspaceManager.getDb()
        const { AuditChainService, AuditIntegrityVerifier } = await import('@dt/database')
        if (options?.autoSeal) {
          AuditChainService.secureAllPendingLogs(db)
        }
        return AuditIntegrityVerifier.verifyChain(db, {
          allowPendingUnhashed: options?.allowPendingUnhashed
        })
      } catch (err: any) {
        console.warn('[IPC] audit:verify-chain error:', err?.message || err)
        return {
          isValid: false,
          isFullySealed: false,
          hasPendingUnhashed: false,
          status: 'ERROR',
          totalRecords: 0,
          sealedRecords: 0,
          unhashedRecords: 0,
          error: err?.message || String(err)
        }
      }
    }
  )

  /**
   * Bekleyen mühürsüz denetim kayıtlarını zincire bağlama (`audit:seal-pending`)
   */
  ipcMain.handle('audit:seal-pending', async () => {
    try {
      const db = workspaceManager.getDb()
      const { AuditChainService, AuditIntegrityVerifier } = await import('@dt/database')
      const sealedCount = AuditChainService.secureAllPendingLogs(db)
      const verify = AuditIntegrityVerifier.verifyChain(db)
      return {
        success: true,
        sealedCount,
        chainStatus: verify
      }
    } catch (err: any) {
      console.warn('[IPC] audit:seal-pending error:', err?.message || err)
      return {
        success: false,
        error: err?.message || String(err)
      }
    }
  })
}

