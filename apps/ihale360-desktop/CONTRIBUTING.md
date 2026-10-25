# Katkıda Bulunma Rehberi

TEMİN 360'a katkıda bulunmayı düşündüğünüz için teşekkür ederiz!

## Geliştirme Ortamı

1. Repoyu klonlayın.
2. `pnpm install` ile bağımlılıkları yükleyin.
3. `pnpm dev:desktop` ile masaüstü uygulamasını başlatın. (Opsiyonel:
   `pnpm dev:web`, `pnpm dev:website`)

## Proje Yapısı

- `apps/app-desktop`: Electron + React + SQLite masaüstü uygulaması
- `apps/app-web`, `apps/app-landing`: Senkronizasyon servisi ve tanıtım portalı
- `packages/document-templates`: Resmi evrak ve tutanak şablonları
- `packages/pdf-generator`: PDF derleme paketi
- `packages/database`: Şema ve migrasyonlar

## Kod Standartları

- TypeScript, React, Tailwind CSS ve SQLite kullanılır.
- PR açmadan önce şunlar hatasız çalışmalıdır: `pnpm typecheck`, `pnpm lint`,
  `pnpm format`
- Commit mesajlarında `feat:`, `fix:`, `style:`, `docs:` gibi önekler kullanın.

## Mevzuat ile İlgili Değişiklikler

Limit, oran, usul veya şablon metni değişikliklerinde ilgili kanun maddesini,
tebliğ veya Resmî Gazete kaynağını PR açıklamasına yazın. Kaynağı belirtilmeyen
mevzuat değişiklikleri kabul edilmez.

## Katkı Süreci

1. Dal oluşturun: `git checkout -b ozellik/yeni-ozellik-adi`
2. Değişiklikleri commit'leyin: `git commit -am 'feat: yeni özellik'`
3. Dalı gönderin: `git push origin ozellik/yeni-ozellik-adi`
4. Pull Request açın.

## Lisans ve Katkı Hakları

Proje çift lisanslıdır (GNU AGPLv3 ve kurumsal/ticari lisans). Pull Request
göndererek, katkınızın bu iki lisans altında da dağıtılabileceğini kabul etmiş
olursunuz.

## Sorun Bildirimi

Hata veya öneri için Issue açın ve durumu mümkün olduğunca ayrıntılı anlatın.
