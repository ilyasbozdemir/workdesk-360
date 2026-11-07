# TEMİN 360 — Belge Şablonları Test Kapsam Raporu

**Tarih:** 2026-11-07  
**Kapsam:** `@temin360/document-templates` (`packages/document-templates`) ve `@worksuite-360/document-engine` (`packages/document-engine`)

---

## 1. Test Altyapısı ve Mimari Düzen

Belge şablonlarının testleri, şablon dosyalarının yanında (`__tests__/`) konumlandırılmış (co-located) ve ayrıca tüm kayıtlı 31 şablon anahtarı için parametrik sözleşme testleriyle desteklenmiştir:

```text
packages/document-templates/src/
├── templates/
│   ├── __tests__/
│   │   ├── fixtures.ts
│   │   └── allTemplatesContract.test.tsx
│   ├── ihtiyac-listesi/
│   │   ├── index.ts
│   │   ├── IhtiyacListesi.template.tsx
│   │   ├── IhtiyacListesi.hook.ts
│   │   ├── IhtiyacListesi.schema.ts
│   │   ├── route.definition.ts
│   │   └── __tests__/
│   │       ├── template.test.tsx
│   │       ├── mapping.test.ts
│   │       ├── route.test.ts
│   │       └── snapshot.test.ts
│   ├── piyasa-fiyat-arastirma-tutanagi/
│   │   └── __tests__/
│   │       ├── template.test.tsx
│   │       ├── mapping.test.ts
│   │       ├── route.test.ts
│   │       └── snapshot.test.ts
│   └── yaklasik-maliyet-cetveli/
│       └── __tests__/
│           └── template.test.tsx
```

---

## 2. Eklenen Test Dosyaları

| Dosya Yolu | Test Sayısı | Kapsanan Boyutlar |
| :--- | :---: | :--- |
| `packages/document-templates/src/templates/__tests__/fixtures.ts` | Yardımcı | Sentetik kurum/personel/kalem/firma verisi ve bellek-içi `DocumentStorageAdapter` |
| `packages/document-templates/src/templates/ihtiyac-listesi/__tests__/template.test.tsx` | 7 | Render, `olurYazisi` görünürlüğü, çoklu sayfa bölünmesi, `null`/`undefined` dayanıklılığı, Zod şema doğrulaması, `DocumentEngine.compileHtml` A4 PDF uyumluluğu |
| `packages/document-templates/src/templates/ihtiyac-listesi/__tests__/mapping.test.ts` | 6 | `IhtiyacListesiResolver` SQLite mapping, personel fallback, `normalizeIhtiyacKalemleri`, `formatTurkishNumber`, `resolveIhtiyacListesiLimits`, `resolveTemplateData` |
| `packages/document-templates/src/templates/ihtiyac-listesi/__tests__/route.test.ts` | 5 | `ihtiyacListesiRoute`, `resolveRoute` (`document` vs `settings` önceliği), kaynak fallback, `mergeRouteOverrides`, `applyResolvedRouteToDocumentData`, `validateRoute` |
| `packages/document-templates/src/templates/ihtiyac-listesi/__tests__/snapshot.test.ts` | 4 | Önizlemede erken kayıt yapmama (`persistIfMissing: false`), `saveDocument` kalıcılığı, yeniden açılışta (`loadOrCreateDocument`) koruma, `syncWithSource` ve `smartMergeDocumentData` |
| `packages/document-templates/src/templates/piyasa-fiyat-arastirma-tutanagi/__tests__/template.test.tsx` | 4 | Render, boş veri dayanıklılığı, Zod şema, A4 yatay PDF uyumluluğu |
| `packages/document-templates/src/templates/piyasa-fiyat-arastirma-tutanagi/__tests__/mapping.test.ts` | 3 | `usePiyasaFiyatArastirmaTutanagi` en düşük teklif, kalem toplamı, firma toplamları, genel toplam hesabı ve `.template.tsx` içinde ham matematik bulunmadığının kontrolü |
| `packages/document-templates/src/templates/piyasa-fiyat-arastirma-tutanagi/__tests__/route.test.ts` | 2 | `piyasaFiyatRoute` `komisyon` (`person-list`) + `onaylayan` (`person`) çözümü ve override köprüsü |
| `packages/document-templates/src/templates/piyasa-fiyat-arastirma-tutanagi/__tests__/snapshot.test.ts` | 1 | Kaydetme, yeniden açma ve `syncWithSource` sonrası kullanıcı açıklaması ve onay makamının korunması |
| `packages/document-templates/src/templates/yaklasik-maliyet-cetveli/__tests__/template.test.tsx` | 3 | Render, `useYaklasikMaliyetCetveli` parasal hesaplama katmanı doğrulaması, Zod şema ve `.template.tsx` izolasyonu |
| `packages/document-templates/src/templates/__tests__/allTemplatesContract.test.tsx` | 126 | Kayıtlı tüm 31 şablon için parametrik Render, PDF/A4 `compileHtml`, Mapping (`resolveTemplateData`), Schema (`DocumentValidationService`), Route (`resolveRoute` + `applyResolvedRouteToDocumentData`), Snapshot/Refresh (`smartMergeDocumentData`) ve SQL izolasyonu |

---

## 3. Şablon Bazında Test Kapsam Tablosu

