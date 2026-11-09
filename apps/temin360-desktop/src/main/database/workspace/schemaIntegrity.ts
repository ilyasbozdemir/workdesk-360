import Database from 'better-sqlite3'
import { schema } from '../index'
import {
  runMigrations,
  getAppSchemaMax,
  initSessionContext,
  registerDefaultAuditTriggers
} from '@dt/database'
import { seedUnitConversions } from './conversionsSeed'
import { seedDefaultCommissions } from './commissionsSeed'

export class SchemaMigrationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message)
    this.name = 'SchemaMigrationError'
  }
}

export function isExpectedSqliteError(err: unknown): boolean {
  if (!err) return false
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes('duplicate column') || msg.includes('already exists')
  )
}

/**
 * Nesnenin fiziksel bir TABLO olup olmadığını döndürür (yoksa veya view ise false).
 * sqlite_master sorgusu başarısız olursa (disk/bozulma/beklenmeyen hata) hata YUTULMAZ;
 * tablo yokmuş gibi davranmak yerine SchemaMigrationError fırlatılır.
 */
function isPhysicalTable(db: Database.Database, tableName: string): boolean {
  try {
    const row = db
      .prepare('SELECT type FROM sqlite_master WHERE name = ?')
      .get(tableName) as { type?: string } | undefined
    return row?.type === 'table'
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new SchemaMigrationError(
      `[ensureSchemaIntegrity Temin 360] Tablo varlığı doğrulanamadı (${tableName}): ${msg}`,
      err
    )
  }
}

function safeExec(db: Database.Database, sql: string, context?: string): void {
  try {
    db.exec(sql)
  } catch (err: unknown) {
    if (isExpectedSqliteError(err)) return
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[ensureSchemaIntegrity Temin 360] Hata (${context || 'SQL execution'}):`, msg)
    throw new SchemaMigrationError(
      `[ensureSchemaIntegrity Temin 360] ${context || 'SQL execution'} başarısız: ${msg}`,
      err
    )
  }
}

function safeAddColumn(
  db: Database.Database,
  tableName: string,
  colName: string,
  colDef: string
): void {
  if (!isPhysicalTable(db, tableName)) return
  try {
    db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colDef};`)
  } catch (err: unknown) {
    if (isExpectedSqliteError(err)) return
    const msg = err instanceof Error ? err.message : String(err)
    console.error(
      `[ensureSchemaIntegrity Temin 360] ADD COLUMN ${tableName}.${colName} başarısız:`,
      msg
    )
    throw new SchemaMigrationError(
      `[ensureSchemaIntegrity Temin 360] Kolon eklenemedi (${tableName}.${colName}): ${msg}`,
      err
    )
  }
}

