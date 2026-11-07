# Veritabanı Şema Değişiklikleri, Aktif Geliştirme (beta.current) ve Release Kuralları

Bu kural, TEMİN 360 projesinde veritabanı şemasında yapılan her değişiklik, eklenen/çıkarılan alan veya şablon tanımları, migration yönetimi ve sürüm yayınlama (release) süreçleri için **ZORUNLUDUR**.

---

## 📌 1. Aktif Geliştirme Süreci (Geliştirme Modu - DEV ve `current` Saklama)

Geliştirme sırasında veritabanında herhangi bir tabloya yeni sütun (`ALTER TABLE ADD COLUMN`), yeni bir tablo (`CREATE TABLE`), şema/şablon değişikliği veya eklenen/çıkarılan ögeler olduğunda:

⚠️ **MANUEL OLARAK YENİ NUMARALI SÜRÜM DOSYASI (`beta.235.ts`, `1.0.0-beta.235.yaml` VB.) OLUŞTURULMAZ! TÜM EKLENEN VE ÇIKARILANLAR `current` DOSYALARINDA ANLIK TUTULUR!**

1. **Aktif Geliştirme Manifestlerine (`current`) Yazma (YAML Tek Gerçeklik Kaynağı - SSOT)**:
   - Veritabanı şema değişiklikleri için **ana kaynak YAML dosyasıdır**:
     - [`packages/database/src/schema-manifest/1.0.0-beta.current.yaml`](file:///d:/Github/ilyas-bozdemir/workdesk-360/packages/database/src/schema-manifest/1.0.0-beta.current.yaml)
   - Sütun, tablo, raw SQL göç adımları ve şablon listesi durumları bu YAML dosyasına işlenir.
   - İlgili TypeScript dosyaları ([`beta.current.ts`](file:///d:/Github/ilyas-bozdemir/workdesk-360/packages/database/src/schema-manifest/versions/beta.current.ts), app manifestleri vb.) elle yazılmaz; `pnpm manifest:sync` veya `pnpm --filter @dt/database build` çalıştırıldığında YAML kaynağından **otomatik derlenir**.
   - Belge şablon değişiklikleri varsa [`tum_belgeler_listesi.yaml`](file:///d:/Github/ilyas-bozdemir/workdesk-360/tum_belgeler_listesi.yaml) ve [`template-registry.ts`](file:///d:/Github/ilyas-bozdemir/workdesk-360/packages/document-templates/src/constants/template-registry.ts) güncellenir.
   - `schema_max` değeri güncellenir; değişiklikler `columns_added`, `tables_added` veya `raw_sql` dizilerine kaydedilir.

2. **Klasörleme Yapısı**:
   - Sürüm `.ts` dosyaları `packages/database/src/schema-manifest/versions/` altında (`alpha/`, `beta-001-100/`, `beta-101-200/`, `beta-201-300/` vb.) klasörlenmiştir.
   - Sürüm `.yaml` dosyaları `packages/database/src/schema-manifest/yaml/` altında klasörlenmiştir.
   - `beta.current.ts` dosyası `versions/` kökünde, `1.0.0-beta.current.yaml` ise `schema-manifest/` kökünde durur.

3. **`manifests.ts` Kaydı**:
   - [`packages/database/src/schema-manifest/manifests.ts`](file:///d:/Github/ilyas-bozdemir/workdesk-360/packages/database/src/schema-manifest/manifests.ts) dosyasında `betaCurrent` en sonda yer alır. Dev sürecinde veritabanı göçleri `betaCurrent` üzerinden otomatik çalışır.

4. **Derleme & Doğrulama**:
   - Değişiklik sonrası `pnpm --filter @dt/database build` komutu çalıştırılarak paket derlenir.

---

## 🏷️ 2. Release & Sürüm Alma Süreci (RELEASE)

Kullanıcı "sürüm al", "release yap" dediginde veya `release.js` çalıştırıldığında:

1. [`apps/app-desktop/scripts/release.js`](file:///d:/Github/ilyas-bozdemir/workdesk-360/apps/app-desktop/scripts/release.js) otomatik olarak:
   - `beta.current.ts` ve `1.0.0-beta.current.yaml` içerisindeki değişiklikleri okur.
   - Yeni sürüm numarasına göre (örn. `beta.235`) ilgili 100'lük klasöre (`versions/beta-201-300/beta.235.ts` ve `yaml/beta-201-300/1.0.0-beta.235.yaml`) dondurup kaydeder.
   - `manifests.ts` dosyasına yeni sürümü import edip `manifests` dizisine ekler.
   - `beta.current.ts` ve `1.0.0-beta.current.yaml` dosyalarını sıfırlayarak yeni geliştirme döngüsü için temizler (`changes: []`).
