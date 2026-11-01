# WorkDesk 360 — Document Engine & Şablon Mimarisi Kullanım Kılavuzu

Bu belge; WorkDesk 360 monoreposunda belge üretimi, şablon tasarımı, veri çözümleme (resolving) ve snapshot saklama işlemlerinin **hangi pakette, hangi dosyada ve nasıl yapılacağını** standartlaştırmak için hazırlanmıştır.

---

## 1. Paket Sorumluluk Haritası (Kuşbakışı)

Monorepo genelinde 3 temel aktör bulunur:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   1. @temin360/document-templates                      │
│                  (GÖRSEL VE TASARIM - SAF REACT UI)                     │
│  • Şablon JSX bileşenleri (.template.tsx)                              │
│  • A4 sayfa düzeni, CSS stilleri, tip tanımları                        │
│  • Kural: Kesinlikle SQL sorgusu veya Electron IPC İÇERMEZ.           │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ (JSON verisi ile beslenir)
┌────────────────────────────────────────────────────────────────────────┐
│                   2. @worksuite-360/document-engine                    │
│                  (AKIL, VERİ ÇÖZÜMLEME & SNAPSHOT MOTORU)               │
│  • TemplateRegistry (Şablon kayıt defteri)                            │
│  • Resolvers (Hangi belgenin hangi SQL verilerine ihtiyacı var?)       │
│  • Snapshot & Overrides (Kullanıcı düzenlemelerini koruyan motor)     │
│  • CompileHtml & PDF ihracı                                           │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ (Veri köprüsü & UI entegrasyonu)
┌────────────────────────────────────────────────────────────────────────┐
│                      3. apps/temin360-desktop                          │
│                      (TÜKETİCİ UYGULAMA - ELECTRON)                     │
│  • Electron IPC kanalları (belge:get-document, belge:save-document)    │
│  • Veritabanı tabloları: DATA_TeminBelgeSnapshot, DATA_DosyaRevizyon   │
│  • Önizleme Modalı (DocumentPreviewModalV3 & DocumentPreviewCanvas)    │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Altın Kural:** Masaüstü uygulaması altında (`DocumentPreviewModalV3/document-engine` gibi) yerel motor kodları bulunmaz. Bütün motor mantığı `@worksuite-360/document-engine` paketi içindedir.

---

## 2. Neyi Nereden Yapacağız? (Geliştirici İş Akışı)

### Senaryo A: Sisteme Yepyeni Bir Belge Şablonu Eklemek

Diyelim ki sisteme **"Sözleşme Tasarısı"** (`sozlesme_tasarisi`) belgesini eklemek istiyorsunuz. Sırasıyla şu adımları izleyin:

#### Adım 1: Görsel Şablonu ve Tipleri Yazın
* **Yer:** `packages/document-templates/src/templates/sozlesme-tasarisi/`
* **Dosyalar:**
  * `types.ts`: Belgenin ihtiyaç duyduğu veri arayüzü (`SozlesmeTasarisiData`).
  * `SozlesmeTasarisi.template.tsx`: Saf React bileşeni. Sadece `data` props'u alır ve HTML/A4 DOM yapısını üretir.

#### Adım 2: Veri Çözümleyicisini (Resolver) Yazın
* **Yer:** `packages/document-engine/src/resolvers/SozlesmeTasarisiResolver.ts`
* **Amaç:** Bu belgenin SQL'den hangi verileri çekeceğini belirler.
* **Örnek Yapı:**
  ```typescript
  import { DocumentDataResolver, DocumentResolutionContext } from '../types/contracts'
  import { SozlesmeTasarisiData } from '@temin360/document-templates'

  export class SozlesmeTasarisiResolver implements DocumentDataResolver<SozlesmeTasarisiData> {
    async resolve(context: DocumentResolutionContext): Promise<SozlesmeTasarisiData> {
      const { dosyaId, headerData, queryExecutor } = context
      
      // Yalnızca bu belgenin ihtiyaç duyduğu SQL sorguları:
      const dosya = (await queryExecutor('SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [dosyaId]))[0]
      const firma = (await queryExecutor('SELECT * FROM DATA_TeminFirma WHERE temin_dosya_id = ? AND kazanan_mi = 1', [dosyaId]))[0]

      return {
        kurumAdi: headerData.kurumAdi,
        yukleniciAdi: firma?.firma_adi || '',
        sozlesmeBedeli: dosya?.yaklasik_maliyet || 0,
        // ...diğer alanlar
      }
    }
  }
  ```

#### Adım 3: Görsel Çiziciyi (Renderer) Oluşturun
* **Yer:** `packages/document-engine/src/renderers/SozlesmeTasarisiRenderer.tsx`
* **Amaç:** `TemplateEditProvider` ve `TemplateErrorBoundary` ile güvenli sarmalama sağlar.

