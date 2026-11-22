import type {
  EventPublisher,
  SqlExecutor,
  SqlStatement,
} from "@worksuite-360/core";
import type {
  DirectProcurementFile,
  FileStage,
} from "../domain/file/DirectProcurementFile";
import type { RateSnapshot } from "../domain/profile/DeductionRule";

// Genel altyapı sözleşmelerini modül içi kullanım ve uyumluluk için dışa aktar
export type { EventPublisher, SqlExecutor, SqlStatement };

/**
 * Dosya Deposu Arayüzü (Repository Port).
 *
 * Doğrudan temin aggregate nesnesini kalıcı saklama alanından (SQLite vb.)
 * okur ve değişiklikleri kaydeder.
 */
export interface FileRepository {
  /**
   * Belirtilen ID'ye sahip doğrudan temin dosyasını aggregate root olarak yükler.
   *
   * @param id - Dosya ID'si
   * @returns Bulunursa DirectProcurementFile, aksi halde `undefined`
   */
  findById(id: number): Promise<DirectProcurementFile | undefined>;
  /**
   * Doğrudan temin dosyasının güncel durumunu ve kalemlerini kalıcı veritabanına kaydeder.
   *
   * @param file - Kaydedilecek dosya nesnesi
   */
  save(file: DirectProcurementFile): Promise<void>;
}

/**
 * Mevzuat Oran Sağlayıcı Arayüzü (Rate Provider Port).
 *
 * Verilen işlem tarihindeki resmî karar pulu ve damga vergisi binde oranlarını sağlar.
 */
export interface RateProvider {
  /**
   * İşlem tarihinde geçerli mevzuat oranlarını (binde cinsinden) getirir.
   *
   * @param isoDate - İşlem tarihi (ISO formatı YYYY-MM-DD)
   */
  ratesFor(isoDate: string): Promise<RateSnapshot>;
}

/* ---- Olay Tepkilerinin (Reaction) İhtiyaç Duyduğu Portlar ---- */

/**
 * Belge Durum Yönetimi Portu.
 */
export interface DocumentStatusPort {
  /**
   * Verilen şablonlardan üretilmiş belgeleri "yeniden üretilmeli / bayat" durumuna alır.
   *
   * @param dosyaId - Dosya ID'si
   * @param templateCodes - Etkilenen şablon kodları
   * @param reason - Geçersiz kılma gerekçesi
   */
  markNeedsRegeneration(
    dosyaId: number,
    templateCodes: readonly string[],
    reason: string,
  ): Promise<void>;
}

/**
 * Aşama İlerleme Portu.
 */
export interface StageProgressPort {
  /**
   * Dosyanın aşamasını yalnızca ileriye doğru taşır (Geri alma izin verilmez).
   *
   * @param dosyaId - Dosya ID'si
   * @param stage - Geçilecek yeni aşama
   */
  advanceTo(dosyaId: number, stage: FileStage): Promise<void>;
}

/**
 * Denetim İzi (Audit Log) Portu.
 */
export interface AuditLogPort {
  /**
   * Sisteme yeni bir denetim günlüğü kaydı ekler.
   *
   * @param entry - Günlük girdisi (başlık, mesaj, önem seviyesi)
   */
  write(
    entry: {
      title: string;
      message: string;
      level: "info" | "success" | "warning" | "error";
    },
  ): Promise<void>;
}
