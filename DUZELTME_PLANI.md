# WORKDESK 360 — MİMARİ VE KOD DÜZELTME PLANI (BACKLOG)

**Oluşturulma Tarihi:** 1 Kasım 2026  
**Durum:** Aktif / Aşama Aşama Yürütülüyor  
**Amaç:** Monorepo teknik denetiminde tespit edilen ve doğrulanmış olan mimari, veri bütünlüğü ve hesaplama hatalarını mevcut işleyişi bozmadan sırayla düzeltmek.

---

## 1. TAMAMLANAN DÜZELTMELER (DONE)

- [x] **`usePiyasaFiyatCalculation.ts` Mükerrer Yaklaşık Maliyet Döngüsü:**
  - `getEstimatedCostTotal` ve `handleSetHesaplamaEsasi` içinde tekrarlanan döngü tekil `calculateEstimatedCost` fonksiyonuna bağlandı.
- [x] **Kazanan Firma Seçiminde ID Karışıklığı ve Atomiklik:**
  - `TANIM_Firma.id` (master) ile `DATA_TeminFirma.id` (satır) kimlikleri veritabanı sorgusuyla kesinleştirildi; tehlikeli `OR id = ?` ifadesi kaldırıldı.
  - İki ayrı `db:run` çağrısı Main process'in `db:transaction` altyapısı üzerinden tek bir atomik transaction'a bağlandı.
  - `kazandi_mi` ve `kazanan_mi` bayrakları birlikte eşitlenerek eski kazananın hortlaması (zombie winner) engellendi.
  - Kazanan firma seçimi ile `yaklasik_maliyet` hesabı birbirinden tamamen ayrıldı.
- [x] **`decimalUtils.ts` Global Kirlilik İzolasyonu:**
  - Global `Decimal.set(...)` çağrısı kaldırılarak `Decimal.clone()` ile modüle özel `ToolDecimal` izole edildi.
- [x] **E2E Testleri ve CI/CD Başlatma Zaman Aşımı (Timeout) Kök Neden Çözümü:**
  - `javascript-obfuscator` Vite eklentisi Rollup'ın `generateBundle` aşamasındaki henüz çözümlenmemiş dinamik import yer tutucularını (`!~{...}~`) base64 string dizisine dönüştürerek Rollup'ın yer tutucu çözümlemesini engelliyordu. Bu durum çalışma zamanında `PageWrapper` altında `DisclaimerModal-!~{021}~.js` 404 hatasına ve tüm ekranların çökmesine yol açıyordu. Obfuscation `writeBundle` aşamasına taşındı, test/CI ortamında gereksiz obfuscation atlandı ve `DisclaimerModal` statik import'a geçirildi.
  - GitHub Actions `windows-2022` gibi sanal/headless CI koşucularında fiziksel GPU bulunmadığından `ignore-gpu-blocklist` ve `enable-gpu-rasterization` bayraklarının Chromium GPU compositor sürecini kilitlemesi engellendi; test/CI modunda `app.disableHardwareAcceleration()` devreye alındı ve `createWindow()` içine güvenlik fallback zamanlayıcısı eklendi.
  - `electronHelper.ts` başlatma argümanlarına test modunda `--disable-gpu`, `--disable-dev-shm-usage`, `--no-sandbox` bayrakları entegre edildi.
- [x] **Faz 1.2: Kazanan Firma Senkronizasyonunun ve Veri Bütünlüğünün Güvenli Uygulanması:**
  - `schemaIntegrity.ts` içindeki belirsiz veya çelişkili eski kayıtları körlemesine çift kazanana dönüştüren iki adet `safeExec(UPDATE DATA_TeminFirma ...)` çağrısı kaldırıldı; yerine salt okunur uyumsuzluk tespiti ve loglama getirildi.
  - Yeni `winnerSyncService.ts` servisi oluşturuldu; `executeSetWinnerTransaction` ile hem master (`TANIM_Firma.id`) hem de satır (`DATA_TeminFirma.id`) doğrulaması yapıldı, `DATA_TeminDosyasi.firma_id` ile `kazandi_mi` / `kazanan_mi` bayrakları atomik `db:transaction` içinde senkronize edildi.
  - `usePiyasaFiyatCalculation.ts` ve `usePiyasaFiyatDocuments.ts` içindeki doğrudan ve dağınık SQL güncellemeleri `executeSetWinnerTransaction` servisine bağlandı.
  - `siparisDataFetcher.ts` ve `useKabulVeOdemeData.ts` içindeki veri okuma sırasında sessizce en düşük teklifliyi veya ilk firmayı kazanan seçen ve arka planda `UPDATE` çalıştıran tehlikeli fallback mekanizmaları kaldırıldı; kazanan yokken veri tabanına dokunulmadan `null` dönülmesi ve kullanıcıya halihazırda var olan koruma uyarısının (`<SiparisGuardWarning />`, `<KabulGuardWarning />`) gösterilmesi sağlandı.
  - `resolveFirmsAndItems.ts` belge önizleme çözümleyicisinde kazanan firma seçilmemişken ilk firmayı yüklenici olarak belirleyen fallback (`|| safeFileFirms[0] ...`) kaldırıldı; `kazandi_mi === 1` bayrağı doğrulandı.
  - Kapsamlı Vitest birim testleri (`winnerSyncService.test.ts` 8/8) ve tüm test paketi (67/67 dosya, 611/611 test) ile typecheck ve üretim derlemesi (`electron-vite build`) sıfır hata ile başarıyla doğrulandı.

