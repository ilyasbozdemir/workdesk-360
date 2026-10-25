# Doğrudan Temin Masaüstü Yönetim Uygulaması

<p align="center">
  <img src="resources/icon.png" alt="Doğrudan Temin Yönetimi İkonu" width="128" />
</p>

<p align="center">
  <a href="https://github.com/ilyasbozdemir/workdesk-360/actions"><img src="https://img.shields.io/github/actions/workflow/status/ilyasbozdemir/workdesk-360/release.yml?style=flat-square&logo=github&label=Build%20Status" alt="Build Status"></a>
  <a href="https://github.com/ilyasbozdemir/workdesk-360/releases/latest"><img src="https://img.shields.io/github/v/release/ilyasbozdemir/workdesk-360?style=flat-square&logo=github&label=Latest%20Release" alt="Latest Release"></a>
  <a href="https://github.com/ilyasbozdemir/workdesk-360/releases"><img src="https://img.shields.io/github/downloads/ilyasbozdemir/workdesk-360/total?style=flat-square&logo=github&color=blue" alt="Downloads"></a>
</p>

**4734 Sayılı Kamu İhale Kanunu Madde 22 kapsamında doğrudan temin yoluyla
yapılan alımları yönetmek için geliştirilmiş masaüstü uygulama.**

## 📥 Masaüstü Uygulamasını İndirin (Download Desktop App)

Uygulamanın en güncel sürümünü (Windows `.exe` yükleyicisi, güncelleme
yansımaları vb.) aşağıdaki resmi kaynaklardan indirebilirsiniz:

