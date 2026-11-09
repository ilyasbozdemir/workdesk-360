import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  IhtiyacListesi,
  MalAlimiIhtiyacListesi,
  HizmetAlimiIhtiyacListesi,
  DanismanlikIhtiyacListesi,
  YapimIsleriIhtiyacListesi,
  MalAlimiIhtiyacListesiSchema,
  HizmetAlimiIhtiyacListesiSchema,
  DanismanlikIhtiyacListesiSchema,
  YapimIsleriIhtiyacListesiSchema,
} from "../index";

describe("İhtiyaç Listesi — Alım Türü Modüler Şablonları Testleri", () => {
  const baseData = {
    antetSatirlari: ["T.C.", "ÖRNEK BELEDİYE BAŞKANLIĞI"],
    evrakSayisi: "E-12345678-934.01-0001",
    tarih: "2026-11-09",
    dosyaKonusu: "Doğrudan Temin İhtiyaç Listesi",
    sunulacakMakamAdi: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
    ihtiyacYeri: "Fen İşleri Müdürlüğü",
    hazirlayanPersonelAdi: "Ahmet YILMAZ",
    hazirlayanPersonelUnvan: "İnşaat Mühendisi",
    onaylayanPersonelAdi: "Mehmet KAYA",
    onaylayanPersonelUnvan: "Harcama Yetkilisi",
  };

  it("1. MalAlimiIhtiyacListesi: Taşınır kodu ve Malzeme Adı kolonlarıyla mal metnini render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "mal",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          tasinirKodu: "150.01.01",
          malzemeAdi: "A4 Fotokopi Kağıdı",
          ozelligi: "80 gr/m² beyaz",
          birimi: "Paket",
          kdvOrani: 20,
          miktar: 50,
        },
      ],
    };

    const parsed = MalAlimiIhtiyacListesiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<MalAlimiIhtiyacListesi data={data} />);
    expect(html).toContain("Taşınır Kodu");
    expect(html).toContain("Malzeme Adı");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("aşağıda yazılı mal kalemlerinin temin");
  });

  it("2. HizmetAlimiIhtiyacListesi: Hizmet Kodu ve Hizmetin Adı kolonlarıyla hizmet metnini render eder", () => {
    const data = {
      ...baseData,
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          hizmetKodu: "HZM-001",
          kalemAdi: "Bina Temizlik Hizmeti",
          ozelligi: "Haftalık periyodik genel temizlik",
          birimi: "Ay",
          kdvOrani: 20,
          miktar: 12,
        },
      ],
    };

    const parsed = HizmetAlimiIhtiyacListesiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<HizmetAlimiIhtiyacListesi data={data} />);
    expect(html).toContain("Hizmet Kodu");
    expect(html).toContain("Hizmetin Adı");
    expect(html).toContain("Bina Temizlik Hizmeti");
    expect(html).toContain("aşağıda yazılı hizmet kalemlerinin temin");
  });

  it("3. DanismanlikIhtiyacListesi: Danışmanlık Konusu kolonlarıyla danışmanlık metnini render eder", () => {
    const data = {
      ...baseData,
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          kodu: "DNS-101",
          kalemAdi: "İmar Planı Değişikliği Danışmanlığı",
          ozelligi: "1/5000 ve 1/1000 revizyon analizi",
          birimi: "Adam-Ay",
          kdvOrani: 20,
          miktar: 3,
        },
      ],
    };

    const parsed = DanismanlikIhtiyacListesiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<DanismanlikIhtiyacListesi data={data} />);
    expect(html).toContain("Danışmanlık Hizmetinin Konusu");
    expect(html).toContain("İmar Planı Değişikliği Danışmanlığı");
    expect(html).toContain("aşağıda yazılı danışmanlık hizmet kalemlerinin temin");
  });

  it("4. YapimIsleriIhtiyacListesi: Poz No, İmalat Adı, Ölçü Birimi ile yapım metnini render eder", () => {
    const data = {
      ...baseData,
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "Y.15.001/2B",
          imalatAdi: "C25/30 Hazır Beton Dökülmesi",
          ozelligi: "Pompalı, vibratör ile sıkıştırma dahil",
          olcuBirimi: "m³",
          kdvOrani: 20,
          miktar: 120,
        },
      ],
    };

    const parsed = YapimIsleriIhtiyacListesiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<YapimIsleriIhtiyacListesi data={data} />);
    expect(html).toContain("Poz No / İş Kalemi No");
    expect(html).toContain("İmalat / İş Kalemi Adı");
    expect(html).toContain("Y.15.001/2B");
    expect(html).toContain("C25/30 Hazır Beton Dökülmesi");
    expect(html).toContain("aşağıda yazılı yapım / imalat iş kalemlerinin temin");
  });

  it("5. Ana IhtiyacListesi alimTuru prop veya verisine göre alt şablona otomatik yönlendirir", () => {
    const yapimData = {
      ...baseData,
      alimTuru: "Yapım İşi",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "Y.21.001",
          kalemAdi: "Tuğla Duvar Örülmesi",
          birimi: "m²",
          miktar: 80,
        },
      ],
    };

    const htmlYapim = renderToStaticMarkup(<IhtiyacListesi data={yapimData} />);
    expect(htmlYapim).toContain("Poz No / İş Kalemi No");
    expect(htmlYapim).toContain("Tuğla Duvar Örülmesi");

    const hizmetData = {
      ...baseData,
      tur: "hizmet",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          kalemAdi: "Özel Güvenlik Hizmeti",
          birimi: "Kişi",
          miktar: 4,
        },
      ],
    };

    const htmlHizmet = renderToStaticMarkup(<IhtiyacListesi data={hizmetData} />);
    expect(htmlHizmet).toContain("Hizmetin Adı");
    expect(htmlHizmet).toContain("Özel Güvenlik Hizmeti");
  });
});
