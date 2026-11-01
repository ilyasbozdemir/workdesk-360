# Data Sources — Veri Kaynağı Kataloğu

Bu klasör, Document Engine içerisinde kullanılan ortak veri alanlarını ve bu alanların SQLite veri kaynaklarıyla eşleştirmelerini içerir.

Amaç, her belge şablonunda aynı tablo ve sütun eşleştirmelerini tekrar tekrar yazmadan, merkezi ve yeniden kullanılabilir bir alan kataloğu oluşturmaktır.

## 1. Klasör yapısı

```text
src/data-sources/
├── global.fields.ts
├── document.fields.ts
├── index.ts
└── README.md
```

| Dosya | Görevi |
|---|---|
| `global.fields.ts` | Kurum ve uygulama genelindeki ortak alanları tanımlar |
| `document.fields.ts` | Dosyaya bağlı alanları ve koleksiyonları tanımlar |
| `index.ts` | Alan kataloglarını dışarı aktarır |
| `README.md` | Kullanım ve mimari kuralları açıklar |

## 2. Data Source nedir?

Data Source, SQLite tablosunun kendisi değildir.

Bir verinin hangi SQLite tablosundan, hangi sütundan ve hangi kayıt üzerinden okunacağını açıklayan TypeScript tanımıdır.

Örneğin:

```typescript
{
  key: "dosya.konu",
  path: "document.dosya.konu",
  label: "Dosya Konusu",
  mapping: {
    kind: "column",
    table: "documents",
    column: "konu",
    whereColumn: "id",
    scopeId: "documentId"
  }
}
```

Bu tanım, Mapping Engine tarafından şu SQL sorgusuna dönüştürülür:

```sql
SELECT konu
FROM documents
WHERE id = ?;
```

`?` parametresi aktif `documentId` değeridir.

Sorgu sonucu, snapshot içerisindeki `document.dosya.konu` yoluna yerleştirilir.

## 3. Global Fields

`global.fields.ts`, kurum ve uygulama genelinde kullanılabilecek alanları tanımlar.

Örnekler:

- Kurum adı
- Kurum adresi
- Kurum logosu
- Yetkili adı soyadı
- Yetkili unvanı

Örnek:

```typescript
export const globalFields = {
  "kurum.ad": {
    key: "kurum.ad",
    path: "global.kurum.ad",
    label: "Kurum Adı",
    mapping: {
      kind: "column",
      table: "global_settings",
      column: "kurum_ad",
      whereColumn: "id",
      scopeId: "globalId"
    }
  }
} as const;
```

Global alanlar farklı belgelerde yeniden kullanılabilir.

Global olması, geçmiş belgelerin değerlerinin otomatik olarak güncelleneceği anlamına gelmez. Snapshot ve RefreshPolicy bu davranışı belirler.

## 4. Document Fields

`document.fields.ts`, aktif dosyaya bağlı alanları tanımlar.

Örnekler:

- Dosya numarası
- Dosya konusu
- Dosya tarihi
- Kalemler
- Komisyon üyeleri
- Firma teklifleri

Örnek:

```typescript
export const documentFields = {
  "dosya.konu": {
    key: "dosya.konu",
    path: "document.dosya.konu",
    label: "Dosya Konusu",
    mapping: {
      kind: "column",
      table: "documents",
      column: "konu",
      whereColumn: "id",
      scopeId: "documentId"
    }
  }
} as const;
```

Bir Document Field, birden fazla SQLite tablosundan veri alabilir. Her alanın ayrı bir SQLite tablosuna karşılık gelmesi gerekmez.

## 5. Mapping türleri

### Column

Tek bir kayıt içerisindeki sütun değerini getirir.

```typescript
{
  kind: "column",
  table: "documents",
  column: "konu",
  whereColumn: "id",
  scopeId: "documentId"
}
```

### Collection

Birden fazla kaydı dizi olarak getirir.

```typescript
{
  kind: "collection",
  table: "items",
  whereColumn: "document_id",
  scopeId: "documentId",
  fields: {
    id: "id",
    siraNo: "sira_no",
    ad: "ad",
    miktar: "miktar",
    birim: "birim"
  },
  orderBy: "sira_no"
}
```

Örnek sonuç:

```json
[
  {
    "id": 1,
    "siraNo": 1,
    "ad": "Bilgisayar",
    "miktar": 5,
    "birim": "Adet"
  }
]
```

### Static

Veritabanına gitmeden sabit değer üretir.

```typescript
{
  kind: "static",
  value: "Örnek açıklama"
}
```

`relation` ve `computed` gibi ek mapping türleri ileride desteklenebilir. Bunlar mevcut motor tarafından uygulanmadan kullanılmamalıdır.

