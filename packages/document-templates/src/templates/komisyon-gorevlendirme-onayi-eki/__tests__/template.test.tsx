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

    const html = renderToStaticMarkup(
      <KomisyonGorevlendirmeOnayiEki data={mockData} />,
    );

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

  it("4. Harcama Yetkilisi onay ekinde komisyon tablosunda listelenmez ve onay ekinde hiçbir imza kartı yer almaz", () => {
    const mockData = {
      baskanAdi: "Kemal Bey Harcama Yetkilisi",
      baskanUnvan: "Harcama Yetkilisi",
      fiyatKomisyonu: [
        { adSoyad: "Kemal Bey Harcama Yetkilisi", unvan: "Harcama Yetkilisi", gorevi: "Harcama Yetkilisi" },
        { adSoyad: "Zeki Memur", unvan: "Memur", gorevi: "Üye" },
      ],
      muayeneKomisyonu: [
        { adSoyad: "Gerçekleştirme Görevlisi Ali", unvan: "Gerçekleştirme Görevlisi", gorevi: "Gerçekleştirme" },
        { adSoyad: "Metin Tekniker", unvan: "Tekniker", gorevi: "Üye" },
      ],
    };

    const html = renderToStaticMarkup(<KomisyonGorevlendirmeOnayiEki data={mockData} />);

    // Sadece gerçek komisyon personelleri yer alır
    expect(html).toContain("Zeki Memur");
    expect(html).toContain("Metin Tekniker");

    // Harcama yetkilisi ve gerçekleştirme personeli komisyon tablosunda bulunmamalıdır
    expect(html).not.toContain("Kemal Bey Harcama Yetkilisi</td>");
    expect(html).not.toContain("Gerçekleştirme Görevlisi Ali</td>");

    // Onay ekinde hiçbir alt imza kartı veya imza bloğu olmamalıdır
    expect(html).not.toContain("PersonelCard");
    expect(html).not.toContain("preparer-signature");
  });
});
