import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'

describe('DATA_TeminBelgeSnapshot Schema & Migration Tests', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_no TEXT,
        konu TEXT,
        sunulacak_makam TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE TANIM_Sablon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_adi TEXT NOT NULL,
        baslik TEXT
      );

      CREATE TABLE DATA_DosyaRevizyon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER,
        modul_adi TEXT,
        surec_kodu TEXT,
        belge_kodu TEXT,
        versiyon TEXT,
        baslik TEXT,
        veri_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE,
        CONSTRAINT uq_snapshot UNIQUE (dosya_id, sablon_kodu)
      );

      CREATE INDEX idx_temin_belge_snapshot_dosya ON DATA_TeminBelgeSnapshot(dosya_id);
      CREATE INDEX idx_temin_belge_snapshot_sablon ON DATA_TeminBelgeSnapshot(sablon_kodu);
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('Test 1 – Çoklu belge: TEMİN dosyası 275 için üç ayrı snapshot oluşmalı', () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id, konu) VALUES (?, ?)').run(275, 'Tıbbi Cihaz Alımı')

    const insert = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?, ?)
    `)

    insert.run(275, 1, 'luzum_muzekkeresi', JSON.stringify({ baslik: 'Lüzum Müzekkeresi', onay: 'Onaylandı' }))
    insert.run(275, 2, 'ihtiyac_listesi', JSON.stringify({ kalemler: [{ ad: 'Ultrason Probu', adet: 2 }] }))
    insert.run(275, 3, 'yaklasik_maliyet_cetveli', JSON.stringify({ toplamTutar: 150000 }))

    const snapshots = db
      .prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND is_deleted = 0')
      .all(275) as any[]

    expect(snapshots.length).toBe(3)
    const codes = snapshots.map((s) => s.sablon_kodu)
    expect(codes).toContain('luzum_muzekkeresi')
    expect(codes).toContain('ihtiyac_listesi')
    expect(codes).toContain('yaklasik_maliyet_cetveli')
  })

  it('Test 2 – Dosya izolasyonu: Dosya 276 belgeleri Dosya 275 ile karışmamalı', () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id, konu) VALUES (?, ?)').run(275, 'Dosya 275')
    db.prepare('INSERT INTO DATA_TeminDosyasi (id, konu) VALUES (?, ?)').run(276, 'Dosya 276')

    const insert = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?)
    `)

    insert.run(275, 'luzum_muzekkeresi', JSON.stringify({ dosyaId: 275, konu: '275 Lüzum' }))
    insert.run(276, 'luzum_muzekkeresi', JSON.stringify({ dosyaId: 276, konu: '276 Lüzum' }))
    insert.run(276, 'ihtiyac_listesi', JSON.stringify({ dosyaId: 276, kalemler: ['Kalem X'] }))

    const docs275 = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ?').all(275) as any[]
    const docs276 = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ?').all(276) as any[]

    expect(docs275.length).toBe(1)
    expect(docs276.length).toBe(2)
    expect(JSON.parse(docs275[0].veri_json).dosyaId).toBe(275)
    expect(JSON.parse(docs276[0].veri_json).dosyaId).toBe(276)
  })

  it('Test 3 – Kullanıcı düzenlemeleri: Düzenlenip kaydedilen JSON tekrar açıldığında korunmalı', () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id, konu) VALUES (?, ?)').run(275, 'Dosya 275')

    // 1. İlk kayıt
    db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?)
    `).run(275, 'luzum_muzekkeresi', JSON.stringify({ gerekce: 'Orijinal Gerekçe' }))

    // 2. Kullanıcı düzenlemesi (UPDATE)
    const editedData = {
      gerekce: 'Kullanıcının Elle Düzenlediği Özel Gerekçe',
      ekstraNot: 'Acil satın alma gereklidir',
      onayci: 'Harcama Yetkilisi'
    }

    db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(dosya_id, sablon_kodu)
      DO UPDATE SET veri_json = excluded.veri_json, updated_at = CURRENT_TIMESTAMP
    `).run(275, 'luzum_muzekkeresi', JSON.stringify(editedData))

    // 3. Tekrar açılış
    const loaded = db.prepare(`
      SELECT veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?
    `).get(275, 'luzum_muzekkeresi') as any

    const parsed = JSON.parse(loaded.veri_json)
    expect(parsed.gerekce).toBe('Kullanıcının Elle Düzenlediği Özel Gerekçe')
    expect(parsed.ekstraNot).toBe('Acil satın alma gereklidir')
    expect(parsed.onayci).toBe('Harcama Yetkilisi')
  })

  it('Test 4 – Bağımsız güncelleme: Bir belgenin snapshot güncellenmesi diğerlerini etkilememeli', () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(275)

    const insert = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?)
    `)

    insert.run(275, 'luzum_muzekkeresi', JSON.stringify({ versiyon: 1 }))
    insert.run(275, 'ihtiyac_listesi', JSON.stringify({ versiyon: 1, kalemSayisi: 5 }))

    // Yalnızca luzum_muzekkeresi'ni güncelle
    db.prepare(`
      UPDATE DATA_TeminBelgeSnapshot
      SET veri_json = ?
      WHERE dosya_id = ? AND sablon_kodu = ?
    `).run(JSON.stringify({ versiyon: 2, guncellendi: true }), 275, 'luzum_muzekkeresi')

    const luzum = db.prepare('SELECT veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?')
      .get(275, 'luzum_muzekkeresi') as any
    const ihtiyac = db.prepare('SELECT veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?')
      .get(275, 'ihtiyac_listesi') as any

    expect(JSON.parse(luzum.veri_json).versiyon).toBe(2)
    expect(JSON.parse(ihtiyac.veri_json).versiyon).toBe(1)
    expect(JSON.parse(ihtiyac.veri_json).kalemSayisi).toBe(5)
  })

  it('Test 5 – Migration: DATA_DosyaSablonVeri tablosundan DATA_TeminBelgeSnapshot tablosuna veri aktarımı', () => {
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
    `)

    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(275)

    const sampleJson = JSON.stringify({
      kalemler: [{ id: 1, ad: 'Toner', adet: 10 }],
      toplamTutar: 25000
    })

    db.prepare(`
      INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, dosya_id, sablon_id, sablon_kodu, veri_json, sablon_versiyon, created_at, updated_at)
      VALUES (275, 275, 10, 'ihtiyac_listesi', ?, 1, '2026-10-30 10:00:00', '2026-10-30 12:00:00')
    `).run(sampleJson)

    // Transactional Migration
    const oldRows = db.prepare('SELECT * FROM DATA_DosyaSablonVeri ORDER BY updated_at DESC, id DESC').all() as any[]
    const insertSnapshot = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (
        dosya_id, sablon_id, sablon_kodu, veri_json, sablon_versiyon, created_at, updated_at, is_active, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(dosya_id, sablon_kodu) DO NOTHING
    `)

    const tx = db.transaction(() => {
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
    })
    tx()

    const migrated = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = 275').all() as any[]
    expect(migrated.length).toBe(1)
    expect(migrated[0].sablon_kodu).toBe('ihtiyac_listesi')
    expect(migrated[0].veri_json).toBe(sampleJson)
    expect(migrated[0].created_at).toBe('2026-10-30 10:00:00')
    expect(migrated[0].updated_at).toBe('2026-10-30 12:00:00')
  })

  it('Test 6 – IPC & Storage: Positional (sql, params) parametre iletimi ve hata yönetimi', async () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id, konu) VALUES (?, ?)').run(275, 'IPC Test')

    // db:query simülasyonu (standart positional parametre imzası: sql, params)
    const dbQuery = async (sql: string, params: any[] = []) => {
      try {
        const stmt = db.prepare(sql)
        const rows = stmt.all(...params)
        return { success: true, data: rows }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }

    // 1. Başarılı SELECT sorgusu
    const resSuccess = await dbQuery('SELECT id, konu FROM DATA_TeminDosyasi WHERE id = ?', [275])
    expect(resSuccess.success).toBe(true)
    expect(resSuccess.data).toEqual([{ id: 275, konu: 'IPC Test' }])

    // 2. Hatalı SQL sorgusu: Gerçek hata yukarı taşınmalı, sahte başarı dönmemeli!
    const resFail = await dbQuery('SELECT * FROM OLMAYAN_TABLO WHERE id = ?', [275])
    expect(resFail.success).toBe(false)
    expect(resFail.error).toContain('no such table: OLMAYAN_TABLO')
  })

  it('Test 7 – Reset: Bir belge sıfırlandığında yalnızca o snapshot etkilenmeli ve revizyona arşivlenmeli', () => {
    db.prepare('INSERT INTO DATA_TeminDosyasi (id) VALUES (?)').run(275)

    const insert = db.prepare(`
      INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json)
      VALUES (?, ?, ?)
    `)

    insert.run(275, 'luzum_muzekkeresi', JSON.stringify({ metin: 'Sıfırlanacak Lüzum Verisi' }))
    insert.run(275, 'ihtiyac_listesi', JSON.stringify({ metin: 'Dokunulmayacak İhtiyaç Listesi' }))

    // Reset akışı (belge:reset-document ile birebir aynı mantık)
    const resetDoc = (dosyaId: number, sablonKodu: string) => {
      const existing = db.prepare(
        'SELECT id, veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?'
      ).get(dosyaId, sablonKodu) as any

      if (existing) {
        db.prepare(`
          INSERT INTO DATA_DosyaRevizyon (temin_dosya_id, modul_adi, surec_kodu, belge_kodu, versiyon, baslik, veri_json)
          VALUES (?, 'BELGE_YONETIMI', 'USER_RESET', ?, 'v_reset', 'Varsayılana Dönüş Öncesi Kullanıcı Verisi', ?)
        `).run(dosyaId, sablonKodu, existing.veri_json)

        db.prepare(
          'DELETE FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?'
        ).run(dosyaId, sablonKodu)
      }
    }

    resetDoc(275, 'luzum_muzekkeresi')

    // 1. Luzum müzekkeresi snapshot'ı silinmiş olmalı
    const luzum = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?')
      .get(275, 'luzum_muzekkeresi')
    expect(luzum).toBeUndefined()

    // 2. İhtiyaç listesi dokunulmamış ve sağlam kalmalı
    const ihtiyac = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?')
      .get(275, 'ihtiyac_listesi') as any
    expect(ihtiyac).toBeDefined()
    expect(JSON.parse(ihtiyac.veri_json).metin).toBe('Dokunulmayacak İhtiyaç Listesi')

    // 3. Silinen veri DATA_DosyaRevizyon tablosuna başarıyla arşivlenmiş olmalı
    const revizyon = db.prepare('SELECT * FROM DATA_DosyaRevizyon WHERE temin_dosya_id = ? AND belge_kodu = ?')
      .get(275, 'luzum_muzekkeresi') as any
    expect(revizyon).toBeDefined()
    expect(JSON.parse(revizyon.veri_json).metin).toBe('Sıfırlanacak Lüzum Verisi')
  })
})
