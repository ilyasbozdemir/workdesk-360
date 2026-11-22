import type {
  AuditLogPort,
  DocumentStatusPort,
  SqlExecutor,
  StageProgressPort,
} from "../../application/ports";
import type { FileStage } from "../../domain/file/DirectProcurementFile";

/**
 * `TANIM_Asama.asama_sira` değerleri (1-4) ile aggregate `FileStage` durumları arasındaki sıralama haritası.
 */
const STAGE_ORDER: Record<FileStage, number> = {
  hazirlik: 1,
  arastirma: 2,
  yuklenici: 3,
  kabul: 4,
};

/**
 * Şablon kodu ile `DATA_TeminBelge.belge_adi` arasındaki SQL LIKE eşleşme kalıpları.
 */
export const DEFAULT_TEMPLATE_NAME_PATTERNS: Readonly<Record<string, string>> =
  {
    "piyasa-fiyat-arastirma-tutanagi": "Piyasa Fiyat Araştırma%",
    "yaklasik-maliyet-cetveli": "Yaklaşık Maliyet%",
  };

/**
 * Doğrudan temin belgelerinin durumunu (bayatlama, beklemede, yeniden üretim) SQLite üzerinde güncelleyen adaptör.
 */
export class SqliteDocumentStatus implements DocumentStatusPort {
  /**
   * @param db - SQL sorgu yürütücü adaptörü.
   * @param patterns - Şablon kodlarını belge adına eşleyen şablon sözlüğü.
   */
  constructor(
    private readonly db: SqlExecutor,
    private readonly patterns: Readonly<Record<string, string>> =
      DEFAULT_TEMPLATE_NAME_PATTERNS,
  ) {}

  /**
   * Teklif değişimi gibi durumlarda tamamlanmış olan araştırma belgelerini bekleme durumuna çeker.
   * @param dosyaId - Temin dosya ID.
   * @param templateCodes - Bayatlatılacak şablon kodları.
   * @param reason - Beklemeye alma gerekçesi.
   */
  async markNeedsRegeneration(
    dosyaId: number,
    templateCodes: readonly string[],
    reason: string,
  ): Promise<void> {
    const likes = templateCodes.map((c) => this.patterns[c]).filter((
      p,
    ): p is string => !!p);
    if (likes.length === 0) return;
    const where = likes.map(() => "belge_adi LIKE ?").join(" OR ");
    // Yalnızca üretilmiş/tamamlanmış belgeler bayatlar; taslak aşamasındakilere dokunulmaz.
    await this.db.transaction([{
      sql: `UPDATE DATA_TeminBelge SET durum = 'beklemede', bekleme_nedeni = ?
            WHERE temin_dosya_id = ? AND durum = 'tamamlandi' AND (${where})`,
      params: [reason, dosyaId, ...likes],
    }]);
  }
}

/**
 * Dosyanın `durum_asama_id` alanını `TANIM_Asama` tablosundaki sıraya göre atomik olarak ilerleten adaptör.
 *
 * @remarks
 * Aşamalar geriye doğru gitmez; mevcut aşama yeni hedeften küçükse güncelleme yapılır.
 */
export class SqliteStageProgress implements StageProgressPort {
  /**
   * @param db - SQL yürütücü adaptörü.
   */
  constructor(private readonly db: SqlExecutor) {}

  /**
   * Dosyayı belirtilen aşamaya ilerletir.
   * @param dosyaId - Temin dosya ID.
   * @param stage - İlerlenecek dosya aşaması.
   */
  async advanceTo(dosyaId: number, stage: FileStage): Promise<void> {
    const order = STAGE_ORDER[stage];
    await this.db.transaction([{
      sql: `UPDATE DATA_TeminDosyasi
            SET durum_asama_id = (SELECT id FROM TANIM_Asama WHERE asama_sira = ?)
            WHERE id = ?
              AND COALESCE((SELECT asama_sira FROM TANIM_Asama WHERE id = DATA_TeminDosyasi.durum_asama_id), 0) < ?`,
      params: [order, dosyaId, order],
    }]);
  }
}

/**
 * Sistem denetim kayıtlarını (Audit Log) `LOG_SystemLog` tablosuna yazan adaptör.
 */
export class SqliteAuditLog implements AuditLogPort {
  /**
   * @param db - SQL yürütücü adaptörü.
   */
  constructor(private readonly db: SqlExecutor) {}

  /**
   * Denetim günlüğüne yeni bir kayıt ekler.
   * @param e - Log başlığı, mesajı ve önem derecesi.
   */
  async write(
    e: {
      title: string;
      message: string;
      level: "info" | "success" | "warning" | "error";
    },
  ): Promise<void> {
    await this.db.transaction([{
      sql: "INSERT INTO LOG_SystemLog (title, message, type) VALUES (?, ?, ?)",
      params: [e.title, e.message, e.level],
    }]);
  }
}