export function ensureSchemaIntegrity(db: Database.Database): void {
  // 1. Temel Şema Tablolarının Varlığını Garanti Et (CREATE TABLE IF NOT EXISTS)
  for (const table of schema.tables as any[]) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[]
      if (tableInfo.length === 0) {
        const columnsSql = table.columns
          .map((col: any) => {
            let colDef = '"' + col.name + '" ' + col.type
            if (col.primaryKey) colDef += ' PRIMARY KEY'
            if (col.autoIncrement) colDef += ' AUTOINCREMENT'
            if (col.unique) colDef += ' UNIQUE'
            if (col.notNull) colDef += ' NOT NULL'
            if (col.default !== undefined) {
              const d = col.default
              if (typeof d === 'string') {
                if (d.toUpperCase() === 'CURRENT_TIMESTAMP') colDef += ' DEFAULT CURRENT_TIMESTAMP'
                else if (d.startsWith("'") || d.startsWith('"')) colDef += ' DEFAULT ' + d
                else colDef += " DEFAULT '" + d.replace(/'/g, "''") + "'"
              } else colDef += ' DEFAULT ' + d
            }
            return colDef
          })
          .join(', ')
        const constraintsSql = table.constraints ? ', ' + table.constraints.join(', ') : ''
        safeExec(
          db,
          'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columnsSql + constraintsSql + ');',
          `Tablo Onarımı: ${table.name}`
        )
      }
    } catch (err: unknown) {
      if (!isExpectedSqliteError(err)) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ensureSchemaIntegrity Temin 360] Tablo onarım hatası (${table.name}):`, msg)
        throw new SchemaMigrationError(
          `Tablo onarımı başarısız (${table.name}): ${msg}`,
          err
        )
      }
    }
  }

  // 2. Çekirdek Sistem Tabloları ve Bağımsız İhtiyaç Raporu Kurulumu
  safeExec(
    db,
    `
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS TANIM_ButceOdenek (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        birim_id INTEGER,
        birim_adi TEXT,
        kurumsal_kod TEXT,
        butce_kodu TEXT NOT NULL,
        butce_kalemi TEXT NOT NULL,
        butce_turu TEXT DEFAULT 'Mal Alımı',
        butce_yili INTEGER NOT NULL,
        yillik_odenek REAL DEFAULT 0,
        aciklama TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS DATA_IhtiyacRaporu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rapor_no TEXT NOT NULL UNIQUE,
        baslik TEXT NOT NULL,
        gerekce TEXT,
        birim_id INTEGER,
        birim_adi TEXT,
        talep_eden_personel_id INTEGER,
        talep_eden_personel TEXT,
        talep_eden_unvan TEXT,
        evrak_sayisi TEXT,
        belge_snapshot_json TEXT,
        durum TEXT DEFAULT 'taslak',
        temin_dosya_id INTEGER,
        tarih DATE DEFAULT CURRENT_DATE,
        onay_tarihi DATE,
        tahmini_butce REAL DEFAULT 0,
        notlar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(temin_dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE SET NULL,
        FOREIGN KEY(birim_id) REFERENCES TANIM_Birim(id) ON DELETE SET NULL,
        FOREIGN KEY(talep_eden_personel_id) REFERENCES TANIM_Personel(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS DATA_IhtiyacRaporuKalem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rapor_id INTEGER NOT NULL,
        sira_no INTEGER,
        kalem_adi TEXT NOT NULL,
        tipi TEXT DEFAULT 'Mal',
        birim TEXT DEFAULT 'Adet',
        miktar REAL NOT NULL DEFAULT 1,
        kdv_orani REAL DEFAULT 20,
        tasinir_kodu TEXT,
        okas_kodu TEXT,
        poz_no TEXT,
        aciklama TEXT,
        tahmini_birim_fiyat REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(rapor_id) REFERENCES DATA_IhtiyacRaporu(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ihtiyac_raporu_no ON DATA_IhtiyacRaporu(rapor_no);
      CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_temin_dosya ON DATA_IhtiyacRaporu(temin_dosya_id);
      CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_kalem_rapor ON DATA_IhtiyacRaporuKalem(rapor_id);
    `,
    'Temel Tablolar ve İhtiyaç Raporu Kurulumu'
  )

  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'talep_eden_unvan', 'TEXT')
  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'evrak_sayisi', 'TEXT')
  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'belge_snapshot_json', 'TEXT')

  // 2.1 Workflow, Görev ve Bildirim Motoru Tabloları
  safeExec(
    db,
    `
      CREATE TABLE IF NOT EXISTS WORKFLOW_Instance (
        id TEXT PRIMARY KEY,
        dosya_id INTEGER NOT NULL,
        definition_id TEXT NOT NULL,
        definition_version INTEGER DEFAULT 1,
        current_state TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        assigned_user_id TEXT,
        assigned_unit_id TEXT,
        assigned_role TEXT,
        last_actor_id TEXT,
        return_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_wf_instance_dosya ON WORKFLOW_Instance(dosya_id);
      CREATE INDEX IF NOT EXISTS idx_wf_instance_state ON WORKFLOW_Instance(current_state);

      CREATE TABLE IF NOT EXISTS WORKFLOW_TransitionHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        dosya_id INTEGER NOT NULL,
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor_id TEXT,
        actor_role TEXT,
        reason TEXT,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_wf_hist_dosya ON WORKFLOW_TransitionHistory(dosya_id);
      CREATE INDEX IF NOT EXISTS idx_wf_hist_inst ON WORKFLOW_TransitionHistory(instance_id);

      CREATE TABLE IF NOT EXISTS WORKFLOW_Task (
        id TEXT PRIMARY KEY,
        instance_id TEXT NOT NULL,
        dosya_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'OPEN',
        assigned_user_id TEXT,
        assigned_unit_id TEXT,
        required_role TEXT,
        due_at DATETIME,
        completed_at DATETIME,
        completed_by TEXT,
        return_reason TEXT,
        idempotency_key TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_wf_task_dosya ON WORKFLOW_Task(dosya_id);
      CREATE INDEX IF NOT EXISTS idx_wf_task_role ON WORKFLOW_Task(required_role, status);

      CREATE TABLE IF NOT EXISTS WORKFLOW_Notification (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        dosya_id INTEGER NOT NULL,
        user_id TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        channel TEXT DEFAULT 'IN_APP',
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_wf_notif_dosya ON WORKFLOW_Notification(dosya_id);
      CREATE INDEX IF NOT EXISTS idx_wf_notif_read ON WORKFLOW_Notification(read_at);

      CREATE TABLE IF NOT EXISTS WORKFLOW_NotificationOutbox (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        attempts INTEGER DEFAULT 0,
        last_attempt DATETIME,
        error_message TEXT,
        idempotency_key TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_wf_outbox_status ON WORKFLOW_NotificationOutbox(status);

      CREATE TABLE IF NOT EXISTS WORKFLOW_RuleEvaluation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        category TEXT NOT NULL,
        passed INTEGER NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        details_json TEXT,
        evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_wf_rule_inst ON WORKFLOW_RuleEvaluation(instance_id);
    `,
    'Workflow, Görev ve Bildirim Motoru Tabloları'
  )

  // 3. Şema Sürümü ve Migrasyon Kontrolü
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as
      | { value?: string }
      | undefined
    const currentDbVer = row?.value ? parseInt(row.value, 10) || 1 : 1
    const targetSchemaMax = getAppSchemaMax('temin360-desktop')
    if (currentDbVer < targetSchemaMax) {
      console.log(
        `[Schema Self-Healing] Migrating from v${currentDbVer} to v${targetSchemaMax} (temin360-desktop)`
      )
      runMigrations(db, currentDbVer, schema, { appId: 'temin360-desktop' })
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('dbSchemaVersion', ?)").run(
        targetSchemaMax.toString()
      )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!isExpectedSqliteError(err)) {
      console.error('[Schema Self-Healing] Migration failed critically:', msg)
      throw new SchemaMigrationError(`Veritabanı şema yükseltmesi başarısız oldu: ${msg}`, err)
    }
    // Beklenen (idempotent) hata: runMigrations transaction'ı geri alındı, dbSchemaVersion ilerletilmedi.
    // Sessiz geçmek yerine açıkça logla; sürüm bir sonraki açılışta yeniden denenir.
    console.warn(
      '[Schema Self-Healing] Beklenen SQLite hatası nedeniyle migration tamamlanmadı, dbSchemaVersion ilerletilmedi:',
      msg
    )
  }

  // 4. TANIM_Firma CRM Kolonları
  const firmaCrmColumns = [
    { name: 'deneyim_skoru', def: 'INTEGER DEFAULT 0' },
    { name: 'kalite_skoru', def: 'INTEGER DEFAULT 0' },
    { name: 'odeme_disiplini', def: 'INTEGER DEFAULT 1' },
    { name: 'kara_liste', def: 'INTEGER DEFAULT 0' },
    { name: 'kara_liste_neden', def: 'TEXT' },
    { name: 'son_iletisim_tarihi', def: 'TEXT' },
    { name: 'sorumlu_personel_id', def: 'INTEGER' },
    { name: 'iletisim_notlari', def: 'TEXT' }
  ]
  for (const c of firmaCrmColumns) {
    safeAddColumn(db, 'TANIM_Firma', c.name, c.def)
  }

  // 5. DATA_TeminDosyasi Kolonları
  const teminDosyasiColumns = [
    { name: 'tarih', def: 'DATE' },
    { name: 'temin_tarihi', def: 'DATE' },
    { name: 'dosya_acilis_tarihi', def: 'DATE' },
    { name: 'temin_no', def: 'TEXT' },
    { name: 'evrak_sayisi', def: 'TEXT' },
    { name: 'hesaplama_esasi', def: "TEXT DEFAULT 'ortalama'" },
    { name: 'komisyon_takdiri', def: 'TEXT' },
    { name: 'teslim_gun', def: 'INTEGER DEFAULT 7' },
    { name: 'teslim_tarihi', def: 'DATE' },
    { name: 'sozlesme_yapilacak_mi', def: 'INTEGER DEFAULT 0' },
    { name: 'sablon_tercihleri', def: "TEXT DEFAULT '{}'" },
    { name: 'ordered_docs', def: 'TEXT' },
    { name: 'starred_docs', def: 'TEXT' },
    { name: 'skipped_docs', def: 'TEXT' },
    { name: 'isin_aciklama_maddeleri', def: 'TEXT' },
    { name: 'yaklasik_maliyet_kdv_dahil_mi', def: 'INTEGER DEFAULT 0' },
    { name: 'odenek_tertibi', def: 'TEXT' },
    { name: 'kullanilabilir_odenek', def: 'TEXT' },
    { name: 'butce_yili', def: 'TEXT' },
    { name: 'odenek_kalemi', def: 'TEXT' },
    { name: 'butce_gerekce', def: 'TEXT' },
    { name: 'fiyat_farki_dayanagi', def: 'TEXT' },
    { name: 'alim_turu', def: 'TEXT' },
    { name: 'tur', def: "TEXT DEFAULT 'mal'" },
    { name: 'birim', def: 'TEXT' },
    { name: 'harcama_birimi', def: 'TEXT' },
    { name: 'birim_id', def: 'INTEGER' },
    { name: 'durum', def: "TEXT DEFAULT 'Tamamlandı'" },
    { name: 'madde', def: "TEXT DEFAULT '4734 Sayılı Kanun Md. 22/d'" },
    { name: 'dosya_no', def: 'TEXT' },
    { name: 'dosya_adi', def: 'TEXT' },
    { name: 'is_tanimi', def: 'TEXT' },
    { name: 'is_adi', def: 'TEXT' },
    { name: 'konu', def: 'TEXT' },
    { name: 'komisyon_seed_edildi', def: 'INTEGER' },
    { name: 'antet_birim_gosterilsin', def: 'INTEGER DEFAULT 1' },
    { name: 'is_locked', def: 'INTEGER DEFAULT 0' },
    { name: 'lock_reason', def: 'TEXT' },
    { name: 'kayit_kaynagi', def: "TEXT DEFAULT 'yeni'" },
    { name: 'aktarim_grubu_id', def: 'TEXT' },
    { name: 'kaynak_kayit_id', def: 'TEXT' }
  ]
  for (const c of teminDosyasiColumns) {
    safeAddColumn(db, 'DATA_TeminDosyasi', c.name, c.def)
  }

  // 6. DATA_TeminKomisyon & TANIM_KomisyonUye Kolonları
  const komisyonExtendedColumns = [
    { name: 'asli_yedek', def: "TEXT DEFAULT 'Asil'" },
    { name: 'imza_turu', def: "TEXT DEFAULT 'İmza'" },
    { name: 'birim_id', def: 'INTEGER' },
    { name: 'birim', def: 'TEXT' },
    { name: 'kaynak', def: "TEXT DEFAULT 'kurumsal'" },
    { name: 'rol', def: "TEXT DEFAULT 'Asil'" },
    { name: 'komisyon_turu', def: 'TEXT' },
    { name: 'belgede_goster', def: 'INTEGER DEFAULT 1' },
    { name: 'vekalet_unvani', def: 'TEXT' },
    { name: 'baslangic_tarihi', def: 'TEXT' },
    { name: 'bitis_tarihi', def: 'TEXT' },
    { name: 'belge_kapsami', def: "TEXT DEFAULT 'tumu'" },
    { name: 'hedef_belgeler', def: 'TEXT DEFAULT \'["*"]\'' }
  ]
  for (const c of komisyonExtendedColumns) {
    safeAddColumn(db, 'DATA_TeminKomisyon', c.name, c.def)
    safeAddColumn(db, 'TANIM_KomisyonUye', c.name, c.def)
  }

  // 7. DATA_TeminKomisyonHistory
  safeExec(
    db,
    `
      CREATE TABLE IF NOT EXISTS DATA_TeminKomisyonHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER NOT NULL,
        komisyon_turu TEXT,
        islem_turu TEXT,
        islem_yapan TEXT,
        snapshot_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    'DATA_TeminKomisyonHistory Kurulumu'
  )

  // 8. DATA_TeminDosyasi & DATA_TeminKomisyon Kolon Eşitleme
  if (isPhysicalTable(db, 'DATA_TeminDosyasi')) {
    safeExec(
      db,
      `
      UPDATE DATA_TeminDosyasi SET dosya_no = temin_no WHERE (dosya_no IS NULL OR dosya_no = '') AND temin_no IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET temin_no = dosya_no WHERE (temin_no IS NULL OR temin_no = '') AND dosya_no IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET dosya_adi = COALESCE(is_adi, konu, is_tanimi) WHERE (dosya_adi IS NULL OR dosya_adi = '') AND COALESCE(is_adi, konu, is_tanimi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET is_adi = COALESCE(dosya_adi, konu, is_tanimi) WHERE (is_adi IS NULL OR is_adi = '') AND COALESCE(dosya_adi, konu, is_tanimi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET is_tanimi = COALESCE(is_adi, konu, dosya_adi) WHERE (is_tanimi IS NULL OR is_tanimi = '') AND COALESCE(is_adi, konu, dosya_adi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET alim_turu = tur WHERE (alim_turu IS NULL OR alim_turu = '') AND tur IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET tur = alim_turu WHERE (tur IS NULL OR tur = '') AND alim_turu IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET birim = harcama_birimi WHERE (birim IS NULL OR birim = '') AND harcama_birimi IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET harcama_birimi = birim WHERE (harcama_birimi IS NULL OR harcama_birimi = '') AND birim IS NOT NULL AND birim <> '';
    `,
      'DATA_TeminDosyasi Kolon Eşitleme'
    )

    safeAddColumn(db, 'TANIM_Personel', 'birim_id', 'INTEGER DEFAULT NULL')
    safeAddColumn(db, 'TANIM_Kurum', 'kurum_baskani', "TEXT DEFAULT ''")
    safeAddColumn(db, 'TANIM_Kurum', 'baskan_unvani', "TEXT DEFAULT ''")
    safeAddColumn(db, 'TANIM_Kurum', 'harcama_yetkilisi', "TEXT DEFAULT ''")
    safeAddColumn(db, 'TANIM_Kurum', 'sunulacak_makam_secimi', "TEXT DEFAULT 'makam'")
    safeAddColumn(db, 'TANIM_Kurum', 'sunulacak_kurum_adi', "TEXT DEFAULT ''")
    safeAddColumn(db, 'TANIM_Kurum', 'makam_adi_custom', "TEXT DEFAULT ''")

    if (isPhysicalTable(db, 'TANIM_Kurum')) {
      try {
        const kRows = db.prepare("SELECT id, kurum_anteti FROM TANIM_Kurum WHERE kurum_anteti LIKE '%>%'").all() as any[]
        for (const row of kRows) {
          if (!row.kurum_anteti) continue
          try {
            const parsed = JSON.parse(row.kurum_anteti)
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((l: string) => l && !String(l).includes('>'))
              db.prepare('UPDATE TANIM_Kurum SET kurum_anteti = ? WHERE id = ?').run(JSON.stringify(cleaned), row.id)
            }
          } catch {
            const lines = String(row.kurum_anteti)
              .split('\n')
              .filter((l: string) => !l.includes('>'))
            db.prepare('UPDATE TANIM_Kurum SET kurum_anteti = ? WHERE id = ?').run(lines.join('\n'), row.id)
          }
        }
      } catch {}
    }

    if (isPhysicalTable(db, 'TANIM_Birim')) {
      safeExec(
        db,
        `
        UPDATE TANIM_Birim SET antet_ek_satir = birim_adi WHERE antet_ek_satir LIKE '%>%';
        UPDATE DATA_TeminDosyasi SET antet_ek_satir = harcama_birimi WHERE antet_ek_satir LIKE '%>%';

        UPDATE TANIM_Personel
        SET birim_id = (
          SELECT b.id FROM TANIM_Birim b
          WHERE LOWER(TRIM(b.birim_adi)) = LOWER(TRIM(TANIM_Personel.birim))
             OR LOWER(TRIM(b.ad)) = LOWER(TRIM(TANIM_Personel.birim))
             OR b.harcama_yetkilisi_id = TANIM_Personel.id
             OR b.gerceklestirme_gorevlisi_id = TANIM_Personel.id
             OR b.ilgili_personel_id = TANIM_Personel.id
          LIMIT 1
        )
        WHERE (birim_id IS NULL OR birim_id = 0)
          AND EXISTS (
            SELECT 1 FROM TANIM_Birim b
            WHERE LOWER(TRIM(b.birim_adi)) = LOWER(TRIM(TANIM_Personel.birim))
               OR LOWER(TRIM(b.ad)) = LOWER(TRIM(TANIM_Personel.birim))
               OR b.harcama_yetkilisi_id = TANIM_Personel.id
               OR b.gerceklestirme_gorevlisi_id = TANIM_Personel.id
               OR b.ilgili_personel_id = TANIM_Personel.id
          );

        UPDATE TANIM_Personel
        SET birim = (
          SELECT b.birim_adi FROM TANIM_Birim b
          WHERE b.id = TANIM_Personel.birim_id
          LIMIT 1
        )
        WHERE (birim IS NULL OR trim(birim) = '')
          AND birim_id IS NOT NULL AND birim_id > 0;
        `,
        'TANIM_Birim ve DATA_TeminDosyasi antet hiyerarsi oku temizligi ve birim-personel baglama'
      )

      safeExec(
        db,
        `
        INSERT OR IGNORE INTO TANIM_Birim (ad, birim_adi, antet_ek_satir, sunum_makami, aktif_mi)
        SELECT DISTINCT
          TRIM(COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''), NULLIF(TRIM(d.antet_ek_satir), ''))) AS yeni_ad,
          TRIM(COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''), NULLIF(TRIM(d.antet_ek_satir), ''))) AS yeni_birim_adi,
          TRIM(COALESCE(NULLIF(TRIM(d.antet_ek_satir), ''), NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''))) AS yeni_antet,
          TRIM(COALESCE(NULLIF(TRIM(d.sunulacak_makam), ''), TRIM(COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''))) || ' MAKAMINA')) AS yeni_makam,
          1
        FROM DATA_TeminDosyasi d
        WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
          AND COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''), NULLIF(TRIM(d.antet_ek_satir), '')) IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM TANIM_Birim b
            WHERE LOWER(TRIM(b.birim_adi)) = LOWER(TRIM(COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''), NULLIF(TRIM(d.antet_ek_satir), ''))))
          );

        UPDATE DATA_TeminDosyasi
        SET birim_id = (
          SELECT b.id FROM TANIM_Birim b
          WHERE LOWER(TRIM(b.birim_adi)) = LOWER(TRIM(COALESCE(NULLIF(TRIM(DATA_TeminDosyasi.birim), ''), NULLIF(TRIM(DATA_TeminDosyasi.harcama_birimi), ''), NULLIF(TRIM(DATA_TeminDosyasi.antet_ek_satir), ''))))
          LIMIT 1
        )
        WHERE (birim_id IS NULL OR birim_id = 0)
          AND COALESCE(NULLIF(TRIM(birim), ''), NULLIF(TRIM(harcama_birimi), ''), NULLIF(TRIM(antet_ek_satir), '')) IS NOT NULL;
        `,
        'DATA_TeminDosyasi Birim ve TANIM_Birim Otomatik Eşitleme'
      )
    }
  }

  if (isPhysicalTable(db, 'DATA_TeminKomisyon')) {
    safeExec(
      db,
      `
      UPDATE DATA_TeminKomisyon SET asli_yedek = COALESCE(rol, 'Asil') WHERE (asli_yedek IS NULL OR asli_yedek = '') AND rol IS NOT NULL;
      UPDATE DATA_TeminKomisyon SET rol = COALESCE(asli_yedek, 'Asil') WHERE (rol IS NULL OR rol = '') AND asli_yedek IS NOT NULL;
      UPDATE DATA_TeminKomisyon SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
    `,
      'DATA_TeminKomisyon Kolon Eşitleme'
    )
  }

  if (isPhysicalTable(db, 'TANIM_KomisyonUye')) {
    safeExec(
      db,
      `
      UPDATE TANIM_KomisyonUye SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
    `,
      'TANIM_KomisyonUye Kolon Eşitleme'
    )
  }

  // 9. DATA_DosyaSablonVeri Kolonları & sablon_kodu Doldurma
  safeAddColumn(db, 'DATA_DosyaSablonVeri', 'sablon_kodu', 'TEXT')
  safeAddColumn(db, 'DATA_DosyaSablonVeri', 'sablon_versiyon', 'INTEGER DEFAULT 1')

  if (isPhysicalTable(db, 'DATA_DosyaSablonVeri') && isPhysicalTable(db, 'TANIM_Sablon')) {
    safeExec(
      db,
      `
      UPDATE DATA_DosyaSablonVeri 
      SET sablon_kodu = (
        SELECT REPLACE(dosya_adi, '.html', '') 
        FROM TANIM_Sablon 
        WHERE TANIM_Sablon.id = DATA_DosyaSablonVeri.sablon_id 
        LIMIT 1
      )
      WHERE (sablon_kodu IS NULL OR sablon_kodu = '') AND sablon_id IS NOT NULL;
    `,
      'DATA_DosyaSablonVeri sablon_kodu doldurma'
    )
  }

  // 10. Mükerrer Şablon Verisi Arşivleme & UNIQUE Index
  if (isPhysicalTable(db, 'DATA_DosyaSablonVeri') && isPhysicalTable(db, 'DATA_DosyaRevizyon')) {
    try {
      const duplicates = db
        .prepare(
          `SELECT temin_dosya_id, sablon_kodu, COUNT(*) as cnt 
           FROM DATA_DosyaSablonVeri 
           WHERE sablon_kodu IS NOT NULL AND sablon_kodu != '' 
           GROUP BY temin_dosya_id, sablon_kodu 
           HAVING cnt > 1`
        )
        .all() as Array<{ temin_dosya_id: number; sablon_kodu: string }>

      for (const dup of duplicates) {
        const rows = db
          .prepare(
            `SELECT id, veri_json, created_at, updated_at 
             FROM DATA_DosyaSablonVeri 
             WHERE temin_dosya_id = ? AND sablon_kodu = ? 
             ORDER BY updated_at DESC, id DESC`
          )
          .all(dup.temin_dosya_id, dup.sablon_kodu) as Array<{
          id: number
          veri_json: string
          created_at?: string
          updated_at?: string
        }>

        if (rows.length > 1) {
          const insertRevizyon = db.prepare(
            `INSERT INTO DATA_DosyaRevizyon (temin_dosya_id, modul_adi, surec_kodu, belge_kodu, versiyon, baslik, veri_json) 
             VALUES (?, 'BELGE_YONETIMI', 'MIGRATION_DEDUP', ?, 'v_arsiv', 'Eski Mükerrer Belge Verisi Arşivi', ?)`
          )
          const deleteSablonVeri = db.prepare(`DELETE FROM DATA_DosyaSablonVeri WHERE id = ?`)

          for (let i = 1; i < rows.length; i++) {
            const oldRow = rows[i]
            db.transaction(() => {
              insertRevizyon.run(dup.temin_dosya_id, dup.sablon_kodu, oldRow.veri_json)
              deleteSablonVeri.run(oldRow.id)
            })()
          }
        }
      }
    } catch (err: unknown) {
      if (!isExpectedSqliteError(err)) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[ensureSchemaIntegrity Temin 360] Mükerrer şablon verisi temizleme hatası:', msg)
        throw new SchemaMigrationError(
          `Mükerrer şablon verisi temizleme başarısız: ${msg}`,
          err
        )
      }
    }
  }

  if (isPhysicalTable(db, 'DATA_DosyaSablonVeri')) {
    safeExec(
      db,
      `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_data_dosyasablonveri_unique 
      ON DATA_DosyaSablonVeri(temin_dosya_id, sablon_kodu);
    `,
      'DATA_DosyaSablonVeri unique index'
    )
  }

  

  // 10.1. DATA_TeminBelgeSnapshot Tablosu Tesis ve Veri Migrasyonu
  safeExec(
    db,
    `
    CREATE TABLE IF NOT EXISTS DATA_TeminBelgeSnapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dosya_id INTEGER NOT NULL,
      sablon_id INTEGER,
      sablon_kodu TEXT NOT NULL,
      veri_json TEXT NOT NULL,
      sablon_versiyon INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER DEFAULT NULL,
      updated_by INTEGER DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_temin_belge_snapshot_dosya ON DATA_TeminBelgeSnapshot(dosya_id);
    CREATE INDEX IF NOT EXISTS idx_temin_belge_snapshot_sablon ON DATA_TeminBelgeSnapshot(sablon_kodu);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_temin_belge_snapshot_unique ON DATA_TeminBelgeSnapshot(dosya_id, sablon_kodu);
  `,
    'DATA_TeminBelgeSnapshot Tablo ve Indeks Tesis'
  )

  // DATA_DosyaSablonVeri -> DATA_TeminBelgeSnapshot Migrasyonu
  if (isPhysicalTable(db, 'DATA_DosyaSablonVeri')) {
    try {
      const oldRows = db
        .prepare(
          `SELECT 
            id,
            temin_dosya_id,
            dosya_id,
            sablon_id,
            sablon_kodu,
            veri_json,
            sablon_versiyon,
            created_at,
            updated_at
           FROM DATA_DosyaSablonVeri
           WHERE (sablon_kodu IS NOT NULL AND sablon_kodu != '')
             AND (dosya_id IS NOT NULL OR temin_dosya_id IS NOT NULL)
           ORDER BY updated_at DESC, id DESC`
        )
        .all() as Array<{
        id: number
        temin_dosya_id: number
        dosya_id?: number
        sablon_id?: number
        sablon_kodu: string
        veri_json: string
        sablon_versiyon?: number
        created_at?: string
        updated_at?: string
      }>

      if (oldRows.length > 0) {
        const insertSnapshot = db.prepare(`
          INSERT INTO DATA_TeminBelgeSnapshot (
            dosya_id,
            sablon_id,
            sablon_kodu,
            veri_json,
            sablon_versiyon,
            created_at,
            updated_at,
            is_active,
            is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
          ON CONFLICT(dosya_id, sablon_kodu) DO NOTHING
        `)

        const migrateTx = db.transaction(() => {
          for (const row of oldRows) {
            const targetDosyaId = row.dosya_id || row.temin_dosya_id
            if (!targetDosyaId) continue

            insertSnapshot.run(
              targetDosyaId,
              row.sablon_id || null,
              row.sablon_kodu,
              row.veri_json,
              row.sablon_versiyon || 1,
              row.created_at || new Date().toISOString(),
              row.updated_at || new Date().toISOString()
            )
          }
        })

        migrateTx()
      }
    } catch (migErr: unknown) {
      console.warn('[ensureSchemaIntegrity] DATA_TeminBelgeSnapshot migrasyon hatasi:', migErr)
    }
  }
// 11. DATA_TeminFirma Kazanan Kolonları
  safeAddColumn(db, 'DATA_TeminFirma', 'kazanan_mi', 'INTEGER DEFAULT 0')
  safeAddColumn(db, 'DATA_TeminFirma', 'kazandi_mi', 'INTEGER DEFAULT 0')

  if (isPhysicalTable(db, 'DATA_TeminFirma')) {
    // Faz 1.2: Eski verileri sessizce ezmeden çelişkili veya tek taraflı kayıtları tespit et ve raporla
    try {
      const discrepancies = db
        .prepare(
          'SELECT temin_dosya_id, id, firma_id, kazandi_mi, kazanan_mi FROM DATA_TeminFirma WHERE COALESCE(kazandi_mi, 0) != COALESCE(kazanan_mi, 0)'
        )
        .all() as { temin_dosya_id: number; id: number; firma_id: number | null; kazandi_mi: number; kazanan_mi: number }[]

      if (discrepancies.length > 0) {
        console.warn(
          `[schemaIntegrity] DATA_TeminFirma tablosunda ${discrepancies.length} adet kazanan bayrak uyumsuzluğu tespit edildi (sessizce ezilmedi):`,
          discrepancies
        )
      }
    } catch (checkErr) {
      console.warn('[schemaIntegrity] DATA_TeminFirma kazanan bayrakları kontrolü hatası:', checkErr)
    }

    // 11b. DATA_TeminFirma firma_id Otomatik Eşleştirme & Onarım
    // unvan veya vergi_no üzerinden TANIM_Firma ile eşleştiği halde firma_id = 0 veya NULL kalmış kayıtları bağla
    if (isPhysicalTable(db, 'TANIM_Firma')) {
      try {
        db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = (
            SELECT id FROM TANIM_Firma
            WHERE LOWER(TRIM(TANIM_Firma.unvan)) = LOWER(TRIM(DATA_TeminFirma.unvan))
            LIMIT 1
          )
          WHERE (firma_id IS NULL OR firma_id = 0)
            AND unvan IS NOT NULL
            AND TRIM(unvan) != ''
            AND EXISTS (
              SELECT 1 FROM TANIM_Firma
              WHERE LOWER(TRIM(TANIM_Firma.unvan)) = LOWER(TRIM(DATA_TeminFirma.unvan))
            )
        `).run()

        db.prepare(`
          UPDATE DATA_TeminFirma
          SET firma_id = (
            SELECT id FROM TANIM_Firma
            WHERE vergi_no IS NOT NULL AND vergi_no != '' AND vergi_no = DATA_TeminFirma.vergi_no
            LIMIT 1
          )
          WHERE (firma_id IS NULL OR firma_id = 0)
            AND vergi_no IS NOT NULL
            AND TRIM(vergi_no) != ''
            AND EXISTS (
              SELECT 1 FROM TANIM_Firma
              WHERE vergi_no IS NOT NULL AND vergi_no != '' AND vergi_no = DATA_TeminFirma.vergi_no
            )
        `).run()
      } catch (firmRepairErr) {
        console.warn('[schemaIntegrity] DATA_TeminFirma firma_id eşleştirme uyarısı:', firmRepairErr)
      }
    }
  }

  // 12. Çocuk Tablolar dosya_id Senkronizasyonu ve Tetikleyicileri
  const dosyaChildTables = [
    'DATA_TeminKalem',
    'DATA_TeminFirma',
    'DATA_TeminKomisyon',
    'DATA_TeminBelge',
    'DATA_TeminKalemTeklif',
    'DATA_DosyaSablonVeri',
    'DATA_TIF'
  ]
  for (const tbl of dosyaChildTables) {
    if (!isPhysicalTable(db, tbl)) continue
    safeAddColumn(db, tbl, 'dosya_id', 'INTEGER')
    safeExec(
      db,
      `
      UPDATE ${tbl} SET dosya_id = temin_dosya_id WHERE dosya_id IS NULL AND temin_dosya_id IS NOT NULL;
      UPDATE ${tbl} SET temin_dosya_id = dosya_id WHERE temin_dosya_id IS NULL AND dosya_id IS NOT NULL;
    `,
      `${tbl} dosya_id sync`
    )
    safeExec(
      db,
      `
      CREATE TRIGGER IF NOT EXISTS trg_${tbl}_sync_dosya_id_ins
      AFTER INSERT ON ${tbl}
      BEGIN
        UPDATE ${tbl} SET 
          dosya_id = COALESCE(NEW.dosya_id, NEW.temin_dosya_id),
          temin_dosya_id = COALESCE(NEW.temin_dosya_id, NEW.dosya_id)
        WHERE id = NEW.id;
      END;
    `,
      `trg_${tbl}_sync_dosya_id_ins trigger`
    )
    safeExec(
      db,
      `
      CREATE TRIGGER IF NOT EXISTS trg_${tbl}_sync_dosya_id_upd
      AFTER UPDATE OF dosya_id, temin_dosya_id ON ${tbl}
      BEGIN
        UPDATE ${tbl} SET 
          dosya_id = COALESCE(NEW.dosya_id, NEW.temin_dosya_id),
          temin_dosya_id = COALESCE(NEW.temin_dosya_id, NEW.dosya_id)
        WHERE id = NEW.id;
      END;
    `,
      `trg_${tbl}_sync_dosya_id_upd trigger`
    )
  }

  // 13. Kalem, OlcuBirimi, Personel, Ihtiyac, Belge Kolonları
  const kalemCols = [
    { name: 'sira_no', def: 'INTEGER' },
    { name: 'poz_no', def: 'TEXT' },
    { name: 'poz_yili', def: 'INTEGER' },
    { name: 'poz_tanimi', def: 'TEXT' },
    { name: 'poz_grubu_ref_id', def: 'TEXT' },
    { name: 'olcu_birimi', def: 'TEXT' },
    { name: 'yapi_sinifi', def: 'TEXT' },
    { name: 'hizmet_kodu', def: 'TEXT' },
    { name: 'hizmet_sinifi', def: 'TEXT' },
    { name: 'sure', def: 'TEXT' },
    { name: 'personel_sayisi', def: 'INTEGER' },
    { name: 'meslek_kodu', def: 'TEXT' },
    { name: 'fiyat_donemi', def: 'TEXT' },
    { name: 'gorsel_url', def: 'TEXT' },
    { name: 'gorseller', def: 'TEXT' },
    { name: 'eski_poz_no', def: 'TEXT' },
    { name: 'fasikul', def: 'TEXT' },
    { name: 'poz_tipi', def: "TEXT DEFAULT 'Analiz'" },
    { name: 'birim_fiyatlar', def: 'TEXT' },
    { name: 'birim_fiyat', def: 'REAL DEFAULT 0' }
  ]
  for (const c of kalemCols) {
    safeAddColumn(db, 'TANIM_Kalem', c.name, c.def)
    safeAddColumn(db, 'DATA_TeminKalem', c.name, c.def)
  }

  const olcuCols = [
    { name: 'kisa_ad', def: 'TEXT' },
    { name: 'kategori', def: "TEXT DEFAULT 'Adet/Miktar'" },
    { name: 'sembol', def: 'TEXT' },
    { name: 'donusum_faktoru', def: 'REAL DEFAULT 1.0' },
    { name: 'temel_birim_mi', def: 'INTEGER DEFAULT 0' },
    { name: 'donusum_tipi', def: "TEXT DEFAULT 'linear'" },
    { name: 'ondalik_basamak', def: 'INTEGER DEFAULT 2' },
    { name: 'iliskili_birimler', def: 'TEXT' },
    { name: 'aciklama', def: 'TEXT' }
  ]
  for (const c of olcuCols) {
    safeAddColumn(db, 'TANIM_OlcuBirimi', c.name, c.def)
  }

  const personelCols = [
    { name: 'gorev', def: 'TEXT' },
    { name: 'unvan', def: 'TEXT' },
    { name: 'birim', def: 'TEXT' },
    { name: 'birim_id', def: 'INTEGER DEFAULT NULL' },
    { name: 'avatar', def: 'TEXT' }
  ]
  for (const c of personelCols) {
    safeAddColumn(db, 'TANIM_Personel', c.name, c.def)
  }

  const ihtiyacCols = [
    { name: 'talep_eden_unvan', def: 'TEXT' },
    { name: 'evrak_sayisi', def: 'TEXT' },
    { name: 'belge_snapshot_json', def: 'TEXT' }
  ]
  for (const c of ihtiyacCols) {
    safeAddColumn(db, 'DATA_IhtiyacRaporu', c.name, c.def)
  }

  const belgeCols = [
    { name: 'durum', def: "TEXT DEFAULT 'hazirlaniyor'" },
    { name: 'bekleme_nedeni', def: 'TEXT' }
  ]
  for (const c of belgeCols) {
    safeAddColumn(db, 'DATA_TeminBelge', c.name, c.def)
  }

  // 14. Eksik Kolonların Tespiti ve Tamamlanması
  for (const table of schema.tables as any[]) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[]
      if (tableInfo.length > 0) {
        const existingColumns = new Set(tableInfo.map((c) => c.name))
        for (const col of table.columns as any[]) {
          if (!existingColumns.has(col.name)) {
            let sqlDef = col.type
            if (col.default !== undefined) {
              const d = col.default
              if (typeof d === 'string') {
                const upper = d.trim().toUpperCase()
                if (!['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME'].includes(upper)) {
                  sqlDef +=
                    d.startsWith("'") || d.startsWith('"')
                      ? ' DEFAULT ' + d
                      : " DEFAULT '" + d.replace(/'/g, "''") + "'"
                }
              } else sqlDef += ' DEFAULT ' + d
            }
            safeAddColumn(db, table.name, col.name, sqlDef)
          }
        }
      }
    } catch (err: unknown) {
      if (!isExpectedSqliteError(err)) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ensureSchemaIntegrity Temin 360] Kolon tamamlama hatası (${table.name}):`, msg)
        throw new SchemaMigrationError(
          `Kolon tamamlama başarısız (${table.name}): ${msg}`,
          err
        )
      }
    }
  }

  // 15. Ölçü Birimleri & Varsayılan Komisyonlar Seed İşlemleri
  seedUnitConversions(db)
  seedDefaultCommissions(db)

  // 16. Denetim Günlüğü ve Donanım Kimliği (mac_hash) Güvenlik Enjeksiyonu
  // Denetim günlüğü zorunludur (adli bilişim/mühür zinciri). @dt/database içindeki
  // initSessionContext/registerDefaultAuditTriggers kendi hatalarını loglayıp yuttuğu için
  // başarıyı çağrı sonucundan değil, veritabanının gerçek durumundan doğruluyoruz.
  try {
    initSessionContext(db)
    registerDefaultAuditTriggers(db, 'temin360-desktop')
  } catch (auditErr: unknown) {
    if (auditErr instanceof SchemaMigrationError) throw auditErr
    if (!isExpectedSqliteError(auditErr)) {
      const msg = auditErr instanceof Error ? auditErr.message : String(auditErr)
      throw new SchemaMigrationError(`Denetim günlüğü kurulumu başarısız: ${msg}`, auditErr)
    }
  }
  verifyAuditInfrastructure(db)
}

const AUDITED_TABLES = [
  'DATA_TeminKalemTeklif',
  'DATA_TeminFirma',
  'DATA_TeminDosyasi',
  'DATA_TeminKalem'
]

/**
 * Denetim altyapısının gerçekten kurulduğunu doğrular; eksikse SchemaMigrationError fırlatır.
 * Veri veya mevcut audit kayıtları değiştirilmez (salt okunur kontrol).
 */
export function verifyAuditInfrastructure(db: Database.Database): void {
  const missing: string[] = []
  for (const t of ['sys_audit_logs', 'sys_session_context']) {
    if (!isPhysicalTable(db, t)) missing.push(`tablo:${t}`)
  }
  const triggerExists = (name: string): boolean => {
    try {
      return !!db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = ?")
        .get(name)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new SchemaMigrationError(`Audit trigger doğrulanamadı (${name}): ${msg}`, err)
    }
  }
  for (const t of AUDITED_TABLES) {
    if (!isPhysicalTable(db, t)) continue
    for (const op of ['insert', 'update', 'delete']) {
      const name = `trg_audit_${t}_${op}`
      if (!triggerExists(name)) missing.push(`trigger:${name}`)
    }
  }
  if (missing.length > 0) {
    throw new SchemaMigrationError(
      `Denetim günlüğü altyapısı eksik, çalışma alanı güvenli açılamadı: ${missing.join(', ')}`
    )
  }
}
