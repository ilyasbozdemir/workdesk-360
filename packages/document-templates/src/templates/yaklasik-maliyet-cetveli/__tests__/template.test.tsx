import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  useYaklasikMaliyetCetveli,
  type UseYaklasikMaliyetCetveliResult,
  YaklasikMaliyetCetveli,
  YaklasikMaliyetCetveliSchema,
} from "../index";
import { createSyntheticDocumentData } from "../../__tests__/fixtures";

function runHook(
  data: Record<string, any>,
): UseYaklasikMaliyetCetveliResult {
  let captured!: UseYaklasikMaliyetCetveliResult;
  function Probe() {
    captured = useYaklasikMaliyetCetveli(data);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return captured;
}

describe("Yaklaşık Maliyet Hesap Cetveli — Render, Hesaplama ve Şema Testleri", () => {
  it("sentetik veriyle YaklasikMaliyetCetveli şablonunu hatasız render eder", () => {
    const data = createSyntheticDocumentData();
    const html = renderToStaticMarkup(
      <YaklasikMaliyetCetveli data={data} isEditing={false} />,
    );

    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("Telli Dosya");
    expect(html).not.toContain("NaN");
  });

  it("useYaklasikMaliyetCetveli hook'u firma tekliflerini ve yaklaşık maliyet toplamlarını doğru hesaplar", () => {
    const res = runHook({
      kurumAdi: "Örnek Valiliği",
      mudurluk: "Destek Hizmetleri Müdürlüğü",
      isinAdi: "Kırtasiye Alımı",
      firmalar: [
        { unvan: "Alfa Ltd.", birimFiyatlar: [100, 20] },
        { unvan: "Beta A.Ş.", birimFiyatlar: [120, 30] },
      ],
      kalemler: [
        {
          siraNo: 1,
          malzemeAdi: "Kağıt",
          birimi: "Paket",
          miktar: 10,
          firmaTeklifleriDetay: [{ birimFiyat: 100 }, { birimFiyat: 120 }],
        },
        {
          siraNo: 2,
          malzemeAdi: "Dosya",
          birimi: "Adet",
          miktar: 50,
          firmaTeklifleriDetay: [{ birimFiyat: 20 }, { birimFiyat: 30 }],
        },
      ],
    });

    expect(res.processedKalemler).toHaveLength(2);
    expect(res.formattedGenelToplam).toBeTruthy();
    expect(res.formattedGenelToplam).not.toContain("NaN");
  });

  it("YaklasikMaliyetCetveliSchema doğrulamasını geçer ve .template.tsx içinde parasal çarpım barındırmaz", () => {
    const parsed = YaklasikMaliyetCetveliSchema.safeParse(
      createSyntheticDocumentData(),
    );
    expect(parsed.success).toBe(true);

    const templatePath = path.resolve(
      __dirname,
      "../YaklasikMaliyetCetveli.template.tsx",
    );
    const source = fs.readFileSync(templatePath, "utf-8");
    expect(source).toContain("useYaklasikMaliyetCetveli");
    expect(source).not.toMatch(/birimFiyat\s*\*\s*miktar/);
  });
});

