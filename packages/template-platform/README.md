# Template Platform — örnek proje

Bu örnek, Form Builder, Document Designer, Handlebars Runtime ve Template Storage katmanlarını birbirinden ayıran küçük bir TypeScript mimari iskeletidir.

## Mimari karar

- **JSON**, form ve belge tanımlarının kalıcı/kanonik formatıdır.
- **React**, JSON tanımlarını düzenlemek ve ekranda göstermek için kullanılır.
- **Handlebars**, metin/HTML tabanlı şablonları çalıştırır; Form Builder veya Document Designer'ın veri modeli değildir.
- **Storage**, tanımları, sürümleri ve yayın durumunu yönetir.

## Klasörler

- `src/form-builder`: form tanımı, alan kayıt sistemi ve form renderer
- `src/document-designer`: belge tanımı, bileşen kayıt sistemi ve belge renderer
- `src/handlebars-runtime`: Handlebars helper/partial ve metin şablonları
- `src/template-storage`: tanım, sürüm ve yayınlama sözleşmeleri ile bellek içi örnek
- `examples`: örnek form, belge ve veriler

## Çalıştırma

```bash
pnpm install
pnpm demo
```

Demo, örnek form verisini alır; Handlebars metin şablonuna aktarır ve HTML çıktısını terminale yazar.

> Bu bir başlangıç iskeletidir. Gerçek uygulamada `InMemoryTemplateStorage` yerine SQLite repository/DAO katmanı bağlanmalı; şema doğrulaması, yetkilendirme, migration ve testler eklenmelidir.
