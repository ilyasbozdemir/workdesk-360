import type { DomainEvent } from '../domain/shared/DomainEvent'
import type { DirectProcurementFile, FileStage } from '../domain/file/DirectProcurementFile'
import type { RateSnapshot } from '../domain/profile/DeductionRule'

/** Portlar application'ın ihtiyacını tanımlar; implementasyonları infrastructure yazar. */
export interface FileRepository {
  findById(id: number): Promise<DirectProcurementFile | undefined>
  save(file: DirectProcurementFile): Promise<void>
}
export interface RateProvider {
  /** İşlem tarihinde geçerli mevzuat oranları (binde) */
  ratesFor(isoDate: string): Promise<RateSnapshot>
}
export interface EventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>
}

/* ---- olay tepkilerinin (reaction) ihtiyaç duyduğu portlar ---- */
export interface DocumentStatusPort {
  /** Verilen şablonlardan üretilmiş belgeleri "yeniden üretilmeli" durumuna alır. */
  markNeedsRegeneration(dosyaId: number, templateCodes: readonly string[], reason: string): Promise<void>
}
export interface StageProgressPort {
  /** Dosyanın aşamasını yalnızca İLERİ taşır, geri almaz. */
  advanceTo(dosyaId: number, stage: FileStage): Promise<void>
}
export interface AuditLogPort {
  write(entry: { title: string; message: string; level: 'info' | 'success' | 'warning' | 'error' }): Promise<void>
}

/**
 * SQL erişim portu. Şekli, uygulamadaki mevcut `db:query` / `db:transaction` IPC çağrılarını
 * ve winnerSyncService'in `WinnerSyncDbExecutor` arayüzünü yansıtır:
 * renderer'da IPC, main'de better-sqlite3 ile aynı repository çalışır.
 */
export interface SqlStatement { sql: string; params?: readonly unknown[] }
export interface SqlExecutor {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>
  /** Tüm ifadeler tek atomik işlemde çalışır; biri hata verirse hiçbiri uygulanmaz. */
  transaction(statements: readonly SqlStatement[]): Promise<void>
}
