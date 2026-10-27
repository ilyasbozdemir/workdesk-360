# WORKDESK 360 / TEMİN 360 • Modüler Ekran Şablonları Rehberi

Bu dizin, **TEMİN 360** tasarım standartlarını referans alan hazır ve modüler ekran şablonlarını içerir. Yeni bir ekran, sayfa veya yönetim masası geliştirileceğinde doğrudan bu şablonlardan biri kopyalanıp hızla işleme alınabilir.

---

## 📁 Şablon Seçenekleri

| Şablon Dosyası | Tür | Kullanım Alanı | İçerik |
|---|---|---|---|
| [`BlankScreenTemplate.tsx`](./BlankScreenTemplate.tsx) | **Yalın / Boş Ekran** | Yeni CRUD modülleri, basit listeler veya sıfırdan tasarlanacak sayfalar | Üst başlık şeridi, breadcrumb, yenile & ekle butonları, arama/filtre çubuğu ve modern empty state |
| [`TabbedScreenTemplate.tsx`](./TabbedScreenTemplate.tsx) | **Sekmeli & Metrikli Ekran** | Süreç akışları, hakedişler, durum bazlı listelemeler | 4'lü KPI sayaç kartları, sekmeler (`Tümü`, `Devam Edenler`, vb.), arama barı ve liste görünümü |
| [`DetailDrawerTemplate.tsx`](./DetailDrawerTemplate.tsx) | **Detay Çekmecesi (Drawer)** | Tablo/liste öğesine tıklandığında sağdan kayan inceleme paneli | Koyu/açık mod uyumlu, özet kartı, parametreler tablosu ve aksiyon butonları |

---

## 🚀 Hızlı Başlangıç (Yeni Ekran Nasıl Eklenir?)

1. İhtiyacınıza uygun şablon dosyasını seçin (örn: `BlankScreenTemplate.tsx`).
2. İlgili uygulamanın `src/renderer/src/screens/<modul-adi>/` dizinine kopyalayın.
3. Başlıkları ve veri modellerini modülünüze göre uyarlayın.
4. TanStack Router veya uygulama routing yapısına kaydedin.

```tsx
// Örnek: apps/flowdesk-desktop/src/renderer/src/screens/surecler/SureclerScreen.tsx
import { TabbedScreenTemplate } from '../../../../templates/screens/TabbedScreenTemplate'

export default function SureclerScreen() {
  return <TabbedScreenTemplate />
}
```

---

## 🎨 Tasarım Prensipleri
- **Tema:** `dark:` ve standart stiller Tailwind CSS ile tam uyumludur.
- **İkonlar:** Tutarlılık için yalnızca `lucide-react` kullanılmalıdır.
- **Pencereler:** Frameless masaüstü başlık çubuğu (`WebkitAppRegion: 'drag'`) ile çakışmayacak şekilde üstten yeterli padding bırakılmıştır.