#### Adım 4: Şablonu Kayıt Defterine (TemplateRegistry) Ekleyin
* **Yer:** `packages/document-engine/src/TemplateRegistry.ts`
* `TemplateRegistry.init()` fonksiyonunun içine kaydını ekleyin:
  ```typescript
  this.registerInternal({
    templateKey: 'sozlesme_tasarisi',
    name: 'SozlesmeTasarisi',
    title: 'Sözleşme Tasarısı',
    category: 'sozlesme-ve-siparis',
    categoryLabel: 'Sözleşme',
    description: 'Yüklenici ile idare arasındaki resmi sözleşme metni',
    orientation: 'portrait',
    resolver: new SozlesmeTasarisiResolver(),
    renderer: SozlesmeTasarisiRenderer
  })
  ```

---

### Senaryo B: Mevcut Bir Belgeye Yeni Bir Veri / Kolon Eklemek

Bir belgede yeni bir veri alanına (örneğin `teslimatSuresiGun`) ihtiyaç duyulduğunda:
1. `packages/document-templates/.../types.ts`: İlgili belgenin veri tipine alanı ekleyin.
2. `packages/document-engine/src/resolvers/...Resolver.ts`: SQL sorgusundan bu alanı okuyup dönen JSON nesnesine ekleyin.
3. `packages/document-templates/.../X.template.tsx`: Gelen yeni alanı React bileşeninde ekranda gösterin.

---

### Senaryo C: Belgeyi UI'da Göstermek ve PDF Olarak Çıkarmak

Önizleme modalında veya yazdırma ekranında belge motorunu kullanmak için doğrudan tek bir bileşen çağrılır:

```tsx
import { DocumentRenderer, DocumentEngine } from '@worksuite-360/document-engine'

// 1. Canlı Önizleme Çizimi:
<DocumentRenderer
  templateKey="luzum_muzekkeresi"
  data={formData}
  orientation="portrait"
  chrome="paper" // veya 'bare'
  scale={0.85}
  isEditing={true}
  onFieldChange={(field, value) => updateField(field, value)}
/>

// 2. PDF İçin Saf HTML Çıktısı Üretme:
const html = DocumentEngine.compileHtml({
  templateKey: 'luzum_muzekkeresi',
  data: formData,
  orientation: 'portrait'
})
```

---

## 3. Snapshot ve Veri Güvenliği Kuralları

1. **`DATA_TeminBelgeSnapshot` Tablosu:**
   * Her belgenin son hali `(dosya_id, sablon_kodu)` anahtarıyla tekil (UNIQUE) olarak bu tabloda saklanır.
   * Asla eski `DATA_DosyaSablonVeri` tablosu kullanılmaz.
2. **Kullanıcı Düzenlemeleri (Overrides) Asla Ezilmez:**
   * Kullanıcı belgedeki bir metni elle değiştirdiyse, bu değişiklik snapshot JSON'ına yazılır.
   * Dosyanın diğer verileri güncellendiğinde bile kullanıcının girdiği metin korunur.
3. **Sıfırlama (Reset to Default):**
   * Kullanıcı *"Varsayılana Dön"* butonuna bastığında, mevcut kullanıcı verisi `DATA_DosyaRevizyon` tablosuna arşivlenir, ardından Resolver çalıştırılarak taze varsayılan veri oluşturulur.

---

## 4. `document-engine-v4-nextjs-studio` ve Geleceğe Geçiş Stratejisi

### Neden V4'e Geçilecek?
V4 paketi (`packages/document-engine-v4-nextjs-studio`), bu mimariyi bir adım daha ileriye taşıyan iki devrimsel özelliğe sahiptir:
1. **Alan Bazlı Yenileme Politikası (`RefreshPolicy`):**
   * Her veri alanına `source` (kaynaktan tazele), `preserve` (kullanıcınınkini koru) veya `manual` politikası verilebilir.
2. **Görsel Tasarım Stüdyosu (Next.js Studio):**
   * Kod yazmadan şablon alanlarını ve SQL eşleştirmelerini (mappings) web ekranından görsel olarak yönetebilme.

### Kademeli Geçiş Takvimi:

* [x] **Aşama 1 (Tamamlandı):** Masaüstü içindeki dağınık `document-engine` klasörü silindi, `@worksuite-360/document-engine` merkezileştirildi.
* [ ] **Aşama 2 (Hemen Yapılabilir):** Eski Mustache tabanlı `packages/document-engine-example` paketi tamamen silinecek (V4 onun yerini aldı).
* [ ] **Aşama 3 (Orta Vade):** V4'teki `SnapshotEngine` çekirdeği (dependency cycle kontrolü, computed alanlar) asıl `packages/document-engine` motorumuzun içine aktarılacak.
* [ ] **Aşama 4 (Uzun Vade):** V4 Next.js Studio, monorepo altında bağımsız bir `apps/document-studio` aracına dönüştürülerek kurumlar ve geliştiriciler için şablon tasarım stüdyosu haline getirilecek.