## 6. Template Definition bağlantısı

Belge şablonları veri kaynağını yeniden tanımlamak yerine ortak katalogdan alır.

```typescript
import {
  globalFields,
  documentFields
} from "../../data-sources/index.js";

export const fields = [
  {
    path: globalFields["kurum.ad"].path,
    mapping: globalFields["kurum.ad"].mapping,
    refreshPolicy: "preserve"
  },
  {
    path: documentFields["dosya.konu"].path,
    mapping: documentFields["dosya.konu"].mapping,
    refreshPolicy: "source"
  }
];
```

`refreshPolicy`, Data Source Registry içerisinde değil, belge şablonunda tanımlanır.

Böylece aynı veri kaynağı farklı belgelerde farklı yenileme kurallarıyla kullanılabilir.

## 7. Form Builder bağlantısı

Form Builder, ortak alan kataloğunu kullanarak kullanıcının seçebileceği alanları listeler.

Örnek:

```typescript
import {
  globalFieldOptions,
  documentFieldOptions
} from "../data-sources/index.js";

export const fieldRegistry = [
  ...globalFieldOptions,
  ...documentFieldOptions
];
```

Form Builder şu bilgileri kullanabilir:

- `key`: Alanın katalog kimliği
- `path`: Snapshot veri yolu
- `label`: Kullanıcıya gösterilen alan adı

Form Builder, SQLite sorgularını doğrudan çalıştırmaz.

Kullanıcı bir alan seçtiğinde şablon tanımına ilgili alanın referansı eklenir. Mapping Engine bu alanın kaynak verisini çözer.

## 8. Veri işleme akışı

```text
SQLite Tabloları
       |
       v
Data Source Registry
       |
       v
Template Definition
       |
       v
Mapping Engine
       |
       v
Resolved Data
       |
       v
Snapshot Engine
       |
       v
Snapshot JSON
       |
       v
React Template / Dynamic Renderer
```

Data Source Registry yalnızca eşleştirme tanımlarını içerir. Veritabanı bağlantısını açmaz, sorgu çalıştırmaz ve snapshot kaydetmez.

## 9. Yeni alan nasıl eklenir?

Örneğin SQLite `documents` tablosunda `birim_adi` sütunu bulunduğunu varsayalım.

`document.fields.ts` içerisine şu alan eklenir:

```typescript
"dosya.birimAdi": {
  key: "dosya.birimAdi",
  path: "document.dosya.birimAdi",
  label: "Talep Eden Birim",
  mapping: {
    kind: "column",
    table: "documents",
    column: "birim_adi",
    whereColumn: "id",
    scopeId: "documentId"
  }
}
```

Ardından ilgili belgenin `definition.ts` dosyasında kullanılır.

```typescript
{
  path: documentFields["dosya.birimAdi"].path,
  mapping: documentFields["dosya.birimAdi"].mapping,
  refreshPolicy: "preserve"
}
```

Yeni alanın kullanılabilmesi için ilgili SQLite tablo ve sütununun gerçekten bulunması gerekir.

## 10. Mimari kurallar

1. Data Source dosyaları yalnızca alan ve mapping tanımlarını içerir.
2. SQL sorguları Mapping Engine veya SQLite Adapter tarafından çalıştırılır.
3. Snapshot kaydetme işlemleri Snapshot Engine tarafından yönetilir.
4. RefreshPolicy şablon bazında tanımlanır.
5. Aynı alan birden fazla şablonda kullanılabilir.
6. Form Builder yalnızca izin verilen alanları kullanıcıya sunar.
7. SQL tablo ve sütun adları güvenilir bir izin listesiyle sınırlandırılır.
8. SQL sorgularındaki değerler parametreli olarak gönderilir.
9. Geçmiş snapshot revizyonları kaynak veriler değiştiğinde otomatik değiştirilmez.
10. Gerçek SQLite şeması değiştiğinde ilgili mapping tanımları da güncellenir.

---

## Özet

**`global.fields.ts`** — Ortak kurum ve uygulama verilerinin kaynaklarını tanımlar.

**`document.fields.ts`** — Dosyaya bağlı verilerin kaynaklarını tanımlar.

**`index.ts`** — Bu tanımları dışarı açar.

**Mapping Engine** — Tanımları kullanarak SQLite verilerini okur.

**Snapshot Engine** — Çözümlenen verileri belgeye özel snapshot olarak kaydeder.

**Form Builder** — Alan kataloğunu kullanarak kullanıcıya alan seçimi sunar.

**React Renderer** — Snapshot verilerinden belge çıktısı oluşturur.

Bu ayrım sayesinde yeni belge şablonları oluşturulurken mevcut SQLite eşleştirmeleri tekrar kullanılabilir.
