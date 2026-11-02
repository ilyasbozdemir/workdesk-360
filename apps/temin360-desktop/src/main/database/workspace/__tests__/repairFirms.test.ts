// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { repairFirmsInDb, repairFile } from '../../../../../../../scripts/repair-firms.mjs'
import { DatabaseSync } from 'node:sqlite'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('repairFirmsInDb & repairFile (Mükerrer Birleştirme ve Onarım Testleri)', () => {
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

  it('GÖKŞEN ve GÜL TES YAPI gibi taslak kartları ana havuza birleştirmeli ve teklifleri aktarmalı', () => {
    // 1. Ana havuz firmaları
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no, telefon)
      VALUES (26, '0026', 'GÖKŞEN MÜHENDİSLİK MÜŞAVİRLİK İNŞAAT TAAHHÜT SANAYİ TİCARET LTD.ŞTİ', '4050312325', '03323534574')
    `).run()
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no, telefon)
      VALUES (28, '0028', 'GÜLTES YAPI ENERJİ SİS KAL.DOĞ SU.SAN TİÇ.LTD.ŞTİ', '4230463658', '03382124040')
    `).run()

    // 2. Doğrudan temin dosyaları
    db.prepare(`INSERT INTO DATA_TeminDosyasi (id, dosya_no, firma_id) VALUES (1, '2026/01', 62)`).run()
    db.prepare(`INSERT INTO DATA_TeminDosyasi (id, dosya_no, firma_id) VALUES (2, '2026/02', 67)`).run()

    // 3. Taslak kartlara bağlı teklifler
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no, telefon)
      VALUES (62, NULL, 'GÖKŞEN', NULL, '03323534574 · 03323534574')
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan, kazandi_mi)
      VALUES (101, 1, 62, 'GÖKŞEN', 1)
    `).run()

    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no, telefon)
      VALUES (67, NULL, 'GÜL TES YAPI', NULL, '03382124040')
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan, kazandi_mi)
      VALUES (102, 2, 67, 'GÜL TES YAPI', 1)
    `).run()

    // 4. Bağımsız taslak firma (havuzda eşi olmayan)
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no, telefon)
      VALUES (80, NULL, 'Yeni Bağımsız Firma Ltd.', '9999999999', '05551234567')
    `).run()

    // Onarım ve birleştirme çalıştır
    const res = repairFirmsInDb(db, 'TestDB')

    expect(res.success).toBe(true)
    expect(res.mergedStubCount).toBe(2)
    expect(res.assignedCodesCount).toBe(1)
    expect(res.dossiersUpdated).toBe(2)

    // Taslak ID 62 ve 67 TANIM_Firma'dan silinmiş olmalı
    const deleted62 = db.prepare('SELECT * FROM TANIM_Firma WHERE id = 62').get()
    const deleted67 = db.prepare('SELECT * FROM TANIM_Firma WHERE id = 67').get()
    expect(deleted62).toBeUndefined()
    expect(deleted67).toBeUndefined()

    // Teklif 101 -> Master ID 26'ya bağlanmış olmalı
    const firma101 = db.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 101').get()
    expect(firma101.firma_id).toBe(26)
    expect(firma101.unvan).toBe('GÖKŞEN MÜHENDİSLİK MÜŞAVİRLİK İNŞAAT TAAHHÜT SANAYİ TİCARET LTD.ŞTİ')

    // Teklif 102 -> Master ID 28'e bağlanmış olmalı
    const firma102 = db.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 102').get()
    expect(firma102.firma_id).toBe(28)

    // Dosya kazananları da master ID'lere güncellenmiş olmalı
    const dosya1 = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = 1').get()
    const dosya2 = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = 2').get()
    expect(dosya1.firma_id).toBe(26)
    expect(dosya2.firma_id).toBe(28)

    // Bağımsız taslak firmaya sıralı kod atanmış olmalı (en büyük 28 idi -> 0029)
    const firma80 = db.prepare('SELECT * FROM TANIM_Firma WHERE id = 80').get()
    expect(firma80.firma_kodu).toBe('0029')
  })

  it('ZIP tabanlı .temin dosyasında mükerrerleri temizleyip arşivi güncellemeli', async () => {
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan, vergi_no)
      VALUES (1, '0001', 'DENİZ REKLAM ÜRÜNLERİ SAN. TİC.', '1234567890')
    `).run()
    db.prepare(`
      INSERT INTO TANIM_Firma (id, firma_kodu, unvan)
      VALUES (2, NULL, 'DENİZ REKLAM ÜRÜNLERİ')
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan)
      VALUES (10, 1, 2, 'DENİZ REKLAM ÜRÜNLERİ')
    `).run()
    db.close()
    db = null

    const teminZipPath = path.join(os.tmpdir(), `test-zip-proje-${Date.now()}.temin`)
    const zip = new AdmZip()
    zip.addLocalFile(tmpDbPath, '', 'database.sqlite')
    zip.addFile('meta.json', Buffer.from(JSON.stringify({ dtal_version: '1.0' })))
    zip.writeZip(teminZipPath)

    try {
      const res = await repairFile(teminZipPath)
      expect(res.success).toBe(true)
      expect(res.mergedStubCount).toBe(1)

      const updatedZip = new AdmZip(teminZipPath)
      const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-zip-'))
      updatedZip.extractAllTo(extractDir, true)

      const verifiedDb = new DatabaseSync(path.join(extractDir, 'database.sqlite'))
      const tf = verifiedDb.prepare('SELECT * FROM DATA_TeminFirma WHERE id = 10').get() as any
      expect(tf.firma_id).toBe(1)

      const stub = verifiedDb.prepare('SELECT * FROM TANIM_Firma WHERE id = 2').get()
      expect(stub).toBeUndefined()

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
