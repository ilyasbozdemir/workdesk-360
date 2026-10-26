/** Veritabanı tablo kolon tanımı arabirimi. */
export interface TableColumn {
  /** Kolon adı. */
  name: string
  /** SQLite veri tipi (INTEGER, TEXT, REAL, BLOB, NUMERIC, DATETIME vb.). */
  type: string
  /** Kolon işlev açıklaması. */
  description?: string
  /** Birincil anahtar olup olmadığı. */
  primaryKey?: boolean
  /** Otomatik artan değer (INTEGER PRIMARY KEY AUTOINCREMENT). */
  autoIncrement?: boolean
  /** Boş bırakılamaz kısıtlaması (NOT NULL). */
  notNull?: boolean
  /** Benzersiz kısıtlaması (UNIQUE). */
  unique?: boolean
  /** Kolon varsayılan değeri. */
  default?: string | number | boolean | null
  /** Kolon varsayılan değeri (alternatif format). */
  defaultValue?: string
  /** Yabancı anahtar referansı (ilişkili tablo ve kolon). */
  references?:
    | {
        table: string
        column: string
        onDelete?: string
        onUpdate?: string
      }
    | string
  /** Kolon kısıtlamaları (PRIMARY KEY, NOT NULL vb.). */
  constraints?: string[]
}

/** Veritabanı tablo indeks tanımı arabirimi. */
export interface TableIndex {
  /** İndeks oluşturulacak kolon adları. */
  columns: string[]
  /** İndeksin benzersiz (UNIQUE) olup olmadığını belirtir. */
  unique?: boolean
  /** İndeks adı (isteğe bağlı). */
  name?: string
}

/** Veritabanı tablo şeması tanımı arabirimi. */
export interface TableSchema {
  /** Tablo adı. */
  name: string
  /** Tablo işlev açıklaması. */
  description?: string
  /** Tabloda yer alan kolonların listesi. */
  columns: TableColumn[]
  /** Denetim/audit kolonlarının (created_at, updated_at vb.) otomatik eklenip eklenmeyeceği. */
  hasAudit?: boolean
  /** Tabloya tanımlı indeks listesi. */
  indexes?: TableIndex[]
}

