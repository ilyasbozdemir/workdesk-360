import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LuzumMuzekkeresiOnayEki } from "../LuzumMuzekkeresiOnayEki.template";
import { MalAlimiLuzumMuzekkeresiOnayEki } from "../MalAlimi/MalAlimiLuzumMuzekkeresiOnayEki";
import { HizmetAlimiLuzumMuzekkeresiOnayEki } from "../HizmetAlimi/HizmetAlimiLuzumMuzekkeresiOnayEki";
import { DanismanlikLuzumMuzekkeresiOnayEki } from "../DanismanlikHizmetAlimi/DanismanlikLuzumMuzekkeresiOnayEki";
import { YapimIsleriLuzumMuzekkeresiOnayEki } from "../YapimIsleri/YapimIsleriLuzumMuzekkeresiOnayEki";

describe("LuzumMuzekkeresiOnayEki — Alım Türü Varyantları", () => {
  const baseData = {
    ekNo: "1",
    kurumMetni: "Belediyemiz",
    talepEdenPersonelAdi: "Mustafa Çelik",
    talepEdenPersonelUnvan: "Şube Müdürü",
    ihtiyacKalemleri: [
      {
        siraNo: 1,
        kodu: "150.01.01",
        malzemeAdi: "Dosya Teli",
        ozelligi: "Plastik Kaplamalı",
        birimi: "Kutu",
        kdvOrani: 20,
        miktar: 100,
      },
    ],
    dosyaTarihi: "14.11.2026",
  };

  it("1. Mal Alımı varyantı doğru başlık ve 'Taşınır Kodu' sütununu içerir", () => {
    const html = renderToString(
      <MalAlimiLuzumMuzekkeresiOnayEki data={baseData} />,
    );
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Taşınır Kodu");
    expect(html).toContain("Dosya Teli");
    expect(html).toContain("Mustafa Çelik");
  });

  it("2. Hizmet Alımı varyantı 'Hizmet Kodu' ve 'Hizmet Adı / İşin Tanımı' sütunlarını içerir", () => {
    const html = renderToString(
      <HizmetAlimiLuzumMuzekkeresiOnayEki data={baseData} />,
    );
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Hizmet Kodu");
    expect(html).toContain("Hizmet Adı / İşin Tanımı");
  });

  it("3. Danışmanlık varyantı 'Danışmanlık Konusu' sütununu içerir", () => {
    const html = renderToString(
      <DanismanlikLuzumMuzekkeresiOnayEki data={baseData} />,
    );
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Danışmanlık Konusu");
  });

  it("4. Yapım İşleri varyantı 'Poz / İş Kalemi No' ve 'İmalat Adı / İş Kalemi' sütunlarını içerir", () => {
    const html = renderToString(
      <YapimIsleriLuzumMuzekkeresiOnayEki data={baseData} />,
    );
    expect(html).toContain("LÜZUM MÜZEKKERESİ");
    expect(html).toContain("Poz / İş Kalemi No");
    expect(html).toContain("İmalat Adı / İş Kalemi");
  });

  it("5. Ana LuzumMuzekkeresiOnayEki alimTuru='hizmet' verildiğinde otomatik Hizmet varyantını çizer", () => {
    const html = renderToString(
      <LuzumMuzekkeresiOnayEki data={{ ...baseData, alimTuru: "hizmet" }} />,
    );
    expect(html).toContain("Hizmet Kodu");
    expect(html).toContain("Hizmet Adı / İşin Tanımı");
  });
});
