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

| Uygulama / Platform | Konum | Odaklandığı Mevzuat ve Alan | Format / Entegrasyon | Durum |
| :--- | :--- | :--- | :---: | :---: |
| **⚖️ TEMİN 360** | [`apps/temin360-desktop`](apps/temin360-desktop) | **4734 Sayılı KİK Madde 22 Doğrudan Temin**<br/>Yaklaşık maliyet, piyasa araştırması, teklif değerlendirme, TİF ve kabul süreçleri. | `.temin` | `v1.0.0-rc.8` (Aktif) |
| **📑 İHALE 360** | [`apps/ihale360-desktop`](apps/ihale360-desktop) | **4734 Sayılı Kanun Kapsamındaki İhale Usulleri**<br/>Açık İhale (m.19), Belli İstekliler (m.20), Pazarlık Usulü (m.21) ve EKAP entegrasyonları. | `.ihale` | Geliştirme |
| **⚡ FLOWDESK** | [`ilyasbozdemir/flowdesk`](https://github.com/ilyasbozdemir/flowdesk) | **Dinamik Süreç Tasarımı, Görev Yönetimi & EBYS Belge Motoru**<br/>JSON tabanlı iş akışları, dinamik formlar ve Workspace 360 Market modülleri. | `.flowdesk` / `.flow` | Aktif Dönüşüm |
| **🏛️ 2886 MODÜLÜ** | [`packages/ecosystem-contracts`](packages/ecosystem-contracts/src/module2886.ts) | **2886 Sayılı Devlet İhale Kanunu Modülü (FlowDesk Uyumlu)**<br/>Taşınmaz satış/kiralama, muhammen bedel, encümen kararı, artırma turları ve sözleşme akışı. | Modül Manifestosu | Entegrasyon |

---

## 📦 Yeniden Kullanılabilir Ortak Paketler (`packages/`)

WorkDesk 360 mimarisi, DRY (Don't Repeat Yourself) prensibi doğrultusunda ortak çekirdek altyapıları paketlere ayırmıştır:

```text
workdesk-360 / flowdesk ekosistemi
├── apps/
│   ├── temin360-desktop/            # Temin 360 Masaüstü Uygulaması (Electron + React)
│   ├── ihale360-desktop/            # İhale 360 Masaüstü Uygulaması
│   └── flowdesk/                    # FlowDesk: Dinamik Süreç Tasarımı & Modüler EBYS Platformu
│
└── packages/
    ├── database/                    # @dt/database: SQLite motoru, şema manifestoları & migration
    ├── document-templates/          # @temin360/document-templates: Resmi evrak & şablon kütüphanesi
    ├── pdf-generator/               # @temin360/pdf-generator: Puppeteer tabanlı PDF/A derleyicisi
    ├── domain/                      # @temin360/domain: Kamu maliyesi saf iş ve limit kuralları
    └── ecosystem-contracts/         # @worksuite-360/contracts: FlowDesk JSON tanımları, 2886 modülü & Market modelleri
```

### 🧩 Paket Sorumlulukları

- **`@dt/database`:** Uygulama bazlı şema yönetimi (`getAppManifest`, `getAppSchemaMax`), otomatik migration zinciri (`resolveMigrationChanges`) ve atomik SQLite dosya yazma güvenliği.
- **`@temin360/document-templates`:** Lüzum Müzekkeresi, İhtiyaç Listesi, Piyasa Fiyat Araştırma Tutanağı ve Muayene Kabul gibi mevzuat standartlarındaki 30+ resmi evrak şablonu.
- **`@temin360/pdf-generator`:** Canlı Word/PDF önizleme ve baskıya hazır vektörel resmi çıktı derleyicisi.
- **`@temin360/domain`:** Sıfır bağımlılıklı saf matematik; parasal limitler, KİK Md. 62/ı denetimleri, tevkifat ve fiyat farkı hesaplamaları.
- **`@worksuite-360/contracts`:** FlowDesk JSON süreç tanımları (`FlowDefinition`), dinamik form şemaları (`FormSchema`), EBYS belge çözümleyicileri ve **2886 Devlet İhale Modül Sözleşmesi** (`DEVLET_IHALE_2886_MODULE_MANIFEST`).

---

## ⚙️ FlowDesk: JSON Tabanlı Süreç ve Belge Altyapısı

FlowDesk, sabit kodlanmış ekranlar yerine **doğrulanabilir, içe/dışa aktarılabilir ve sürümlenebilir JSON süreç tanımları** üzerinden çalışır.

### 📐 Süreç Tanım Modeli Örneği (`FlowDefinition`)

```json
{
  "schemaVersion": 1,
  "id": "sample-process",
  "name": "Örnek Süreç",
  "version": 1,
  "status": "draft",
  "groups": [
    {
      "id": "preparation",
      "title": "Hazırlık",
      "order": 1,
      "steps": [
        {
          "id": "collect-information",
          "title": "Bilgileri Gir",
          "type": "form",
          "order": 1,
          "config": {
            "formSchemaId": "sample-form"
          }
        },
        {
          "id": "prepare-document",
          "title": "Belge Hazırla",
          "type": "document",
          "order": 2,
          "config": {
            "templateId": "sample-document"
          }
        }
      ]
    }
  ]
}
```

### ⚡ Dinamik İşlem Adımı Türleri
- **`form`:** Yapılandırılmış form üzerinden dinamik veri toplama ve alan doğrulama.
- **`document`:** Şablon üzerinden EBYS formatında matbu evrak oluşturma (HTML/PDF).
- **`task`:** Kullanıcıya veya birime atanabilir görev tanımlama ve tamamlama.
- **`approval`:** Yetkili karar mekanizması (Kabul, Ret, İade).
- **`condition`:** Koşula bağlı dinamik adım ve süreç dallanması.
- **`action`:** Önceden tanımlı ve izin verilen sistem işlevini güvenli tetikleme.

### 🏛️ 2886 Devlet İhale Modülü Dönüşümü
2886 Devlet İhale Kanunu ayrı, silolaşmış bir masaüstü uygulaması olarak değil; **FlowDesk üzerinde çalışan ve Workspace 360 Market üzerinden edinilebilen 5 aşamalı bir modül** olarak konumlandırılmıştır:
1. **Aşama:** Başlangıç ve Yetki Evrakları (Başkanlık Oluru `2886-EVR-01`, Encümen Kararı)
2. **Aşama:** Kıymet Takdiri & Muhammen Bedel (`2886-EVR-05`)
3. **Aşama:** Şartname, İhale Kararı & İlan Süreci (`2886-EVR-06`)
4. **Aşama:** İhale Günü, Açık Artırma & Encümen Kararı (`2886-EVR-12`)
5. **Aşama:** İta Amiri Onayı, Tebligat & Sözleşme (`2886-EVR-14`)

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
