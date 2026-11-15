import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KomisyonGorevlendirmeOnayiEki } from "../KomisyonGorevlendirmeOnayiEki.template";
import { formatAlimTuru } from "../KomisyonGorevlendirmeOnayiEki.hook";
import { getTemplateDefinition } from "../../../registry";

describe("KomisyonGorevlendirmeOnayiEki — Şablon Bileşen Render Testleri", () => {
  it("1. formatAlimTuru alım türü çeşitlerini doğru standart ifadelere dönüştürür", () => {
    expect(formatAlimTuru("mal")).toBe("mal alımı");
    expect(formatAlimTuru("hizmet")).toBe("hizmet alımı");
    expect(formatAlimTuru("yapim")).toBe("yapım işi");
    expect(formatAlimTuru("danismanlik")).toBe("danışmanlık hizmet alımı");
    expect(formatAlimTuru(undefined, "mal")).toBe("mal alımı");
  });

  it("2. Ek numarası, gövde paragrafı ve komisyon tabloları başarıyla render edilir", () => {
    const mockData = {
      ekNo: "3",
      alimTuru: "mal alımı",
      kurumumuz: "Kadıköy Belediyesi Destek Hizmetleri",
      fiyatKomisyonu: [
        { adSoyad: "Münir Özkul", unvan: "Mühendis", gorevi: "Başkan" },
      ],
      muayeneKomisyonu: [
        { adSoyad: "Adile Naşit", unvan: "Tekniker", gorevi: "Üye" },
      ],
    };

    const html = renderToStaticMarkup(<KomisyonGorevlendirmeOnayiEki data={mockData} />);

    expect(html).toContain("EK:");
    expect(html).toContain("3");
    expect(html).toContain("Kadıköy Belediyesi Destek Hizmetleri");
    expect(html).toContain("mal alımı");
    expect(html).toContain("PİYASA ARAŞTIRMA VE SATINALMA KOMİSYONU");
    expect(html).toContain("Münir Özkul");
    expect(html).toContain("MUAYENE KABUL VE TESLİM ALMA KOMİSYONU");
    expect(html).toContain("Adile Naşit");
  });

  it("3. Template Registry üzerinden `komisyon-gorevlendirme-onayi-eki` tanımı çözümlenir", () => {
    const def = getTemplateDefinition("komisyon-gorevlendirme-onayi-eki");
    expect(def).toBeDefined();
    expect(def?.id).toBe("komisyon-gorevlendirme-onayi-eki");
  });
});
