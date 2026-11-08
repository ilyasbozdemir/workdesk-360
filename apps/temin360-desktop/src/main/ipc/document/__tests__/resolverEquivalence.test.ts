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
        birim_id INTEGER,
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

  it('Regresyon 1: resolveDocumentPayload veritabanı hatası durumunda resolveAllCiktiData sessizce {} ile devam etmemeli, anlamlı hata döndürmelidir', () => {
    const brokenDb = {
      prepare: (sql: string) => {
        if (sql.includes('DATA_TeminDosyasi')) {
          throw new Error('SQLite disk I/O failure in payload resolver')
        }
        return {
          all: () => [],
          get: () => null,
          run: () => {}
        }
      }
    }
    const ciktiRes = resolveAllCiktiData(brokenDb, { dosyaId: 1 })
    expect(ciktiRes.success).toBe(false)
    expect(ciktiRes.error).toContain('Belge çözümleme hatası')
    expect(ciktiRes.error).toContain('SQLite disk I/O failure in payload resolver')
  })

  it('Regresyon 2: Bulunamayan hedef sablonId talep edildiğinde açıklayıcı hata dönmelidir', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1, sablonId: 9999 })
    expect(ciktiRes.success).toBe(false)
    expect(ciktiRes.error).toContain('Hedef şablon veritabanında bulunamadı')
    expect(ciktiRes.error).toContain('9999')
  })

  it('Regresyon 3: Şablon içeriği boş olduğunda render hatası dönmelidir', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()
    db.prepare(`INSERT INTO TANIM_Sablon (id, kod, ad, html_icerik, aktif_mi) VALUES (50, 'bos_sablon', 'Boş Şablon', '', 1);`).run()

    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1, sablonId: 50 })
    expect(ciktiRes.success).toBe(false)
    expect(ciktiRes.error).toContain('Şablon içeriği boş')
  })

  it('Regresyon 4: Mustache render sırasında sözdizimi / ayrıştırma hatası olduğunda hata sessizce yutulmamalıdır', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()
    // Kapatılmamış Mustache bloğu: {{#kalemler}} (kapanış etiketi yok)
    db.prepare(`
      INSERT INTO TANIM_Sablon (id, kod, ad, html_icerik, aktif_mi) 
      VALUES (60, 'hatali_sablon', 'Hatalı Şablon', '<div>{{#kalemler}}<span>{{kalem_adi}}</div>', 1);
    `).run()

    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1, sablonId: 60 })
    expect(ciktiRes.success).toBe(false)
    expect(ciktiRes.error).toContain('Mustache render hatası')
  })

  it('Regresyon 5: documentId veya templateId ile çağrıldığında doğru şablon çözümlenmeli ve render edilmelidir', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()
    db.prepare(`INSERT INTO DATA_TeminDosyasi (id, temin_no, konu) VALUES (1, '2026/005', 'Laboratuvar Alımı');`).run()
    db.prepare(`
      INSERT INTO TANIM_Sablon (id, kod, ad, dosya_adi, route_path, html_icerik, aktif_mi) 
      VALUES (70, 'ihtiyac-listesi', 'İhtiyaç Listesi', 'ihtiyac-listesi.html', '/dosya/ihtiyac-listesi', '<h1>İşin Tanımı: {{{isin_tanimi}}} - Dosya: {{{dosya_no}}}</h1>', 1);
    `).run()

    // 1) documentId ile çağırma
    const resDoc = resolveAllCiktiData(db, { dosyaId: 1, documentId: 'ihtiyac-listesi' })
    expect(resDoc.success).toBe(true)
    expect(resDoc.data.sablons.length).toBe(1)
    expect(resDoc.data.sablons[0].id).toBe(70)
    expect(resDoc.data.renderedHtmlMap[70]).toContain('İşin Tanımı: Laboratuvar Alımı - Dosya: 2026/005')

    // 2) templateId ile çağırma
    const resTpl = resolveAllCiktiData(db, { dosyaId: 1, templateId: 'ihtiyac-listesi' })
    expect(resTpl.success).toBe(true)
    expect(resTpl.data.renderedHtmlMap[70]).toContain('İşin Tanımı: Laboratuvar Alımı - Dosya: 2026/005')
  })

  it('Regresyon 6: Geçersiz dosyaId (0 veya olmayan id) sorgulandığında güvenli varsayılanlar üretilmeli ve çökmemelidir', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()

    const resZero = resolveAllCiktiData(db, { dosyaId: 0 })
    expect(resZero.success).toBe(true)
    expect(resZero.data.dosyaContext.dosya_no).toBe('')
    expect(resZero.data.dosyaContext.id).toBe(0)
    expect(resZero.data.dosyaContext.firmalar).toEqual([])
    expect(resZero.data.dosyaContext.butce_yili).toBe(new Date().getFullYear().toString())

    const resNonExistent = resolveAllCiktiData(db, { dosyaId: 999999 })
    expect(resNonExistent.success).toBe(true)
    expect(resNonExistent.data.dosyaContext.id).toBe(0)
  })

  it('Regresyon 7: Önizleme (resolvedContext) ve Çıktı Merkezi (dosyaContext) veri alanları birebir uyumludur', () => {
    db.prepare(`INSERT INTO TANIM_Kurum (id, kurum_adi, is_active) VALUES (1, 'DEVLET HASTANESİ', 1);`).run()
    db.prepare(`INSERT INTO TANIM_Personel (id, ad_soyad, unvan, aktif_mi) VALUES (10, 'Dr. Mehmet AK', 'Başhekim', 1);`).run()
    db.prepare(`INSERT INTO TANIM_Personel (id, ad_soyad, unvan, aktif_mi) VALUES (11, 'Ali VELİ', 'Şef', 1);`).run()
    db.prepare(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, konu, butce_yili, onay_personel_id, hazirlayan_personel_id)
      VALUES (1, '2026/007', 'Genel Hizmet Alımı', '2026', 10, 11);
    `).run()

    const payloadRes = resolveDocumentPayload(db, { dosyaId: 1 })
    const ciktiRes = resolveAllCiktiData(db, { dosyaId: 1 })

    const resolved = payloadRes.data.resolvedContext
    const cikti = ciktiRes.data.dosyaContext

    // Çekirdek alanların eşdeğerliği
    expect(cikti.teminNo).toBe(resolved.teminNo)
    expect(cikti.dosya_no).toBe(resolved.teminNo)
    expect(cikti.isinTanimi).toBe(resolved.isinTanimi)
    expect(cikti.isin_tanimi).toBe(resolved.isinTanimi)
    expect(cikti.butceYili).toBe(resolved.butceYili)
    expect(cikti.butce_yili).toBe(resolved.butceYili)

    // Kurumsal antet ve kurum eşdeğerliği
    expect(cikti.kurumAdi).toBe(resolved.kurumAdi)
    expect(cikti.antet).toEqual(resolved.antet)

    // Personel ve imza blokları eşdeğerliği
    expect(cikti.harcamaYetkilisi.adSoyad).toBe(resolved.onaylayanPersonelAdi)
    expect(cikti.harcamaYetkilisi.unvan).toBe(resolved.onaylayanPersonelUnvan)
    expect(cikti.gerceklestirmeGorevlisi.adSoyad).toBe(resolved.hazirlayanPersonelAdi)
    expect(cikti.gerceklestirmeGorevlisi.unvan).toBe(resolved.hazirlayanPersonelUnvan)
  })
})
