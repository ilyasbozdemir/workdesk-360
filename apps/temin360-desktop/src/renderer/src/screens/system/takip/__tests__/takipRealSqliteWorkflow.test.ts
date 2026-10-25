// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'

describe('Gerçek SQLite ile Doğrudan Temin & Kanban İş Akışı Entegrasyon Testi', () => {
  let db: DatabaseSync

  beforeEach(() => {
    db = new DatabaseSync(':memory:')
    db.exec('PRAGMA foreign_keys = ON;')

    // Production şemasıyla birebir uyumlu DATA_TeminDosyasi tablosu
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_no TEXT NOT NULL,
        konu TEXT NOT NULL,
        tur TEXT DEFAULT 'mal',
        butce_yili INTEGER DEFAULT 2026,
        dosya_acilis_tarihi DATE DEFAULT CURRENT_DATE,
        yaklasik_maliyet REAL DEFAULT 0,
        yaklasik_maliyet_kdv_dahil_mi INTEGER DEFAULT 0,
        kdv TEXT DEFAULT '20',
        ihtiyac_yeri TEXT,
        teslim_gun INTEGER DEFAULT 7,
        irtibat_yetkilisi_id INTEGER,
        onay_personel_id INTEGER,
        birim_id INTEGER,
        birim TEXT,
        ihale_sekli TEXT DEFAULT '22/d*',
        ihale_tipi TEXT DEFAULT 'Doğrudan Temin',
        notlar TEXT,
        durum_asama_id INTEGER DEFAULT 1,
        status TEXT DEFAULT 'devam_ediyor',
        is_deleted INTEGER DEFAULT 0,
        komisyon_seed_edildi INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('1. Sihirbaz Akışı: Yeni dosya veritabanına Aşama 1 (Hazırlıkta) olarak atomik yazılır', () => {
    const insertStmt = db.prepare(`
      INSERT INTO DATA_TeminDosyasi (
        temin_no, konu, tur, butce_yili, yaklasik_maliyet, durum_asama_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertStmt.run(
      '2026/1',
      'Bilgisayar ve Sunucu Donanımı Temini',
      'mal',
      2026,
      120000.0,
      1,
      'devam_ediyor'
    )

    expect(Number(result.lastInsertRowid)).toBe(1)

    const row = db
      .prepare(
        'SELECT id, temin_no, konu, durum_asama_id, status FROM DATA_TeminDosyasi WHERE id = 1'
      )
      .get() as {
      id: number
      temin_no: string
      konu: string
      durum_asama_id: number
      status: string
    }

    expect(row).toBeDefined()
    expect(row.temin_no).toBe('2026/1')
    expect(row.durum_asama_id).toBe(1) // Hazırlıkta
    expect(row.status).toBe('devam_ediyor')
  })

  it('2. Kanban Sürükle-Bırak: Dosya aşaması 1 -> 2 -> 4 (Tamamlandı) olarak güncellenir', () => {
    // Önce dosya oluştur
    db.prepare(
      `
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu, durum_asama_id, status)
      VALUES (10, '2026/10', 'Büro Mobilyası Alımı', 1, 'devam_ediyor')
    `
    ).run()

    // 1 -> 2 (Teklif Toplanıyor)
    const updateStmt = db.prepare(`
      UPDATE DATA_TeminDosyasi
      SET durum_asama_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    updateStmt.run(2, 'devam_ediyor', 10)

    let row = db
      .prepare('SELECT durum_asama_id, status FROM DATA_TeminDosyasi WHERE id = 10')
      .get() as { durum_asama_id: number; status: string }
    expect(row.durum_asama_id).toBe(2)
    expect(row.status).toBe('devam_ediyor')

    // 2 -> 4 (Tamamlandı)
    updateStmt.run(4, 'tamamlandi', 10)

    row = db
      .prepare('SELECT durum_asama_id, status FROM DATA_TeminDosyasi WHERE id = 10')
      .get() as { durum_asama_id: number; status: string }
    expect(row.durum_asama_id).toBe(4)
    expect(row.status).toBe('tamamlandi')
  })

  it('3. Uygulama Yeniden Açılma (Persistence): Veritabanından taze okunduğunda son aşama ve durum korunur', () => {
    // Dosyayı oluşturup 3. Aşamaya (Onayda) taşıyoruz
    db.prepare(
      `
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu, durum_asama_id, status)
      VALUES (25, '2026/25', 'Park Bakım Hizmeti', 3, 'devam_ediyor')
    `
    ).run()

    // Uygulama kapandı / tekrar açıldı simülasyonu:
    // Takip ekranı açılışında çağrılan SELECT sorgusu:
    const freshQuery = db.prepare(`
      SELECT id, temin_no, konu, durum_asama_id, status, is_deleted
      FROM DATA_TeminDosyasi
      WHERE is_deleted = 0
      ORDER BY id DESC
    `)

    const activeList = freshQuery.all() as Array<{
      id: number
      temin_no: string
      durum_asama_id: number
      status: string
    }>

    expect(activeList.length).toBe(1)
    const openedDosya = activeList[0]
    expect(openedDosya.id).toBe(25)
    expect(openedDosya.temin_no).toBe('2026/25')
    expect(openedDosya.durum_asama_id).toBe(3) // Onayda aşamasında kalıcı korunmuş
    expect(openedDosya.status).toBe('devam_ediyor')
  })

  it('4. Hata ve Rollback: Güncelleme sırasında transaction başarısız olursa önceki aşama bozulmaz', () => {
    db.prepare(
      `
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu, durum_asama_id, status)
      VALUES (30, '2026/30', 'Kırtasiye Alımı', 1, 'devam_ediyor')
    `
    ).run()

    // Transaction başlatıp hata simülasyonu yapıyoruz
    db.exec('BEGIN TRANSACTION;')
    try {
      db.prepare(
        `
        UPDATE DATA_TeminDosyasi
        SET durum_asama_id = 4, status = 'tamamlandi'
        WHERE id = 30
      `
      ).run()

      // Hata tetikle (örnek: geçersiz SQL / constraint hatası)
      throw new Error('IPC Bağlantı veya Disk Hatası')
    } catch {
      db.exec('ROLLBACK;')
    }

    // Rollback sonrası durumun orijinal 1. Aşamada kaldığını doğrula
    const row = db
      .prepare('SELECT durum_asama_id, status FROM DATA_TeminDosyasi WHERE id = 30')
      .get() as { durum_asama_id: number; status: string }

    expect(row.durum_asama_id).toBe(1) // Rollback yapıldı, 1 kaldı
    expect(row.status).toBe('devam_ediyor')
  })
})