👉
**[En Son Sürümü İndir (GitHub Releases)](https://github.com/ilyasbozdemir/workdesk-360/releases/latest)**
👉
**[Tüm Sürümler ve Paketler (Releases Archive)](https://github.com/ilyasbozdemir/workdesk-360/releases)**

_Not: Windows için indirilen `.exe` dosyasını çalıştırarak kurulumu
tamamlayabilirsiniz. Otomatik güncelleme desteği sayesinde uygulama açıkken yeni
sürümler arka planda otomatik olarak denetlenip güncellenir._

---

## Hakkında

Doğrudan Temin Programı, varsayılan olarak internet bağlantısı gerektirmeyen,
tamamen **çevrimdışı (offline)** çalışan bir masaüstü uygulamasıdır. Ancak yeni
nesil **Ağ Senkronizasyonu (EBYS Mimarisi)** sayesinde kurumunuzdaki diğer
birimlerle (Satın Alma, Muhasebe vb.) yerel ağ (LAN) üzerinden anında eşzamanlı
veri paylaşımı yapabilirsiniz.

Uygulama, tüm verilerini `.temin` uzantılı dosyalarda saklar. Bu dosya formatı,
tıpkı `.docx`, `.xlsx` veya `.pptx` gibi uygulamaya özgü bir yapıya sahiptir;
içinde SQLite veritabanı ve ilgili meta veriler yer alır. Dosyalarınızı
yedekleyebilir, taşıyabilir, paylaşabilir veya yerel ağdaki bir Host üzerinden
tüm birimlerle canlı olarak çalışabilirsiniz.

---

## Özellikler

- **Mevzuata tam uygunluk** — 4734 Sayılı Kamu İhale Kanunu Madde 22 ve Kamu
  İhale Kurumu standartları eksiksiz karşılanmaktadır.
- **Tek girdi, sonsuz kullanım** — Temin sürecinde kullanılan belgeleri
  kurumunuza özgü bir kez düzenleyin, her zaman kullanın. Sık kullanılan benzer
  alımlarınız için Tip Onay Belgesi oluşturun.
- **Sınırsız Esneklik** — En düşük fiyatlı firmadan mı, tüm kalemleri aynı
  firmadan mı, yoksa her kalem için istediğiniz firmadan mı alım
  gerçekleştireceksiniz?
- **Yaklaşık Maliyet Kolaylığı** — Yaklaşık maliyeti ister programla detaylı
  hesaplayın, isterseniz doğrudan elinizdeki veriyi girin.
- **EBYS ve Çoklu Birim Mimarisi** — Yerleşik Socket.io altyapısı ile
  uygulamanızı bir Ana Sunucu (Host) haline getirip, kurumdaki diğer
  istemcilerin (Client) size bağlanmasını sağlayın. Dosya durum güncellemelerini
  anında tüm birimlerde görün.
- **Birim Yetkilendirme** — Birimlere (Örn: Fen İşleri, Destek Hizmetleri) özel
  yetkilendirme sistemi sayesinde evraklarda güvenli Okuma/Yazma (RBAC) kontrolü
  yapın.
- **Dinamik şablon yönetimi** — Belgelerinizi uygulama içinden düzenleyebilir,
  anlık önizleyebilir ve `.xlsx` ya da `.docx` formatında dışa aktarabilirsiniz.
- **Tamamen çevrimdışı veya Yerel Ağ** — İnternet bağlantısı gerekmez.
  Verileriniz buluta gitmez, yalnızca sizin bilgisayarınızda veya kurumunuzun
  yerel ağında (LAN) durur.

---

## 📸 Uygulama Arayüzü ve E2E Test Ekran Görüntüleri

Temin 360 masaüstü uygulaması; farklı ekran çözünürlükleri, dosya yönetimi ve belge düzenleme süreçleri için otomatik E2E (End-to-End) testleriyle sürekli taranmakta ve ekran görüntüleri arşivlenmektedir.

### 1. Başlatıcı ve Çalışma Alanı Yönetimi

| Başlatıcı & Dosya Seçimi | Çalışma Alanı & Süreç Yönetimi |
| :---: | :---: |
| ![Başlatıcı Ekranı](e2e-screenshots/01-launcher-screen.png) | ![Çalışma Alanı](e2e-screenshots/02-workspace-opened.png) |
| *Kurum, birim veya mevcut `.temin` çalışma dosyasının seçildiği başlatıcı arayüzü.* | *İhale ve doğrudan temin sürecinin tüm aşamalarını barındıran ana çalışma alanı.* |

| Mod & Form Etkileşimi | Canlı Belge ve Word Düzenleme Önizlemesi |
| :---: | :---: |
| ![Mod Etkileşimi](e2e-screenshots/03-mode-switched-interaction.png) | ![Word Düzenleme Önizleme](e2e-screenshots/11-word-editing-preview.png) |
| *Alım türüne ve mevzuat moduna göre dinamik form alanları.* | *Resmi evrakların anlık şablon düzenlemesi ve canlı Word önizleme paneli.* |

### 2. Taşınabilir `.temin` Dosya ve Veritabanı Döngüsü

| Farklı Kaydet & Veritabanı İhracı | Kayıtlı Dosyanın Yeniden Açılması |
| :---: | :---: |
| ![Farklı Kaydet](e2e-screenshots/07-after-save-as.png) | ![Yeniden Açılan Dosya](e2e-screenshots/08-reopened-saved-file.png) |
| *Sürecin tüm veritabanını bağımsız bir `.temin` dosyası olarak kaydetme.* | *Kayıtlı dosyanın doğrulanarak tüm verileriyle eksiksiz açılması.* |

### 3. Responsive ve Farklı Ekran Çözünürlükleri (E2E Test Doğrulamaları)

Uygulama, hem büyük masaüstü monitörlerde hem de küçük dizüstü ekranlarında (1024x600, 1280x720, 1366x768, 1920x1080) kurum logosu, sol menü ve formlar taşmadan kusursuz çalışacak şekilde tasarlanmıştır:

| Full HD (1920×1080) | Standart Laptop (1366×768) |
| :---: | :---: |
| ![Full HD 1920x1080](e2e-screenshots/responsive-1920x1080.png) | ![1366x768](e2e-screenshots/responsive-1366x768.png) |
| *Geniş ekranlarda maksimum veri görünürlüğü ve ferah çalışma alanı.* | *Standart laptop ekranlarında optimize edilmiş arayüz düzeni.* |

| HD Kompakt (1280×720) | Küçük Ekran (1024×600) |
| :---: | :---: |
| ![1280x720](e2e-screenshots/responsive-1280x720.png) | ![1024x600](e2e-screenshots/responsive-1024x600.png) |
| *Düşük çözünürlüklü ekranlarda menü ve içeriklerin taşmasız görünümü.* | *Netbook / küçük cihazlarda menü kaydırma ve kompakt düzen.* |

<p align="center">
  <img src="e2e-screenshots/responsive-minimum_pencere_800x420_.png" alt="Minimum Pencere Boyutu" width="600" />
  <br/>
  <em>Desteklenen minimum pencere boyutu (800×420) — Menü ve kurum alanı güvenle daralır ve kaydırılabilir.</em>
</p>

---

## Kimler Kullanabilir?

Kamu İhale Kanunu kapsamında **Doğrudan Temin** ile alım yapan tüm kurum ve
kuruluşlar için tasarlanmıştır:

- **Belediyeler** (Büyük, orta ve küçük ölçekli ihale düzenleyen tüm
  müdürlükler)
- **İl Özel İdareleri**
- **Hastaneler** ve **Üniversiteler**
- **İl Milli Eğitim Müdürlükleri**
- **İçişleri Bakanlığı** Merkez ve Taşra Müdürlükleri
- **Milli Savunma Bakanlığı** ve ilgili Başkanlıkları
- **Karayolları, DSİ, İller Bankası**, **Adalet Bakanlığı Ceza İnfaz Kurumları**
- **Sosyal Güvenlik Kurumları**

---

## Basıma Hazır Alabileceğiniz Belgeler

Sistemden saniyeler içinde otomatik olarak üretip çıktısını alabileceğiniz
belgeler:

- Doğrudan Temin Onay Belgesi
- Yaklaşık Maliyet Hesap Cetveli ve Görevlendirme Yazısı
- İhtiyaç Listesi ve Talep Yazısı (Lüzum Müzekkeresi)
- Firmalardan Teklif İsteme Yazısı
- Piyasa Araştırma Tutanağı
- Geçmiş Alımlar Tutanağı
- Doğrudan Temin Gerekçe Tutanağı
- Sipariş Formu ve Sözleşme
- Kabul Tutanağı ve Ödeme Emri Yazısı
- Doğrudan Temin Kayıt Formu
- Doğrudan Temin Arşiv Dosyaları...

---

## Gelişmiş Raporlama

Bütçe harcama raporlarınız tek tuşla elinizin altında:

- Hangi bütçe kaleminden?
- Hangi tarih aralığında?
- Hangi temin şeklinden veya iş türlerinde?
- Ne kadar alım gerçekleştirdiniz?

Tüm bu soruların yanıtlarını güçlü ve dinamik raporlama ekranlarıyla anında
alabilirsiniz.

---

## Dosya Formatı

`.temin` dosyaları ZIP tabanlı bir yapıya sahiptir. İçeriği:

```
dosya.temin
├── database.sqlite    ← Tüm veriler
├── meta.json          ← Sürüm ve şema bilgisi
└── attachments/       ← Varsa ek dosyalar
```

Bu yapı sayesinde dosyalarınız hem taşınabilir hem de versiyon uyumluluğu
açısından yönetilebilirdir.

---

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Geliştirme modunda çalıştır
pnpm run dev

# Üretim için derle (Windows)
pnpm run build:win

# Linux veya Mac için derle (İsteğe bağlı)
pnpm run build:linux
pnpm run build:mac
```

---

## Teknolojiler

- [Electron.js](https://www.electronjs.org/) — Masaüstü uygulama çatısı
- [Radix UI](https://www.radix-ui.com/) — Erişilebilirlik odaklı, headless
  bileşen kütüphanesi
- [Tailwind CSS](https://tailwindcss.com/) — `rem` tabanlı, responsive
  utility-first stil sistemi
- [SQLite](https://www.sqlite.org/) /
  [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Yerel
  veritabanı
- [Socket.io](https://socket.io/) — Çoklu birimler arası yerel ağda (LAN) gerçek
  zamanlı WebSockets senkronizasyonu
- [node-windows](https://github.com/coreybutler/node-windows) — Windows servis
  entegrasyonu

---

## Lisans

Bu proje [GNU Affero General Public License v3.0](./LICENSE) lisansı ile
lisanslanmıştır.

```
hakim-pro-app - Kamu Harcama, İhale ve Hakediş Yönetim Sistemi
Copyright (C) 2026  İlyas Bozdemir
```

---

## Yasal Uyarı ve Sorumluluk Reddi

**ÖNEMLİ:** Bu uygulama, kamu kurumları ve diğer kuruluşların Doğrudan Temin
süreçlerini dijitalleştirmek ve kolaylaştırmak amacıyla **yardımcı bir araç**
olarak geliştirilmiştir. Uygulama üzerinden üretilen belgelerin doğruluğunu,
mevzuata uygunluğunu ve güncelliğini kontrol etmek **tamamen kullanıcının
(idarenin) sorumluluğundadır**. Geliştirici; uygulama üzerinden üretilen hatalı
hesaplamalar, eksik belgeler, mevzuata aykırı işlemler veya veri kayıplarından
dolayı **hiçbir hukuki, idari veya mali sorumluluk kabul etmez**. Kullanıcılar
kritik tutar ve belgeleri her zaman manuel olarak veya ilgili yasal mevzuata
göre son kez gözden geçirmelidir.
