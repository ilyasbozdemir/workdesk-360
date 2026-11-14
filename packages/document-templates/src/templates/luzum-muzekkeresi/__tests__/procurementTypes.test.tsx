import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DanismanlikLuzumMuzekkeresi,
  DanismanlikLuzumMuzekkeresiSchema,
  HizmetAlimiLuzumMuzekkeresi,
  HizmetAlimiLuzumMuzekkeresiSchema,
  LuzumMuzekkeresi,
  MalAlimiLuzumMuzekkeresi,
  MalAlimiLuzumMuzekkeresiSchema,
  YapimIsleriLuzumMuzekkeresi,
  YapimIsleriLuzumMuzekkeresiSchema,
} from "../index";

describe("Lüzum Müzekkeresi — Alım Türü Modüler Şablonları Testleri", () => {
  const baseData = {
    antetSatirlari: ["T.C.", "ÖRNEK BELEDİYE BAŞKANLIĞI"],
    evrakSayisi: "E-12345678-934.01-0001",
    tarih: "2026-11-14",
    dosyaKonusu: "Lüzum Müzekkeresi",
    sunulacakMakamAdi: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
    ihtiyacYeri: "Fen İşleri Müdürlüğü",
    talepEdenPersonelAdi: "Ali ÇELİK",
    talepEdenPersonelUnvan: "Birim Sorumlusu",
    hazirlayanPersonelAdi: "Ahmet YILMAZ",
    hazirlayanPersonelUnvan: "İnşaat Mühendisi",
    onaylayanPersonelAdi: "Mehmet KAYA",
    onaylayanPersonelUnvan: "Harcama Yetkilisi",
  };

  it("1. MalAlimiLuzumMuzekkeresi: Malzeme Adı ve Kodu kolonlarıyla mal metnini render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "mal",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          kodu: "150.01.01",
          malzemeAdi: "A4 Fotokopi Kağıdı",
          ozelligi: "80 gr/m² beyaz",
          birimi: "Paket",
          kdvOrani: 20,
          miktar: 50,
        },
      ],
    };

    const parsed = MalAlimiLuzumMuzekkeresiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<MalAlimiLuzumMuzekkeresi data={data} />);
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Malzeme Adı");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("mal kalemlerinin temin");
  });

  it("2. HizmetAlimiLuzumMuzekkeresi: Hizmet Kodu ve Hizmetin Adı kolonlarıyla hizmet metnini render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "hizmet",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          hizmetKodu: "HZ-01",
          kalemAdi: "Yazılım Bakım ve Destek Hizmeti",
          ozelligi: "12 Aylık SLA Garantili",
          birimi: "Ay",
          kdvOrani: 20,
          miktar: 12,
        },
      ],
    };

    const parsed = HizmetAlimiLuzumMuzekkeresiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<HizmetAlimiLuzumMuzekkeresi data={data} />);
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Hizmetin Adı");
    expect(html).toContain("Yazılım Bakım ve Destek Hizmeti");
    expect(html).toContain("hizmet kalemlerinin temin");
  });

  it("3. DanismanlikLuzumMuzekkeresi: Danışmanlık Hizmetinin Konusu kolonlarıyla danışmanlık metnini render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "danismanlik",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          danismanlikKonusu: "Kentsel Dönüşüm Hukuki Danışmanlığı",
          ozelligi: "Hukuksal süreç raporlaması",
          birimi: "Ay",
          kdvOrani: 20,
          miktar: 6,
        },
      ],
    };

    const parsed = DanismanlikLuzumMuzekkeresiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<DanismanlikLuzumMuzekkeresi data={data} />);
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Danışmanlık Hizmetinin Konusu");
    expect(html).toContain("Kentsel Dönüşüm Hukuki Danışmanlığı");
    expect(html).toContain("danışmanlık hizmet kalemlerinin temin");
  });

  it("4. YapimIsleriLuzumMuzekkeresi: Poz No ve İmalat Adı kolonlarıyla yapım metnini render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "yapim",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "Y.15.001/2B",
          kalemAdi: "Demirli Beton İmalatı",
          ozelligi: "C25/30 hazır beton dökümü",
          birimi: "m³",
          kdvOrani: 20,
          miktar: 120,
        },
      ],
    };

    const parsed = YapimIsleriLuzumMuzekkeresiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<YapimIsleriLuzumMuzekkeresi data={data} />);
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Poz No / İş Kalemi No");
    expect(html).toContain("İmalat / İş Kalemi Adı");
    expect(html).toContain("Demirli Beton İmalatı");
    expect(html).toContain("yapım / imalat iş kalemlerinin temin");
  });

  it("5. Ana LuzumMuzekkeresi Şablonu: alimTuru alanına göre otomatik yönlendirir", () => {
    const yapimData = {
      ...baseData,
      alimTuru: "yapim",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "15.001",
          kalemAdi: "İstinat Duvarı Yapımı",
          birimi: "m³",
          miktar: 40,
        },
      ],
    };

    const html = renderToStaticMarkup(<LuzumMuzekkeresi data={yapimData} />);
    expect(html).toContain("Poz No / İş Kalemi No");
    expect(html).toContain("İstinat Duvarı Yapımı");

    const malData = {
      ...baseData,
      alimTuru: "mal",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          malzemeAdi: "Yazıcı Kartuşu",
          birimi: "Adet",
          miktar: 5,
        },
      ],
    };

    const malHtml = renderToStaticMarkup(<LuzumMuzekkeresi data={malData} />);
    expect(html).not.toContain("Yazıcı Kartuşu");
    expect(malHtml).toContain("Yazıcı Kartuşu");
    expect(malHtml).toContain("Malzeme Adı");
  });
});
