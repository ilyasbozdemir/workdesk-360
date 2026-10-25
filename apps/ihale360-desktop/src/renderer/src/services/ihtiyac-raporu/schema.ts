import { dbClient } from '../db/dbClient'

let tablesChecked = false

export function resetTablesChecked(): void {
  tablesChecked = false
}

export async function ensureIhtiyacRaporuTables(): Promise<void> {
  if (tablesChecked) return
  try {
    await dbClient.run(`CREATE TABLE IF NOT EXISTS DATA_IhtiyacRaporu (
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
      evrak_sayisi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(temin_dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE SET NULL,
      FOREIGN KEY(birim_id) REFERENCES TANIM_Birim(id) ON DELETE SET NULL,
      FOREIGN KEY(talep_eden_personel_id) REFERENCES TANIM_Personel(id) ON DELETE SET NULL
    )`)

    await dbClient.run(`CREATE TABLE IF NOT EXISTS DATA_IhtiyacRaporuKalem (
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
    )`)

    // İndeksler
    await dbClient.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_ihtiyac_raporu_no ON DATA_IhtiyacRaporu(rapor_no)`
    )
    await dbClient.run(
      `CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_temin_dosya ON DATA_IhtiyacRaporu(temin_dosya_id)`
    )
    await dbClient.run(
      `CREATE INDEX IF NOT EXISTS idx_ihtiyac_raporu_kalem_rapor ON DATA_IhtiyacRaporuKalem(rapor_id)`
    )
    tablesChecked = true
  } catch (e) {
    console.warn('[ihtiyacRaporu] Auto-init tables warning:', e)
  }
}
