# 💼 WorkDesk 360 — Mimari, Masaüstü Uygulamaları ve Workspace 360

> **Ana Depo:**
> [github.com/ilyasbozdemir/workdesk-360](https://github.com/ilyasbozdemir/workdesk-360)\
> **Temin & İhale Uygulaması:**
> [TEMİN 360](https://github.com/ilyasbozdemir/workdesk-360)

---

## 1. WorkDesk 360 Nedir, Hangi Problemi Çözer?

Kamu idareleri (belediyeler, üniversiteler, bakanlıklar) ve onlarla çalışan
**müteahhitler, mühendislik firmaları ve kurumsal işletmeler** günlük
operasyonlarında çok sayıda parçalı masaüstü veya web yazılımı kullanmaktadır:

- Satın alma, ihale, doğrudan temin (4734, 4735, 2886) ve müteahhit
  hakediş/keşif özetleri
- Dosya arama, arşivleme ve yinelenen depolama temizliği
- Resmi evrak üretimi, EBYS ve şablon doldurma
- Harita, koordinat (ITRF96/ED50/WGS84) ve taşınmaz yönetimi
- Personel görevlendirmeleri, heyetler ve süreç takibi

Bu araçların büyük kısmı ya birbirinden kopuk çalışmakta, ya hantal web
arayüzlerine sıkışmakta ya da modern masaüstü kullanıcı deneyiminden
(offline-first, anlık tepki hızı, koyu/açık tema, yerel dosya güvenliği) yoksun
kalmaktadır.

**WorkDesk 360**, aynı tasarım dilini (design system), ortak güvenlik
prensiplerini ve tip sözleşmelerini paylaşan; hem idarenin hem de müteahhit/özel
sektörün operasyonel ihtiyaçlarını karşılayan **bağımsız çalışabilen ve
kurulabilen** modern bir masaüstü çalışma süitidir.

---

## 2. Mimari Yaklaşım ve Güvenlik Sınırları

1. **Bağımsızlık ve İzolasyon:** Her masaüstü uygulaması bağımsız bir
   `appId`'ye, bağımsız SQLite/yerel depolama modeline ve bağımsız yürütülebilir
   dosyaya (`.exe`) sahiptir. Bir uygulamanın çökmesi diğerini etkilemez.
2. **Mevcut Temin 360'ın Korunması:** Amiral gemisi niteliğindeki Temin 360'ın
   `.temin` dosya ilişkisi, NSIS kurulum altyapısı, veritabanı şeması ve release
   mekanizması kesinlikle bozulmaz.
3. **Doğrulanabilir Yerel Manifestolar:** Her uygulama,
   `@WorkDesk-360/contracts` paketi altındaki Zod şemasıyla doğrulanan bir
   `AppManifest` nesnesine sahiptir.
4. **Ortak Tasarım Dili:** Temin 360'ın CSS tasarım tokenları
   (`--theme-primary`, `--theme-bg-100`, `--theme-border-100`, Lucide ikon seti,
   Radix UI ve cam efekti / glassmorphism) tüm süite rehberlik eder.

---

## 3. WorkDesk 360 Ürün Ailesi

| Uygulama          |              Durum              | App ID                           | Görev ve Sorumluluk Alanı                                                                                                        |
| :---------------- | :-----------------------------: | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace 360** |   **Yüklü / Hazır (v0.1.0)**    | `dev.ilyasbozdemir.workspace360` | Merkezi çalışma alanı, uygulama kataloğu, sürüm doğrulama ve başlatıcı.                                                          |
| **TEMİN 360**     | **Yüklü / Hazır (v1.0.0-rc.7)** | `dev.ilyasbozdemir.temin360`     | Kamu alımları, doğrudan temin, ihale, hakediş icmalleri, keşif özetleri ve taşınır yönetimi.                                     |
| **Dosya 360**     |     **Planlandı (Aşama 2)**     | `dev.ilyasbozdemir.dosya360`     | **Birleşik Dosya Merkezi:** Hızlı Arama, Etiketler/Koleksiyonlar, Yinelenen Dosyalar, Temizlik/Karantina, İndeksleme ve Ayarlar. |
| **Süreç 360**     |            Planlandı            | `dev.ilyasbozdemir.surec360`     | İş süreçleri, birimler ve taşeronlar arası görev dağılımı, zaman çizelgesi ve kanban onay akışları.                              |
| **Harita 360**    |            Planlandı            | `dev.ilyasbozdemir.harita360`    | ITRF96/ED50/WGS84 koordinat dönüşümü, parsel haritalandırma, saha fotoğrafları ve taşınmaz envanteri.                            |
| **Personel 360**  |            Planlandı            | `dev.ilyasbozdemir.personel360`  | Muayene kabul heyetleri, kontrol teşkilatı ve personel görev matrisi.                                                            |
| **Belge 360**     |            Planlandı            | `dev.ilyasbozdemir.belge360`     | Resmi yazışma kurallarına uygun evrak editörü, şablon motoru ve barkodlama.                                                      |
| **Arşiv 360**     | **Hazır (v1.0.0 / Portable)**   | `dev.ilyasbozdemir.arsiv360`     | Karışık duran belgeleri fiziksel olarak taşımadan kural motoruyla sanal klasörler halinde düzenleme, canlı chokidar izleme ve SQLite arşivi. |

---

## 4. Özel Mimari Karar: "Dosya 360" Altında Birleşik Dosya Araçları

İlk taslakta ayrı ayrı planlanan dosya araçları, çelişkili veya parçalı bir yapı
oluşturmamak ve ortak indeksleme/ayar merkezi avantajını kullanmak amacıyla
**Dosya 360** adıyla tek masaüstü ürününde birleştirilmiştir.

Dosya 360 bünyesinde yer alan 6 modül:

1. **Hızlı Arama:** Dosya indeksleme, hızlı arama, filtreler (uzantı, boyut,
   tarih) ve sıralama.
2. **Etiketler ve Koleksiyonlar:** Dosyaları fiziksel olarak taşımadan sanal
   olarak düzenleme, etiketleme, favoriler ve kayıtlı aramalar.
3. **Yinelenen Dosyalar:** Dosya boyutu ve SHA-256 hash doğrulamasıyla adayları
   belirleme, içerikleri karşılaştırma ve kullanıcı onayıyla güvenli temizlik.
4. **Temizlik ve Karantina:** İnceleme, karantinaya alma ve gerektiğinde güvenli
   geri yükleme.
5. **İndeksleme ve Depolama:** İndeks kapsamı, arka plan ilerlemesi, hariç
   tutulan dizinler ve depolama limitleri.
6. **Genel Bakış ve Ayarlar:** Dosya araçlarının durumunu ve uygulama ayarlarını
   tek merkezden yönetme.

---

## 5. Workspace 360'ın Rolü

Workspace 360, kullanıcının bilgisayarında kurulu olan WorkDesk 360
uygulamalarını tespit eder, sürümlerini ve sağlık durumlarını gösterir, tek
tıkla başlatılmalarını sağlar. Henüz kurulmamış veya geliştirilmekte olan
uygulamaları açıkça **"Geliştirme Aşamasında / Planlandı"** olarak işaretler;
kullanıcıyı yanıltıcı sahte butonlar sunmaz.

---

## 6. Monorepo Yapısı ve Paketler

```text
workdesk-360/
├── apps/
│   ├── app-archive/          # Arşiv 360 (Portable Electron + React + SQLite)
│   ├── app-desktop/          # TEMİN 360 (Electron + React + SQLite)
│   ├── app-workspace/        # Workspace 360 (Vite + React + Tailwind + Catalog)
│   ├── app-web/              # Web Portalı & Bulut Yönetimi
│   └── app-landing/          # Tanıtım Sitesi
├── packages/
│   ├── ecosystem-contracts/  # @WorkDesk-360/contracts (Manifestolar & Zod Şeması)
│   ├── database/             # @dt/database
│   ├── domain/               # @temin360/domain
│   ├── document-templates/   # @temin360/document-templates
│   └── pdf-generator/        # @temin360/pdf-generator
```

---

## 7. Geliştirme ve Çalıştırma

```bash
# 1. Bağımlılıkları yükle
pnpm install

# 2. Workspace 360'ı yerel geliştirme modunda çalıştır
pnpm dev:workspace

# 3. Temin 360 masaüstü uygulamasını çalıştır
pnpm dev:desktop

# 4. Bağımsız testleri çalıştır
pnpm test:contracts   # Manifesto sözleşme testleri (6/6)
pnpm test:workspace   # Workspace katalog UI testleri (6/6)
pnpm test             # Temin 360 birim testleri (486/486)
```
