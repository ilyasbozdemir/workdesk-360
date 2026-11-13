import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DanismanlikIhtiyacTalepFormu,
  DanismanlikIhtiyacTalepFormuSchema,
  HizmetAlimiIhtiyacTalepFormu,
  HizmetAlimiIhtiyacTalepFormuSchema,
  IhtiyacTalepFormu,
  MalAlimiIhtiyacTalepFormu,
  MalAlimiIhtiyacTalepFormuSchema,
  YapimIsleriIhtiyacTalepFormu,
  YapimIsleriIhtiyacTalepFormuSchema,
} from "../index";

describe("İhtiyaç Talep Formu — Alım Türü Modüler Şablonları Testleri", () => {
  const baseData = {
    antetSatirlari: ["T.C.", "ÖRNEK BELEDİYE BAŞKANLIĞI"],
    evrakSayisi: "E-12345678-934.01-0001",
    tarih: "2026-11-09",
    dosyaKonusu: "Doğrudan Temin İhtiyaç Talep Formu",
    ihtiyacYeri: "Fen İşleri Müdürlüğü",
    talepEdenBirim: "Fen İşleri Müdürlüğü",
    hazirlayanPersonelAdi: "Ahmet YILMAZ",
    hazirlayanPersonelUnvan: "İnşaat Mühendisi",
    talepEdenPersonelAdi: "Ahmet YILMAZ",
    talepEdenPersonelUnvan: "İnşaat Mühendisi",
    onaylayanPersonelAdi: "Mehmet KAYA",
    onaylayanPersonelUnvan: "Harcama Yetkilisi",
    gerekce: "Müdürlüğümüz büro ve saha faaliyetlerinin aksamadan yürütülebilmesi",
  };

  it("1. MalAlimiIhtiyacTalepFormu: Taşınır kodu ve Malzeme Adı kolonlarıyla formu render eder", () => {
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

    const parsed = MalAlimiIhtiyacTalepFormuSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(<MalAlimiIhtiyacTalepFormu data={data} />);
    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("TAŞINIR KODU");
    expect(html).toContain("MALZEME ADI");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("Fen İşleri Müdürlüğü");
    expect(html).toContain("Ahmet YILMAZ");
  });

  it("2. HizmetAlimiIhtiyacTalepFormu: Hizmet Kodu ve Hizmetin Adı kolonlarıyla render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "hizmet",
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

    const parsed = HizmetAlimiIhtiyacTalepFormuSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(
      <HizmetAlimiIhtiyacTalepFormu data={data} />
    );
    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("HİZMET KODU");
    expect(html).toContain("HİZMETİN ADI");
    expect(html).toContain("Bina Temizlik Hizmeti");
  });

  it("3. DanismanlikIhtiyacTalepFormu: Danışmanlık Konusu kolonlarıyla render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "danismanlik",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          kodu: "DNS-101",
          danismanlikKonusu: "İmar Planı Değişikliği Danışmanlığı",
          ozelligi: "1/5000 ve 1/1000 revizyon analizi",
          birimi: "Adam-Ay",
          kdvOrani: 20,
          miktar: 3,
        },
      ],
    };

    const parsed = DanismanlikIhtiyacTalepFormuSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(
      <DanismanlikIhtiyacTalepFormu data={data} />
    );
    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("HİZMET KODU");
    expect(html).toContain("DANIŞMANLIK HİZMETİNİN KONUSU");
    expect(html).toContain("İmar Planı Değişikliği Danışmanlığı");
  });

  it("4. YapimIsleriIhtiyacTalepFormu: Poz No ve İmalat Adı kolonlarıyla render eder", () => {
    const data = {
      ...baseData,
      alimTuru: "yapim",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "Y.15.001/2B",
          kalemAdi: "Düz Yüzeyli Beton İmalatı (C25/30)",
          ozelligi: "Santral üretimi hazır beton",
          birimi: "m³",
          kdvOrani: 20,
          miktar: 150,
        },
      ],
    };

    const parsed = YapimIsleriIhtiyacTalepFormuSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const html = renderToStaticMarkup(
      <YapimIsleriIhtiyacTalepFormu data={data} />
    );
    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("POZ NO");
    expect(html).toContain("İMALAT / İŞ KALEMİ ADI");
    expect(html).toContain("Düz Yüzeyli Beton İmalatı (C25/30)");
  });

  it("5. Ana IhtiyacTalepFormu: alimTuru prop veya veriden otomatik yönlendirme yapar", () => {
    const malHtml = renderToStaticMarkup(
      <IhtiyacTalepFormu
        data={{
          ...baseData,
          alimTuru: "mal",
          ihtiyacKalemleri: [
            { siraNo: 1, malzemeAdi: "Kalem 1", miktar: 1, birimi: "Adet" },
          ],
        }}
      />
    );
    expect(malHtml).toContain("MALZEME ADI");

    const yapimHtml = renderToStaticMarkup(
      <IhtiyacTalepFormu
        data={{
          ...baseData,
          alimTuru: "yapim",
          ihtiyacKalemleri: [
            { siraNo: 1, kalemAdi: "İmalat 1", miktar: 1, birimi: "m³" },
          ],
        }}
      />
    );
    expect(yapimHtml).toContain("İMALAT / İŞ KALEMİ ADI");
  });
});

