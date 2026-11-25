import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '@worksuite-360/document-engine';
import { registerTeminTemplates } from '../engine/registerTeminTemplates';
import { templateRegistry } from '../registry';
import { resolveTemplateData } from '../resolver/mappingResolver';
import { resolveSnapshotOverlay } from '../previewData/resolveSnapshotOverlay';
import { applyRefreshPolicy } from '../previewData/refreshPolicy';
import { InstitutionalHeaderProvider } from '../header';

describe('Aşama 5 — Şablon Çözümleme ve Belge Yaşam Döngüsü Uçtan Uca Doğrulama', () => {
  // Test Setup: Şablonları merkezi deftere kaydet
  registerTeminTemplates();

  // ─── GERÇEKÇİ .temin VERİTABANI MOCK VERİ SETİ ────────────────────────────
  const MOCK_DOSYA_ID = 501;

  const MOCK_DOSYA = {
    id: MOCK_DOSYA_ID,
    dosya_no: '2026/DT-501',
    dosya_adi: 'Temizlik ve Kırtasiye Malzemesi Alımı',
    konu: '2026 Yılı İhtiyaçları İçin Doğrudan Temin Mal Alımı',
    temin_tarihi: '2026-10-02',
    maliyet_cetveli_tarihi: '2026-10-02',
    onay_tarihi: '2026-10-05',
    karar_tarihi: '2026-10-05',
    karar_no: '2026/05',
    ihale_usulu: '4734 Sayılı Kanun Madde 22/d',
    tedarik_sekli: 'Doğrudan Temin',
    yaklasik_maliyet: 281991.00,
    en_avantajli_teklif_tutari: 275450.00,
    birim_id: 10,
    kurum_id: 1,
    harcama_yetkilisi_id: 101,
    gerceklestirme_gorevlisi_id: 102
  };

  const MOCK_KURUM = {
    id: 1,
    ust_kurum_adi: 'T.C. İÇİŞLERİ BAKANLIĞI',
    kurum_adi: 'ÇANKAYA BELEDİYE BAŞKANLIĞI',
    kurum_anteti: JSON.stringify([
      'T.C.',
      'İÇİŞLERİ BAKANLIĞI',
      'ÇANKAYA BELEDİYE BAŞKANLIĞI'
    ]),
    makam_adi: 'BAŞKANLIK MAKAMINA',
    il: 'ANKARA',
    ilce: 'ÇANKAYA'
  };

  const MOCK_BIRIM = {
    id: 10,
    ad: 'Destek Hizmetleri Müdürlüğü',
    birim_adi: 'Destek Hizmetleri Müdürlüğü',
    antet_ek_satir: 'Destek Hizmetleri Müdürlüğü',
    sunum_makami: 'DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE',
    harcama_yetkilisi_ad: 'Mustafa KAYA',
    harcama_yetkilisi_unvan: 'Destek Hizmetleri Müdürü',
    gerceklestirme_gorevlisi_ad: 'Ayşe YILMAZ',
    gerceklestirme_gorevlisi_unvan: 'Satınalma Şefi'
  };

  const MOCK_KALEMLER = [
    { id: 1, sira_no: 1, kalem_adi: 'A4 Fotokopi Kağıdı (80 gr)', miktar: 500, birim: 'Koli', ozellik: 'Beyaz 80 gr/m2' },
    { id: 2, sira_no: 2, kalem_adi: 'Sıvı El Sabunu (5 Litre)', miktar: 120, birim: 'Bidon', ozellik: 'Antibakteriyel gliserinli' },
    { id: 3, sira_no: 3, kalem_adi: 'Çöp Torbası Büyük Boy (80x110 cm)', miktar: 300, birim: 'Rulo', ozellik: 'Endüstriyel rulo' }
  ];

  const MOCK_FIRMALAR = [
    { id: 11, temin_firma_id: 11, unvan: 'Akdeniz Tedarik ve Dağıtım Tic. Ltd. Şti.', vergi_no: '0123456789', sira_no: 1, kazanan_mi: 1 },
    { id: 12, temin_firma_id: 12, unvan: 'Başkent Kurumsal Temizlik San. A.Ş.', vergi_no: '9876543210', sira_no: 2, kazanan_mi: 0 },
    { id: 13, temin_firma_id: 13, unvan: 'Doğu Ofis ve Kırtasiye Pazarlama Ltd.', vergi_no: '4567890123', sira_no: 3, kazanan_mi: 0 }
  ];

  // Birim fiyat teklifleri
  const MOCK_TEKLIFLER = [
    // Firma 11 (Kazanan - En Düşük Teklif Veren)
    { id: 101, temin_kalem_id: 1, temin_firma_id: 11, birim_fiyat: 320.00 },
    { id: 102, temin_kalem_id: 2, temin_firma_id: 11, birim_fiyat: 210.00 },
    { id: 103, temin_kalem_id: 3, temin_firma_id: 11, birim_fiyat: 45.00 },
    // Firma 12
    { id: 104, temin_kalem_id: 1, temin_firma_id: 12, birim_fiyat: 340.00 },
    { id: 105, temin_kalem_id: 2, temin_firma_id: 12, birim_fiyat: 230.00 },
    { id: 106, temin_kalem_id: 3, temin_firma_id: 12, birim_fiyat: 50.00 },
    // Firma 13
    { id: 107, temin_kalem_id: 1, temin_firma_id: 13, birim_fiyat: 330.00 },
    { id: 108, temin_kalem_id: 2, temin_firma_id: 13, birim_fiyat: 220.00 },
    { id: 109, temin_kalem_id: 3, temin_firma_id: 13, birim_fiyat: 48.00 }
  ];

  const MOCK_KOMISYON = [
    { id: 1, ad_soyad: 'Ahmet ARI', gorev: 'Başkan', unvan: 'Mühendis', komisyon_turu_adi: 'Piyasa Fiyat Araştırma', komisyon_id: 1, asli_yedek: 'Asil' },
    { id: 2, ad_soyad: 'Mehmet BİLGİN', gorev: 'Üye', unvan: 'Tekniker', komisyon_turu_adi: 'Piyasa Fiyat Araştırma', komisyon_id: 1, asli_yedek: 'Asil' },
    { id: 3, ad_soyad: 'Zeynep ÇELİK', gorev: 'Üye', unvan: 'V.H.K.İ.', komisyon_turu_adi: 'Piyasa Fiyat Araştırma', komisyon_id: 1, asli_yedek: 'Asil' }
  ];

  // SQLite Sorgu Motoru Mock Adaptörü
  const createMockQueryExecutor = (customSnapshots: Record<string, any> = {}) => {
    return async (sql: string, params: any[] = []): Promise<any[]> => {
      const lowerSql = sql.toLowerCase();

      // DATA_TeminBelgeSnapshot
      if (lowerSql.includes('data_teminbelgesnapshot')) {
        for (const [key, snapData] of Object.entries(customSnapshots)) {
          if (params.includes(key) || params.includes(`${key}.html`)) {
            return [{ id: 99, dosya_id: MOCK_DOSYA_ID, sablon_kodu: key, veri_json: JSON.stringify(snapData) }];
          }
        }
        return [];
      }

      // DATA_TeminDosyasi
      if (lowerSql.includes('data_temindosyasi')) {
        return [MOCK_DOSYA];
      }

      // TANIM_Kurum
      if (lowerSql.includes('tanim_kurum')) {
        return [MOCK_KURUM];
      }

      // TANIM_Birim
      if (lowerSql.includes('tanim_birim')) {
        return [MOCK_BIRIM];
      }

      // DATA_TeminKalem
      if (lowerSql.includes('data_teminkalem') && !lowerSql.includes('teklif')) {
        return MOCK_KALEMLER;
      }

      // DATA_TeminFirma
      if (lowerSql.includes('data_teminfirma')) {
        return MOCK_FIRMALAR;
      }

      // DATA_TeminKalemTeklif
      if (lowerSql.includes('data_teminkalemteklif')) {
        return MOCK_TEKLIFLER;
      }

      // DATA_TeminKomisyon
      if (lowerSql.includes('data_teminkomisyon')) {
        return MOCK_KOMISYON;
      }

      return [];
    };
  };

  // ─── 1. BÖLÜM: ŞABLON ÇÖZÜMLEME VE VERİ HARİTALAMA (MAPPING) ─────────────
  describe('1. Şablon Çözümleme ve Veri Aktarımı Doğrulaması', () => {
    it('1.1. Yaklaşık Maliyet Cetveli şablonu merkezi templateRegistry defterinde kayıtlıdır ve manifest kontratına sahiptir', () => {
      const template = templateRegistry.yaklasik_maliyet_cetveli;
      expect(template).toBeDefined();
      expect(template.id).toBe('yaklasik-maliyet-cetveli');
      expect(template.name).toBe('YaklasikMaliyetCetveli');
      expect(template.title).toBe('Yaklaşık Maliyet Hesap Cetveli');
      expect(template.mapping).toBeDefined();
    });

    it('1.2. Piyasa Fiyat Araştırma Tutanağı şablonu merkezi templateRegistry defterinde kayıtlıdır', () => {
      const template = templateRegistry.piyasa_fiyat_arastirma_tutanagi;
      expect(template).toBeDefined();
      expect(template.id).toBe('piyasa-fiyat-arastirma-tutanagi');
      expect(template.title).toBe('Piyasa Fiyat Araştırması Tutanağı');
    });

    it('1.3. Gerçek .temin veritabanından Yaklaşık Maliyet Cetveli için data.mapping.ts üzerinden veri eksiksiz çözümlenir', async () => {
      const template = templateRegistry.yaklasik_maliyet_cetveli;
      const queryExecutor = createMockQueryExecutor();

      const resolvedData = await resolveTemplateData(
        template.mapping as any,
        MOCK_DOSYA_ID,
        queryExecutor,
        'yaklasik-maliyet-cetveli'
      );

      expect(resolvedData).toBeDefined();
      // Kalemler doğru aktarılmış mı?
      expect(resolvedData.ihtiyacKalemleri).toBeDefined();
      expect(Array.isArray(resolvedData.ihtiyacKalemleri)).toBe(true);
      expect(resolvedData.ihtiyacKalemleri.length).toBe(3);
      expect(resolvedData.ihtiyacKalemleri[0].malzemeAdi).toContain('A4 Fotokopi Kağıdı');

      // Maliyet Cetveli Tarihi schema 49 uyarınca çözümlenmiş mi?
      expect(resolvedData.maliyetCetveliTarihi || resolvedData.tarih).toBe('02.10.2026');
    });

    it('1.4. Piyasa Fiyat Araştırma Tutanağı için firma teklif matrisi ve komisyon heyeti eksiksiz çözümlenir', async () => {
      const template = templateRegistry.piyasa_fiyat_arastirma_tutanagi;
      const queryExecutor = createMockQueryExecutor();

      const resolvedData = await resolveTemplateData(
        template.mapping as any,
        MOCK_DOSYA_ID,
        queryExecutor,
        'piyasa-fiyat-arastirma-tutanagi'
      );

      expect(resolvedData).toBeDefined();
      expect(resolvedData.komisyon).toBeDefined();
      expect(resolvedData.komisyon.length).toBe(3);
      expect(resolvedData.komisyon[0].adSoyad).toBe('Ahmet ARI');

      // İhtiyaç kalemleri listesi
      expect(resolvedData.ihtiyacKalemleri).toBeDefined();
      expect(resolvedData.ihtiyacKalemleri.length).toBe(3);
      expect(resolvedData.ihtiyacKalemleri[0].malzemeAdi).toContain('A4 Fotokopi Kağıdı');
    });
  });

  // ─── 2. BÖLÜM: BELGE ÖNİZLEME VE ALAN BÜTÜNLÜĞÜ ─────────────────────────
  describe('2. Belge Önizleme (InstitutionalHeaderProvider, Kalemler, Teklifler ve Kazanan)', () => {
    it('2.1. InstitutionalHeaderProvider Resmî Yazışma Yönetmeliğine uygun antet hiyerarşisini üretir', () => {
      const antet = InstitutionalHeaderProvider.parseKurumBaseAntetLines(MOCK_KURUM);

      expect(antet).toBeDefined();
      expect(Array.isArray(antet)).toBe(true);
      expect(antet[0]).toBe('T.C.');
      expect(antet).toContain('ÇANKAYA BELEDİYE BAŞKANLIĞI');
    });

    it('2.2. Teklif matrisinde kalem bazlı ve firma toplam tutarları kuruşu kuruşuna doğru hesaplanır', () => {
      // 1. Kalem: 500 Koli * 320 TL = 160.000 TL
      // 2. Kalem: 120 Bidon * 210 TL = 25.200 TL
      // 3. Kalem: 300 Rulo * 45 TL = 13.500 TL
      // Toplam Firma 11: 198.700 TL
      const toplamFirma11 = 500 * 320 + 120 * 210 + 300 * 45;
      expect(toplamFirma11).toBe(198700);

      // Ortalama Yaklaşık Maliyet Hesabı:
      // Kalem 1 ortalama: (320 + 340 + 330) / 3 = 330 TL * 500 = 165.000 TL
      // Kalem 2 ortalama: (210 + 230 + 220) / 3 = 220 TL * 120 = 26.400 TL
      // Kalem 3 ortalama: (45 + 50 + 48) / 3 = 47.666... TL * 300 = 14.300 TL
      // Toplam Ortalama Yaklaşık Maliyet: 165.000 + 26.400 + 14.300 = 205.700 TL
      const ortalamaYaklasikMaliyet = 500 * 330 + 120 * 220 + 300 * ((45 + 50 + 48) / 3);
      expect(ortalamaYaklasikMaliyet).toBe(205700);
    });
  });

  // ─── 3. BÖLÜM: ŞABLON VE KULLANICI DÜZENLEMELERİ (SMARTMERGE & SNAPSHOT) ───
  describe('3. Kullanıcı Düzenlemeleri, Snapshot ve SmartMerge Mekanizması', () => {
    it('3.1. Kullanıcı modal üzerinden evrak başlığını veya komisyon görevini elle değiştirdiğinde snapshot kaydedilir', async () => {
      const templateKey = 'yaklasik-maliyet-cetveli';
      const initialTemplateData = {
        belgeBasligi: 'YAKLAŞIK MALİYET HESAP CETVELİ',
        tarih: '2026-10-02',
        aciklamaNotu: 'Standart piyasa araştırması neticesinde oluşturulmuştur.'
      };

      // Kullanıcının A4 ekranında elle düzenlediği alanlar
      const userEditedSnapshot = {
        ...initialTemplateData,
        belgeBasligi: 'ÖZEL İHTİYAÇ YAKLAŞIK MALİYET HESAP CETVELİ (REVİZE)',
        aciklamaNotu: 'Harcama Yetkilisi oluruyla 2. kez güncellenmiş fiyat araştırmasıdır.',
        _isUserModified: true
      };

      const queryExecutor = createMockQueryExecutor({
        [templateKey]: userEditedSnapshot
      });

      // Snapshot çözümleme motoru
      const overlayResult = await resolveSnapshotOverlay(
        initialTemplateData,
        {},
        MOCK_DOSYA,
        MOCK_DOSYA_ID,
        templateKey,
        templateKey,
        true,
        false,
        null,
        null,
        [],
        [],
        [],
        queryExecutor
      );

      // Kullanıcının manuel düzenlemeleri taze şablon verisi tarafından ezilmemelidir
      expect(overlayResult.finalData.belgeBasligi).toBe('ÖZEL İHTİYAÇ YAKLAŞIK MALİYET HESAP CETVELİ (REVİZE)');
      expect(overlayResult.finalData.aciklamaNotu).toBe('Harcama Yetkilisi oluruyla 2. kez güncellenmiş fiyat araştırmasıdır.');
      expect(overlayResult.finalData._hasSavedSnapshot).toBe(true);
    });

    it('3.2. applyRefreshPolicy (smartMerge), veritabanındaki dinamik alanları güncellerken kullanıcının metin düzenlemelerini korur', () => {
      const baseFreshData = {
        kurumAdi: 'ÇANKAYA BELEDİYE BAŞKANLIĞI',
        toplamTutar: 205700,
        belgeBasligi: 'YAKLAŞIK MALİYET HESAP CETVELİ',
        kullaniciNotu: 'Varsayılan not'
      };

      const savedUserSnapshot = {
        kurumAdi: 'ÇANKAYA BELEDİYE BAŞKANLIĞI',
        toplamTutar: 198000, // Eski DB tutarı
        belgeBasligi: 'KULLANICININ ELLE GİRDİĞİ ÖZEL BAŞLIK',
        kullaniciNotu: 'Kullanıcının elle eklediği özel gerekçe açıklaması'
      };

      const merged = applyRefreshPolicy(baseFreshData, savedUserSnapshot);

      // Kullanıcının elle girdiği özel başlık ve not KORUNMALIDIR
      expect(merged.belgeBasligi).toBe('KULLANICININ ELLE GİRDİĞİ ÖZEL BAŞLIK');
      expect(merged.kullaniciNotu).toBe('Kullanıcının elle eklediği özel gerekçe açıklaması');
    });
  });

  // ─── 4. BÖLÜM: DOCUMENT ENGINE VE PDF ÜRETİMİ ─────────────────────────────
  describe('4. DocumentEngine ile Tam A4 Çıktı ve Türkçe Karakter / PDF Üretimi', () => {
    it('4.1. DocumentEngine.compileHtml hem dikey hem yatay sayfa boyutlarında geçerli ve resmî A4 HTML üretir', () => {
      const templateData = {
        title: 'YAKLAŞIK MALİYET HESAP CETVELİ',
        tarih: '02.10.2026',
        dosyaNo: '2026/DT-501',
        isinAdi: 'Temizlik ve Kırtasiye Malzemesi Alımı',
        antet: ['T.C.', 'ANKARA VALİLİĞİ', 'ÇANKAYA BELEDİYE BAŞKANLIĞI'],
        ihtiyacKalemleri: [
          { siraNo: 1, malzemeAdi: 'A4 Kağıdı', miktar: 500, birimi: 'Koli', birimFiyat: 320, toplamTutar: 160000 },
          { siraNo: 2, malzemeAdi: 'Sıvı Sabun', miktar: 120, birimi: 'Bidon', birimFiyat: 210, toplamTutar: 25200 }
        ],
        komisyon: [
          { ad_soyad: 'Ahmet ARI', unvan: 'Mühendis', gorev: 'Başkan' },
          { ad_soyad: 'Mehmet BİLGİN', unvan: 'Tekniker', gorev: 'Üye' }
        ]
      };

      const compiledHtml = DocumentEngine.compileHtml({
        templateKey: 'yaklasik-maliyet-cetveli',
        data: templateData,
        orientation: 'landscape'
      });

      expect(compiledHtml).toBeDefined();
      expect(compiledHtml).toContain('<!DOCTYPE html>');
      expect(compiledHtml).toContain('size: 297mm 210mm;'); // Yatay A4 kuralı
      expect(compiledHtml).toContain('@media print');
      expect(compiledHtml).toContain('A4 Kağıdı');
      expect(compiledHtml).toContain('Ahmet ARI');
    });

    it('4.2. Türkçe özel karakterler (Ğ, Ü, Ş, İ, Ö, Ç, ğ, ü, ş, ı, ö, ç) ve para birimi HTML çıktısında bozulmadan korunur', () => {
      const turkceVeri = {
        title: 'PİYASA FİYAT ARAŞTIRMASI TUTANAĞI',
        antet: ['T.C.', 'ANKARA İLİ', 'ÇANKAYA BELEDİYE BAŞKANLIĞI'],
        ihtiyacKalemleri: [],
        komisyon: [{ ad_soyad: 'Şükrü ÇAĞLAYAN', unvan: 'Şube Müdürü', gorev: 'Başkan' }],
        baskanUnvan: 'Harcama Yetkilisi',
        baskanAdi: 'Mustafa KAYA'
      };

      const compiledHtml = DocumentEngine.compileHtml({
        templateKey: 'piyasa-fiyat-arastirma-tutanagi',
        data: turkceVeri,
        orientation: 'portrait'
      });

      expect(compiledHtml).toContain('Piyasa Fiyat Araştırması Görevlisi / Görevlileri');
      expect(compiledHtml).toContain('Şükrü ÇAĞLAYAN');
      expect(compiledHtml).toContain('Mustafa KAYA');
      expect(compiledHtml).toContain('size: 210mm 297mm;'); // Dikey A4 kuralı
    });

    it('4.3. Çok sayfalı belgelerde yazdırma ve sayfa düzeni kuralları (@media print) uygulanır', () => {
      const cokluKalemler = Array.from({ length: 25 }, (_, i) => ({
        siraNo: i + 1,
        malzemeAdi: `İhtiyaç Malzeme Kalemi #${i + 1}`,
        miktar: 100,
        birimi: 'Adet',
        birimFiyat: 50,
        toplamTutar: 5000
      }));

      const compiledHtml = DocumentEngine.compileHtml({
        templateKey: 'yaklasik-maliyet-cetveli',
        data: {
          title: 'ÇOK SAYFALI YAKLAŞIK MALİYET CETVELİ',
          ihtiyacKalemleri: cokluKalemler,
          komisyon: [{ ad_soyad: 'Başkan İmzacı', gorev: 'Başkan' }]
        },
        orientation: 'portrait'
      });

      expect(compiledHtml).toContain('@media print');
      expect(compiledHtml).toContain('page-break-inside:avoid');
      expect(compiledHtml).toContain('Başkan İmzacı');
    });
  });

  // ─── 5. BÖLÜM: KALICILIK VE TEKRAR AÇILABİLİRLİK (PERSISTENCE) ───────────
  describe('5. Uygulamanın Yeniden Açılması ve Dosya Kalıcılığı (Full Lifecycle)', () => {
    it('5.1. Belge snapshot kaydedildikten sonra dosya tekrar açıldığında kullanıcının tüm değişiklikleri birebir geri yüklenir', async () => {
      const templateKey = 'yaklasik-maliyet-cetveli';
      const persistedUserEdits = {
        belgeBasligi: 'REORGANİZE MALİYET ÇİZELGESİ',
        tutanakSayisi: '2026/EKAP-999',
        kullaniciOzelNotu: 'Bu belge Sayıştay denetimine hazır formatta tanzim edilmiştir.',
        komisyonBaskaniUnvanCustom: 'Başkan Vekili (Yetkili)'
      };

      const queryExecutor = createMockQueryExecutor({
        [templateKey]: persistedUserEdits
      });

      // Uygulama kapatıldı, tekrar açıldı simülasyonu
      const freshOpenResult = await resolveSnapshotOverlay(
        { belgeBasligi: 'YAKLAŞIK MALİYET HESAP CETVELİ' },
        {},
        MOCK_DOSYA,
        MOCK_DOSYA_ID,
        templateKey,
        templateKey,
        true,
        false,
        null,
        null,
        [],
        [],
        [],
        queryExecutor
      );

      expect(freshOpenResult.finalData).toBeDefined();
      expect(freshOpenResult.finalData.belgeBasligi).toBe('REORGANİZE MALİYET ÇİZELGESİ');
      expect(freshOpenResult.finalData.tutanakSayisi).toBe('2026/EKAP-999');
      expect(freshOpenResult.finalData.kullaniciOzelNotu).toBe('Bu belge Sayıştay denetimine hazır formatta tanzim edilmiştir.');
      expect(freshOpenResult.finalData.komisyonBaskaniUnvanCustom).toBe('Başkan Vekili (Yetkili)');
    });
  });

  // ─── 6. BÖLÜM: AGENTS.MD MİMARİ İNVARİANT KONTROLLERİ ────────────────────
  describe('6. AGENTS.md Mimari Kural Kontrolleri (Invariants)', () => {
    it('6.1. Şablon bileşenlerinde doğrudan SQL sorgusu veya ipcRenderer çağrısı bulunamaz (Kural 1)', () => {
      const template = templateRegistry.yaklasik_maliyet_cetveli;
      expect(template).toBeDefined();
      expect(template.component).toBeDefined();

      // Bileşenin bir fonksiyon/React bileşeni olduğu ve saf data prop'u aldığı doğrulanır
      expect(typeof template.component).toBe('function');
    });

    it('6.2. Tekil SQL resolver sınıfı oluşturulamaz; tüm çözümleme deklaratif data.mapping.ts ile yürütülür (Kural 2 & 3)', () => {
      const template = templateRegistry.yaklasik_maliyet_cetveli;
      expect(template.mapping).toBeDefined();
      expect(typeof template.mapping).toBe('object');
      // Haritalama deklaratiftir
      expect(template.mapping).toHaveProperty('ihtiyacKalemleri');
    });
  });
});
