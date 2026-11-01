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

---

## 2. SIRAYLA DÜZELTİLECEK MADDELER (TODO / BACKLOG)

### Faz 1: Domain ve Hesaplama Bütünlüğü [Öncelik: P0]

- [ ] **1.1. `@temin360/domain` Paketindeki Derleme Hatası ve Öksüz Fonksiyon:**
  - **Sorun:** `calculateLineTotal.ts` dosyasında `import Decimal from 'decimal.js'` var ancak `package.json` içinde `decimal.js` tanımlı değil. Ayrıca bu fonksiyon kod tabanında hiçbir yer tarafından çağrılmıyor.
  - **Yapılacak:** Domain paketine ya `decimal.js` bağımlılığı resmi olarak eklenecek ya da mevcut saf BigInt tabanlı `Money` sınıfı üzerinden uygulanacak; öksüz durum giderilecek.
  - **Etkilenen Dosyalar:** `packages/domain/package.json`, `packages/domain/src/procurement/calculations/calculateLineTotal.ts`

- [ ] **1.2. Kazanan Firma Senkronizasyonunun Diğer Modüllere Yayılması:**
  - **Sorun:** Sipariş ve Kabul/Ödeme aşamalarında da (`siparisDataFetcher.ts`, `useKabulVeOdemeData.ts`) benzer şekilde yalnızca `kazandi_mi` güncelleniyor.
  - **Yapılacak:** Bu ekranlardaki güncellemeler de `kazandi_mi` ve `kazanan_mi` ikilisini birlikte güncelleyecek ortak bir servise/fonksiyona bağlanacak.
  - **Etkilenen Dosyalar:** `apps/temin360-desktop/src/renderer/src/screens/dosya/sub-screens/...`

---

### Faz 2: Belge Çözümleme ve Veri Akışı [Öncelik: P0 - P1]

- [ ] **2.1. Çift Belge Çözümleyici (Split-Brain Resolver) Tekilleştirmesi:**
  - **Sorun:** Main process'teki `documentContextResolver.ts` veri setini hazırladıktan sonra, Renderer process'teki `previewDataLoader.ts` ve `sourceResolvers.ts` aynı personel, birim ve firma listelerini `db:query` ile bağımsız olarak ikinci kez çekiyor. İki taraftaki filtre farkları (ör. `aktif_mi`) eksik veri sorunlarına yol açıyor.
  - **Yapılacak:** Renderer tarafındaki gereksiz ikinci sorgu döngüleri temizlenecek; Main process'ten gelen `belge:get-document-payload` tek otorite veri kaynağı kılınacak.
  - **Etkilenen Dosyalar:** `previewDataLoader.ts`, `sourceResolvers.ts`, `documentContextResolver.ts`

- [ ] **2.2. Hukuki Belge Arşiv Koruması (Snapshot Immutable Kuralı):**
  - **Sorun:** `refreshPolicy.ts` içindeki `SOURCE` kuralı, onaylanmış veya kesinleşmiş resmi belgelerde dahi komisyon üyelerini ve kalemleri canlı veritabanından eziyor. 3 ay önce imzalanmış bir belgenin komisyonu personel tayiniyle bozulabiliyor.
  - **Yapılacak:** Belge durumu "Kesinleşti / Onaylandı (Sealed)" olduğunda komisyon ve kalemlerin canlı DB ile güncellenmesini engelleyen `IMMUTABLE` kilidi eklenecek.
  - **Etkilenen Dosyalar:** `apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/hooks/helpers/previewData/refreshPolicy.ts`

---

### Faz 3: Temizlik ve Monorepo Bakımı [Öncelik: P2]

- [ ] **3.1. Atıl `packages/pdf-generator` Paketinin Temizliği:**
  - **Sorun:** Masaüstü uygulaması Puppeteer tabanlı bu paketi hiç kullanmıyor; doğrudan Electron yerel `printToPDF` motorunu kullanıyor.
  - **Yapılacak:** Paket bağımsız CLI/web kullanımı için belgelenecek veya monorepo derleme zincirinden çıkarılarak hafifleme sağlanacak.
  - **Etkilenen Dosyalar:** `packages/pdf-generator/`

- [ ] **3.2. 1000+ Satırlık JSX Ekranlarının Okunabilirlik Refactoring'i:**
  - **Sorun:** `HariciDosyaAktarScreen.tsx` ve `all-templates.mapping.ts` dosyaları devasa JSX ağaçları içeriyor.
  - **Yapılacak:** State ve iş kurallarına dokunulmadan, yalnızca sekmeler (`GenelTab`, `KalemlerTab`) alt bileşenlere çıkarılacak.
  - **Etkilenen Dosyalar:** `HariciDosyaAktarScreen.tsx`, `all-templates.mapping.ts`

---

## 3. UYGULAMA İLKELERİ (ENGINEERING RULES)

1. **Tek Seferde Tek Odak:** Her adım bağımsız bir dalda veya commit'te ele alınacak; çalışan ekranlar toplu refactoring ile riske atılmayacak.
2. **Önce Test, Sonra Değişiklik:** Değiştirilen her fonksiyonun mevcut vitest entegrasyon testleri çalıştırılacak (`pnpm test`).
3. **Mevcut Veri Uyumluluğu:** `.temin` arşiv dosyalarındaki eski kayıtları bozacak şema veya sözleşme değişiklikleri yapılmayacak.