---

## 2. SIRAYLA DÜZELTİLECEK MADDELER (TODO / BACKLOG)

### Faz 1: Domain ve Hesaplama Bütünlüğü [Öncelik: P0]

- [ ] **1.1. `@temin360/domain` Paketindeki Derleme Hatası ve Öksüz Fonksiyon:**
  - **Sorun:** `calculateLineTotal.ts` dosyasında `import Decimal from 'decimal.js'` var ancak `package.json` içinde `decimal.js` tanımlı değil. Ayrıca bu fonksiyon kod tabanında hiçbir yer tarafından çağrılmıyor.
  - **Yapılacak:** Domain paketine ya `decimal.js` bağımlılığı resmi olarak eklenecek ya da mevcut saf BigInt tabanlı `Money` sınıfı üzerinden uygulanacak; öksüz durum giderilecek.
  - **Etkilenen Dosyalar:** `packages/domain/package.json`, `packages/domain/src/procurement/calculations/calculateLineTotal.ts`

---

### Faz 2: Belge Motoru (Document Engine) Bağımsızlaştırma, Eşdeğerlik ve Veri Akışı [Öncelik: P0 - P1]

- [x] **2.1. Document Engine Bağımsızlaştırma & Tersine Bağımlılık (Inversion of Control) [P0] (TAMAMLANDI):**
  - **Uygulanan Mimari:**
    1. `packages/document-engine` paketinde `@temin360/document-templates` bağımlılığı tamamen kaldırıldı ve ters importlar ESLint sınır kuralları (`no-restricted-imports`) ile kilitlendi.
    2. `InstitutionalHeaderProvider` (890 satır SQL, DETSİS ve kurum anteti mantığı) Engine'den `document-templates/src/header/` paketine taşındı.
    3. `DocumentHeaderProvider<THeader>` ve `DocumentHeaderContext` arayüzleri generic ve SQL'den bağımsız hale getirildi; context bilgisi Engine boyunca uçtan uca taşındı.
    4. Engine içindeki tüm `window.electron.ipcRenderer`, `db:query` ve `belge:*` fallback'leri silinerek motor ortam-bağımsız kılındı.
    5. Masaüstü için `electronDocumentStorageAdapter.ts` geliştirilerek `DocumentEngine.setStorageAdapter()` ve `DocumentEngine.setQueryExecutor()` üzerinden IoC ile dışarıdan enjekte edildi.
    6. `configureTeminEngine()` ile şablon kaydı, kurumsal antet ve Zod doğrulayıcı tek noktadan yapılandırıldı.
    7. Tüm paketlerde (engine, templates, desktop) typecheck 0 hata ile geçti; 26 masaüstü entegrasyon testi ve 25 şablon testi doğrulandı.

- [ ] **2.2. Tek Otorite Belge Veri Akışı (Split-Brain Resolver Tekilleştirmesi) [P0]:**
  - **Sorun:** Main process'teki `documentContextResolver.ts` veri setini hazırladıktan sonra, Renderer process'teki `previewDataLoader.ts` ve `sourceResolvers.ts` aynı personel, birim ve firma listelerini `db:query` ile bağımsız olarak ikinci kez çekiyor. İki taraftaki filtre farkları (ör. `aktif_mi`) eksik veri ve tutarsızlık sorunlarına yol açıyor. Eşdeğerlik testlerinden önce tek otorite veri kaynağı sağlanmalıdır.
  - **Yapılacak:** Renderer tarafındaki gereksiz ikinci sorgu döngüleri temizlenecek; Main process'ten gelen `belge:get-document-payload` tek otorite veri kaynağı (*single source of truth*) kılınacak.
  - **Etkilenen Dosyalar:** `previewDataLoader.ts`, `sourceResolvers.ts`, `documentContextResolver.ts`

- [ ] **2.3. Canlı A4 Önizleme (Live Reactive) vs Mühürlü Arşiv (Tam Metadata & Snapshot) Ayrımı [P0]:**
  - **Sorun:** Canlı önizleme sırasında gereksiz yere veritabanı revizyonu üretilmesi engellenmeli; mühürlü arşivde ise salt JSON saklamak ileride JSX/CSS değiştiğinde aynı çıktıyı üretmeyi garanti etmez.
  - **Yapılacak:**
    1. **Canlı Önizleme:** Kullanıcı formda değişiklik yaptıkça `DocumentRenderer` doğrudan in-memory state (`mergedData`) ile render edilecek; veritabanında snapshot üretilmeyecek.
    2. **Mühürlü Arşiv (Snapshot & Hukuki İkiz):** Belge "Onaylandı / Mühürlendi (Sealed)" durumuna geçtiğinde yalnızca JSON verisi değil; `templateCode`, `templateVersion`, `schemaVersion`, `snapshotData`, `createdAt`, `sealedAt`, `contentHash` (SHA-256) ve kesinleşmiş PDF çıktısı / hash referansı birlikte saklanacak (`IMMUTABLE` garantisi).
  - **Etkilenen Dosyalar:** `DocumentPreviewCanvas.tsx`, `refreshPolicy.ts`, `DATA_TeminBelgeSnapshot.ts`