| # | Şablon Anahtarı (`templateRegistry`) | Klasör | Render & A4 PDF | Mapping | Schema | Route | Snapshot & Refresh | Parasal Hesaplama (Hook) |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :-: | :-: |
| 1 | `ihtiyac_listesi` | `templates/ihtiyac-listesi` | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | N/A (Miktar formatlama ✅) |
| 2 | `piyasa_fiyat_arastirma_tutanagi` | `templates/piyasa-fiyat-arastirma-tutanagi` | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (Özel + Parametrik) | ✅ (`usePiyasaFiyatArastirmaTutanagi`) |
| 3 | `yaklasik_maliyet_cetveli` | `templates/yaklasik-maliyet-cetveli` | ✅ (Özel + Parametrik) | ✅ (Parametrik) | ✅ (Özel + Parametrik) | ✅ (Parametrik) | ✅ (Parametrik) | ✅ (`useYaklasikMaliyetCetveli`) |
| 4 | `ihtiyac_talep_formu` | `templates/ihtiyac-talep-formu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 5 | `tasinir_kayit_yetkilisi_gorusu` | `templates/tasinir-kayit-yetkilisi-gorusu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 6 | `teknik_sartname` | `templates/teknik-sartname` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 7 | `luzum_muzekkeresi` | `templates/luzum-muzekkeresi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 8 | `luzum_onay_eki` | `templates/luzum-muzekkeresi-onay-eki` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 9 | `luzum_muzekkeresi_teslim_tesellum` | `templates/luzum-muzekkeresi-teslim-tesellum` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 10 | `harcama_talimati` | `templates/harcama-talimati` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 11 | `komisyon_gorevlendirme_onayi` | `templates/komisyon-gorevlendirme-onayi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 12 | `komisyon_gorevlendirme_onayi_eki` | `templates/komisyon-gorevlendirme-onayi-eki` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 13 | `piyasa_fiyat_arastirma_gorevlendirmesi` | `templates/piyasa-fiyat-arastirma-gorevlendirmesi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 14 | `son_alim_fiyat_cetveli` | `templates/son-alim-fiyat-cetveli` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 15 | `fiyat_arastirma_mektubu` | `templates/fiyat-arastirma-mektubu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 16 | `birim_fiyat_teklif_mektubu` | `templates/birim-fiyat-teklif-mektubu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 17 | `arastirma_mektubu` | `templates/arastirma-mektubu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 18 | `kabul_edilen_teklif` | `templates/kabul-edilen-teklif` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 19 | `dogrudan_temin_onay_belgesi` | `templates/dogrudan-temin-onay-belgesi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 20 | `dogrudan_temin_sonuc_onay_belgesi` | `templates/dogrudan-temin-onay-belgesi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 21 | `butce_sorgusu` | `templates/butce-sorgusu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 22 | `dogrudan_temin_sozlesmesi` | `templates/dogrudan-temin-sozlesmesi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 23 | `sozlesmeye_davet` | `templates/sozlesmeye-davet` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 24 | `muayene_kabul_tutanagi` | `templates/muayene-kabul-tutanagi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 25 | `muayene_kabul_komisyonu` | `templates/muayene-kabul-komisyonu` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 26 | `kik048_yapim_gecici_kabul_teklif` | `templates/kik048-yapim-gecici-kabul-teklif` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 27 | `kik049_yapim_gecici_kabul_tutanagi` | `templates/kik049-yapim-gecici-kabul-tutanagi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 28 | `kik050_yapim_kesin_kabul_teklif` | `templates/kik050-yapim-kesin-kabul-teklif` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 29 | `kik051_yapim_kesin_kabul_tutanagi` | `templates/kik051-yapim-kesin-kabul-tutanagi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 30 | `harcama_pusulasi` | `templates/harcama-pusulasi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| 31 | `odeme_yazisi` | `templates/odeme-yazisi` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |

---

## 4. Çalıştırılan Komutlar ve Gerçek Test Sonuçları

### Komut 1: `@temin360/document-templates` Test Paketi

```bash
pnpm --filter @temin360/document-templates test
```

**Sonuç:**
- **Test Dosyaları:** `23 passed (23)`
- **Test Sayısı:** `283 passed (283)` (`0 failed`)
- **Süre:** `6.44s`

### Komut 2: `@worksuite-360/document-engine` Test Paketi

```bash
pnpm --filter @worksuite-360/document-engine test
```

**Sonuç:**
- **Test Dosyaları:** `2 passed (2)`
- **Test Sayısı:** `11 passed (11)` (`0 failed`)
- **Süre:** `1.10s`

---

## 5. Başarısız veya Henüz Test Edilemeyen Senaryolar

- **Başarısız Test:** Yok (`294 / 294` test başarılı).
- **Kapsam Notu:**
  - Şablonlardan `ihtiyac-listesi` ve `luzum-muzekkeresi` kendine özel `DocumentDataResolver` sınıflarına (`IhtiyacListesiResolver`, `LuzumMuzekkeresiResolver`) sahiptir; diğer 29 şablon `DefaultDocumentResolver` ve `resolveTemplateData` (`ProcessMapping`) üzerinden çözülmektedir. İlerleyen aşamalarda diğer şablonlar için de özel `Resolver` sınıfları yazıldıkça kendi `__tests__/mapping.test.ts` dosyaları genişletilebilir.
  - Gerçek Chromium/Electron `printToPDF` binary çıktı testi yerine, `DocumentEngine.compileHtml` ve `renderToStaticMarkup` üzerinden A4 sayfa yapısı (`@page { size: 210mm 297mm }` / `297mm 210mm`), sayfa bölünmesi (`paginateData`) ve yetim imza koruması (`dynamicPaginationAndOrphan.test.tsx`) doğrulanmıştır.

