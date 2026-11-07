import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  usePiyasaFiyatArastirmaTutanagi,
  type UsePiyasaFiyatArastirmaTutanagiResult,
} from "../PiyasaFiyatArastirmaTutanagi.hook";

function runHook(
  data: Record<string, any>,
): UsePiyasaFiyatArastirmaTutanagiResult {
  let captured!: UsePiyasaFiyatArastirmaTutanagiResult;
  function Probe() {
    captured = usePiyasaFiyatArastirmaTutanagi(data);
    return null;
  }
  renderToStaticMarkup(React.createElement(Probe));
  return captured;
}

describe("Piyasa Fiyat Araştırma Tutanağı — Mapping ve Parasal Hesaplama Testleri", () => {
  it("en düşük teklifi, kalem toplam bedelini, firma toplamlarını ve genel toplamı veri hazırlama katmanında (hook) doğru hesaplar", () => {
    const result = runHook({
      kurumAdi: "Örnek Valiliği",
      isinAdi: "Büro Malzemesi Alımı",
      alimTuru: "Mal Alımı",
      firmalar: [
        { unvan: "Alfa Tedarik Ltd." },
        { unvan: "Beta Kırtasiye A.Ş." },
        { unvan: "Gama Büro Ltd." },
      ],
      kalemler: [
        {
          siraNo: 1,
          malzemeAdi: "A4 Fotokopi Kağıdı",
          ozelligi: "80 gr",
          birimi: "Paket",
          miktar: 50,
          firmaTeklifleriDetay: [
            { birimFiyat: 120 }, // 50 * 120 = 6.000,00 (En düşük)
            { birimFiyat: 140 }, // 50 * 140 = 7.000,00
            { birimFiyat: 130 }, // 50 * 130 = 6.500,00
          ],
        },
        {
          siraNo: 2,
          malzemeAdi: "Telli Dosya",
          ozelligi: "Mavi",
          birimi: "Adet",
          miktar: 200,
          firmaTeklifleriDetay: [
            { birimFiyat: 18 }, // 200 * 18 = 3.600,00
            { birimFiyat: 15.5 }, // 200 * 15,5 = 3.100,00 (En düşük)
            { birimFiyat: 20 }, // 200 * 20 = 4.000,00
          ],
        },
      ],
    });

    expect(result.isBasligi).toBe("Alınan Malın Adı, Niteliği:");
    expect(result.processedKalemler).toHaveLength(2);

    // 1. Kalem: En uygun Alfa Tedarik Ltd. (120,00 -> Toplam: 6.000,00)
    expect(result.processedKalemler[0].enUygunFirmaAdi).toBe(
      "Alfa Tedarik Ltd.",
    );
    expect(result.processedKalemler[0].enDusukFiyat).toBe("120,00");
    expect(result.processedKalemler[0].toplamBedel).toBe("6.000,00");

    // 2. Kalem: En uygun Beta Kırtasiye A.Ş. (15,50 -> Toplam: 3.100,00)
    expect(result.processedKalemler[1].enUygunFirmaAdi).toBe(
      "Beta Kırtasiye A.Ş.",
    );
    expect(result.processedKalemler[1].enDusukFiyat).toBe("15,50");
    expect(result.processedKalemler[1].toplamBedel).toBe("3.100,00");

    // Firma toplamları:
    // Alfa: 6.000 + 3.600 = 9.600,00
    // Beta: 7.000 + 3.100 = 10.100,00
    // Gama: 6.500 + 4.000 = 10.500,00
    expect(result.displayFirmaToplamlari.map((f) => f.toplam)).toEqual([
      "9.600,00",
      "10.100,00",
      "10.500,00",
    ]);

    // Genel toplam (en düşük kalem bedelleri toplamı: 6.000 + 3.100 = 9.100,00)
    expect(result.formattedGenelToplam).toBe("9.100,00");
  });

  it("teklif verisi boş, null veya '-' olduğunda NaN üretmeden '-' veya '0,00' döndürür", () => {
    const result = runHook({
      firmalar: [{ unvan: "Tek Firma" }],
      kalemler: [
        {
          siraNo: 1,
          malzemeAdi: "Teklifsiz Kalem",
          miktar: 10,
          firmaTeklifleriDetay: [{ birimFiyat: null }],
        },
      ],
    });

    expect(result.processedKalemler[0].enDusukFiyat).toBe("-");
    expect(result.processedKalemler[0].toplamBedel).toBe("-");
    expect(result.formattedGenelToplam).not.toContain("NaN");
  });

  it("React şablonu (.template.tsx) içinde parasal çarpma/toplama hesabı yapılmaz, hesaplanmış hook çıktısını kullanır", () => {
    const templatePath = path.resolve(
      __dirname,
      "../PiyasaFiyatArastirmaTutanagi.template.tsx",
    );
    const source = fs.readFileSync(templatePath, "utf-8");

    expect(source).toContain("usePiyasaFiyatArastirmaTutanagi");
    // Şablonda birimFiyat * miktar gibi doğrudan parasal çarpım olmamalı
    expect(source).not.toMatch(/birimFiyat\s*\*\s*miktar/);
    expect(source).not.toMatch(/minTutar\s*\*\s*miktarNum/);
  });
});
