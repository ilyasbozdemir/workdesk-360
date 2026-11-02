// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { repairFirmsInDb, repairFile } from '../../../../../../../scripts/repair-firms.mjs'
import { DatabaseSync } from 'node:sqlite'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('repairFirmsInDb & repairFile (Firma Eşleştirme ve Onarım Testi)', () => {
  let tmpDbPath: string
  let db: any

  beforeEach(() => {
    tmpDbPath = path.join(os.tmpdir(), `test-repair-firms-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
    db = new DatabaseSync(tmpDbPath)

    // Tabloları oluştur
    db.exec(`
      CREATE TABLE TANIM_Firma (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firma_kodu TEXT,
        unvan TEXT,
        vergi_no TEXT,
        telefon TEXT,
        email TEXT,
        adres TEXT,
        aktif_mi INTEGER DEFAULT 1
      );

      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_no TEXT,
        firma_id INTEGER
      );

      CREATE TABLE DATA_TeminFirma (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER,
        dosya_id INTEGER,
        firma_id INTEGER,
        unvan TEXT,
        vergi_no TEXT,
        telefon TEXT,
        email TEXT,
        kazandi_mi INTEGER DEFAULT 0,
        kazanan_mi INTEGER DEFAULT 0
      );
    `)
  })

  afterEach(() => {
    try {
      if (db && typeof db.close === 'function') db.close()
    } catch {}
    try {
      if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath)
    } catch {}
  })

  it('eşleşen firmaları TANIM_Firma ID si ile bağlamalı ve yeni firmaları havuza kaydetmeli', () => {
    // 1. Havuzda mevcut firma
    db.prepare(`
      INSERT INTO TANIM_Firma (firma_kodu, unvan, vergi_no)
      VALUES ('0001', 'Mega İnşaat Ltd. Şti.', '1234567890')
    `).run()

    // 2. Bir doğrudan temin dosyası
    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, dosya_no, firma_id)
      VALUES (10, '2026/01', NULL)
    `).run()

    // 3. Dosyaya metin olarak eklenmiş fakat firma_id = 0 veya NULL olan teklifler
    // A: unvan büyük/küçük harf ve boşluk farkı olan, VKN'si aynı olan kazanan firma
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, dosya_id, firma_id, unvan, vergi_no, kazandi_mi)
      VALUES (101, 10, 10, 0, '   mega i̇nşaat ltd. şti.   ', '1234567890', 1)
    `).run()

    // B: Havuzda hiç olmayan yeni firma
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, dosya_id, firma_id, unvan, vergi_no, kazandi_mi)
      VALUES (102, 10, 10, NULL, 'Anadolu Bilişim Teknolojileri', '9876543210', 0)
    `).run()

    // Onarım fonksiyonunu çalıştır
    const res = repairFirmsInDb(db, 'TestDB')

    expect(res.success).toBe(true)
    expect(res.matchedCount).toBe(1)
    expect(res.createdCount).toBe(1)
    expect(res.dossiersUpdated).toBe(1)

    // 101 nolu firma havuz ID 1'e bağlanmalı
    const firma101 = db.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 101').get()
    expect(firma101.firma_id).toBe(1)

    // 102 nolu firma yeni bir havuz ID'ye bağlanmalı
    const firma102 = db.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 102').get()
    expect(firma102.firma_id).toBeGreaterThan(1)

    // TANIM_Firma'da 'Anadolu Bilişim Teknolojileri' oluşmuş olmalı
    const yeniFirma = db.prepare('SELECT * FROM TANIM_Firma WHERE id = ?').get(firma102.firma_id)
    expect(yeniFirma).toBeDefined()
    expect(yeniFirma.unvan).toBe('Anadolu Bilişim Teknolojileri')
    expect(yeniFirma.vergi_no).toBe('9876543210')

    // DATA_TeminDosyasi kazanan firmanın ID'si (1) ile güncellenmiş olmalı
    const dosya = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = 10').get()
    expect(dosya.firma_id).toBe(1)
  })

  it('hiç yetim kayıt yoksa işlem yapmadan tamamlanmalı', () => {
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan) VALUES (1, '0001', 'Test')
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan) VALUES (1, 1, 1, 'Test')
    `).run()

    const res = repairFirmsInDb(db, 'CleanDB')
    expect(res.success).toBe(true)
    expect(res.matchedCount).toBe(0)
    expect(res.createdCount).toBe(0)
  })

  it('ZIP tabanlı .temin dosyasını açıp içindeki veritabanını onarmalı ve güncelleyerek paketlemeli', async () => {
    // 1. Havuz ve yetim kayıt içeren geçici bir db
    db.prepare(`
      INSERT INTO TANIM_Firma (firma_kodu, unvan, vergi_no)
      VALUES ('0001', 'Teknoloji A.Ş.', '1111111111')
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, dosya_no, firma_id)
      VALUES (5, '2026/05', NULL)
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, dosya_id, firma_id, unvan, vergi_no, kazandi_mi)
      VALUES (501, 5, 5, 0, 'Teknoloji A.Ş.', '1111111111', 1)
    `).run()
    db.close()
    db = null

    // 2. Bu sqlite dosyasını bir .temin (zip) arşivi içine koy
    const teminZipPath = path.join(os.tmpdir(), `test-proje-${Date.now()}.temin`)
    const zip = new AdmZip()
    zip.addLocalFile(tmpDbPath, '', 'database.sqlite')
    zip.addFile('meta.json', Buffer.from(JSON.stringify({ dtal_version: '1.0', updated_at: '2026-01-01' })))
    zip.writeZip(teminZipPath)

    try {
      // 3. repairFile ile .temin dosyasını onar
      const res = await repairFile(teminZipPath)
      expect(res.success).toBe(true)
      expect(res.matchedCount).toBe(1)
      expect(res.dossiersUpdated).toBe(1)

      // Güvenlik yedeği .bak oluşmuş olmalı
      expect(fs.existsSync(`${teminZipPath}.bak`)).toBe(true)

      // Güncellenmiş .temin dosyasını doğrula
      const updatedZip = new AdmZip(teminZipPath)
      const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-zip-'))
      updatedZip.extractAllTo(extractDir, true)

      const verifiedDb = new DatabaseSync(path.join(extractDir, 'database.sqlite'))
      const firma501 = verifiedDb.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 501').get() as any
      expect(firma501.firma_id).toBe(1)

      const dosya5 = verifiedDb.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = 5').get() as any
      expect(dosya5.firma_id).toBe(1)

      verifiedDb.close()
      fs.rmSync(extractDir, { recursive: true, force: true })
    } finally {
      try {
        if (fs.existsSync(teminZipPath)) fs.unlinkSync(teminZipPath)
        if (fs.existsSync(`${teminZipPath}.bak`)) fs.unlinkSync(`${teminZipPath}.bak`)
      } catch {}
    }
  })
})
