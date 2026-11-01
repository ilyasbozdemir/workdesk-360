# WorkDesk 360 — Document Engine örnek paketi

Bu paket, konuştuğumuz mimariyi göstermek için hazırlanmış **çalışan bir başlangıç örneğidir**. Mevcut WorkDesk 360 kodunun birebir taşınmış veya repo ile derlenerek doğrulanmış hali değildir. Özellikle mevcut `TableColumnMapping` alanları ve SQL sorgu adaptörü taşınırken gerçek projedeki tiplerle eşleştirilmelidir.

## Amaç

Mevcut mapping yapısını koruyarak her Mustache şablonuna ait JSON verisini üretmek, bu JSON'u snapshot olarak saklamak ve yenileme sırasında korunması gereken kullanıcı değişikliklerini ezmemek.

Temel ayrım:

1. **Mapping:** Verinin hangi tablo/sütun/ilişki/formülden geleceğini tarif eder.
2. **Resolver / Snapshot builder:** Mapping'i çalıştırıp şablona özel JSON üretir.
3. **Snapshot:** Belgenin o anki çözülmüş JSON verisinin sürümlü kopyasıdır.
4. **Override:** Kullanıcının elle düzenlediği alanların yenilemede korunmasını sağlar.
5. **Mustache renderer:** Snapshot verisini şablona basar. Render aşamasında DB sorgusu yapılmaz.
6. **PDF generator:** HTML çıktısını PDF'e dönüştürür; bu paketin dışında kalır.

## Akış

```text
Mustache template + template mapping
                |
                v
       DocumentDataSource
                |
                v
         MappingResolver
                |
                v
          SnapshotBuilder
                |
                v
      SnapshotRepository (SQLite adapter)
                |
                v
        MustacheRenderer
                |
                v
       HTML -> PDF generator
```

## Refresh politikaları

- `source`: Her yenilemede kaynaktaki güncel değer kullanılır.
- `preserve`: Mevcut snapshot değeri varsa korunur; yoksa kaynak değeri alınır.
- `manual`: Kullanıcı tarafından override edilmiş değer korunur; override yoksa kaynak değeri alınır.

Önemli: `manual`, değeri karşılaştırarak değil, açık bir override kaydıyla takip edilir. Kullanıcı alanı elle düzenlediğinde `overrides` içine yazılır. Kullanıcı override'ı temizlerse alan bir sonraki yenilemede kaynağa döner.

`preserve` ile `manual` aynı şey değildir:
- `preserve`: Önceki snapshot değerini her durumda tutar.
- `manual`: Yalnızca kullanıcı tarafından işaretlenmiş override'ı tutar.

## Kullanım

```ts
const snapshot = await engine.createSnapshot({
  documentId: "DOSYA-123",
  templateId: "piyasa-fiyat-arastirma",
  templateVersion: 1
});

await snapshotRepository.save(snapshot);

// Daha sonra, eski belgeyi açmak için snapshot okunur.
// Güncel veriyi almak istenirse createSnapshot tekrar çalıştırılır.
const html = renderer.render(templateSource, snapshot.data);
```

Kullanıcı bir alanı düzenlediğinde:

```ts
const updated = await engine.applyOverride({
  snapshotId: snapshot.id,
  path: "teslimSuresi",
  value: "45 gün"
});
```

Kaynaktan güncel veriyi tekrar alırken `manual` alan override'ı korunur:

```ts
const refreshed = await engine.refreshSnapshot({
  snapshotId: updated.id
});
```

## Template tanımı

`src/examples/piyasa-fiyat-arastirma.definition.ts` dosyasında örnek mapping bulunur. Mapping alanları mevcut projedeki `TableColumnMapping` modelinin sadeleştirilmiş örneğidir. Gerçek projeye taşırken mevcut `tablo`, `sutun`, `iliskili_id`, `iliskiliTablo`, `iliskiliSutun`, `deger`, `varsayilan`, `altEslestirme`, `formul`, `aciklama` alanları korunup `refreshPolicy` gibi opsiyonel metadata eklenebilir.

## Veri kaynağı adaptörü

Paket SQLite veya Electron import etmez. `DocumentDataSource` arayüzünü ana süreç / uygulama katmanı uygular. Böylece engine test edilebilir ve başka bir host uygulamasında da kullanılabilir.

Örnekteki `InMemoryDataSource` sadece demo içindir. Gerçek uygulamada bu adaptör mevcut SQL executor'ınızı çağırır.

## Saklama önerisi

Snapshot'ı her refresh'te aynı kaydın üzerine yazmak yerine yeni revision olarak saklayın:

- `documentId`
- `templateId`
- `templateVersion`
- `schemaVersion`
- `revision`
- `createdAt`
- `data`
- `overrides`

Eski snapshot'lar belge geçmişi ve tekrar PDF üretimi için korunur. Snapshot'ın `data` alanı o revizyondaki render girdisidir.

## Mevcut repoya taşıma notları

1. `TableColumnMapping` ve `ProcessMapping` tiplerini mevcut kaynaklarından al; örnek tipleri ikinci bir gerçeklik haline getirme.
2. Mevcut `resolveTemplateData()` içindeki SQL okuma ve mapping çözümleme mantığını kademeli taşı.
3. Logo, tarih formatlama, evrak numarası ve komisyon gibi özel kuralları küçük resolver/provider fonksiyonlarına ayır; hepsini tek fonksiyonda büyütme.
4. Template'e özel mapping/definition `document-templates` içinde kalabilir; çalıştırma, snapshot ve override davranışı `document-engine` içinde olsun.
5. Mustache render için snapshot dışında canlı DB erişimi kullanma.
6. Snapshot oluşturma/yenileme açık kullanıcı veya iş akışı eylemi olsun; otomatik refresh eski resmi belge içeriğini sessizce değiştirmesin.

## Kapsam dışı / üretime geçmeden önce

- Gerçek SQLite repository implementasyonu
- Gerçek `TableColumnMapping` tiplerinin birebir entegrasyonu
- Şema migrasyonları ve snapshot JSON doğrulaması (Zod gibi)
- Eşzamanlı güncelleme / optimistic locking
- Büyük snapshot'lar için sıkıştırma ve dosya depolama kararı
- Resmi belge imzalama ve PDF/A süreçleri

Bu örnek mimari iskelet ve davranışları göstermek içindir; üretim verisiyle doğrudan kullanmadan önce test ve mevcut repo entegrasyonu gerekir.
