import { DatabaseSync } from 'node:sqlite'

/**
 * Sentetik Veritabanı Üretici (Synthetic Database Generator)
 * Hiçbir gerçek kişi/kurum bilgisi içermez.
 * 100, 1.000 ve 10.000 dosyalık benchmark verisi üretir.
 */
export function createSyntheticDatabase(options = {}) {
  const {
    fileCount = 100,
    itemsPerFile = 10,
    firmsPerFile = 3,
    withIndexes = false,
    dbPath = ':memory:'
  } = options

  const db = new DatabaseSync(dbPath)

  // 1. Şemayı oluştur
  db.exec(`
    PRAGMA foreign_keys = OFF;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS TANIM_Kurum (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kurum_adi TEXT,
      ust_kurum_adi TEXT,
      kurum_anteti TEXT,
      makam_adi TEXT,
      logo_sol TEXT,
      logo_sag TEXT,
      adres TEXT,
      telefon TEXT,
      eposta TEXT
    );

    CREATE TABLE IF NOT EXISTS TANIM_Birim (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad TEXT,
      birim_adi TEXT,
      kisa_ad TEXT,
      sunum_makami TEXT,
      antet_ek_satir TEXT,
      harcama_yetkilisi_id INTEGER,
      harcama_yetkilisi_unvan TEXT,
      aktif_mi INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS TANIM_Personel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_soyad TEXT,
      unvan TEXT,
      telefon TEXT,
      eposta TEXT,
      birim TEXT,
      birim_id INTEGER,
      sicil_no TEXT,
      aktif_mi INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS TANIM_Firma (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unvan TEXT,
      vergi_no TEXT,
      adres TEXT,
      telefon TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminDosyasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temin_no TEXT,
      dosya_no TEXT,
      konu TEXT NOT NULL,
      isin_aciklamasi TEXT,
      dosya_acilis_tarihi DATE,
      temin_tarihi DATE,
      butce_yili INTEGER DEFAULT 2026,
      birim_id INTEGER,
      birim TEXT,
      antet_ek_satir TEXT,
      sunulacak_makam TEXT,
      ihtiyac_yeri TEXT,
      ihale_sekli TEXT DEFAULT '22/d',
      tur TEXT DEFAULT 'Mal',
      alim_turu TEXT DEFAULT 'Mal Alımı',
      durum TEXT DEFAULT 'Aktif',
      yaklasik_maliyet REAL DEFAULT 0,
      hazirlayan_personel_id INTEGER,
      talep_eden_personel_id INTEGER,
      onay_personel_id INTEGER,
      harcama_yetkilisi_id INTEGER,
      harcama_yetkilisi_unvan TEXT
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminKalem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temin_dosya_id INTEGER NOT NULL,
      dosya_id INTEGER,
      sira_no INTEGER,
      tasinir_kodu TEXT,
      kalem_adi TEXT NOT NULL,
      aciklama TEXT,
      poz_no TEXT,
      poz_tanimi TEXT,
      hizmet_kodu TEXT,
      birim TEXT DEFAULT 'Adet',
      olcu_birimi TEXT DEFAULT 'Adet',
      miktar REAL DEFAULT 1,
      kdv_orani REAL DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminFirma (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temin_dosya_id INTEGER NOT NULL,
      dosya_id INTEGER,
      firma_id INTEGER NOT NULL,
      unvan TEXT NOT NULL,
      vergi_no TEXT,
      adres TEXT,
      telefon TEXT,
      email TEXT,
      teklif_toplami REAL
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminKalemTeklif (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temin_dosya_id INTEGER NOT NULL,
      dosya_id INTEGER,
      temin_kalem_id INTEGER NOT NULL,
      temin_firma_id INTEGER NOT NULL,
      birim_fiyat REAL DEFAULT 0,
      kdv_tutari REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminBelgeSnapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dosya_id INTEGER NOT NULL,
      temin_dosya_id INTEGER,
      sablon_id INTEGER,
      sablon_kodu TEXT NOT NULL,
      veri_json TEXT NOT NULL,
      sablon_versiyon INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS DATA_TeminKomisyon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temin_dosya_id INTEGER,
      gorev TEXT,
      ad_soyad TEXT
    );
  `)

  if (withIndexes) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_temin_kalem_dosya ON DATA_TeminKalem(temin_dosya_id);
      CREATE INDEX IF NOT EXISTS idx_temin_firma_dosya ON DATA_TeminFirma(temin_dosya_id);
      CREATE INDEX IF NOT EXISTS idx_temin_teklif_dosya ON DATA_TeminKalemTeklif(temin_dosya_id);
      CREATE INDEX IF NOT EXISTS idx_temin_teklif_kalem ON DATA_TeminKalemTeklif(temin_kalem_id);
      CREATE INDEX IF NOT EXISTS idx_temin_snapshot_dosya_sablon ON DATA_TeminBelgeSnapshot(dosya_id, sablon_kodu);
      CREATE INDEX IF NOT EXISTS idx_temin_dosyasi_tarih ON DATA_TeminDosyasi(dosya_acilis_tarihi);
      CREATE INDEX IF NOT EXISTS idx_temin_dosyasi_durum ON DATA_TeminDosyasi(durum);
    `)
  }

  // 2. Temel Kurum, Birim ve Personel Kayıtları
  db.exec(`
    INSERT INTO settings (key, value) VALUES ('institutionName', 'Örnek İl Sağlık Müdürlüğü');
    INSERT INTO settings (key, value) VALUES ('logoLeft', 'data:image/png;base64,sampleLeftLogo');
    INSERT INTO settings (key, value) VALUES ('logoRight', 'data:image/png;base64,sampleRightLogo');

    INSERT INTO TANIM_Kurum (id, kurum_adi, ust_kurum_adi, kurum_anteti, makam_adi, adres, telefon, eposta)
    VALUES (1, 'Örnek Valiliği', 'T.C. İÇİŞLERİ BAKANLIĞI', '["T.C.", "ÖRNEK VALİLİĞİ", "İl Sağlık Müdürlüğü"]', 'VALİLİK MAKAMINA', 'Merkez Mah. Hükümet Konağı', '0312 000 00 00', 'iletisim@ornek.gov.tr');

    INSERT INTO TANIM_Birim (id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan)
    VALUES (1, 'Destek Hizmetleri', 'Destek Hizmetleri Şube Müdürlüğü', 'Destek', 'ŞUBE MÜDÜRLÜĞÜ MAKAMINA', 'Destek Hizmetleri Şube Müdürlüğü', 1, 'Şube Müdürü');

    INSERT INTO TANIM_Birim (id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan)
    VALUES (2, 'Bilgi İşlem', 'Bilgi İşlem Şube Müdürlüğü', 'Bilgi İşlem', 'ŞUBE MÜDÜRLÜĞÜ MAKAMINA', 'Bilgi İşlem Şube Müdürlüğü', 2, 'Şube Müdürü');

    INSERT INTO TANIM_Personel (id, ad_soyad, unvan, telefon, eposta, birim_id, aktif_mi)
    VALUES (1, 'Ahmet YILMAZ', 'Şube Müdürü', '0312 111 00 01', 'ahmet.yilmaz@ornek.gov.tr', 1, 1);

    INSERT INTO TANIM_Personel (id, ad_soyad, unvan, telefon, eposta, birim_id, aktif_mi)
    VALUES (2, 'Mehmet DEMİR', 'Bilgisayar Mühendisi', '0312 111 00 02', 'mehmet.demir@ornek.gov.tr', 2, 1);

    INSERT INTO TANIM_Personel (id, ad_soyad, unvan, telefon, eposta, birim_id, aktif_mi)
    VALUES (3, 'Ayşe KAYA', 'VHKİ', '0312 111 00 03', 'ayse.kaya@ornek.gov.tr', 1, 1);

    INSERT INTO TANIM_Personel (id, ad_soyad, unvan, telefon, eposta, birim_id, aktif_mi)
    VALUES (4, 'Fatma ÇELİK', 'Memur', '0312 111 00 04', 'fatma.celik@ornek.gov.tr', 2, 1);

    INSERT INTO TANIM_Firma (id, unvan, vergi_no, adres, telefon, email)
    VALUES (1, 'Alfa Bilişim Ltd. Şti.', '1234567890', 'Ankara', '0312 222 00 01', 'info@alfabilisim.com');

    INSERT INTO TANIM_Firma (id, unvan, vergi_no, adres, telefon, email)
    VALUES (2, 'Beta Kırtasiye A.Ş.', '2345678901', 'İstanbul', '0212 222 00 02', 'info@betakirtasiye.com');

    INSERT INTO TANIM_Firma (id, unvan, vergi_no, adres, telefon, email)
    VALUES (3, 'Gama Medikal Tic.', '3456789012', 'İzmir', '0232 222 00 03', 'info@gamamedikal.com');
  `)

  // 3. Sentetik Temin Dosyaları ve Kalemleri Toplu Olarak Ekle
  db.exec('BEGIN TRANSACTION;')

  const insertDosya = db.prepare(`
    INSERT INTO DATA_TeminDosyasi (
      temin_no, dosya_no, konu, isin_aciklamasi, dosya_acilis_tarihi, temin_tarihi,
      birim_id, birim, antet_ek_satir, sunulacak_makam, ihtiyac_yeri, ihale_sekli, tur, alim_turu,
      hazirlayan_personel_id, talep_eden_personel_id, onay_personel_id, harcama_yetkilisi_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertKalem = db.prepare(`
    INSERT INTO DATA_TeminKalem (
      temin_dosya_id, dosya_id, sira_no, tasinir_kodu, kalem_adi, aciklama, poz_no, hizmet_kodu, birim, miktar, kdv_orani
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertFirma = db.prepare(`
    INSERT INTO DATA_TeminFirma (
      temin_dosya_id, dosya_id, firma_id, unvan, vergi_no
    ) VALUES (?, ?, ?, ?, ?)
  `)

  const insertTeklif = db.prepare(`
    INSERT INTO DATA_TeminKalemTeklif (
      temin_dosya_id, dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat, kdv_tutari
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertSnapshot = db.prepare(`
    INSERT INTO DATA_TeminBelgeSnapshot (
      dosya_id, temin_dosya_id, sablon_kodu, veri_json, sablon_versiyon
    ) VALUES (?, ?, ?, ?, 1)
  `)

  const itemNames = [
    'A4 Fotokopi Kağıdı', 'Toner Kartuş', 'Masaüstü Bilgisayar', 'Lazer Yazıcı',
    'Arşiv Kolisi', 'Plastik Klasör', 'Tükenmez Kalem', 'Zımba Teli',
    'Temizlik Maddesi', 'Dezenfektan', 'Yazılım Lisansı', 'Sunucu Bakım Onarımı',
    'Boya Badana İşçiliği', 'Kapı Kolu Değişimi', 'Elektrik Tesisat Bakımı'
  ]

  let kalemIdSeq = 1
  let teminFirmaIdSeq = 1

  for (let i = 1; i <= fileCount; i++) {
    const pad = String(i).padStart(4, '0')
    const teminNo = `2026/DT-${pad}`
    const dosyaNo = `2026-${pad}`
    const konu = `Birim İhtiyacı İçin ${itemNames[i % itemNames.length]} Temini - Dosya ${i}`
    const isinAciklamasi = `Kurumumuz 2026 mali yılı ihtiyaçları kapsamında ${konu} doğrudan temin usulü ile karşılanacaktır.`
    const tarih = '2026-10-15'
    const birimId = (i % 2) + 1
    const tur = i % 4 === 0 ? 'Yapım' : i % 3 === 0 ? 'Hizmet' : 'Mal'
    const alimTuru = `${tur} Alımı`

    insertDosya.run(
      teminNo, dosyaNo, konu, isinAciklamasi, tarih, tarih,
      birimId, 'Destek Hizmetleri', 'Destek Hizmetleri Şube Müdürlüğü',
      'İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA', 'Merkez Binası', '22/d', tur, alimTuru,
      3, 3, 1, 1
    )

    const dosyaId = i

    // Firmalar
    const createdFirmaIds = []
    for (let f = 1; f <= firmsPerFile; f++) {
      const fId = teminFirmaIdSeq++
      insertFirma.run(dosyaId, dosyaId, f, `İstekli Firma ${f}`, `100000000${f}`)
      createdFirmaIds.push(fId)
    }

    // Kalemler
    const createdKalemIds = []
    for (let k = 1; k <= itemsPerFile; k++) {
      const kId = kalemIdSeq++
      const kName = itemNames[(i + k) % itemNames.length]
      const pozNo = tur === 'Yapım' ? `23.${String(k).padStart(3, '0')}` : null
      const tasinir = tur === 'Mal' ? `150.01.${String(k).padStart(2, '0')}` : null

      insertKalem.run(
        dosyaId, dosyaId, k, tasinir, kName, `${kName} standart teknik şartnamesine uygun`,
        pozNo, null, 'Adet', k * 10, 20
      )
      createdKalemIds.push(kId)

      // Kalem Teklifleri
      for (const firmId of createdFirmaIds) {
        const basePrice = 50 + (k * 15) + (firmId * 5)
        insertTeklif.run(dosyaId, dosyaId, kId, firmId, basePrice, basePrice * 0.20)
      }
    }

    // Snapshot (ilk 50 dosyaya hazır snapshot yerleştir)
    if (i <= 50) {
      const mockSnapshot = JSON.stringify({
        dosyaNo,
        konu,
        tarih,
        sunulacakMakamAdi: 'İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA',
        ihtiyacKalemleri: Array.from({ length: itemsPerFile }).map((_, idx) => ({
          siraNo: idx + 1,
          malzemeAdi: itemNames[(i + idx) % itemNames.length],
          miktar: (idx + 1) * 10,
          birimi: 'Adet',
          kdvOrani: 20
        }))
      })
      insertSnapshot.run(dosyaId, dosyaId, 'ihtiyac_listesi', mockSnapshot)
      insertSnapshot.run(dosyaId, dosyaId, 'ihtiyac_talep_formu', mockSnapshot)
    }
  }

  db.exec('COMMIT;')

  return db
}

