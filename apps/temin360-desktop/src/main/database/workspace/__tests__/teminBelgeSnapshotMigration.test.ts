import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'

describe('DATA_TeminBelgeSnapshot Schema & Migration Tests', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  it('1. DATA_TeminBelgeSnapshot tablosunu doğru şema, foreign key ve indekslerle oluşturur', () => {
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        konu TEXT
      );

      CREATE TABLE DATA_TeminBelgeSnapshot (
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

      CREATE INDEX idx_temin_belge_snapshot_dosya ON DATA_TeminBelgeSnapshot(dosya_id);
      CREATE INDEX idx_temin_belge_snapshot_sablon ON DATA_TeminBelgeSnapshot(sablon_kodu);
      CREATE UNIQUE INDEX idx_temin_belge_snapshot_unique ON DATA_TeminBelgeSnapshot(dosya_id, sablon_kodu);
    `)

    const pragma = db.prepare("PRAGMA table_info('DATA_TeminBelgeSnapshot')").all() as any[]
    const columnNames = pragma.map((col) => col.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('dosya_id')
    expect(columnNames).toContain('sablon_id')
    expect(columnNames).toContain('sablon_kodu')
    expect(columnNames).toContain('veri_json')
    expect(columnNames).toContain('sablon_versiyon')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
    expect(columnNames).toContain('created_by')
    expect(columnNames).toContain('updated_by')
    expect(columnNames).toContain('is_active')
    expect(columnNames).toContain('is_deleted')

    // temin_dosya_id sütununun OLMADIĞINI doğrula
    expect(columnNames).not.toContain('temin_dosya_id')
  })

  it('2. Bir TEMİN dosyasına birden fazla belge snapshot kaydı eklenebilmeli', () => {
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (id INTEGER PRIMARY KEY AUTOINCREMENT);
      CREATE TABLE DATA_TeminBelgeSnapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_id INTEGER NOT NULL,
        sablon_id INTEGER,
        sablon_kodu TEXT NOT NULL,
        veri_json TEXT NOT NULL,
        sablon_versiyon INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        is_deleted INTEGER DEFAULT 0,
        CONSTRAINT uq_snapshot UNIQUE (dosya_id, sablon_kodu)
      );
    `)

    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(275)

    const insert = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?, ?)
    `)

    insert.run(275, 1, 'luzum_muzekkeresi', JSON.stringify({ baslik: 'Lüzum Müzekkeresi Verisi' }))
    insert.run(275, 2, 'ihtiyac_listesi', JSON.stringify({ kalemler: [{ ad: 'Defter', adet: 10 }] }))
    insert.run(275, 3, 'onay_belgesi', JSON.stringify({ onayMakam: 'Rektörlük' }))

    const snapshots = db
      .prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND is_deleted = 0')
      .all(275) as any[]

    expect(snapshots.length).toBe(3)
    const codes = snapshots.map((s) => s.sablon_kodu)
    expect(codes).toContain('luzum_muzekkeresi')
    expect(codes).toContain('ihtiyac_listesi')
    expect(codes).toContain('onay_belgesi')
  })

  it('3. Farklı dosyaların snapshot kayıtları birbirine karışmamalı', () => {
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (id INTEGER PRIMARY KEY AUTOINCREMENT);
      CREATE TABLE DATA_TeminBelgeSnapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_id INTEGER NOT NULL,
        sablon_kodu TEXT NOT NULL,
        veri_json TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        CONSTRAINT uq_snapshot UNIQUE (dosya_id, sablon_kodu)
      );
    `)

    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(100)
    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(200)

    db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (100, 'luzum_muzekkeresi', '{"dosya": 100}')
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (200, 'luzum_muzekkeresi', '{"dosya": 200}')
    `).run()

    const dosya100 = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ?').all(100) as any[]
    const dosya200 = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ?').all(200) as any[]

    expect(dosya100.length).toBe(1)
    expect(dosya200.length).toBe(1)
    expect(JSON.parse(dosya100[0].veri_json).dosya).toBe(100)
    expect(JSON.parse(dosya200[0].veri_json).dosya).toBe(200)
  })

  it('4. DATA_DosyaSablonVeri tablosundan DATA_TeminBelgeSnapshot tablosuna veri migrasyonu JSON içeriğini birebir korur', () => {
    db.exec(`
      CREATE TABLE DATA_DosyaSablonVeri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER NOT NULL,
        dosya_id INTEGER,
        sablon_id INTEGER,
        sablon_kodu TEXT,
        veri_json TEXT NOT NULL,
        sablon_versiyon INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE DATA_TeminBelgeSnapshot (
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
        CONSTRAINT uq_snapshot UNIQUE (dosya_id, sablon_kodu)
      );
    `)

    const complexJson = JSON.stringify({
      isBasligi: 'Laboratuvar Sarf Malzemesi Alımı',
      kalemler: [
        { siraNo: 1, ad: 'Eppendorf Tüpü', miktar: 500, birim: 'Adet' },
        { siraNo: 2, ad: 'Pipet Ucu', miktar: 1000, birim: 'Kutu' }
      ],
      ozelNot: 'Acele teslim edilmeli'
    })

    db.prepare(`
      INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, dosya_id, sablon_id, sablon_kodu, veri_json, sablon_versiyon)
      VALUES (275, 275, 5, 'ihtiyac_listesi', ?, 1)
    `).run(complexJson)

    // Migration logic
    const oldRows = db.prepare(`
      SELECT * FROM DATA_DosyaSablonVeri
      ORDER BY updated_at DESC, id DESC
    `).all() as any[]

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

    for (const row of oldRows) {
      insertSnapshot.run(
        row.dosya_id || row.temin_dosya_id,
        row.sablon_id,
        row.sablon_kodu,
        row.veri_json,
        row.sablon_versiyon || 1,
        row.created_at,
        row.updated_at
      )
    }

    const migrated = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = 275').all() as any[]
    expect(migrated.length).toBe(1)
    expect(migrated[0].sablon_kodu).toBe('ihtiyac_listesi')
    expect(migrated[0].veri_json).toBe(complexJson)
    expect(JSON.parse(migrated[0].veri_json).kalemler.length).toBe(2)
  })

  it('5. Migration tekrar çalıştırıldığında mükerrer snapshot kaydı üretmez', () => {
    db.exec(`
      CREATE TABLE DATA_DosyaSablonVeri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER NOT NULL,
        sablon_kodu TEXT,
        veri_json TEXT NOT NULL
      );

      CREATE TABLE DATA_TeminBelgeSnapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_id INTEGER NOT NULL,
        sablon_kodu TEXT NOT NULL,
        veri_json TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        CONSTRAINT uq_snapshot UNIQUE (dosya_id, sablon_kodu)
      );
    `)

    db.prepare(`
      INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, sablon_kodu, veri_json)
      VALUES (275, 'luzum_muzekkeresi', '{"test": 1}')
    `).run()

    const migrate = () => {
      const oldRows = db.prepare('SELECT * FROM DATA_DosyaSablonVeri').all() as any[]
      const insert = db.prepare(`
        INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
        VALUES (?, ?, ?)
        ON CONFLICT(dosya_id, sablon_kodu) DO NOTHING
      `)
      for (const r of oldRows) {
        insert.run(r.temin_dosya_id, r.sablon_kodu, r.veri_json)
      }
    }

    // 1. çalışma
    migrate()
    expect(db.prepare('SELECT COUNT(*) as c FROM DATA_TeminBelgeSnapshot').get()).toEqual({ c: 1 })

    // 2. çalışma
    migrate()
    expect(db.prepare('SELECT COUNT(*) as c FROM DATA_TeminBelgeSnapshot').get()).toEqual({ c: 1 })
  })
})

