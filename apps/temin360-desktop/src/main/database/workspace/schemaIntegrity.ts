import Database from 'better-sqlite3'
import { schema } from '../index'
import { runMigrations, getAppSchemaMax, initSessionContext, registerDefaultAuditTriggers } from '@dt/database'
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

export function ensureSchemaIntegrity(db: Database.Database): void {
  try {
    db.exec(`
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
    `)
  } catch {}

  try {
    db.exec(`ALTER TABLE DATA_IhtiyacRaporu ADD COLUMN "talep_eden_unvan" TEXT;`)
  } catch {}

  try {
    db.exec(`ALTER TABLE DATA_IhtiyacRaporu ADD COLUMN "evrak_sayisi" TEXT;`)
  } catch {}

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
  } catch (err: any) {
    console.warn('[Schema Self-Healing] Migration check warning:', err.message)
  }

  // Explicit columns for TANIM_Firma CRM
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
    try {
      db.exec(`ALTER TABLE TANIM_Firma ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  // Explicit columns for DATA_TeminDosyasi
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
    { name: 'komisyon_seed_edildi', def: 'INTEGER' }
  ]
  for (const c of teminDosyasiColumns) {
    try {
      db.exec(`ALTER TABLE DATA_TeminDosyasi ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  // Explicit columns for DATA_TeminKomisyon & TANIM_KomisyonUye
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
    try {
      db.exec(`ALTER TABLE DATA_TeminKomisyon ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
    try {
      db.exec(`ALTER TABLE TANIM_KomisyonUye ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS DATA_TeminKomisyonHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER NOT NULL,
        komisyon_turu TEXT,
        islem_turu TEXT,
        islem_yapan TEXT,
        snapshot_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
  } catch {}

  // Sync alias columns for DATA_TeminDosyasi & DATA_TeminKomisyon
  try {
    db.exec(`
      UPDATE DATA_TeminDosyasi SET dosya_no = temin_no WHERE (dosya_no IS NULL OR dosya_no = '') AND temin_no IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET temin_no = dosya_no WHERE (temin_no IS NULL OR temin_no = '') AND dosya_no IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET dosya_adi = COALESCE(is_adi, konu, is_tanimi) WHERE (dosya_adi IS NULL OR dosya_adi = '') AND COALESCE(is_adi, konu, is_tanimi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET is_adi = COALESCE(dosya_adi, konu, is_tanimi) WHERE (is_adi IS NULL OR is_adi = '') AND COALESCE(dosya_adi, konu, is_tanimi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET is_tanimi = COALESCE(is_adi, konu, dosya_adi) WHERE (is_tanimi IS NULL OR is_tanimi = '') AND COALESCE(is_adi, konu, dosya_adi) IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET alim_turu = tur WHERE (alim_turu IS NULL OR alim_turu = '') AND tur IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET tur = alim_turu WHERE (tur IS NULL OR tur = '') AND alim_turu IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET birim = harcama_birimi WHERE (birim IS NULL OR birim = '') AND harcama_birimi IS NOT NULL;
      UPDATE DATA_TeminDosyasi SET harcama_birimi = birim WHERE (harcama_birimi IS NULL OR harcama_birimi = '') AND birim IS NOT NULL;
      UPDATE DATA_TeminKomisyon SET asli_yedek = COALESCE(rol, 'Asil') WHERE (asli_yedek IS NULL OR asli_yedek = '') AND rol IS NOT NULL;
      UPDATE DATA_TeminKomisyon SET rol = COALESCE(asli_yedek, 'Asil') WHERE (rol IS NULL OR rol = '') AND asli_yedek IS NOT NULL;
      UPDATE DATA_TeminKomisyon SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
      UPDATE TANIM_KomisyonUye SET belgede_goster = 1 WHERE (belge_kapsami IS NULL OR belge_kapsami != 'gizli') AND (belgede_goster = 0 OR belgede_goster IS NULL);
    `)
  } catch {}

  try {
    db.exec(`ALTER TABLE DATA_DosyaSablonVeri ADD COLUMN "sablon_kodu" TEXT;`)
  } catch {
    /* ignore */
  }

  try {
    db.exec(`ALTER TABLE DATA_DosyaSablonVeri ADD COLUMN "sablon_versiyon" INTEGER DEFAULT 1;`)
  } catch {
    /* ignore */
  }

  // Backfill sablon_kodu from TANIM_Sablon if missing
  try {
    db.exec(`
      UPDATE DATA_DosyaSablonVeri 
      SET sablon_kodu = (
        SELECT REPLACE(dosya_adi, '.html', '') 
        FROM TANIM_Sablon 
        WHERE TANIM_Sablon.id = DATA_DosyaSablonVeri.sablon_id 
        LIMIT 1
      )
      WHERE (sablon_kodu IS NULL OR sablon_kodu = '') AND sablon_id IS NOT NULL;
    `)
  } catch {
    /* ignore */
  }

  // Deterministic deduplication before unique index creation:
  // If duplicate records exist for (temin_dosya_id, sablon_kodu), archive older duplicates into DATA_DosyaRevizyon and keep newest
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
          // Arşivleme ve silme tek bir atomik transaction içinde yapılır.
          // Arşivleme başarısız olursa silme işlemi yapılmaz (veri kaybı engellenir).
          db.transaction(() => {
            insertRevizyon.run(dup.temin_dosya_id, dup.sablon_kodu, oldRow.veri_json)
            deleteSablonVeri.run(oldRow.id)
          })()
        }
      }
    }
  } catch (err: unknown) {
    if (!isExpectedSqliteError(err)) {
      console.error('[ensureSchemaIntegrity Temin 360] Mükerrer şablon verisi temizleme uyarısı:', err)
    }
  }

  // Ensure UNIQUE index on (temin_dosya_id, sablon_kodu)
  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_data_dosyasablonveri_unique 
      ON DATA_DosyaSablonVeri(temin_dosya_id, sablon_kodu);
    `)
  } catch {
    /* ignore */
  }

  try {
    db.exec(`ALTER TABLE DATA_TeminFirma ADD COLUMN "kazanan_mi" INTEGER DEFAULT 0;`)
  } catch {}
  try {
    db.exec(`ALTER TABLE DATA_TeminFirma ADD COLUMN "kazandi_mi" INTEGER DEFAULT 0;`)
  } catch {}
  try {
    db.exec(`
      UPDATE DATA_TeminFirma SET kazanan_mi = kazandi_mi WHERE (kazanan_mi IS NULL OR kazanan_mi = 0) AND kazandi_mi = 1;
      UPDATE DATA_TeminFirma SET kazandi_mi = kazanan_mi WHERE (kazandi_mi IS NULL OR kazandi_mi = 0) AND kazanan_mi = 1;
    `)
  } catch {}

  // Child tables dosya_id sync & triggers
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
    try {
      db.exec(`ALTER TABLE ${tbl} ADD COLUMN dosya_id INTEGER;`)
    } catch {}
    try {
      db.exec(
        `UPDATE ${tbl} SET dosya_id = temin_dosya_id WHERE dosya_id IS NULL AND temin_dosya_id IS NOT NULL;`
      )
      db.exec(
        `UPDATE ${tbl} SET temin_dosya_id = dosya_id WHERE temin_dosya_id IS NULL AND dosya_id IS NOT NULL;`
      )
    } catch {}
    try {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${tbl}_sync_dosya_id_ins
        AFTER INSERT ON ${tbl}
        BEGIN
          UPDATE ${tbl} SET 
            dosya_id = COALESCE(NEW.dosya_id, NEW.temin_dosya_id),
            temin_dosya_id = COALESCE(NEW.temin_dosya_id, NEW.dosya_id)
          WHERE id = NEW.id;
        END;
      `)
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${tbl}_sync_dosya_id_upd
        AFTER UPDATE OF dosya_id, temin_dosya_id ON ${tbl}
        BEGIN
          UPDATE ${tbl} SET 
            dosya_id = COALESCE(NEW.dosya_id, NEW.temin_dosya_id),
            temin_dosya_id = COALESCE(NEW.temin_dosya_id, NEW.dosya_id)
          WHERE id = NEW.id;
        END;
      `)
    } catch {}
  }

  // Kalem, OlcuBirimi, Personel extended columns
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
    try {
      db.exec(`ALTER TABLE TANIM_Kalem ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
    try {
      db.exec(`ALTER TABLE DATA_TeminKalem ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
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
    try {
      db.exec(`ALTER TABLE TANIM_OlcuBirimi ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  const personelCols = [
    { name: 'gorev', def: 'TEXT' },
    { name: 'unvan', def: 'TEXT' },
    { name: 'birim', def: 'TEXT' },
    { name: 'avatar', def: 'TEXT' }
  ]
  for (const c of personelCols) {
    try {
      db.exec(`ALTER TABLE TANIM_Personel ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  const ihtiyacCols = [
    { name: 'talep_eden_unvan', def: 'TEXT' },
    { name: 'evrak_sayisi', def: 'TEXT' }
  ]
  for (const c of ihtiyacCols) {
    try {
      db.exec(`ALTER TABLE DATA_IhtiyacRaporu ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  const belgeCols = [
    { name: 'durum', def: "TEXT DEFAULT 'hazirlaniyor'" },
    { name: 'bekleme_nedeni', def: 'TEXT' }
  ]
  for (const c of belgeCols) {
    try {
      db.exec(`ALTER TABLE DATA_TeminBelge ADD COLUMN "${c.name}" ${c.def};`)
    } catch {}
  }

  // Schema Table & Column self-repair
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
        db.exec(
          'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columnsSql + constraintsSql + ');'
        )
      } else {
        const existingColumns = new Set(tableInfo.map((c) => c.name))
        for (const col of table.columns as any[]) {
          if (!existingColumns.has(col.name)) {
            try {
              let sqlDef = '"' + col.name + '" ' + col.type
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
              db.exec(`ALTER TABLE ${table.name} ADD COLUMN ${sqlDef};`)
            } catch {}
          }
        }
      }
    } catch {}
  }

  // Seed Units & Default Commissions
  seedUnitConversions(db)
  seedDefaultCommissions(db)

  // Denetim Gunlugu ve Donanim Kimligi (mac_hash) Guvenlik Enjeksiyonu
  try {
    initSessionContext(db)
    registerDefaultAuditTriggers(db, 'temin360-desktop')
  } catch (auditErr) {
    console.warn('[AuditTrail] ensureSchemaIntegrity tetikleyici uyarisi:', auditErr)
  }
}
