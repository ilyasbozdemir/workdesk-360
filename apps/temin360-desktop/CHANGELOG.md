# Değişiklik Günlüğü (Changelog)

Bu dosyada TEMİN 360 (Doğrudan Temin ve İhale Yönetim Sistemi) uygulamasının her sürümünde yapılan önemli değişiklikler listelenmektedir. Proje [SemVer](https://semver.org/lang/tr/) kurallarına uygun olarak sürüm standardını takip eder.

---

## [1.0.0-rc.1] - 2026-10-18 (Sürüm Adayı / Release Candidate)

### Eklenenler (Added)

- **Monorepo Mimarisi**: pnpm workspace yapısına geçildi (`apps/app-desktop`, `packages/database`, `packages/document-templates`).
- **Merkezi Sürüm Yöneticisi (`VersionManager`)**: Çoklu sürüm kanalları (`alpha`, `beta`, `rc`, `stable`), SemVer kural motoru, versiyon politikası (`version-policy.yaml`) ve CLI desteği.
- **Gelişmiş Release CLI (`scripts/release.js`)**:
  - `--channel <ad>`, `--rc`, `--patch`, `--dry-run`, `--no-push`, `--skip-manifest` seçenekleri.
  - Sürüm adayları için otomatik release notes üretimi (`generate-release-notes.js`).
  - Güvenli dosya stage (`releaseTargets`) ve kural doğrulama mekanizması.
- **Kod Satırı Sayacı & Dağılım Analizi (LOC Counter)**:
  - `scripts/count-loc.js` aracı; yorum, boşluk, test ve vendor ayrımı yaparak gerçek kod hacmini hesaplar.
  - `apps/app-desktop/src/renderer/src/generated-loc.json` ve `AboutModal` üzerinden gerçek zamanlı kod metrikleri gösterimi.
- **DTM Çalışma Alanı Güvenliği**:
  - `.dtm` arşiv paketlerinde Zip-Slip (dizin dışına çıkma) saldırı koruması.
  - Çalışma alanı dosyalarında eşzamanlı çakışmaları önleyen `.lock` kilit dosyası yönetimi.
  - Veri kaybını önleyen atomik kaydetme ve hata anında temizleme altyapısı.
- **GitHub Actions CI İş Akışı**:
  - Çoklu platformda `Schema Parity`, `Typecheck`, `Vitest Tests` ve monorepo güvenlik denetimi.

### Düzeltilenler (Fixed)

- **Doğrudan Temin Dosya Oluşturma Sadeleştirmesi**: Mükerrer ~1100 satırlık eski dosya sihirbazı kaldırıldı, dosya listesindeki çift dosya oluşturma buton karmaşası giderildi ve tüm doğrudan temin oluşturma akışları hızlı, zengin ve modern `DosyaManageScreen` ekranına bağlandı.
- **Hızlı Dosya Ekleme Süreç Tarihleri & Doğrudan Temin Terminolojisi**: Hızlı dosya ekleme ekranında mevzuata uygun doğrudan temin terimleri benimsendi (İhale -> Temin / Süreç). Tek bir tarih alanı yerine Dosya Açılış Tarihi, Son Teklif Verme Tarih/Saati ve Tahmini Bitiş Tarihi alanları tanımlandı; varsayılan tarih yönetimi ve toplu tarih atama yeteneği kazandırıldı.
- **Komisyon Şablon & SQL Şema Uyumsuzluğu Düzeltmesi**: `commissionSeedService.ts` ve şablon eşlemelerindeki eski `ihale_usulu`, `alim_turu` ve `dosya_no` sorgu sütunları güncel şemadaki `ihale_sekli`, `tur` ve `temin_no` sütunlarıyla senkronize edildi.
- **Tarih & Saat Seçici Format Sanitizasyonu**: `<input type="datetime-local">` alanlarında hatalı/5 haneli yılların ve eksik dakikaların tarayıcı konsol uyarısı üretmesi engellendi; `formatDateTimeLocal` ile otomatik format doğrulaması sağlandı.
- **SQLite Migrasyon Güvenlik Düzeltmesi**: `packages/database/src/migrate.ts` içinde varsayılan dize değerlerinin SQL tırnaklamasından geçirilmemesi sonucu ortaya çıkan `near "/": syntax error` (Sürüm 11 - `TANIM_OlcuBirimi.kategori`) hatası giderildi (`formatSqlDefault`).
- **Depolama Güvenliği**: Docker Compose içindeki PocketBase portu yerel ağ erişimine (`127.0.0.1`) sınırlandı.

### Kaldırılanlar (Removed)

- **`versions.json` Temizliği**: Artık monorepo paketleri `package.json`, git etiketleri ve şema manifestleri üzerinden yönetildiği için gereksiz hale gelen `packages/database/versions.json` ve ilgili kod referansları tamamen kaldırıldı.

---

## [1.0.0-beta.245 ... 1.0.0-beta.256] - 2026-10-01 - 2026-10-18

### Eklenenler (Added)

- **Belge Önizleme Regresyon Test Paketi**: `documentPreviewRegression.test.tsx` ile şablon anahtarları çözünürlüğü, landscape/portrait sayfa yönü, HTML/PDF çıktıları ve hata durumları doğrulandı.
- **Kamu İhale & Doğrudan Temin Süreç Ayrımı**:
  - 4734 Sayılı Kamu İhale Kanunu (Madde 22/d doğrudan temin) ve 2886 Sayılı Devlet İhale Kanunu ayrımı sağlandı.
  - Yaklaşık Maliyet Hesap Cetveli, İhale Hazırlığı grubu altında tutulurken; Piyasa Fiyat Araştırması Tutanağı, Doğrudan Temin akışına uyarlandı.
- **Dinamik A4 Sayfalama & Orphan Prevention**:
  - `packages/document-templates` içerisinde dinamik sayfa hesaplama, yetim başlık/imza bloklarının sayfada yalnız kalmasını engelleyen taşma kontrolü ve font optimizasyonları.
- **Belgelerim Eklentisi (EBYS Entegrasyonu)**:
  - Kurum içi doğrudan temin arşivi, belge sürümleri ve yer tutucu yönetimi (`DATA_KutuphaneGrup`, `DATA_KutuphaneBelge`, `DATA_KutuphaneBelgeSurum`, `DATA_KutuphaneYerTutucu`).
- **Poz Kataloğu Modülü**:
  - Çevre, Şehircilik ve İklim Değişikliği Bakanlığı yapım ve hizmet işleri birim fiyat / poz kataloğu (`TANIM_Poz`).
- **Modül Mağazası ve Hazır Mevzuat Metinleri**:
  - İhale ve temin şartnameleri için standart kamu idaresi metinleri mimarisi.

---

## [1.0.0-beta.200 ... 1.0.0-beta.244] - 2026-09-01 - 2026-09-30

### Eklenenler (Added)

- **Komisyon Şablon Hassasiyeti**:
  - Komisyon üyelerinin hangi belgelerde görüneceği (`belge_kapsami`, `belgede_goster`, `hedef_belgeler`) ve üye sıralama (`sira`) dinamik yapısı.
  - Komisyon unvan geçmişi takibi (`TANIM_PersonelUnvanGecmisi`).
- **4 Düzey Analitik Bütçe Sınıflandırması**:
  - `TANIM_ButceKod` modülü ve ekranı. Bütçe tertibi, ödenek sorgusu ve harcama yetkilisi entegrasyonu.
- **Türkçe Para Formatlayıcı**:
  - Para ve döviz tutarları için tam Türkçe formatlama (`###.###,## ₺`) ve metin ile tutar dönüşümü.
- **Kurum ve Makam Hiyerarşisi**:
  - Sunulacak makam seçimi, sunulacak kurum adı, DETSİS kodları ve alt kurum hiyerarşisi.

---

## [1.0.0-beta.150 ... 1.0.0-beta.199] - 2026-08-01 - 2026-08-31

### Eklenenler (Added)

- **Muayene & Kabul İşlemleri**:
  - Kısmi teslimat desteği, bakiye hesaplamaları ve kabul tutanakları (`KabulTutanakModal`).
- **Mali Hizmetler Ödeme Yazısı**:
  - Ödeme emri belgesi ve kabul onay entegrasyonu.
- **Bulut ve Harici Depolama**:
  - MinIO S3 ve PocketBase entegrasyonu ile merkezi yedekleme ve arşivleme.
- **KİK 22/d Limit Tüketim Takibi**:
  - İdare bazlı yıllık parasal limit tüketim göstergeleri ve aşım uyarıları.

---

## [1.0.0-beta.50 ... 1.0.0-beta.149] - 2026-07-15 - 2026-07-31

### Eklenenler (Added)

- **Firma CRM & Yasaklılık Kontrolü**:
  - Tedarikçi firma profilleri, iletişim notları (`TANIM_FirmaIletisimNotu`), KİK yasaklılık teyit belgeleri.
- **Ambar ve Depo Yönetimi**:
  - Malzeme ambar hareketleri (`DATA_AmbarHareket`) ve taşınır kayıt süreçleri.
- **Piyasa Fiyat Araştırma Analizi**:
  - Otomatik teklif mektubu değerlendirme tablosu, KDV tevkifat ve aritmetik yaklaşık maliyet analizi.

---

## [1.0.0-beta.17 ... 1.0.0-beta.49] - 2026-07-02 - 2026-07-14

### Eklenenler (Added)

- **SQLite Çok Katmanlı Şema Göç Motoru**:
  - Veritabanı şemasının v1'den v45'e kadar kesintisiz yükseltilmesini sağlayan `runMigrations` mimarisi.
- **Şablon Snapshot ve Versiyonlama**:
  - `DATA_DosyaSablonVeri` ve `DATA_DosyaRevizyon` ile geçmişe dönük belge geri yükleme.
- **Electron İletişim Güvenliği**:
  - `contextIsolation`, preload izolasyonu ve güvenli IPC kanalları.

---

## [1.0.0-beta.16] - 2026-07-01

### Düzeltilenler (Fixed)

- **Aktif Dosya Araç Çubuğu Düzeltmesi**: `ActiveFileToolbar` bileşenindeki `dosya_no` / `temin_no` tip uyumsuzluğu giderildi ve geri dönüş butonunun yazısı `"Aktif Dosyadan Çık"` olarak güncellendi.

---

## [1.0.0-beta.15] - 2026-06-30

### Eklenenler (Added)

- **İmza Toggle Desteği**: Üretilen Belgeler ve İmza Takibi bölümünde imza durumu artık çift yönlü toggle switch ile değiştirilebilir (İmzalandı ↔ Bekliyor).
- **Genel Metrik Paneli (Takip Ekranı)**: Aktif dosya seçilmediğinde toplam dosya sayısı, imza bekleyen/imzalanan belge sayıları, toplam yaklaşık maliyet ve aşama dağılım grafiği gösterilir.
- **Otomatik Release Scripti** (`scripts/release.js`): `npm run release` komutuyla monorepo paket sürümleme, şema manifest dondurma, commit, tag oluşturma ve push işlemleri tek komutla yapılabilir. `--dry-run`, `--no-push`, `--patch`, `--message` flag'leri desteklenir.
- Lüzum Müzekkeresi, Lüzum Onay Eki, Teslim Tesellüm ve Son Alım Fiyat Cetveli mapping dosyaları eklendi.
- Şablon dosya adı ↔ kategori eşleştirme sabiti (`sablonKategorileri.ts`) eklendi.
- `SubScreens.screen.tsx` dosyası daha iyi bir kod organizasyonu için ayrı parçalara/bileşenlere bölündü (17 ayrı ekrana ayrıştırıldı).
- İhtiyaç Listesi yazdırma işlemi ana liste ekranı içerisine (PDF olarak kaydet/yazdır butonu ile) entegre edildi.
- Sidebar ve menü yönlendirmelerinde "Malzeme Listesi" terimi "İhtiyaç Listesi" olarak güncellendi.
- `CONTRIBUTING.md` ve `CHANGELOG.md` dosyaları eklendi.
- Dağınık duran dokümantasyon dosyaları `docs/` klasörü altına taşındı.

### Düzeltilenler (Fixed)

- Çeşitli lint ve tip uyarıları giderildi.

### Kaldırılanlar (Removed)

- Kullanılmayan `IhtiyacListesiTalepFormu` rotası ve `IhtiyacListesi.screen.tsx` tamamen silindi.
