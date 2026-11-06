import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  DocumentMetadata,
  MetadataBlock,
  CommonDocumentFields,
  DefaultDocumentResolver
} from '../index';
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

      const html = renderToString(React.createElement(IhtiyacListesi, { data }));

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
});
