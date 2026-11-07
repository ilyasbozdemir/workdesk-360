// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { resolveDocumentPayload } from '../documentContextResolver'
import { resolveAllCiktiData } from '../documentCiktiResolver'

function createTestDb(): any {
  const rawDb = new DatabaseSync(':memory:')
  return {
    exec: (sql: string) => rawDb.exec(sql),
    prepare: (sql: string) => {
      const stmt = rawDb.prepare(sql)
      return {
        run: (...args: any[]) => stmt.run(...args),
        get: (...args: any[]) => stmt.get(...args),
        all: (...args: any[]) => stmt.all(...args)
      }
    }
  }
}

describe('Split-Brain Resolver Equivalence Tests (Phase 1)', () => {
  let db: any

  beforeEach(() => {
    db = createTestDb()

    // Create minimal schema
    db.exec(`
      CREATE TABLE TANIM_Kurum (
        id INTEGER PRIMARY KEY,
        ad TEXT,
        kurum_adi TEXT,
        ust_kurum_adi TEXT,
        kurum_anteti TEXT,
        logo_sol TEXT,
        logo_sag TEXT,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE TANIM_Birim (
        id INTEGER PRIMARY KEY,
        ad TEXT,
        birim_adi TEXT,
        kisa_ad TEXT,
        sunum_makami TEXT,
        antet_ek_satir TEXT,
        ihtiyac_yeri_eki TEXT,
        harcama_yetkilisi_id INTEGER,
        harcama_yetkilisi_unvan TEXT,
        gerceklestirme_gorevlisi_id INTEGER,
        gerceklestirme_gorevlisi_unvan TEXT,
        ilgili_personel_id INTEGER,
        aktif_mi INTEGER DEFAULT 1,
        harcama_kodu TEXT,
        muhasebe_kodu TEXT,
        detsis_kodu TEXT
      );

      CREATE TABLE TANIM_Personel (
        id INTEGER PRIMARY KEY,
        ad_soyad TEXT,
        unvan TEXT,
        telefon TEXT,
        eposta TEXT,
        birim TEXT,
        sicil_no TEXT,
        aktif_mi INTEGER DEFAULT 1
      );

      CREATE TABLE TANIM_Firma (
        id INTEGER PRIMARY KEY,
        unvan TEXT,
        ilgili_adi TEXT,
        telefon TEXT,
        email TEXT,
        adres TEXT,
        vergi_no TEXT,
        vergi_dairesi TEXT,
        aktif_mi INTEGER DEFAULT 1
      );

      CREATE TABLE TANIM_Sablon (
        id INTEGER PRIMARY KEY,
        kod TEXT,
        ad TEXT,
        dosya_adi TEXT,
        route_path TEXT,
        kategori TEXT,
        html_icerik TEXT,
        aktif_mi INTEGER DEFAULT 1,
        parent_id INTEGER
      );

      CREATE TABLE TANIM_Placeholder (
        id INTEGER PRIMARY KEY,
        key TEXT,
        label TEXT
      );

      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY,
        temin_no TEXT,
        konu TEXT,
        isin_aciklamasi TEXT,
        dosya_acilis_tarihi TEXT,
        tarih TEXT,
        created_at TEXT,
        birim_id INTEGER,
        firma_id INTEGER,
        onay_personel_id INTEGER,
        hazirlayan_personel_id INTEGER,
        butce_yili TEXT,
        evrak_sayisi TEXT,
        karar_no TEXT,
        fatura_no TEXT,
        fatura_tarihi TEXT,
        irsaliye_no TEXT,
        irsaliye_tarihi TEXT,
        tutanak_no TEXT,
        tutanak_tarihi TEXT,
        yaklasik_maliyet REAL,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE DATA_TeminKalem (
        id INTEGER PRIMARY KEY,
        temin_dosya_id INTEGER,
        kalem_adi TEXT,
        aciklama TEXT,
        birim TEXT,
        miktar REAL,
        tasinir_kodu TEXT,
        kdv_orani REAL
      );

      CREATE TABLE DATA_TeminFirma (
        id INTEGER PRIMARY KEY,
        temin_dosya_id INTEGER,
        firma_id INTEGER,
        unvan TEXT,
        ilgili_kisi TEXT,
        telefon TEXT,
        email TEXT
      );

      CREATE TABLE DATA_TeminKalemTeklif (
        id INTEGER PRIMARY KEY,
        temin_dosya_id INTEGER,
        temin_kalem_id INTEGER,
        temin_firma_id INTEGER,
        birim_fiyat REAL
      );

      CREATE TABLE DATA_TeminKomisyon (
        id INTEGER PRIMARY KEY,
        temin_dosya_id INTEGER,
        komisyon_id INTEGER,
        personel_id INTEGER,
        ad_soyad TEXT,
        unvan TEXT,
        gorev TEXT,
        rol TEXT
      );

      CREATE TABLE TANIM_Komisyon (
        id INTEGER PRIMARY KEY,
        kod TEXT,
        ad TEXT
      );

      CREATE TABLE DATA_TeminBelgeSnapshot (
        id INTEGER PRIMARY KEY,
        dosya_id INTEGER,
        sablon_kodu TEXT,
        sablon_id INTEGER,
        veri_json TEXT,
        updated_at TEXT,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)
  })

  it('Tekil Otorite: resolveDocumentPayload ve resolveAllCiktiData aynı kurum ve antet satırlarını çözümler', () => {
    // Kurum ve Birim ekle
    db.prepare(`
      INSERT INTO TANIM_Kurum (id, kurum_adi, ust_kurum_adi, kurum_anteti, is_active)
      VALUES (1, 'ANKARA İL SAĞLIK MÜDÜRLÜĞÜ', 'T.C. SAĞLIK BAKANLIĞI', '["T.C.", "SAĞLIK BAKANLIĞI", "ANKARA İL SAĞLIK MÜDÜRLÜĞÜ"]', 1)
    `).run()

    db.prepare(`
      INSERT INTO TANIM_Birim (id, birim_adi, antet_ek_satir, aktif_mi)
      VALUES (1, 'Destek Hizmetleri Başkanlığı', 'Destek Hizmetleri Şube Müdürlüğü', 1)
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu, birim_id, dosya_acilis_tarihi)
      VALUES (1, '2026/001', 'Tıbbi Cihaz Alımı', 1, '2026-03-15')
    `).run()

    const payloadRes = resolveDocumentPayload(db, { dosyaId: 1, documentId: 'ihtiyac-listesi' })
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1, documentId: 'ihtiyac-listesi' })

    expect(payloadRes.success).toBe(true)
    expect(ciktiRes.success).toBe(true)

    // Kurum Adı Eşdeğerliği
    expect(ciktiRes.data.dosyaContext.kurumAdi).toBe(payloadRes.data.resolvedContext.kurumAdi)
    expect(ciktiRes.data.dosyaContext.kurumAdi).toBe('ANKARA İL SAĞLIK MÜDÜRLÜĞÜ')

    // Antet Satırları Eşdeğerliği
    expect(ciktiRes.data.dosyaContext.antetSatirlari).toEqual(payloadRes.data.resolvedContext.antetSatirlari)
    expect(ciktiRes.data.dosyaContext.antetSatirlari).toContain('Destek Hizmetleri Şube Müdürlüğü')
  })

  it('Split-Brain Önleme: Çoklu kurumda activeKurumId otoritesi her iki resolver için de geçerlidir', () => {
    // 1 numaralı kurum pasif, 2 numaralı kurum aktif
    db.prepare(`
      INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'ESKİ PASİF KURUM', 0);
    `).run()
    db.prepare(`
      INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (2, 'GÜNCEL AKTİF KURUM', 1);
    `).run()

    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('activeKurumId', '2');
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu) VALUES (1, '2026/002', 'Bilişim Alımı');
    `).run()

    const payloadRes = resolveDocumentPayload(db, { dosyaId: 1 })
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1 })

    // Her iki resolver da "LIMIT 1" ile yanlışlıkla 1 numaralı kurumu almamalı, 2 numaralı aktif kurumu almalı
    expect(payloadRes.data.kurum.id).toBe(2)
    expect(payloadRes.data.resolvedContext.kurumAdi).toBe('GÜNCEL AKTİF KURUM')
    expect(ciktiRes.data.dosyaContext.kurumAdi).toBe('GÜNCEL AKTİF KURUM')
  })

  it('Veri Bütünlüğü: Kalemler, Teklifler ve Kazanan Firma iki resolver arasında birebir eşleşir', () => {
    db.prepare(`
      INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu) VALUES (1, '2026/003', 'Kırtasiye Alımı');
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminKalem (id, temin_dosya_id, kalem_adi, birim, miktar, kdv_orani)
      VALUES (101, 1, 'A4 Fotokopi Kağıdı', 'Koli', 10, 20);
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, unvan) VALUES (1, 1, 'Firma A');
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, unvan) VALUES (2, 1, 'Firma B');
    `).run()

    // Firma A: 100 TL, Firma B: 80 TL (Firma B en düşük teklif)
    db.prepare(`
      INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat)
      VALUES (1, 101, 1, 100);
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat)
      VALUES (1, 101, 2, 80);
    `).run()

    const payloadRes = resolveDocumentPayload(db, { dosyaId: 1 })
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1 })

    // Kazanan Firma Eşdeğerliği
    expect(payloadRes.data.resolvedContext.kazananFirma.unvan).toBe('Firma B')
    expect(ciktiRes.data.dosyaContext.kazananFirma.unvan).toBe('Firma B')

    // Kalem sayısı ve genel toplam eşdeğerliği
    expect(ciktiRes.data.dosyaContext.kalemler.length).toBe(payloadRes.data.resolvedContext.kalemler.length)
    expect(ciktiRes.data.dosyaContext.genelToplam).toBe(payloadRes.data.resolvedContext.genelToplam)
  })

  it('Komisyon ve İmza Yetkilileri Eşdeğerliği', () => {
    db.prepare(`
      INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu) VALUES (1, '2026/004', 'Medikal Gaz Alımı');
    `).run()

    db.prepare(`
      INSERT INTO TANIM_Komisyon (id, kod, ad) VALUES (1, 'piyasa_fiyat', 'Piyasa Fiyat Araştırma Komisyonu');
    `).run()
    db.prepare(`
      INSERT INTO TANIM_Komisyon (id, kod, ad) VALUES (2, 'muayene_kabul', 'Muayene ve Kabul Komisyonu');
    `).run()

    db.prepare(`
      INSERT INTO DATA_TeminKomisyon (id, temin_dosya_id, komisyon_id, ad_soyad, unvan, gorev)
      VALUES (1, 1, 1, 'Ahmet YILMAZ', 'Mühendis', 'Üye');
    `).run()
    db.prepare(`
      INSERT INTO DATA_TeminKomisyon (id, temin_dosya_id, komisyon_id, ad_soyad, unvan, gorev)
      VALUES (2, 1, 2, 'Ayşe DEMİR', 'Tabip', 'Başkan');
    `).run()

    const payloadRes = resolveDocumentPayload(db, { dosyaId: 1 })
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1 })

    expect(payloadRes.data.resolvedContext.fiyatKomisyonu[0].adSoyad).toBe('Ahmet YILMAZ')
    expect(ciktiRes.data.dosyaContext.fiyatKomisyonu[0].adSoyad).toBe('Ahmet YILMAZ')

    expect(payloadRes.data.resolvedContext.muayeneKomisyonu[0].adSoyad).toBe('Ayşe DEMİR')
    expect(ciktiRes.data.dosyaContext.muayeneKomisyonu[0].adSoyad).toBe('Ayşe DEMİR')
  })
})
