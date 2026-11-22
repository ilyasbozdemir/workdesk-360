import type { IDatabaseConnection } from "./IDatabaseConnection";

/**
 * .temin paketi içerisindeki meta.json veri modelini temsil eder.
 */
export interface ITeminMeta {
  project_id: string;
  institution: string;
  active_db_file?: string;
  schema_version?: number;
  app_version?: string;
  created_at?: string;
  updated_at?: string;
  data_revision?: number;
  integrity_hash?: string;
  [key: string]: unknown;
}

/**
 * .temin arşivindeki ek dosya girdilerini temsil eder.
 */
export interface ITeminAttachmentEntry {
  fileName: string;
  relativePath: string;
  size: number;
}

/**
 * .temin dosya paketini temsil eden ana sözleşme (Interface).
 *
 * Sorumlulukları:
 * - .temin ZIP paketini yüklemek ve doğrulamak.
 * - İçerisindeki meta.json verisini sunmak.
 * - İçerisindeki asıl SQLite veritabanını (database.sqlite) ayıklamak ve dosya yolunu sunmak.
 * - IDatabaseConnection üzerinden doğrudan SQL sorgusu/yürütmesi sağlamak.
 * - Prisma ORM için sqlite datasource bağlantı url'ini (file:...) üretmek.
 */
export interface ITeminPackage {
  /**
   * Fiziksel .temin arşiv dosyasının yolu.
   */
  readonly filePath: string;

  /**
   * Arşiv içerisindeki meta.json bilgileri.
   */
  readonly meta: ITeminMeta;

  /**
   * Arşivdeki aktif veritabanı dosyasının adı (Varsayılan: 'database.sqlite').
   */
  readonly activeDbFileName: string;

  /**
   * Arşivdeki attachments/ klasörü altındaki eklerin listesi.
   */
  readonly attachments: ITeminAttachmentEntry[];

  /**
   * Arşivden ayıklanan asıl SQLite veritabanı dosyasının tam dosya yolunu döner.
   */
  getDatabasePath(): string;

  /**
   * Arşiv içerisindeki database.sqlite dosyasının binary Buffer içeriğini döner.
   */
  getDatabaseBuffer(): Buffer;

  /**
   * Prisma ORM datasource url formatını döner (örn: file:/path/to/database.sqlite).
   */
  getPrismaDatasourceUrl(): string;

  /**
   * Bu .temin paketinin veritabanına bağlı IDatabaseConnection örneğini döner.
   */
  getConnection(): Promise<IDatabaseConnection>;

  /**
   * Kaynakları ve geçici çalışma dosyalarını serbest bırakır.
   */
  close(): Promise<void>;
}
