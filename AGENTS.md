# WorkDesk 360 / Temin 360 — Agent & Developer Mimari Kuralları

Bu belge, AI ajanlarının (Antigravity, Codex vb.) ve monorepo geliştiricilerinin
WorkDesk 360 genelinde uyması gereken zorunlu mimari kuralları tanımlar.

---

## 🏛️ TEMEL MİMARİ İLKELER

```
Template = Talimat ve görünüm (Görsel ve şema kontratı)
   ↓
Document Engine = Talimatları çalıştıran tek genel motor (@worksuite-360/document-engine)
   ↓
Data Adapter = Veritabanı işlemleri (queryExecutor / IPC adaptörleri)
   ↓
Domain Services = Ortak iş kuralları (@temin360/contracts, rota, antet)
   ↓
PDF Generator = Bağımsız çıktı üretimi (@temin360/pdf-generator)
```

---

## ⛔ 8 KESİN MİMARİ KURAL (ARCHITECTURAL INVARIANTS)

1. **Şablon içine SQL yazılamaz:** React şablon bileşenleri (`*.template.tsx`),
   görsel katman ve şemalar kesinlikle SQL sorgusu veya doğrudan veritabanı
   erişimi içeremez. Şablonlar yalnızca kendilerine prop olarak sağlanan tipli
   `data` nesnesini çizer.

2. **Yeni şablon eklerken ayrı SQL resolver sınıfı YAZILMAZ; `data.mapping.ts`
   kullanılır:** Şablon zaten hangi veriyi nereden alacağını `data.mapping.ts`
   içinde deklaratif olarak tarif eder. Standart veri ihtiyacı olan hiçbir
   şablon için tekil SQL resolver sınıfı (örn. `XResolver.ts`) oluşturulamaz.
   Tüm çözümleme `TemplateResolver` ve `DefaultDocumentResolver` üzerinden genel
   motor tarafından yürütülür.

3. **Document Engine dışında ikinci bir paralel resolver veya registry
   oluşturulamaz:** Şablonlar tek bir merkezi deftere (`TemplateRegistry`)
   kaydedilir. Paralel bir resolver sınıfı, gölge defter veya ikinci bir veri
   çözümleme hattı oluşturmak mimari ihlaldir (Split-Brain Antipattern).

4. **`DocumentPreviewModalV3` içinde bağımsız veri yükleme mantığı
   barındırılamaz; `DocumentEngine` adaptörü kullanılır:** Önizleme modalı veya
   UI hook'ları doğrudan SQLite sorgusu çalıştıramaz. Tüm veri derleme,
   `loadDocumentPreviewData` köprüsü üzerinden
   `DocumentEngine.loadOrCreateDocument()` tarafından yürütülür.

5. **Snapshot ve smartMerge akışı atlanamaz; kullanıcının manuel düzenlemeleri
   silinemez:** Kullanıcının modal veya A4 sayfası üzerinde elle yaptığı
   düzenlemeler `DATA_TeminBelgeSnapshot` tablosunda saklanır. Veritabanından
   taze veri çekildiğinde daima `smartMergeDocumentData` çalıştırılarak
   kullanıcının metinleri ve değişiklikleri korunur; asla üzerine ezilmez.

6. **Kurum anteti, birim ve personel hiyerarşisi `InstitutionalHeaderProvider`
   otoritesindedir:** Resmî Yazışma Yönetmeliğine uygun antet oluşturma, T.C.
   ibaresi, harcama birimi ek satırı, harcama yetkilisi ve evrak sayısı
   çözümlemesi yalnızca `InstitutionalHeaderProvider` tarafından tek noktada
   yönetilir. Şablonlar yerel string manipülasyonlarıyla antet türetmez.

7. **Alım türü (Mal, Hizmet, Danışmanlık, Yapım İşleri) varyantları standart
   contract üzerinden desteklenir:** Şablonlar alım türünü `detectAlimTuru` ile
   tespit eder ve ilgili standart alt bileşeni (`MalAlimi*`, `HizmetAlimi*`,
   `Danismanlik*`, `YapimIsleri*`) çizer. Poz no, iş kalemi, pursantaj veya
   hizmet kodu gibi kolonlar veri katmanında tam olarak korunur.

8. **PDF üretimi Document Engine HTML çıktısı ve `pdf-generator` üzerinden
   yürütülür:** PDF üretiminde renderer veya ekranda çizilen geçici DOM yerine,
   `DocumentEngine.compileHtml()` ile derlenen A4 PDF uyumlu tam HTML çıktısı
   kullanılır ve `@temin360/pdf-generator` bağımsız olarak çalıştırılır.

---

## 📂 MERKEZİ VERİ DİZİNİ

Tüm SQLite tabloları, mapping dosyaları ve çözümleme zinciri için
[docs/DATA_LINEAGE.yaml](docs/DATA_LINEAGE.yaml) dosyasına başvurunuz.
