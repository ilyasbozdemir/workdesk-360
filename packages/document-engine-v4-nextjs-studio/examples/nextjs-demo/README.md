# Document Engine Studio V4 — Next.js

## Başlatma

```powershell
cd examples/nextjs-demo
npm install
npm run dev
```

`http://localhost:3000` açılır. Ana dizindeki `npm run dev` komutu Next.js başlatmaz.

## Özellikler
- Belge, birim ve kalem oluşturma
- Şablon kataloğu ve şablon oluşturma
- Field Registry / direct (`column`), relation, computed (`sum`, `count`), collection, static mapping editörü
- SQL izin listesi ile güvenli kaynak çözümleme
- Snapshot revizyonları, manuel override, JSON dışa aktarma, geçmiş revizyonları görüntüleme
- React piyasa araştırması şablonu ve tarayıcı yazdırma
- İşlem geçmişi

## Sınırlar
- Bu bağımsız demo WorkDesk 360 deposuna otomatik entegrasyon yapmaz.
- Gerçek WorkDesk 360 şablonlarının tamamı aktarılmamıştır. Depo kaynak kodu ile birebir port/migration ayrıca yapılmalıdır.
- SQL tabloları `src/sqlite/source.ts` izin listesiyle sınırlıdır. Mapping editörü rastgele SQL çalıştırmaz.
- Belge motoru şablonlarının bazıları yalnızca JSON/snapshot olarak görüntülenir; yalnızca örnek piyasa araştırması React render bileşenine sahiptir.
- PDF çıktı için tarayıcının Yazdır → PDF özelliği kullanılabilir; özel PDF/DOCX üreticisi eklenmedi.
- Studio geliştirme/demonstrasyon içindir: kullanıcı girişi, RBAC, CSRF ve internet üzerinde yayınlama için sertleştirme yoktur. Yalnızca yerelde çalıştırın.
- Geçmiş snapshot'ların şema sürümü otomatik taşınmaz. Değişikliklerde migration gerekir.
- Next.js Webpack modunda `.js` → `.ts` extensionAlias kullanılır.
