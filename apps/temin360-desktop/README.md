# ⚖️ TEMİN 360 — Doğrudan Temin Masaüstü Yönetim Sistemi

<p align="center">
  <img src="resources/icon.png" alt="Temin 360 İkonu" width="128" />
</p>

<p align="center">
  <a href="https://github.com/ilyasbozdemir/workdesk-360/actions"><img src="https://img.shields.io/github/actions/workflow/status/ilyasbozdemir/workdesk-360/release.yml?style=flat-square&logo=github&label=Build%20Status" alt="Build Status"></a>
  <a href="https://github.com/ilyasbozdemir/workdesk-360/releases/latest"><img src="https://img.shields.io/github/v/release/ilyasbozdemir/workdesk-360?style=flat-square&logo=github&label=Latest%20Release" alt="Latest Release"></a>
  <a href="https://github.com/ilyasbozdemir/workdesk-360/releases"><img src="https://img.shields.io/github/downloads/ilyasbozdemir/workdesk-360/total?style=flat-square&logo=github&color=blue" alt="Downloads"></a>
</p>

> **"Kamu Harcamaları ve Doğrudan Temin Süreçlerinde Akıllı Masaüstü
> Asistanı."**\
> _Bu uygulama, [WorkDesk 360](../../README.md) masaüstü ürün ailesinin 4734
> Sayılı Kamu İhale Kanunu Madde 22 kapsamındaki doğrudan temin alımlarına
> odaklanmış uzmanlık uygulamasıdır._

**TEMİN 360**, kamu idareleri (Belediyeler, Bakanlıklar, Üniversiteler ve Özel
Bütçeli Kurumlar) için doğrudan temin süreçlerini uçtan uca dijitalleştiren
**modern, çevrimdışı öncelikli (offline-first) ve açık kaynaklı** bir kurumsal
yönetim platformudur.

---

## 🌟 Öne Çıkan Özellikler

- ⚡ **360° Doğrudan Temin Süreci:** İhtiyaç tespiti ve lüzum müzekkeresinden
  başlayıp piyasa araştırması, onay belgesi, sözleşme, muayene-kabul, hakediş ve
  taşınır işlem fişine (TİF) kadar tüm adımlar tek ekranda.
- 📦 **Tüm Alım Türleri Destekli:**
  - **Mal Alımları (22/a, 22/c, 22/d):** Taşınır kodları, ambar stok çıkış,
    muayene ve kabul komisyon tutanakları.
  - **Hizmet Alımları:** Puantaj çizelgeleri, KDV tevkifat hesapları, hizmet
    kabul tutanakları.
  - **Yapım İşleri & Küçük Onarım (22/d):** Keşif özetleri, poz ve metraj
    analizleri, hakediş icmalleri.
- ✍️ **Resmi Evrak & Şablon Motoru:** Tek tıkla mevzuata tam uyumlu, barkodlu,
  karekodlu ve baskıya hazır resmi PDF/A ve Word belgeleri üretimi.
- 🗄️ **Tek Dosyada Taşınabilir Çalışma Alanı (`.temin`):** Her doğrudan temin
  dosyası bağımsız, şifrelenebilir ve taşınabilir tek bir SQLite arşiv dosyası
  olarak saklanır.
- ☁️ **Akıllı Senkronizasyon & Yedekleme:** Google Drive veya yerel klasöre
  otomatik kapanış yedeği ve arka plan eşitlemesi.
- 🛡️ **Mevzuat Karar Destek:** Güncel KİK doğrudan temin limitleri
  (Büyükşehir/Diğer), yaklaşık maliyet analizleri ve usul kontrolleri ile
  personele hata payı bırakmayan rehberlik.

---

## 📥 İndir ve Kur

En güncel kararlı masaüstü sürümlerini doğrudan indirebilirsiniz:

