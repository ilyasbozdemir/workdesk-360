import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  DocumentMetadata,
  MetadataBlock,
  CommonDocumentFields,
  DefaultDocumentResolver,
  buildMergedPersonelList,
  PersonelCard,
  TemplateEditProvider,
  getTemplateRouteDefinition
} from '../index';
import {
  resolveRoute,
  validateRoute,
  mergeRouteOverrides,
  applyResolvedRouteToDocumentData
} from '@worksuite-360/document-engine';
import { IhtiyacListesi } from '../templates/ihtiyac-listesi';
import { COMMON_DOCUMENT_MAPPING } from '../../../contracts/document-source.mapping';

describe('Common Document Fields & Standardization', () => {
  describe('1. COMMON_DOCUMENT_MAPPING SQLite Kolon Doğrulaması', () => {
    it('dosyaKonusu DATA_TeminDosyasi.konu kolonuna eşlenir', () => {
      expect(COMMON_DOCUMENT_MAPPING.dosyaKonusu).toBeDefined();
      expect(COMMON_DOCUMENT_MAPPING.dosyaKonusu.source).toBe('DATA_TeminDosyasi');
      expect(COMMON_DOCUMENT_MAPPING.dosyaKonusu.column).toBe('konu');
    });

    it('dosyaTarihi DATA_TeminDosyasi.dosya_acilis_tarihi kolonuna eşlenir', () => {
      expect(COMMON_DOCUMENT_MAPPING.dosyaTarihi).toBeDefined();
      expect(COMMON_DOCUMENT_MAPPING.dosyaTarihi.source).toBe('DATA_TeminDosyasi');
      expect(COMMON_DOCUMENT_MAPPING.dosyaTarihi.column).toBe('dosya_acilis_tarihi');
    });

    it('kurumAdi TANIM_Kurum.kurum_adi kolonuna eşlenir', () => {
      expect(COMMON_DOCUMENT_MAPPING.kurumAdi).toBeDefined();
      expect(COMMON_DOCUMENT_MAPPING.kurumAdi.source).toBe('TANIM_Kurum');
      expect(COMMON_DOCUMENT_MAPPING.kurumAdi.column).toBe('kurum_adi');
    });
  });

  describe('2. DocumentMetadata & MetadataBlock Standart Bileşeni', () => {
    it('DocumentMetadata, CommonDocumentFields verilerini doğru render eder', () => {
      const data: CommonDocumentFields = {
        evrakSayisi: 'E-10234521-934.01-0001',
        dosyaKonusu: 'Bilgisayar ve Donanım Alımı',
        dosyaTarihi: '2026-11-06'
      };

      const html = renderToString(React.createElement(DocumentMetadata, { data, showBorder: false }));

      expect(html).toContain('Bilgisayar ve Donanım Alımı');
      expect(html).toContain('E-10234521-934.01-0001');
      expect(html).toContain('06.11.2026');
    });
  });

  describe('3. IhtiyacListesi Pilot Şablon Uyumluluğu', () => {
    it('standart CommonDocumentFields ile hatasız HTML üretir ve fallback antipattern içermez', () => {
      const data: CommonDocumentFields & Record<string, any> = {
        dosyaId: 101,
        evrakSayisi: 'E-10234521-934.01-0001',
        dosyaKonusu: 'Laboratuvar Sarf Malzemesi Alımı',
        dosyaTarihi: '2026-11-06',
        sunulacakMakamAdi: 'SAĞLIK DAİRE BAŞKANLIĞINA',
        ihtiyacYeri: 'Merkez Laboratuvarı',
        hazirlayanPersonelAdi: 'Ayşe Kaya',
        hazirlayanPersonelUnvan: 'Biyolog',
        onaylayanPersonelAdi: 'Dr. Mehmet Demir',
        onaylayanPersonelUnvan: 'Harcama Yetkilisi',
        onayTarihi: '2026-11-06',
        antetSatirlari: ['T.C.', 'SAĞLIK BAKANLIĞI'],
        ihtiyacKalemleri: [
          {
            id: 1,
            siraNo: 1,
            kodu: '150.01.001',
            malzemeAdi: 'Test Tüpü',
            ozelligi: 'Cam 10ml',
            birimi: 'Adet',
            miktar: '500',
            kdvOrani: 20
          }
        ]
      };

      const html = renderToString(React.createElement(IhtiyacListesi, { data: data as any }));

      expect(html).toContain('Laboratuvar Sarf Malzemesi Alımı');
      expect(html).toContain('SAĞLIK DAİRE BAŞKANLIĞINA');
      expect(html).toContain('Merkez Laboratuvarı');
      expect(html).toContain('Ayşe Kaya');
      expect(html).toContain('Test Tüpü');
      expect(html).toContain('Dr. Mehmet Demir');
    });
  });

  describe('4. DefaultDocumentResolver Standartlaştırması', () => {
    it('herhangi bir şablon için standart CommonDocumentFields alanlarını eksiksiz sağlar', async () => {
      const resolver = new DefaultDocumentResolver();
      const mockContext = {
        dosyaId: 10,
        templateKey: 'genel-belge',
        headerData: {
          antetSatirlari: ['T.C.', 'BELEDİYE BAŞKANLIĞI'],
          kurumUst: 'İÇİŞLERİ BAKANLIĞI',
          kurumAdi: 'ÖRNEK BELEDİYESİ',
          mudurluk: 'Fen İşleri Müdürlüğü',
          solLogo: null,
          sagLogo: null,
          dosyaNo: '2026/10',
          evrakSayisi: 'E-123456-934.01-0010',
          dosyaTarihi: '2026-11-06',
          konu: 'Yol Bakım Onarımı',
          harcamaYetkilisiAdi: 'Hasan Yılmaz',
          harcamaYetkilisiUnvan: 'Fen İşleri Müdürü'
        },
        queryExecutor: async () => []
      };

      const resolved = await resolver.resolve(mockContext);

      expect(resolved.dosyaKonusu).toBe('Yol Bakım Onarımı');
      expect(resolved.dosyaTarihi).toBe('2026-11-06');
      expect(resolved.evrakSayisi).toBe('E-123456-934.01-0010');
      expect(resolved.kurumAdi).toBe('ÖRNEK BELEDİYESİ');
      expect(resolved.onaylayanPersonelAdi).toBe('Hasan Yılmaz');
      expect(resolved.onaylayanPersonelUnvan).toBe('Fen İşleri Müdürü');
    });
  });

  describe('5. Personel Havuzu Birleştirme (buildMergedPersonelList — Firmalar Mantığı)', () => {
    it('global personelListesi, komisyon üyeleri, rota adımları ve mevcut personel bilgisini tekilleştirerek birleştirir', () => {
      const globalList = [
        { id: 1, ad_soyad: 'Ahmet Yılmaz', unvan: 'Müdür' },
        { id: 2, adSoyad: 'Zeynep Kaya', gorev: 'Uzman' }
      ];
      const docData = {
        komisyonUyeleri: [
          { id: 3, ad_soyad: 'Mustafa Demir', unvan: 'Başkan' },
          { id: 99, ad_soyad: 'Ahmet Yılmaz', unvan: 'Müdür' } // Mükerrer isim -> elenmeli
        ],
        rota: [
          { r: 'Paraf', a: 'Elif Çelik', u: 'Şube Müdürü' }
        ],
        onaylayanPersonelAdi: 'Kemal Öztürk',
        onaylayanPersonelUnvan: 'Genel Müdür'
      };

      const merged = buildMergedPersonelList(globalList, docData, 'Dışarıdan Eklenen Kişi', 'Danışman');

      // Mevcut seçili ama listede olmayan kişi en başa custom_ olarak eklenmeli
      expect(merged[0].ad_soyad).toBe('Dışarıdan Eklenen Kişi');
      expect(merged[0].unvan).toBe('Danışman');
      expect(String(merged[0].id)).toContain('custom_');

      // Diğer tüm kaynaklardan gelen kişiler tekilleştirilmiş olarak listede yer almalı
      const names = merged.map((p) => p.ad_soyad);
      expect(names).toContain('Ahmet Yılmaz');
      expect(names).toContain('Zeynep Kaya');
      expect(names).toContain('Mustafa Demir');
      expect(names).toContain('Elif Çelik');
      expect(names).toContain('Kemal Öztürk');

      // Ahmet Yılmaz yalnızca 1 kez bulunmalı
      expect(names.filter((n) => n === 'Ahmet Yılmaz').length).toBe(1);
    });

    it('isEditing modunda PersonelCard personelList seçicisini gösterir ve A4 şablonunu ekstra rota tablosuyla bozmaz', () => {
      const mockData = {
        belgeModu: 'koordinasyonlu',
        rota: [{ t: 'Koordinasyon', a: 'Elif Çelik', u: 'Şube Müdürü' }]
      };
      const html = renderToString(
        React.createElement(
          TemplateEditProvider,
          {
            isEditing: true,
            onFieldChange: () => {},
            personelListesi: [{ id: 1, ad_soyad: 'Ayşe Kaya', unvan: 'Biyolog' }],
            data: mockData
          },
          React.createElement(IhtiyacListesi, {
            data: {
              ...mockData,
              hazirlayanPersonelAdi: 'Ayşe Kaya',
              hazirlayanPersonelUnvan: 'Biyolog',
              onaylayanPersonelAdi: 'Dr. Mehmet Demir',
              onaylayanPersonelUnvan: 'Başhekim'
            } as any
          })
        )
      );

      expect(html).toContain('Ayşe Kaya');
      expect(html).toContain('👤 Personel Seç...');
      expect(html).not.toContain('Belge Koordinasyon / Paraf Akışı');
      expect(html).not.toContain('🔀 Rota Aktif');
    });

    it('Şablon bazlı slot rota sistemi (resolveRoute) person ve person-list slotlarını doğru öncelikle çözer', () => {
      const settings = {
        onaylayan: { id: 'p1', name: 'Ayşe Demir', title: 'Birim Yetkilisi' }
      };

      // 1) ihtiyac-listesi: hazirlayan (document) + onaylayan (settings)
      const ihtiyacDef = getTemplateRouteDefinition('ihtiyac-listesi');
      const ihtiyacResolved = resolveRoute({
        definition: ihtiyacDef,
        settings,
        document: {
          hazirlayan: { id: 'p2', name: 'Mehmet Yılmaz', title: 'Personel' }
        },
        overrides: []
      });

      expect(validateRoute(ihtiyacResolved)).toEqual([]);
      expect(ihtiyacResolved.steps.find((s) => s.id === 'hazirlayan')?.origin).toBe('document');
      expect(ihtiyacResolved.steps.find((s) => s.id === 'onaylayan')?.origin).toBe('settings');

      // 2) piyasa-fiyat-arastirma: komisyon (person-list) + onaylayan (override)
      const piyasaDef = getTemplateRouteDefinition('piyasa-fiyat-arastirma');
      const piyasaResolved = resolveRoute({
        definition: piyasaDef,
        settings,
        document: {
          komisyon: [
            { id: 'p3', name: 'Zeynep Kaya', title: 'Uzman' },
            { id: 'p4', name: 'Ali Çelik', title: 'Memur' }
          ]
        },
        overrides: [{ slotId: 'onaylayan', value: { id: 'p5', name: 'Fatma Ak', title: 'Müdür' } }]
      });

      expect(validateRoute(piyasaResolved)).toEqual([]);
      expect(piyasaResolved.steps.find((s) => s.id === 'komisyon')?.origin).toBe('document');
      expect(piyasaResolved.steps.find((s) => s.id === 'onaylayan')?.origin).toBe('override');

      const mappedDoc = applyResolvedRouteToDocumentData({}, piyasaResolved);
      expect(mappedDoc.fiyatArastirmaGorevlileri).toHaveLength(2);
      expect(mappedDoc.fiyatArastirmaGorevlileri[0].adSoyad).toBe('Zeynep Kaya');
      expect(mappedDoc.onaylayanPersonelAdi).toBe('Fatma Ak');
      expect(mappedDoc.onaylayanPersonelUnvan).toBe('Müdür');

      const merged = mergeRouteOverrides(settings, [
        { slotId: 'onaylayan', value: { id: 'p5', name: 'Fatma Ak' } }
      ]);
      expect((merged.onaylayan as any).name).toBe('Fatma Ak');
    });
  });
});
