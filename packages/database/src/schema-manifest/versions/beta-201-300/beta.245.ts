/* eslint-disable */
/**
 * BELGELERİM EKLENTİSİ ŞEMA MANİFESTİ (1.0.0-beta.245)
 */
export default {
  app: '1.0.0-beta.245',
  schema_min: 1,
  schema_max: 45,
  release_date: '2026-10-13',
  changes: [
    {
      schema: 45,
      type: 'add_tables',
      description:
        'Belgelerim eklentisi tabloları (DATA_KutuphaneGrup, DATA_KutuphaneBelge, DATA_KutuphaneBelgeSurum, DATA_KutuphaneYerTutucu)',
      tables_added: [
        'DATA_KutuphaneGrup',
        'DATA_KutuphaneBelge',
        'DATA_KutuphaneBelgeSurum',
        'DATA_KutuphaneYerTutucu'
      ],
      raw_sql: [
        `CREATE TABLE IF NOT EXISTS DATA_KutuphaneGrup (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_id INTEGER,
          ad TEXT NOT NULL,
          renk TEXT DEFAULT 'blue',
          ikon TEXT DEFAULT 'Folder',
          sira INTEGER DEFAULT 0,
          FOREIGN KEY(parent_id) REFERENCES DATA_KutuphaneGrup(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS DATA_KutuphaneBelge (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grup_id INTEGER,
          ad TEXT NOT NULL,
          etiketler TEXT DEFAULT '[]',
          aktif_surum_id INTEGER,
          arsiv_mi INTEGER DEFAULT 0,
          favori_mi INTEGER DEFAULT 0,
          silindi_at DATETIME,
          FOREIGN KEY(grup_id) REFERENCES DATA_KutuphaneGrup(id) ON DELETE SET NULL
        );`,
        `CREATE TABLE IF NOT EXISTS DATA_KutuphaneBelgeSurum (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          belge_id INTEGER NOT NULL,
          surum_no INTEGER NOT NULL,
          etiket TEXT,
          "not" TEXT,
          icerik_html TEXT NOT NULL,
          kosullar_json TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(belge_id) REFERENCES DATA_KutuphaneBelge(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS DATA_KutuphaneYerTutucu (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kapsam TEXT NOT NULL,
          kapsam_id INTEGER,
          anahtar TEXT NOT NULL,
          etiket TEXT NOT NULL,
          tip TEXT DEFAULT 'metin',
          varsayilan TEXT,
          secenekler_json TEXT,
          kaynak TEXT DEFAULT 'elle',
          sira INTEGER DEFAULT 0
        );`
      ]
    }
  ]
}
