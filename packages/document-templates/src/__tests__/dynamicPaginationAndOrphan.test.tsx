import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  DEFAULT_LIMITS,
  LANDSCAPE_LIMITS,
  paginateData,
  resolveSignatureAwareLimits,
} from "../document/DynamicPaginatedTable";
import { IhtiyacListesi } from "../templates/ihtiyac-listesi/IhtiyacListesi.template";
import { LuzumMuzekkeresi } from "../templates/luzum-muzekkeresi/LuzumMuzekkeresi.template";
import {
  ApprovalSignature,
  PersonelCard,
  CommissionList,
  MetadataBlock,
  SignatureBlockContainer,
} from "../document/ApprovalSignature";
import { DocumentLayout } from "../document/DocumentLayout";

describe("Issue #16: Şablon Sayfa Bölünmesi (Page Break) ve Yetim İmza (Orphan) Önleme Testleri", () => {
  // Yardımcı: N adet test kalemi üretici
  const generateItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      siraNo: i + 1,
      kodu: `MALZ-${1000 + i}`,
      malzemeAdi: `Test Malzeme / Hizmet Kalemi ${i + 1}`,
      ozelligi: `Şartnameye uygun teknik detay ${i + 1}`,
      birimi: "Adet",
      kdvOrani: 20,
      miktar: (i + 1) * 5,
    }));

  // --------------------------------------------------------------------------
  // 1. paginateData Birim ve Sınır Değer Testleri
  // --------------------------------------------------------------------------
  describe("1. paginateData Algoritması ve Sınır Değer Dağılımları", () => {
    it("Boş veri listesinde (0 kalem) tek boş sayfa döner", () => {
      const result = paginateData([], DEFAULT_LIMITS);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([]);
    });

    it("Tek sayfaya sığan durumlarda (1, 5, 8 kalem) tek sayfa döner", () => {
      [1, 5, 8].forEach((count) => {
        const items = generateItems(count);
        const pages = paginateData(items, DEFAULT_LIMITS);
        expect(pages).toHaveLength(1);
        expect(pages[0]).toHaveLength(count);
      });
    });

    it("9 kalem girildiğinde tek sayfaya sığmaz (lastPage=8 aşılır), 2 sayfaya bölünür ve son sayfa yetim kalmaz", () => {
      const items = generateItems(9);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages).toHaveLength(2);
      expect(pages[0].length).toBe(6);
      expect(pages[1].length).toBe(3);
      // Toplam satır sayısı korunmalı
      expect(pages[0].length + pages[1].length).toBe(9);
      // Son sayfadaki satır sayısı en az 2 olmalı (yetim önleme)
      expect(pages[1].length).toBeGreaterThanOrEqual(2);
    });

    it("12 kalem girildiğinde sayfalar dengeli bölünür (9 + 3)", () => {
      const items = generateItems(12);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages).toHaveLength(2);
      expect(pages[0].length).toBe(9);
      expect(pages[1].length).toBe(3);
      expect(pages[1].length).toBeGreaterThanOrEqual(2);
    });

    it("13 kalem KRİTİK SINIR: İlk sayfa 12 alıp son sayfaya 1 yetim satır bırakamaz, 11 + 2 olarak bölünür", () => {
      const items = generateItems(13);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages).toHaveLength(2);
      // Yetim satır önleme mekanizması devrede:
      expect(pages[0].length).toBe(11);
      expect(pages[1].length).toBe(2);
      expect(pages[1].length).toBeGreaterThanOrEqual(2);
    });

    it("14 ve 20 kalem durumunda son sayfa satır sınırlarını aşmaz", () => {
      const items14 = generateItems(14);
      const pages14 = paginateData(items14, DEFAULT_LIMITS);
      expect(pages14).toHaveLength(2);
      expect(pages14[0].length).toBe(12);
      expect(pages14[1].length).toBe(2);

      const items20 = generateItems(20);
      const pages20 = paginateData(items20, DEFAULT_LIMITS);
      expect(pages20).toHaveLength(2);
      expect(pages20[0].length).toBe(12);
      expect(pages20[1].length).toBe(8);
      expect(pages20[1].length).toBeLessThanOrEqual(DEFAULT_LIMITS.lastPage);
    });

    it("30 kalem senaryosu: Çoklu sayfada (3 sayfa) doğru dağılım sağlanır", () => {
      const items = generateItems(30);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages).toHaveLength(3);
      expect(pages[0].length).toBe(12);
      // Kalan 18 satır: orta ve son sayfaya dengeli paylaştırılır
      expect(pages[1].length).toBeLessThanOrEqual(DEFAULT_LIMITS.middle);
      expect(pages[2].length).toBeLessThanOrEqual(DEFAULT_LIMITS.lastPage);
      expect(pages[2].length).toBeGreaterThanOrEqual(2);
      expect(pages[0].length + pages[1].length + pages[2].length).toBe(30);
    });

    it("31 kalem KRİTİK SINIR: 3. sayfaya tek satır kalması önlenir (son sayfa >= 2)", () => {
      const items = generateItems(31);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages).toHaveLength(3);
      expect(pages[pages.length - 1].length).toBeGreaterThanOrEqual(2);
      expect(pages[0].length + pages[1].length + pages[2].length).toBe(31);
    });

    it("50 kalem senaryosu: 4 sayfaya bölünür ve tüm sayfalar limitler dahilindedir", () => {
      const items = generateItems(50);
      const pages = paginateData(items, DEFAULT_LIMITS);
      expect(pages.length).toBeGreaterThanOrEqual(4);
      // İlk sayfa <= firstPage
      expect(pages[0].length).toBeLessThanOrEqual(DEFAULT_LIMITS.firstPage);
      // Ara sayfalar <= middle
      for (let i = 1; i < pages.length - 1; i++) {
        expect(pages[i].length).toBeLessThanOrEqual(DEFAULT_LIMITS.middle);
      }
      // Son sayfa <= lastPage ve >= 2
      const lastPage = pages[pages.length - 1];
      expect(lastPage.length).toBeLessThanOrEqual(DEFAULT_LIMITS.lastPage);
      expect(lastPage.length).toBeGreaterThanOrEqual(2);

      const totalItems = pages.reduce((acc, p) => acc + p.length, 0);
      expect(totalItems).toBe(50);
    });

    it("Yatay (Landscape) mod sınırları doğru uygulanır", () => {
      const items4 = generateItems(4);
      expect(paginateData(items4, LANDSCAPE_LIMITS)).toHaveLength(1);

      const items5 = generateItems(5);
      const pages5 = paginateData(items5, LANDSCAPE_LIMITS);
      expect(pages5).toHaveLength(2);
      expect(pages5[1].length).toBeGreaterThanOrEqual(2);

      const items7 = generateItems(7);
      const pages7 = paginateData(items7, LANDSCAPE_LIMITS);
      expect(pages7).toHaveLength(2);
      expect(pages7[0].length).toBe(5);
      expect(pages7[1].length).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Şablon Render & DOM Entegrasyon Testleri (İhtiyaç Listesi)
  // --------------------------------------------------------------------------
  describe("2. IhtiyacListesi Şablonu Sayfa Bölünmesi ve İmza Blokları", () => {
    it("5 kalem ile tek sayfa render edilir; başlık, tablo ve OLUR aynı sayfadadır", () => {
      const data = {
        dosyaKonusu: "Kırtasiye Alımı",
        evrakSayisi: "2026/101",
        tarih: "17.10.2026",
        sunulacakMakamAdi: "BELEDİYE BAŞKANLIĞINA",
        hazirlayanPersonelAdi: "Ahmet Yılmaz",
        hazirlayanPersonelUnvan: "Müdür",
        onaylayanPersonelAdi: "Mehmet Demir",
        onaylayanPersonelUnvan: "Harcama Yetkilisi",
        olurYazisi: true,
        ihtiyacKalemleri: generateItems(5),
      };

      const html = renderToString(<IhtiyacListesi data={data as any} />);

      // Tek sayfa layout container
      const containerCount = (html.match(/class="document-container"/g) || []).length;
      expect(containerCount).toBe(1);

      // Başlık, tablo ve onay alanı tek çıktıda mevcut
      expect(html).toContain("BELEDİYE BAŞKANLIĞINA");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 1");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 5");
      expect(html).toContain("OLUR");
      expect(html).toContain("Harcama Yetkilisi");
    });

    it("13 kalem ile 2 sayfa render edilir; OLUR bloğu 2. sayfadadır ve 1. sayfa başlığı 2. sayfada yinelenmez", () => {
      const data = {
        dosyaKonusu: "Büyük Malzeme Alımı",
        evrakSayisi: "2026/102",
        sunulacakMakamAdi: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
        hazirlayanPersonelAdi: "Ali Veli",
        onaylayanPersonelAdi: "Ayşe Kaya",
        olurYazisi: true,
        ihtiyacKalemleri: generateItems(13),
      };

      const html = renderToString(<IhtiyacListesi data={data as any} />);

      // 2 adet sayfa container'ı oluşmalı
      const containerCount = (html.match(/class="document-container"/g) || []).length;
      expect(containerCount).toBe(2);

      // 1. sayfada Makam başlığı ve ilk 11 kalem bulunmalı
      expect(html).toContain("FEN İŞLERİ MÜDÜRLÜĞÜNE");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 1");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 11");

      // 2. sayfada son 2 kalem (12 ve 13) ve OLUR bloğu bulunmalı
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 12");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 13");
      expect(html).toContain("OLUR");
      expect(html).toContain("Ayşe Kaya");
    });

    it("50 kalem ile çoklu sayfada tüm kalemler eksiksiz basılır", () => {
      const data = {
        dosyaKonusu: "Toplu Temizlik Malzemesi",
        olurYazisi: true,
        ihtiyacKalemleri: generateItems(50),
      };

      const html = renderToString(<IhtiyacListesi data={data as any} />);

      const containerCount = (html.match(/class="document-container"/g) || []).length;
      expect(containerCount).toBeGreaterThanOrEqual(4);

      // İlk ve son kalem basılmış olmalı
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 1");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 50");
      expect(html).toContain("OLUR");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Lüzum Müzekkeresi Şablonu Testleri
  // --------------------------------------------------------------------------
  describe("3. LuzumMuzekkeresi Şablonu Sayfa Bölünmesi", () => {
    it("15 kalemlik Lüzum Müzekkeresi doğru sayfa adediyle bölünür", () => {
      const data = {
        dosyaKonusu: "Yedek Parça İhtiyacı",
        evrakSayisi: "2026/205",
        sunulacakMakamAdi: "BAŞKANLIK MAKAMINA",
        hazirlayanPersonelAdi: "Hasan Usta",
        onaylayanPersonelAdi: "İsmail Yetkili",
        olurYazisi: true,
        ihtiyacKalemleri: generateItems(15),
      };

      const html = renderToString(<LuzumMuzekkeresi data={data as any} />);
      const containerCount = (html.match(/class="document-container"/g) || []).length;
      expect(containerCount).toBe(2);
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 1");
      expect(html).toContain("Test Malzeme / Hizmet Kalemi 15");
      expect(html).toContain("OLUR");
    });
  });

  // --------------------------------------------------------------------------
  // 4. CSS Page-Break ve Break-Inside Kural Denetimleri
  // --------------------------------------------------------------------------
  describe("4. Yazdırma ve CSS Sayfa Kırılma Kuralları (break-inside / page-break)", () => {
    it("ApprovalSignature bileşeni break-inside: avoid ve page-break-inside: avoid kurallarını içerir", () => {
      const html = renderToString(
        <ApprovalSignature title="ONAY" adSoyad="Ali Veli" unvan="Müdür" />
      );

      expect(html).toContain("break-inside:avoid");
      expect(html).toContain("page-break-inside:avoid");
    });

    it("PersonelCard bileşeni imza bölünmesini engelleyen stillere sahiptir", () => {
      const html = renderToString(
        <PersonelCard adSoyad="Mehmet Can" unvan="Teknisyen" />
      );

      expect(html).toContain("break-inside:avoid");
      expect(html).toContain("page-break-inside:avoid");
    });

    it("CommissionList bileşeni komisyon üyelerinin sayfa ortasında bölünmesini engeller", () => {
      const html = renderToString(
        <CommissionList
          members={[
            { adSoyad: "Üye 1", unvan: "Mühendis" },
            { adSoyad: "Üye 2", unvan: "Tekniker" },
          ]}
        />
      );

      expect(html).toContain("break-inside:avoid");
      expect(html).toContain("page-break-inside:avoid");
    });

    it("MetadataBlock evrak başlığı sayfa ortasında bölünmez", () => {
      const html = renderToString(
        <MetadataBlock evrakSayisi="2026/1" tarih="17.10.2026" dosyaKonusu="Konu" />
      );

      expect(html).toContain("break-inside:avoid");
      expect(html).toContain("page-break-inside:avoid");
    });

    it("DocumentLayout son sayfa haricinde break-after: page ve page-break-after: always kurallarını uygular", () => {
      const htmlFirst = renderToString(
        <DocumentLayout pageNumber={1} totalPages={2}>
          <div>Sayfa 1</div>
        </DocumentLayout>
      );

      expect(htmlFirst).toContain("break-after:page");
      expect(htmlFirst).toContain("page-break-after:always");
      expect(htmlFirst).toContain("break-inside:avoid");

      const htmlLast = renderToString(
        <DocumentLayout pageNumber={2} totalPages={2}>
          <div>Sayfa 2</div>
        </DocumentLayout>
      );

      expect(htmlLast).toContain("break-after:avoid");
      expect(htmlLast).toContain("page-break-after:avoid");
    });

    it("SignatureBlockContainer imza kartlarını ve OLUR bloğunu tek parça tutarak bölünmeyi engeller", () => {
      const html = renderToString(
        <SignatureBlockContainer align="right" marginTop={30}>
          <PersonelCard adSoyad="Ali Veli" unvan="Mühendis" />
          <ApprovalSignature title="OLUR" adSoyad="Mehmet Müdür" unvan="Harcama Yetkilisi" />
        </SignatureBlockContainer>
      );

      expect(html).toContain("signature-block-container");
      expect(html).toContain("break-inside:avoid");
      expect(html).toContain("page-break-inside:avoid");
      expect(html).toContain("Ali Veli");
      expect(html).toContain("Mehmet Müdür");
    });
  });

  // --------------------------------------------------------------------------
  // 4. resolveSignatureAwareLimits İmza Bloğu Ağırlık Algoritması Testleri
  // --------------------------------------------------------------------------
  describe("4. resolveSignatureAwareLimits İmza Ağırlıklı Limit Çözümleme Algoritması", () => {
    it("Varsayılan durumda (imzasız/düz) DEFAULT_LIMITS değerlerini döner", () => {
      const limits = resolveSignatureAwareLimits({ orientation: "portrait" });
      expect(limits.firstPage).toBe(DEFAULT_LIMITS.firstPage);
      expect(limits.middle).toBe(DEFAULT_LIMITS.middle);
      expect(limits.lastPage).toBe(DEFAULT_LIMITS.lastPage);
    });

    it("OLUR bloğu olduğunda son sayfa satır limiti güvenli boşluk için 2 satır düşürülür (8 -> 6)", () => {
      const limits = resolveSignatureAwareLimits({
        orientation: "portrait",
        hasOlur: true,
      });
      expect(limits.lastPage).toBe(6);
      expect(limits.firstPage).toBe(DEFAULT_LIMITS.firstPage);
    });

    it("Hem OLUR hem Hazırlayan olduğunda son sayfa limiti 3 satır düşürülür (8 -> 5)", () => {
      const limits = resolveSignatureAwareLimits({
        orientation: "portrait",
        hasOlur: true,
        hasHazirlayan: true,
      });
      expect(limits.lastPage).toBe(5);
    });

    it("Geniş Komisyon (5 üye) olduğunda son sayfa satır limiti dengelenir", () => {
      const limits = resolveSignatureAwareLimits({
        orientation: "portrait",
        commissionCount: 5,
      });
      expect(limits.lastPage).toBe(6);
    });

    it("Yatay (landscape) modda OLUR bloğu için lastPage limiti 4'ten 3'e düşürülür", () => {
      const limits = resolveSignatureAwareLimits({
        orientation: "landscape",
        hasOlur: true,
      });
      expect(limits.lastPage).toBe(3);
    });

    it("Kullanıcı tarafından özel satır limiti tanımlanmışsa hesaplamayı ezer ve kullanıcı limitini korur", () => {
      const limits = resolveSignatureAwareLimits({
        orientation: "portrait",
        hasOlur: true,
        customLastPage: 7,
      });
      expect(limits.lastPage).toBe(7);
    });
  });
});