- [ ] **2.4. Belge Eşdeğerlik Test Paketi (Equivalence Test Suite: Mustache vs React Engine) [P0]:**
  - **Sorun:** 611 birim testinin geçmesi, yeni React tabanlı şablonların eski Mustache şablonlarıyla %100 birebir aynı hukuki ve hesaplama çıktısını ürettiğini tek başına garanti etmez.
  - **Yapılacak:** Tek otorite veri kaynağından beslenen pilot belgelerden (Piyasa Fiyat Araştırma Tutanağı, İhtiyaç Listesi, Lüzum Müzekkeresi) başlayarak otomatik eşdeğerlik testleri yazılacak:
    1. **Metin & Hesaplama Eşdeğerliği:** Birim fiyatlar, toplam tutarlar, KDV, indirim oranları ve sayıların yazıya çevrilmesi.
    2. **Tablo & Sütun Dinamikliği:** Firma ve kalem sayılarına göre dinamik satır/sütun genişlemeleri.
    3. **Yetki & İmza Blokları:** Komisyon üyelerinin unvanları, asil/yedek durumları ve imza kutuları.
  - **Etkilenen Dosyalar:** `packages/document-templates/src/__tests__/equivalence/`

- [ ] **2.5. PDF Pipeline Entegrasyonu (Motor Bağımsız `PdfAdapter` Mimarisi) [P1]:**
  - **Sorun:** Document Engine doğrudan Electron'a bağımlı olmamalı; hem masaüstünde hem sunucu/Next.js ortamında çalışabilmelidir.
  - **Yapılacak:**
    1. `DocumentEngine` içinde jenerik `PdfAdapter` arayüzü tanımlanacak.
    2. Masaüstü için `ElectronPrintToPdfAdapter`, sunucu/CLI için `PuppeteerPdfAdapter` implementasyonları sağlanacak.
    3. `packages/pdf-generator` paketindeki yararlı PDF yetenekleri (font yönetimi, sayfalama stilleri, A4 CSS kuralları) `PdfAdapter` altyapısına aktarılacak, ardından eski paket değerlendirilecektir.
  - **Etkilenen Dosyalar:** `packages/document-engine/src/export/`, `previewExportUtils.ts`, `packages/pdf-generator/`

---

### Faz 3: Temizlik ve Monorepo Bakımı [Öncelik: P2]

- [ ] **3.1. Yetenek Aktarımı Sonrası Eski PDF Paketinin Arşivlenmesi:**
  - **Sorun:** `packages/pdf-generator` paketindeki yetenekler Document Engine'e aktarıldıktan sonra atıl kalacak.
  - **Yapılacak:** Uyumluluk testleri tamamlandıktan sonra paket güvenli şekilde arşivlenecek ve monorepo derleme zincirinden çıkarılacak.
  - **Etkilenen Dosyalar:** `packages/pdf-generator/`

- [ ] **3.2. 1000+ Satırlık JSX Ekranlarının Okunabilirlik Refactoring'i:**
  - **Sorun:** `HariciDosyaAktarScreen.tsx` ve `all-templates.mapping.ts` dosyaları devasa JSX ağaçları içeriyor.
  - **Yapılacak:** State ve iş kurallarına dokunulmadan, yalnızca sekmeler (`GenelTab`, `KalemlerTab`) alt bileşenlere çıkarılacak.
  - **Etkilenen Dosyalar:** `HariciDosyaAktarScreen.tsx`, `all-templates.mapping.ts`
  - **Yapılacak:** State ve iş kurallarına dokunulmadan, yalnızca sekmeler (`GenelTab`, `KalemlerTab`) alt bileşenlere çıkarılacak.
  - **Etkilenen Dosyalar:** `HariciDosyaAktarScreen.tsx`, `all-templates.mapping.ts`

---

## 3. UYGULAMA İLKELERİ (ENGINEERING RULES)

1. **Tek Seferde Tek Odak:** Her adım bağımsız bir dalda veya commit'te ele alınacak; çalışan ekranlar toplu refactoring ile riske atılmayacak.
2. **Önce Test, Sonra Değişiklik:** Değiştirilen her fonksiyonun mevcut vitest entegrasyon testleri çalıştırılacak (`pnpm test`).
3. **Mevcut Veri Uyumluluğu:** `.temin` arşiv dosyalarındaki eski kayıtları bozacak şema veya sözleşme değişiklikleri yapılmayacak.
