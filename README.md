# 💼 WorkDesk 360

> **"Kamu Alımları, İhale ve Sözleşme Yönetiminde Yeni Nesil Masaüstü Ekosistemi."**  
> *Tek bir monorepo altında bağımsız uzmanlık uygulamaları ve yüksek performanslı ortak paketler.*

[![Build Status](https://img.shields.io/github/actions/workflow/status/ilyasbozdemir/workdesk-360/release.yml?style=flat-square&logo=github&label=Build%20Status)](https://github.com/ilyasbozdemir/workdesk-360/actions)
[![Latest Release](https://img.shields.io/github/v/release/ilyasbozdemir/workdesk-360?style=flat-square&logo=github&label=Latest%20Release)](https://github.com/ilyasbozdemir/workdesk-360/releases/latest)
[![Monorepo](https://img.shields.io/badge/monorepo-pnpm%20workspaces-orange?style=flat-square)](https://pnpm.io/workspaces)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)

**WorkDesk 360**, kamu kurum ve kuruluşları (Belediyeler, Bakanlıklar, Üniversiteler, Döner Sermayeli ve Özel Bütçeli İdareler) için alım, ihale ve taşınmaz yönetimi süreçlerini uçtan uca dijitalleştiren **çevrimdışı öncelikli (offline-first), modüler ve modern** bir masaüstü monorepo ekosistemidir.

---

## 🏛️ Ürün ve Uygulama Ailesi

WorkDesk 360 monoreposu, her biri kendi mevzuat ve iş akışına odaklanmış 3 bağımsız masaüstü uygulamasını barındırır:

| Uygulama | Konum | Odaklandığı Mevzuat ve Alan | Dosya Formatı | Durum |
| :--- | :--- | :--- | :---: | :---: |
| **⚖️ TEMİN 360** | [`apps/temin360-desktop`](apps/temin360-desktop) | **4734 Sayılı KİK Madde 22 Doğrudan Temin**<br/>Yaklaşık maliyet, piyasa araştırması, teklif değerlendirme, TİF ve kabul süreçleri. | `.temin` | `v1.0.0-rc.8` (Aktif) |
| **📑 İHALE 360** | [`apps/ihale360-desktop`](apps/ihale360-desktop) | **4734 Sayılı Kanun Kapsamındaki İhale Usulleri**<br/>Açık İhale (m.19), Belli İstekliler (m.20), Pazarlık Usulü (m.21) ve EKAP entegrasyonları. | `.ihale` | Geliştirme |
| **🏛️ DEVLET İHALE 2886** | [`apps/devlet-ihale-2886-desktop`](apps/devlet-ihale-2886-desktop) | **2886 Sayılı Devlet İhale Kanunu**<br/>Taşınmaz satış, kiralama (m.45), trampa, mülkiyetten gayri ayni hak ve ecrimisil süreçleri. | `.ihale2886` | Geliştirme |

---

## 📦 Yeniden Kullanılabilir Ortak Paketler (`packages/`)

WorkDesk 360 mimarisi, DRY (Don't Repeat Yourself) prensibi doğrultusunda ortak çekirdek altyapıları paketlere ayırmıştır:

```text
workdesk-360/
├── apps/
│   ├── temin360-desktop/            # Temin 360 Masaüstü Uygulaması (Electron + React)
│   ├── ihale360-desktop/            # İhale 360 Masaüstü Uygulaması
│   └── devlet-ihale-2886-desktop/   # Devlet İhale 2886 Masaüstü Uygulaması
│
└── packages/
    ├── database/                    # @dt/database: SQLite motoru, şema manifestoları & migration
    ├── document-templates/          # @temin360/document-templates: Resmi evrak & şablon kütüphanesi
    ├── pdf-generator/               # @temin360/pdf-generator: Puppeteer tabanlı PDF/A derleyicisi
    ├── domain/                      # @temin360/domain: Kamu maliyesi saf iş ve limit kuralları
    └── ecosystem-contracts/         # @worksuite-360/contracts: Katalog sözleşmeleri & Zod modelleri
```

### 🧩 Paket Sorumlulukları

- **`@dt/database`:** Uygulama bazlı şema yönetimi (`getAppManifest`, `getAppSchemaMax`), otomatik migration zinciri (`resolveMigrationChanges`) ve atomik SQLite dosya yazma güvenliği.
- **`@temin360/document-templates`:** Lüzum Müzekkeresi, İhtiyaç Listesi, Piyasa Fiyat Araştırma Tutanağı ve Muayene Kabul gibi mevzuat standartlarındaki 30+ resmi evrak şablonu.
- **`@temin360/pdf-generator`:** Canlı Word/PDF önizleme ve baskıya hazır vektörel resmi çıktı derleyicisi.
- **`@temin360/domain`:** Sıfır bağımlılıklı saf matematik; parasal limitler, KİK Md. 62/ı denetimleri, tevkifat ve fiyat farkı hesaplamaları.

---

## 🌟 Temel Mimari Prensipler

1. **Çevrimdışı Öncelikli (Offline-First):** Hiçbir uygulama çalışmak için internet bağlantısına ihtiyaç duymaz. Veriler kurum intranetinde veya kullanıcının yerel bilgisayarında kalır.
2. **Bağımsız Mikro-Veritabanı Dosyaları:** Her alım veya ihale dosyası (`.temin`, `.ihale`, `.ihale2886`) içinde SQLite veritabanı, ek belgeler ve metadata içeren taşınabilir bir arşivdir.
3. **Uygulama İzolasyonu:** Her uygulamanın `appId`'si (`com.temin360.desktop`, `com.ihale360.desktop`, `com.devletihale2886.desktop`), güncelleme kanalı ve şema manifestosu tamamen bağımsızdır.
4. **Resmi Evrak & Şablon Motoru:** Yazıcı çıktıları, barkod/karekod desteği, kurum logoları ve imza blokları standart sayfa düzeni motoru (`DocumentEngine`) tarafından yönetilir.

---

## 🚀 Geliştirici Ortamı & Hızlı Başlangıç

### Ön Gereksinimler
- **Node.js:** `>=22.5.0`
- **Paket Yöneticisi:** `pnpm >=9.0.0`
- **İşletim Sistemi:** Windows (Öncelikli), macOS, Linux

### 1. Depoyu Klonlayın ve Bağımlılıkları Kurun
```bash
git clone https://github.com/ilyasbozdemir/workdesk-360.git
cd workdesk-360
pnpm install
```

### 2. Uygulamaları Geliştirme Modunda Çalıştırma
```bash
# Temin 360 uygulamasını başlatın
pnpm --filter temin360-desktop dev

# İhale 360 uygulamasını başlatın
pnpm --filter ihale360-desktop dev

# Devlet İhale 2886 uygulamasını başlatın
pnpm --filter devlet-ihale-2886-desktop dev
```

### 3. Paketleri Derleme ve Test Etme
```bash
# Veritabanı paketini derleyin
pnpm --filter @dt/database build

# Temin 360 birim ve entegrasyon testlerini çalıştırın (550+ test)
pnpm --filter temin360-desktop test

# Tüm projede TypeScript tip denetimini yürütün
pnpm --filter temin360-desktop typecheck
pnpm --filter ihale360-desktop typecheck:node
pnpm --filter devlet-ihale-2886-desktop typecheck:node
```

### 4. Kurulum Paketlerini Derleme (Production Build)
```bash
# Temin 360 Windows kurulum paketini (.exe) derleyin
pnpm --filter temin360-desktop build:win
```

---

## 📊 Kod Tabanı ve Metrikler

Depo bünyesindeki kod satırları ve istatistikler otomatik sayaç altyapısıyla (`scripts/count-loc.js`) takip edilmektedir:

- **Monorepo Genel Kapsam:** 1.500+ kaynak dosya, 230.000+ satır üretim kodu.
- **Test Güvencesi:** Vitest & Playwright ile 550'den fazla otomatik birim, şema, kilit ve UI testi.

---

## 📄 Lisans

Bu proje **Çift Lisanslama (Dual Licensing)** modeliyle sunulmaktadır:

1. **Açık Kaynak Sürüm:** Bireysel geliştiriciler ve akademik incelemeler için **GNU Affero General Public License v3.0 (AGPLv3)** lisansına tabidir.
2. **Kurumsal / Ticari Lisans:** Kamu kurumları, bakanlıklar ve özel entegratörler için intranet dağıtımı, kaynak kodu açma muafiyeti ve özel teknik destek imkânı sağlayan kurumsal lisans mevcuttur.

İletişim ve kurumsal talepler için: **[iletisim@ilyasbozdemir.dev](mailto:iletisim@ilyasbozdemir.dev)**
