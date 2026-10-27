# WORKDESK 360 • Uygulama ve Ekran Şablonları Kütüphanesi (`apps/templates`)

Bu dizin, **TEMİN 360** mimarisi ve tasarım dilini referans alan standart şablonları barındırır. Yeni bir masaüstü uygulaması veya yeni bir ekran sayfası geliştirileceğinde doğrudan buradan hızla kopyalanıp işleme alınabilir.

---

## 📂 Dizin Ağacı

```
apps/templates/
├── screens/                     # 🚀 HIZLI İŞLER İÇİN (2. Adım: Hazır Ekran Şablonları)
│   ├── BlankScreenTemplate.tsx  # En yalın, temiz boş ekran ve aksiyon şablonu
│   ├── TabbedScreenTemplate.tsx # 4'lü KPI sayaçlı, sekmeli ve filtreli zengin ekran şablonu
│   ├── DetailDrawerTemplate.tsx # Sağdan kayan detay/inspector paneli şablonu
│   └── README.md                # Ekran şablonları kullanım rehberi
│
└── desktop-app-template/        # 🏛️ YENİ UYGULAMA İÇİN (1. Adım: Komple Masaüstü İskeleti)
    ├── package.json             # Monorepo pnpm workspace, Electron, React 19, Tailwind
    ├── src/renderer/src/App.tsx # Frameless header, dark/light switcher, sidebar ve boş dashboard
    └── README.md                # Uygulama klonlama kılavuzu
```

---

## ⚡ Kullanım Senaryoları

### Senaryo A: "Mevcut uygulamama yeni bir modül/ekran eklemek istiyorum" (Hızlı 2. Adım)
1. `apps/templates/screens/` klasörüne gidin.
2. `BlankScreenTemplate.tsx` veya `TabbedScreenTemplate.tsx` dosyasını kopyalayın.
3. Uygulamanızın `src/renderer/src/screens/<modul>/` altına yapıştırıp içeriğinizi doldurun.

### Senaryo B: "Monorepo içine sıfırdan yeni bir masaüstü uygulaması kurmak istiyorum" (1. Adım)
1. `apps/templates/desktop-app-template` klasörünü kopyalayıp `apps/<yeni-uygulama>-desktop` adıyla kaydedin.
2. `package.json` içindeki `name` alanını güncelleyin.
3. Kök dizinde `pnpm install` çalıştırarak workspace'e dahil edin.
