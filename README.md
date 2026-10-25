# ⚖️ TEMİN 360

> **"Kamu Harcamaları, İhale, Doğrudan Temin ve Hakediş Süreçlerinde Akıllı
> Masaüstü Asistanı."**\
> _Bu uygulama, [WorkSuite 360](docs/WORKSUITE.md) masaüstü ürün ailesinin kamu
> alımları, ihale ve hakediş yönetimi uzmanlık modülüdür. Merkezi başlatıcı ve
> uygulama kataloğu için
> [Workspace 360](docs/WORKSUITE.md#5-workspace-360%C4%B1n-rol%C3%BC)
> dokümantasyonunu inceleyebilirsiniz._

**TEMİN 360**, kamu idareleri (Belediyeler, Bakanlıklar, Üniversiteler ve Özel
Bütçeli Kurumlar) için 4734 Sayılı Kamu İhale Kanunu, 4735 Sayılı Sözleşmeler
Kanunu, 5018 Sayılı Kamu Malî Yönetimi Kanunu ve 2886 Sayılı Devlet İhale Kanunu
süreçlerini uçtan uca dijitalleştiren **modern, çevrimdışı öncelikli ve açık
kaynaklı** bir kurumsal yönetim platformudur.

---

## 🌟 Öne Çıkan Özellikler

- ⚡ **360° Süreç Yönetimi:** İhtiyaç tespiti ve lüzum müzekkeresinden başlayıp
  piyasa araştırması, onay belgesi, sözleşme, muayene-kabul, hakediş ve taşınır
  işlem fişine (TİF) kadar tüm adımlar tek ekranda.
- 📦 **Tüm Alım Türleri Destekli:**
  - **Mal Alımları:** Taşınır kodları, ambar stok çıkış, muayene ve kabul
    komisyon tutanakları.
  - **Hizmet Alımları:** Puantaj çizelgeleri, KDV tevkifat hesapları, hizmet
    kabul tutanakları.
  - **Yapım İşleri & Küçük Onarım:** Keşif özetleri, poz ve metraj analizleri,
    hakediş icmalleri.
  - **2886 Sayılı DİK:** Taşınmaz kiralama, satış, trampa ve ecrimisil takip
    süreçleri.
- ✍️ **Resmi Evrak & Şablon Motoru:** Tek tıkla mevzuata tam uyumlu, barkodlu,
  karekodlu ve baskıya hazır resmi PDF/A ve Word belgeleri üretimi.
- 🗄️ **Tek Dosyada Taşınabilir Çalışma Alanı (`.temin`):** Her ihale veya
  doğrudan temin dosyası bağımsız, şifrelenebilir ve taşınabilir tek bir yerel
  veritabanı dosyası olarak saklanır.
- ☁️ **Akıllı Senkronizasyon & Yedekleme:** Google Drive, yerel klasör veya
  merkezi kurum sunucusuna otomatik kapanış yedeği ve arka plan eşitlemesi.
- 🛡️ **Mevzuat Karar Destek:** Güncel KİK limitleri, yaklaşık maliyet analizleri
  ve usul kontrolleri ile personele hata payı bırakmayan rehberlik.

---

## 📸 Uygulama Arayüzü ve Ekran Görüntüleri

|                           Başlatıcı & Dosya Seçimi                           |                       Çalışma Alanı & Süreç Yönetimi                       |
| :--------------------------------------------------------------------------: | :------------------------------------------------------------------------: |
| ![Başlatıcı Ekranı](apps/app-desktop/e2e-screenshots/01-launcher-screen.png) | ![Çalışma Alanı](apps/app-desktop/e2e-screenshots/02-workspace-opened.png) |
|                  _Kurum, birim ve `.temin` dosyası seçimi_                   |     _İhale / temin sürecinin uçtan uca yürütüldüğü ana çalışma alanı_      |

|                              Dinamik Form & Süreç Modu                               |                               Canlı Word & Belge Önizleme                                |
| :----------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------: |
| ![Mod Etkileşimi](apps/app-desktop/e2e-screenshots/03-mode-switched-interaction.png) | ![Word Düzenleme Önizleme](apps/app-desktop/e2e-screenshots/11-word-editing-preview.png) |
|          _Alım türüne ve yasal usule göre uyarlanan dinamik veri alanları_           |            _Mevzuata uygun resmi şablonlar ve canlı Word/PDF önizleme motoru_            |

|                      Dizüstü & Kompakt Ekran (1366×768)                      |                         Full HD Geniş Ekran (1920×1080)                         |
| :--------------------------------------------------------------------------: | :-----------------------------------------------------------------------------: |
| ![Laptop 1366x768](apps/app-desktop/e2e-screenshots/responsive-1366x768.png) | ![Full HD 1920x1080](apps/app-desktop/e2e-screenshots/responsive-1920x1080.png) |
|    _Dizüstü bilgisayarlarda menü ve kurum alanlarının optimize yerleşimi_    |        _Geniş ekranlarda maksimum veri görünürlüğü ve konforlu kullanım_        |

---

## 📥 İndir ve Kur

En güncel kararlı masaüstü sürümlerini doğrudan indirebilirsiniz:

- 🚀 **Resmi Web Portalı:**
  [temin360.ilyasbozdemir.dev](https://temin360.ilyasbozdemir.dev)
- 📦 **Doğrudan İndirme:**
  [GitHub Releases](https://github.com/ilyasbozdemir/workdesk-360/releases)
  _(Windows `.exe` ve macOS `.dmg`)_
- ☁️ **Canlı Demo Gateway:**
  [temin360app.demo.ilyasbozdemir.dev](https://temin360app.demo.ilyasbozdemir.dev)

---

## 🛠️ Teknoloji Mimarisi

TEMİN 360 modern, yüksek performanslı ve çevrimdışı (offline-first) bir monorepo
mimarisi üzerine inşa edilmiştir:

```text
workdesk-360/
├── apps/
│   ├── app-desktop/      # Electron 39 + React 19 + TypeScript + SQLite Masaüstü Uygulaması
│   ├── app-landing/      # Next.js 16 + Tailwind CSS Tanıtım ve Dağıtım Portalı
│   └── app-web/          # Next.js 16 Canlı Senkronizasyon ve API Gateway Servisi
└── packages/
    ├── document-templates/ # Modüler Kamu Evrak ve Tutanak Şablonları Motoru
    ├── pdf-generator/      # Yüksek Performanslı PDF Derleme Paketi
    └── database/           # SQLite ve Ortak Şema Tanımları
```

---

## 🚀 Geliştirici Ortamı (Hızlı Başlangıç)

Projeyi yerel geliştirme ortamınızda çalıştırmak için:

```bash
# 1. Depoyu klonlayın ve bağımlılıkları yükleyin
pnpm install

# 2. Masaüstü uygulamasını başlatın
pnpm dev:desktop

# 3. Tanıtım web portalını başlatın (Opsiyonel - http://localhost:3001)
pnpm dev:website

# 4. Web Gateway sunucusunu başlatın (Opsiyonel - http://localhost:3000)
pnpm dev:web
```

### Sık Kullanılan Komutlar

| Komut                 | Açıklama                                                            |
| :-------------------- | :------------------------------------------------------------------ |
| `pnpm dev:desktop`    | Masaüstü uygulamasını geliştirme modunda açar                       |
| `pnpm build:desktop`  | Windows ve macOS için kurulum paketlerini derler                    |
| `pnpm typecheck`      | Tüm çalışma alanında TypeScript tip kontrollerini çalıştırır        |
| `pnpm format`         | Prettier ile kod formatlamasını düzenler                            |
| `pnpm lint`           | ESLint ile kod kalitesi denetimini yürütür                          |
| `pnpm stats:loc`      | Masaüstü ve bağımlılıklarının kod satırlarını (`app+deps`) sayar    |
| `pnpm stats:loc:repo` | Monorepo bünyesindeki tüm paketlerin (`repo`) kod satırlarını sayar |
| `pnpm analyze`        | Kod büyüklüğü ve mükerrer fonksiyon analizi yürütür                 |

### 📊 Kod Tabanı Dağılımı ve LOC Metrikleri

Projede kod satırlarının ve dosya adetlerinin güvenilir biçimde takip edilmesi
için otomatik sayaç altyapısı (`apps/app-desktop/scripts/count-loc.js`)
bulunmaktadır. Sayaç çıktısı masaüstü uygulamasının _Hakkında_ penceresine
(`generated-loc.json`) otomatik olarak beslenir.

- **Kapsamlar:**
  - `app`: Yalnızca `apps/app-desktop` uygulamasını kapsar.
  - `app+deps` _(Varsayılan)_: Masaüstü uygulaması ve doğrudan bağlı workspace
    paketlerini (`packages/database`, `packages/document-templates`) kapsar.
  - `repo`: Monorepo bünyesindeki tüm paketleri (`apps/*`, `packages/*`) kapsar.
- **Sayım Kuralı & Tanımlar:**
  - Taranan dosyalar paketlerin `src/` dizini altındaki `.ts`, `.tsx`, `.css`,
    `.html`, `.js`, `.jsx` uzantılı kaynak dosyalarıdır (`.d.ts` ve `.min.*`
    hariçtir).
  - `node_modules`, `dist`, `out`, `build`, `coverage`, `.git`, `.next`,
    `dist-local` ve `.turbo` klasörleri sayıma dahil edilmez.
  - `totalLines`: Dosya sonundaki tekil satır sonlandırıcı karakteri normalize
    edilerek hesaplanan gerçek satır sayısıdır
    (`totalLines = nonBlankLines + blankLines`).
  - `codeLines` / `nonBlankLines`: Yalnızca boş olmayan satırları (SLOC) ifade
    eder. Bu metrik satır içi/blok yorumları içerebilir; yorumlardan
    arındırılmış saf çalıştırılabilir kod olduğu varsayılmamalıdır.
  - Test dosyaları (`__tests__`, `*.test.*`, `*.spec.*`, `__mocks__`,
    `__fixtures__`) üretim kodundan ayrı kategorize edilir.

#### Doğrulanmış Güncel Kod Tabanı Dağılımı (`app+deps` Kapsamı)

| Paket Adı                        | Konum                         | Dosya Sayısı | Toplam Satır | Kod Satırı (SLOC) | Üretim Kodu (SLOC) |    Test Kodu (SLOC)    | Boş Satır  |
| :------------------------------- | :---------------------------- | :----------: | :----------: | :---------------: | :----------------: | :--------------------: | :--------: |
| **app-desktop**                  | `apps/app-desktop`            |    1.217     |   225.231    |      210.285      |      205.140       |   5.145 _(35 dosya)_   |   14.946   |
| **@temin360/document-templates** | `packages/document-templates` |     148      |    24.736    |      23.251       |       21.660       |   1.591 _(10 dosya)_   |   1.485    |
| **@dt/database**                 | `packages/database`           |     146      |    4.592     |       4.508       |       4.508        |           0            |     84     |
| **GENEL TOPLAM**                 | Monorepo (Çalışma Seti)       |  **1.511**   | **254.559**  |    **238.044**    |    **231.308**     | **6.736** _(45 dosya)_ | **16.515** |

_(Not: Sayım `count-loc.js` aracıyla otomatik üretilmiştir. Testler
çıkarıldığında net üretim kodu 1.466 dosyada 231.308 boş olmayan satırdır.)_

---

## 📄 Lisans

Bu proje **Çift Lisanslama (Dual Licensing)** modeliyle sunulmaktadır:

1. **Açık Kaynak Sürüm:** Bireysel geliştiriciler ve akademik incelemeler için
   **GNU AGPLv3** lisansına tabidir.
2. **Kurumsal / Ticari Lisans:** Kamu kurumları, bakanlıklar ve özel
   entegratörler için intranet dağıtımı, kaynak kodu açma muafiyeti ve özel
   teknik destek imkânı sağlayan kurumsal lisans mevcuttur.

İletişim ve kurumsal talepler için:
**[bozdemir.ib70@gmail.com](mailto:bozdemir.ib70@gmail.com)**