- 👉
  **[En Son Sürümü İndir (GitHub Releases)](https://github.com/ilyasbozdemir/workdesk-360/releases/latest)**
  _(Windows `.exe` kurulum paketi)_
- 📦
  **[Tüm Sürümler ve Paketler (Releases Archive)](https://github.com/ilyasbozdemir/workdesk-360/releases)**
- 🚀 **Resmi Tanıtım Portalı:**
  [temin360.ilyasbozdemir.dev](https://temin360.ilyasbozdemir.dev)

---

## 📸 Uygulama Arayüzü ve Ekran Görüntüleri

|                  Başlatıcı & Dosya Seçimi                   |              Çalışma Alanı & Süreç Yönetimi               |
| :---------------------------------------------------------: | :-------------------------------------------------------: |
| ![Başlatıcı Ekranı](e2e-screenshots/01-launcher-screen.png) | ![Çalışma Alanı](e2e-screenshots/02-workspace-opened.png) |
|          _Kurum, birim ve `.temin` dosyası seçimi_          | _Temin sürecinin uçtan uca yürütüldüğü ana çalışma alanı_ |

|                      Dinamik Form & Süreç Modu                      |                       Canlı Word & Belge Önizleme                       |
| :-----------------------------------------------------------------: | :---------------------------------------------------------------------: |
| ![Mod Etkileşimi](e2e-screenshots/03-mode-switched-interaction.png) | ![Word Düzenleme Önizleme](e2e-screenshots/11-word-editing-preview.png) |
|         _Alım türüne göre uyarlanan dinamik veri alanları_          |   _Mevzuata uygun resmi şablonlar ve canlı Word/PDF önizleme motoru_    |

|                 Standart Laptop (1366×768)                  |                   Full HD Geniş Ekran (1920×1080)                   |
| :---------------------------------------------------------: | :-----------------------------------------------------------------: |
| ![Laptop 1366x768](e2e-screenshots/responsive-1366x768.png) |   ![Full HD 1920x1080](e2e-screenshots/responsive-1920x1080.png)    |
|  _Dizüstü bilgisayarlarda optimize edilmiş arayüz düzeni_   | _Geniş ekranlarda maksimum veri görünürlüğü ve ferah çalışma alanı_ |

---

## 📄 Basıma Hazır Alınabilen Belgeler

Sistemden saniyeler içinde otomatik olarak üretip çıktısını alabileceğiniz resmi
belgeler:

1. Lüzum Müzekkeresi (İhtiyaç Talep Yazısı)
2. İhtiyaç Listesi Cetveli
3. Yaklaşık Maliyet Hesap Cetveli & Görevlendirme Yazısı
4. Piyasa Fiyat Araştırması Görevlendirme Onayı
5. Firmalardan Teklif İsteme Mektubu
6. Piyasa Fiyat Araştırma Tutanağı
7. Doğrudan Temin Onay Belgesi
8. Doğrudan Temin Sözleşmesi & Sipariş Mektubu
9. Muayene ve Kabul Komisyonu Görevlendirme Onayı
10. Muayene ve Kabul Tutanağı (Mal / Hizmet / Yapım)
11. Taşınır İşlem Fişi (TİF) ve Ödeme Emri Belgesi

---

## 🗄️ Taşınabilir Dosya Mimarisi (`.temin`)

`.temin` dosyaları ZIP tabanlı, bağımsız bir mikro-veritabanı paketidir:

```text
dosya.temin
├── database.sqlite    ← Dosyaya ait tüm SQLite verileri
├── meta.json          ← Dosya kimliği, kurum adı ve şema sürümü
└── attachments/       ← Ekli şartnameler, teklif mektupları ve belgeler
```

---

## 🛠️ Yerel Geliştirme

```bash
# Bağımlılıkları yükleyin (monorepo kök dizininde)
pnpm install

# Temin 360 uygulamasını geliştirme modunda başlatın
pnpm --filter temin360-desktop dev

# TypeScript tip kontrolünü çalıştırın
pnpm --filter temin360-desktop typecheck

# Testleri çalıştırın
pnpm --filter temin360-desktop test

# Windows kurulum paketini (.exe) derleyin
pnpm --filter temin360-desktop build:win
```

---

## 📄 Lisans

Bu proje **GNU Affero General Public License v3.0 (AGPLv3)** ile
lisanslanmıştır. Kurumsal ve intranet dağıtımları için çift lisanslama
(dual-licensing) imkânı sunulmaktadır.

İletişim: **[bozdemir.ib70@gmail.com](mailto:bozdemir.ib70@gmail.com)**
