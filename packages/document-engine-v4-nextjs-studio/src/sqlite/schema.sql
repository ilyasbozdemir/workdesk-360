CREATE TABLE IF NOT EXISTS global_settings (id TEXT PRIMARY KEY, kurum_ad TEXT NOT NULL, kurum_adres TEXT, logo TEXT, yetkili_ad TEXT, yetkili_unvan TEXT);
CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, ad TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, dosya_no TEXT NOT NULL, konu TEXT NOT NULL, tarih TEXT, birim_id TEXT REFERENCES units(id));
CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, sira_no INTEGER, ad TEXT, miktar REAL, birim TEXT);
CREATE TABLE IF NOT EXISTS commission (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, ad_soyad TEXT, unvan TEXT, gorev TEXT);
CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, firma TEXT, item_id TEXT, birim_fiyat REAL);
CREATE TABLE IF NOT EXISTS document_snapshots (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, template_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(document_id, template_id, revision));
