import 'server-only';
import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SqliteDataSource } from '../../../src/sqlite/source';
import { SqliteSnapshotRepository } from '../../../src/sqlite/repository';
import { SnapshotEngine } from '../../../src/core/engine';
import { definition } from '../../../src/templates/piyasa-fiyat-arastirma/definition';

const context = { globalId: 'g1', documentId: 'd1' };
let instance: Database.Database | undefined;
function database() {
  if (instance) return instance;
  const folder = join(process.cwd(), 'data');
  mkdirSync(folder, { recursive: true });
  const db = new Database(join(folder, 'nextjs-demo.sqlite'));
  db.pragma('journal_mode = WAL');
  db.exec(readFileSync(join(process.cwd(), '../../src/sqlite/schema.sql'), 'utf8'));
  db.prepare('INSERT OR IGNORE INTO global_settings (id,kurum_ad,kurum_adres,logo,yetkili_ad,yetkili_unvan) VALUES (?,?,?,?,?,?)')
    .run('g1','Örnek Belediyesi','Ankara',null,'Ayşe Kaya','Yetkili');
  db.prepare('INSERT OR IGNORE INTO units (id,ad) VALUES (?,?)').run('u1','Fen İşleri Müdürlüğü');
  db.prepare('INSERT OR IGNORE INTO documents (id,dosya_no,konu,tarih,birim_id) VALUES (?,?,?,?,?)')
    .run('d1','2026/125','Bilgisayar Alımı','2026-10-31','u1');
  db.prepare('INSERT OR IGNORE INTO items (id,document_id,sira_no,ad,miktar,birim) VALUES (?,?,?,?,?,?)')
    .run('k1','d1',1,'Dizüstü Bilgisayar',3,'Adet');
  db.prepare('INSERT OR IGNORE INTO items (id,document_id,sira_no,ad,miktar,birim) VALUES (?,?,?,?,?,?)')
    .run('k2','d1',2,'Yazıcı',2,'Adet');
  db.prepare('INSERT OR IGNORE INTO commission (id,document_id,ad_soyad,unvan,gorev) VALUES (?,?,?,?,?)')
    .run('c1','d1','Ali Demir','Müdür','Başkan');
  db.prepare('INSERT OR IGNORE INTO offers (id,document_id,firma,item_id,birim_fiyat) VALUES (?,?,?,?,?)')
    .run('t1','d1','Örnek Teknoloji','k1',15000);
  instance = db;
  return db;
}
export function documentService() {
  const db = database();
  const repo = new SqliteSnapshotRepository(db);
  const engine = new SnapshotEngine(new SqliteDataSource(db));
  return { db, repo, engine, definition, context };
}
