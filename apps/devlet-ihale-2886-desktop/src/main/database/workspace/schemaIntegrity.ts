import Database from 'better-sqlite3'
import { schema } from '../index'
import { runMigrations, getAppSchemaMax, ensureIhaleCompatibilityViews } from '@dt/database'
import { seedUnitConversions } from './conversionsSeed'
import { seedDefaultCommissions } from './commissionsSeed'

function isExpectedSqliteError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes('duplicate column') ||
    msg.includes('already exists') ||
    msg.includes('cannot add a column to a view')
  )
}

function safeExec(db: Database.Database, sql: string, context?: string): void {
  try {
    db.exec(sql)
  } catch (err: unknown) {
    if (isExpectedSqliteError(err)) return
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[ensureSchemaIntegrity 2886] Hata (${context || 'SQL execution'}):`, msg)
    throw new Error(`[ensureSchemaIntegrity 2886] ${context || 'SQL execution'} başarısız: ${msg}`)
  }
}

function isPhysicalTable(db: Database.Database, tableName: string): boolean {
  try {
    const row = db
      .prepare('SELECT type FROM sqlite_master WHERE name = ?')
      .get(tableName) as { type?: string } | undefined
    return row?.type === 'table'
  } catch {
    return false
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
    console.error(`[ensureSchemaIntegrity 2886] ADD COLUMN ${tableName}.${colName} başarısız:`, msg)
    throw new Error(`[ensureSchemaIntegrity 2886] Kolon eklenemedi (${tableName}.${colName}): ${msg}`)
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
        console.error(`[ensureSchemaIntegrity 2886] Tablo onarım hatası (${table.name}):`, msg)
        throw err
      }
    }
  }

  // 2. Devlet İhale 2886 Uyumluluk Görünümleri (DATA_Temin... Views & Triggers)
  try {
    ensureIhaleCompatibilityViews(db)
  } catch (err: unknown) {
    if (!isExpectedSqliteError(err)) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[ensureSchemaIntegrity 2886] Uyumluluk katmanı başlatılamadı:', errorMsg)
      throw new Error(`Devlet İhale 2886 uyumluluk katmanı başlatılamadı: ${errorMsg}`)
    }
  }

  // 3. Çekirdek Sistem Tabloları ve Bağımsız İhtiyaç Raporu (2886 İlişki Modeli)
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
        durum TEXT DEFAULT 'taslak',
        ihale_dosya_id INTEGER,
        temin_dosya_id INTEGER,
        tarih DATE DEFAULT CURRENT_DATE,
        onay_tarihi DATE,
        tahmini_butce REAL DEFAULT 0,
        notlar TEXT,
        evrak_sayisi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(ihale_dosya_id) REFERENCES DATA_IhaleDosyasi(id) ON DELETE SET NULL,
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
      CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_ihale_dosya ON DATA_IhtiyacRaporu(ihale_dosya_id);
      CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_kalem_rapor ON DATA_IhtiyacRaporuKalem(rapor_id);
    `,
    'Temel Tablolar ve İhtiyaç Raporu Kurulumu'
  )

  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'talep_eden_unvan', 'TEXT')
  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'evrak_sayisi', 'TEXT')
  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'ihale_dosya_id', 'INTEGER')
  safeAddColumn(db, 'DATA_IhtiyacRaporu', 'temin_dosya_id', 'INTEGER')

  // 4. Şema Sürümü ve Migrasyon Kontrolü
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as
      | { value?: string }
      | undefined
    const currentDbVer = row?.value ? parseInt(row.value, 10) || 1 : 1
    const targetSchemaMax = getAppSchemaMax('devlet-ihale-2886-desktop')
    if (currentDbVer < targetSchemaMax) {
      console.log(
        `[Schema Self-Healing] Migrating from v${currentDbVer} to v${targetSchemaMax} (devlet-ihale-2886-desktop)`
      )
      runMigrations(db, currentDbVer, schema, { appId: 'devlet-ihale-2886-desktop' })
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('dbSchemaVersion', ?)").run(
        targetSchemaMax.toString()
      )
    }
  } catch (err: any) {
    if (!isExpectedSqliteError(err)) {
      console.error('[Schema Self-Healing] Migration check warning:', err.message)
      throw err
    }
  }

  // 5. TANIM_Firma CRM Kolonları
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

  // 6. 2886 Sayılı Devlet İhale Kanunu Süreç Kolonları
  // Fiziksel ana tablo DATA_IhaleDosyasi olup mevzuat varsayılanı 2886'dır (4734/22-d kalıntısı temizlendi)
  const ihaleDosyasiColumns = [
    { name: 'tarih', def: 'DATE' },
    { name: 'temin_tarihi', def: 'DATE' },
    { name: 'dosya_acilis_tarihi', def: 'DATE' },
    { name: 'temin_no', def: 'TEXT' },
    { name: 'evrak_sayisi', def: 'TEXT' },
    { name: 'hesaplama_esasi', def: "TEXT DEFAULT 'tahmini_bedel'" },
    { name: 'komisyon_takdiri', def: 'TEXT' },
    { name: 'teslim_gun', def: 'INTEGER DEFAULT 15' },
    { name: 'teslim_tarihi', def: 'DATE' },
    { name: 'sozlesme_yapilacak_mi', def: 'INTEGER DEFAULT 1' },
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
    { name: 'tur', def: "TEXT DEFAULT 'satis_kiralama'" },
    { name: 'birim', def: 'TEXT' },
    { name: 'harcama_birimi', def: 'TEXT' },
    { name: 'birim_id', def: 'INTEGER' },
    { name: 'durum', def: "TEXT DEFAULT 'Tamamlandı'" },
    { name: 'madde', def: "TEXT DEFAULT '2886 Sayılı Devlet İhale Kanunu'" },
    { name: 'ihale_usulu', def: "TEXT DEFAULT '2886 Sayılı Kanun'" },
    { name: 'ihale_tipi', def: "TEXT DEFAULT 'Devlet İhalesi (2886)'" },
    { name: 'dosya_no', def: 'TEXT' },
    { name: 'dosya_adi', def: 'TEXT' },
    { name: 'is_tanimi', def: 'TEXT' },
    { name: 'is_adi', def: 'TEXT' },
    { name: 'konu', def: 'TEXT' },
    { name: 'komisyon_seed_edildi', def: 'INTEGER' },
    { name: 'is_locked', def: 'INTEGER DEFAULT 0' },
    { name: 'lock_reason', def: 'TEXT' },
    { name: 'kayit_kaynagi', def: "TEXT DEFAULT 'manual'" },
    { name: 'aktarim_grubu_id', def: 'TEXT' },
    { name: 'kaynak_kayit_id', def: 'TEXT' }
  ]
  for (const c of ihaleDosyasiColumns) {
    safeAddColumn(db, 'DATA_IhaleDosyasi', c.name, c.def)
    safeAddColumn(db, 'DATA_TeminDosyasi', c.name, c.def)
  }

  // 7. Komisyon Kolonları
  const komisyonExtendedColumns = [
    { name: 'asli_yedek', def: "TEXT DEFAULT 'Asil'" },
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
    'DATA_TeminKomisyonHistory tablosu oluşturma'
  )

  // 8. Kolon Eşitleme ve Senkronizasyon (Fiziksel Tablolar)
  if (isPhysicalTable(db, 'DATA_IhaleDosyasi')) {
    safeExec(
      db,
      `
        UPDATE DATA_IhaleDosyasi SET dosya_no = temin_no WHERE (dosya_no IS NULL OR dosya_no = '') AND temin_no IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET temin_no = dosya_no WHERE (temin_no IS NULL OR temin_no = '') AND dosya_no IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET dosya_adi = COALESCE(is_adi, konu, is_tanimi) WHERE (dosya_adi IS NULL OR dosya_adi = '') AND COALESCE(is_adi, konu, is_tanimi) IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET is_adi = COALESCE(dosya_adi, konu, is_tanimi) WHERE (is_adi IS NULL OR is_adi = '') AND COALESCE(dosya_adi, konu, is_tanimi) IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET is_tanimi = COALESCE(is_adi, konu, dosya_adi) WHERE (is_tanimi IS NULL OR is_tanimi = '') AND COALESCE(is_adi, konu, dosya_adi) IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET alim_turu = tur WHERE (alim_turu IS NULL OR alim_turu = '') AND tur IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET tur = alim_turu WHERE (tur IS NULL OR tur = '') AND alim_turu IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET birim = harcama_birimi WHERE (birim IS NULL OR birim = '') AND harcama_birimi IS NOT NULL;
        UPDATE DATA_IhaleDosyasi SET harcama_birimi = birim WHERE (harcama_birimi IS NULL OR harcama_birimi = '') AND birim IS NOT NULL;
      `,
      'DATA_IhaleDosyasi Kolon Senkronizasyonu'
    )
  }

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
        UPDATE DATA_TeminDosyasi SET harcama_birimi = birim WHERE (harcama_birimi IS NULL OR harcama_birimi = '') AND birim IS NOT NULL;
      `,
      'DATA_TeminDosyasi Kolon Senkronizasyonu'
    )
  }

  if (isPhysicalTable(db, 'DATA_TeminKomisyon')) {
    safeExec(
      db,
      `
        UPDATE DATA_TeminKomisyon SET asli_yedek = COALESCE(rol, 'Asil') WHERE (asli_yedek IS NULL OR asli_yedek = '') AND rol IS NOT NULL;
        UPDATE DATA_TeminKomisyon SET rol = COALESCE(asli_yedek, 'Asil') WHERE (rol IS NULL OR rol = '') AND asli_yedek IS NOT NULL;
        UPDATE DATA_TeminKomisyon SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
      `,
      'DATA_TeminKomisyon Kolon Senkronizasyonu'
    )
  }

  if (isPhysicalTable(db, 'TANIM_KomisyonUye')) {
    safeExec(
      db,
      `
        UPDATE TANIM_KomisyonUye SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
      `,
      'TANIM_KomisyonUye Kolon Senkronizasyonu'
    )
  }

  safeAddColumn(db, 'DATA_DosyaSablonVeri', 'sablon_kodu', 'TEXT')
  safeAddColumn(db, 'DATA_DosyaSablonVeri', 'sablon_versiyon', 'INTEGER DEFAULT 1')

  if (isPhysicalTable(db, 'DATA_DosyaSablonVeri')) {
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
      'DATA_DosyaSablonVeri sablon_kodu backfill'
    )

    // Deduplication before unique index creation
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
          for (let i = 1; i < rows.length; i++) {
            const oldRow = rows[i]
            if (isPhysicalTable(db, 'DATA_DosyaRevizyon')) {
              try {
                db.prepare(
                  `INSERT INTO DATA_DosyaRevizyon (temin_dosya_id, modul_adi, surec_kodu, belge_kodu, versiyon, baslik, veri_json) 
                   VALUES (?, 'BELGE_YONETIMI', 'MIGRATION_DEDUP', ?, 'v_arsiv', 'Eski Mükerrer Belge Verisi Arşivi', ?)`
                ).run(dup.temin_dosya_id, dup.sablon_kodu, oldRow.veri_json)
              } catch {}
            }
            db.prepare(`DELETE FROM DATA_DosyaSablonVeri WHERE id = ?`).run(oldRow.id)
          }
        }
      }
    } catch {}

    safeExec(
      db,
      `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_data_dosyasablonveri_unique 
        ON DATA_DosyaSablonVeri(temin_dosya_id, sablon_kodu);
      `,
      'idx_data_dosyasablonveri_unique indeksi oluşturma'
    )
  }

  // DATA_TeminFirma / DATA_IhaleFirma kazanma durumu
  safeAddColumn(db, 'DATA_TeminFirma', 'kazanan_mi', 'INTEGER DEFAULT 0')
  safeAddColumn(db, 'DATA_TeminFirma', 'kazandi_mi', 'INTEGER DEFAULT 0')
  safeAddColumn(db, 'DATA_IhaleFirma', 'kazanan_mi', 'INTEGER DEFAULT 0')
  safeAddColumn(db, 'DATA_IhaleFirma', 'kazandi_mi', 'INTEGER DEFAULT 0')

  if (isPhysicalTable(db, 'DATA_TeminFirma')) {
    safeExec(
      db,
      `
        UPDATE DATA_TeminFirma SET kazanan_mi = kazandi_mi WHERE (kazanan_mi IS NULL OR kazanan_mi = 0) AND kazandi_mi = 1;
        UPDATE DATA_TeminFirma SET kazandi_mi = kazanan_mi WHERE (kazandi_mi IS NULL OR kazanan_mi = 0) AND kazanan_mi = 1;
      `,
      'DATA_TeminFirma kazanma durumu senkronizasyonu'
    )
  }

  // 9. Alt Tablolar dosya_id Senkronizasyonu (Yalnızca Fiziksel Tablolar)
  const dosyaChildTables = [
    'DATA_IhaleKalem',
    'DATA_IhaleFirma',
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
      `${tbl} dosya_id senkronizasyonu`
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
        CREATE TRIGGER IF NOT EXISTS trg_${tbl}_sync_dosya_id_upd
        AFTER UPDATE OF dosya_id, temin_dosya_id ON ${tbl}
        BEGIN
          UPDATE ${tbl} SET 
            dosya_id = COALESCE(NEW.dosya_id, NEW.temin_dosya_id),
            temin_dosya_id = COALESCE(NEW.temin_dosya_id, NEW.dosya_id)
          WHERE id = NEW.id;
        END;
      `,
      `${tbl} dosya_id trigger oluşturma`
    )
  }

  // 10. Kalem, Ölçü Birimi, Personel ve İhtiyaç Raporu Ek Kolonları
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
    safeAddColumn(db, 'DATA_IhaleKalem', c.name, c.def)
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
    { name: 'avatar', def: 'TEXT' }
  ]
  for (const c of personelCols) {
    safeAddColumn(db, 'TANIM_Personel', c.name, c.def)
  }

  const ihtiyacCols = [
    { name: 'talep_eden_unvan', def: 'TEXT' },
    { name: 'evrak_sayisi', def: 'TEXT' },
    { name: 'ihale_dosya_id', def: 'INTEGER' },
    { name: 'temin_dosya_id', def: 'INTEGER' }
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

  // 11. Kolon Eksiklerini Tamamlama (PRAGMA table_info ile karşılaştır)
  for (const table of schema.tables as any[]) {
    try {
      if (isPhysicalTable(db, table.name)) {
        const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[]
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
        console.error(`[ensureSchemaIntegrity 2886] Kolon tamamlama hatası (${table.name}):`, msg)
        throw err
      }
    }
  }

  // 12. Sabit Birim ve Varsayılan Komisyonları Seed Et
  seedUnitConversions(db)
  seedDefaultCommissions(db)
}
