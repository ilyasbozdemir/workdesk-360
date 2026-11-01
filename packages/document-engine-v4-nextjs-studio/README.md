# Document Engine V3
**TypeScript + React + SQLite + Snapshot-based Document Rendering**

WorkDesk 360 gibi belge yönetimi sistemlerinde kullanılmak üzere tasarlanan, bağımsız ve yeniden kullanılabilir belge oluşturma motoru.

Paket, herhangi bir uygulamaya doğrudan bağımlı değildir. Veri kaynakları, şablon tanımları, snapshot yönetimi ve React render işlemleri birbirinden ayrılmıştır.

## 1. Temel özellikler

- TypeScript tabanlı modüler mimari
- React ile `.template.tsx` belge şablonları
- Global ve Document veri kapsamları
- Ortak Field Registry (`global.fields.ts`, `document.fields.ts`)
- SQLite Mapping Engine
- Tekil alan ve koleksiyon eşleştirmeleri
- Form alan tanımları ve salt okunur dinamik renderer
- `{{global.kurum.ad}}` gibi yer tutucular
- Template bazlı snapshot yönetimi
- Alan bazlı RefreshPolicy
- Kullanıcı override yönetimi
- Append-only snapshot revizyon geçmişi
- React tabanlı dinamik ve özel belge renderer'ları

**Mustache renderer kullanılmaz.** Yer tutucular yalnızca alan referansı olarak değerlendirilir. Belgeler React ile oluşturulur.

## 2. Önerilen proje yapısı

```text
document-engine/
├── src/
│   ├── core/
│   │   └── types.ts
│   │
│   ├── data-sources/
│   │   ├── global.fields.ts
│   │   ├── document.fields.ts
│   │   └── index.ts
│   │
│   ├── engine/
│   │   ├── mapping-engine.ts
│   │   ├── snapshot-engine.ts
│   │   └── snapshot-merger.ts
│   │
│   ├── sqlite/
│   │   ├── sqlite-adapter.ts
│   │   ├── snapshot-repository.ts
│   │   └── schema.sql
│   │
│   ├── form-builder/
│   │   ├── field-registry.ts
│   │   └── FormBuilder.tsx
│   │
│   ├── dynamic/
│   │   └── DynamicRenderer.tsx
│   │
│   ├── templates/
│   │   └── piyasa-fiyat-arastirma/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── definition.ts
│   │       └── piyasa-fiyat-arastirma.template.tsx
│   │
│   └── index.ts
│
├── examples/
├── package.json
├── tsconfig.json
└── README.md
```

Bu klasör yapısı V4 için hedeflenen mimaridir. V3 paketinde bulunmayan bileşenlerin ayrıca uygulanması gerekir.

## 3. Data Source Registry

Veri kaynakları şablonlardan bağımsız tanımlanır.

### Global Fields

`src/data-sources/global.fields.ts`

Kurum genelinde kullanılabilecek ortak alanları içerir.

Örnek alanlar:

| Path | SQLite kaynağı |
|---|---|
| `global.kurum.ad` | `global_settings.kurum_ad` |
| `global.kurum.adres` | `global_settings.kurum_adres` |
| `global.kurum.logo` | `global_settings.logo` |
| `global.yetkili.adSoyad` | `global_settings.yetkili_ad` |
| `global.yetkili.unvan` | `global_settings.yetkili_unvan` |

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

### Document Fields

`src/data-sources/document.fields.ts`

Dosyaya veya belgeye özel verileri içerir.

Örnekler:

- Dosya numarası
- Dosya konusu
- Dosya tarihi
- Mal ve hizmet kalemleri
- Komisyon üyeleri
- Firma teklifleri

Koleksiyonlar `kind: "collection"` ile tanımlanır.

```typescript
export const documentFields = {
  kalemler: {
    key: "kalemler",
    path: "document.kalemler",
    label: "Kalemler",
    mapping: {
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
  }
} as const;
```

Registry, veri kaynağını ve alanın kimliğini tanımlar. `RefreshPolicy` ise şablon bazında belirlenir.

## 4. Template Definition

Her belge kendi `definition.ts` dosyasına sahiptir.

Bu dosya:

- Şablon kimliğini
- Şablon sürümünü
- Kullanılacak veri alanlarını
- Alanların mapping referanslarını
- RefreshPolicy kurallarını
- Form Builder yapılandırmasını

tanımlar.

```typescript
import type { TemplateDefinition } from "../../core/types.js";

import {
  globalFields,
  documentFields
} from "../../data-sources/index.js";

export const definition = {
  id: "piyasa-fiyat-arastirma",
  version: 4,
  schemaVersion: 1,

  fields: [
    {
      path: globalFields["kurum.ad"].path,
      mapping: globalFields["kurum.ad"].mapping,
      refreshPolicy: "preserve",
      required: true
    },
    {
      path: documentFields.kalemler.path,
      mapping: documentFields.kalemler.mapping,
      refreshPolicy: "source"
    }
  ],

  form: [
    {
      path: "document.kalemler",
      label: "Kalemler",
      kind: "table"
    }
  ]
} satisfies TemplateDefinition;
```

`version: 4` burada örnek şablon sürümüdür; gerçek uygulamada şablon sürümleri bağımsız yönetilebilir.

## 5. SQLite Mapping Engine

Mapping Engine, alan tanımlarını okuyarak SQLite üzerinden verileri çözer.

Desteklenmesi hedeflenen mapping türleri:

| Mapping | Görevi |
|---|---|
| `column` | Tek bir sütun değerini getirir |
| `collection` | Birden fazla kayıt getirir |
| `static` | Sabit değer üretir |
| `relation` | İlişkili tablolardan veri çözer |
| `computed` | Tanımlı hesaplamaları gerçekleştirir |

`relation` ve `computed`, V4 için önerilen genişletmelerdir; V3'te hazır oldukları varsayılmamalıdır.

Örnek sorgu:

```sql
SELECT
  id,
  sira_no AS siraNo,
  ad,
  miktar,
  birim
FROM items
WHERE document_id = ?
ORDER BY sira_no;
```

SQL değerleri parametreli sorgularla aktarılır. Tablo ve sütun isimleri doğrulanmış bir izin listesinden seçilir.

Form Builder'ın doğrudan SQL çalıştırmasına izin verilmez.

## 6. Snapshot Engine

Snapshot Engine, SQLite üzerinden çözülen verileri belgeye özel JSON yapısına dönüştürür.

Örnek:

```json
{
  "templateId": "piyasa-fiyat-arastirma",
  "templateVersion": 4,
  "schemaVersion": 1,
  "documentId": 125,
  "revision": 1,
  "data": {
    "global": {
      "kurum": {
        "ad": "Örnek Belediyesi"
      }
    },
    "document": {
      "dosya": {
        "dosyaNo": "2026/125"
      },
      "kalemler": []
    }
  },
  "overrides": {}
}
```

Global veriler de snapshot oluşturulurken belgeye kopyalanır. Böylece kaynak veriler değiştiğinde geçmiş belge revizyonları otomatik olarak değişmez.

Her revizyon ayrı kaydedilir.

## 7. RefreshPolicy

Üç temel yenileme politikası bulunur.

| Policy | Davranış |
|---|---|
| `source` | Güncel kaynak verisini kullanır |
| `preserve` | Önceki snapshot değerini korur |
| `manual` | Açık kullanıcı override'ı varsa onu, yoksa kaynak değerini kullanır |

İlk snapshot oluşturulurken alanlar kaynak verilerinden başlatılır.

`preserve` için önceki değer bulunmuyorsa kaynak değer kullanılır.

Override kayıtları alanın snapshot değerinden ayrı tutulur.
Bir override'ı geri almak için `build` çağrısının beşinci argümanında alan yolu verilebilir: `build(definition, context, previous, {}, ["document.aciklama"])`. Yolun şablonda `editable: true` olması gerekir; temizlenen değer bir sonraki snapshot'ta tanımlı kaynaktan yeniden çözülür.

Koleksiyonlar için satır bazlı güncelleme gerekiyorsa sabit kayıt kimlikleri üzerinden ek merge kuralları tanımlanmalıdır.

## 8. Dynamic Form Builder

Mevcut V3 paketi tam bir Form Builder içermez. `DynamicTemplate`, verilen form alanlarını ve snapshot verisini salt okunur şekilde gösterir. Kullanıcı girişi, alan kataloğundan form oluşturma ve form değişikliklerini kaydetme akışı henüz uygulanmamıştır.

Tam bir Form Builder uygulandığında kullanıcı:

- Alan seçebilir
- Alan başlığını değiştirebilir
- Metin, tarih, sayı ve tablo gibi kontrol tiplerini belirleyebilir
- Düzenlenebilir alanları tanımlayabilir
- Zorunlu alanları işaretleyebilir
- Şablonun form düzenini yapılandırabilir

Form arayüzü veri kaynağını doğrudan sorgulamamalıdır; veri akışı Mapping Engine ve Snapshot Engine üzerinden kurulmalıdır.

Alan kataloğunun paylaşılması sayesinde aynı veri alanı birden fazla şablonda kullanılabilir.

## 9. Yer Tutucular

Yer tutucular alanların mantıksal referanslarıdır.

Örnekler:

```text
{{global.kurum.ad}}
{{global.kurum.adres}}
{{document.dosya.dosyaNo}}
{{document.dosya.konu}}
{{document.kalemler}}
{{document.komisyon}}
```

Yer tutucu isimleri snapshot path'lerinden üretilebilir.

Bunlar Mustache ile render edilmez. React şablonları snapshot verilerini doğrudan kullanır.

## 10. React Template Renderer

Her özel belge `.template.tsx` dosyasıyla oluşturulabilir.

```tsx
import type {
  PiyasaFiyatArastirmaSnapshot
} from "./types.js";

interface Props {
  data: PiyasaFiyatArastirmaSnapshot;
}

export default function PiyasaFiyatArastirmaTemplate({
  data
}: Props) {
  return (
    <article>
      <header>
        <h2>{data.global.kurum.ad}</h2>
      </header>

      <h3>Piyasa Fiyat Araştırması</h3>

      <p>{data.document.dosya.dosyaNo}</p>

      <table>
        <tbody>
          {data.document.kalemler.map(kalem => (
            <tr key={kalem.id}>
              <td>{kalem.ad}</td>
              <td>{kalem.miktar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
```

React bileşenleri SQLite bağlantısı, mapping veya snapshot güncelleme işlemi yapmaz.

## 11. İki Render Modu

**React Template Renderer**

Karmaşık resmî belgeler, özel tablolar, imza alanları ve sabit tasarımlar için kullanılır.

**Dynamic Template Renderer**

JSON tabanlı alan ve yerleşim tanımları üzerinden daha basit belgeler oluşturur.

Her iki renderer da aynı Snapshot Engine'i kullanır.

## 12. SQLite Depolama

İki veri grubu bulunur:

**Kaynak veriler**

- Global ayarlar
- Dosyalar
- Kalemler
- Komisyon
- Teklifler

**Snapshot verileri**

- Template ID
- Template version
- Schema version
- Document ID
- Revision
- Snapshot JSON
- Overrides
- Oluşturulma zamanı

Global ve Document kaynakları farklı SQLite veritabanlarında tutuluyorsa ayrı bağlantılarla çalışan bir adapter kullanılabilir.

Snapshot revizyonları append-only olarak saklanır. Önceki revizyonlar değiştirilmez.

## 13. Önerilen veri akışı

```text
Global Fields + Document Fields
               |
               v
       Template Definition
               |
               v
         Mapping Engine
               |
               v
         SQLite Adapter
               |
               v
         Resolved Data
               |
               v
         Snapshot Engine
               |
               v
    RefreshPolicy + Overrides
               |
               v
       Snapshot Repository
               |
               v
       React / Dynamic Renderer
               |
               v
         Belge / PDF
```

## 14. Başlangıç

Mevcut V3 paketi için:

```bash
npm install
npm run typecheck
npm test
npm run demo
```

V3 demosu `demo.sqlite` oluşturacak ve iki snapshot revizyonu kaydedecek şekilde tasarlanmıştır.

**Not:** Bu doküman mevcut V3 uygulamasını ve henüz uygulanmamış hedef özellikleri ayrı ayrı belirtir. `relation`/`computed` mapping, tam Form Builder ve snapshot şema sürümleri arasında otomatik migration mevcut değildir.

## 15. Üretim ortamı için gereksinimler

Üretime geçmeden önce şu konular tamamlanmalıdır:

- SQLite migration yönetimi
- Transaction kullanımı
- SQL tablo ve sütun izin listeleri
- Snapshot veri doğrulama
- Template schema migration
- Eski snapshot'lar için sürümler arası migration stratejisi
- Kullanıcı yetkilendirmesi
- Override değişiklik geçmişi
- Revizyon bütünlüğü
- Koleksiyonlar için satır bazlı merge stratejisi
- PDF ve yazdırma testleri
- Dinamik Form Builder alan doğrulaması

---

## Mimari prensip

**Data Source Registry**, verinin nereden geldiğini belirler.

**Template Definition**, hangi alanların kullanılacağını ve yenileme kurallarını tanımlar.

**Mapping Engine**, SQLite verilerini çözer.

**Snapshot Engine**, belge verilerini ve revizyonları yönetir.

**Form Builder**, kullanıcıya alanları ve düzenleme arayüzünü sunar.

**React Renderer**, snapshot verilerini belge çıktısına dönüştürür.

Bu sorumluluklar birbirinden bağımsız tutulur.

Document Engine'in temel hedefi, uygulamaya bağımlı olmayan, sürümlenebilir ve genişletilebilir bir belge altyapısı sağlamaktır.

## V3.1 güvenilirlik güncellemeleri

- `SnapshotEngine.build()` önceki snapshot'ın `documentId`, `templateId`, `schemaVersion`, `templateVersion` ve revision değerlerini kontrol eder. Şema değiştiğinde otomatik veri migrasyonu **yapmaz**; önce açık bir migrasyon gerekir.
- `SqliteSnapshotRepository.buildAndSave(engine, definition, context, overrides?, clearOverrides?)` en son revizyonu okuyup yeni revizyonu **tek SQLite IMMEDIATE transaction** içinde kaydeder. Yeni kullanımda ayrı `latest()` / `build()` / `save()` zinciri yerine bu metodu tercih edin.
- `collectionFieldTypes` ile collection mapping alanlarının veri tipleri (null olmayan değerlerde) doğrulanabilir; mapping'de tanımlı kolon alias'larının varlığı kontrol edilir.
- `DynamicForm` yalnızca `form` içinde `editable: true` olarak işaretlenmiş metin/tarih/sayı alanlarını düzenler. `onSave(overrides, clearOverrides)` ile değişiklikleri birlikte teslim eder. `definition.fields` içinde aynı path için `editable: true` bulunması da zorunludur. Tablo satır düzenleyicisi bu sürüme dahil değildir.
- Ek regresyon testleri `tests/reliability.test.ts` dosyasındadır.

**Not:** Monorepo Electron projesine taşırken `better-sqlite3` native modülünü hedef Electron ABI'sine göre yeniden derleyin. Bağımsız Node.js testleri için normal Node.js ABI'si gerekir.


## V3.2 — Relation ve Computed Mapping

- `relation`: SQLite allowlist doğrulamalı, `scopeId` ile sınırlandırılmış `LEFT JOIN` yapar. `localColumn`, `relatedTable`, `foreignColumn` ve `selectColumn` tanımlanır. Eksik eşleşme `null` döndürür.
- `computed`: SnapshotEngine tarafından diğer belge alanları çözüldükten sonra hesaplanır. `count` bir koleksiyonun eleman sayısını, `sum` ise `valueField` değerlerinin toplamını (isteğe bağlı `multiplyField` ile çarpımını) hesaplar. Bağımlılık sırası otomatik çözülür, döngüler ve geçersiz sayılar hata üretir.
- Örnek: `documentFields["dosya.birimAdi"]` ilişki üzerinden birim adını, `documentFields["kalemSayisi"]` ise kalem sayısını getirir.
- `computed` fonksiyon/eval çalıştırmaz; deklaratif işlemler kullanır. Sonuç snapshot içinde saklanır.
- **Mevcut veritabanı:** Demo şemasına `units` tablosu ve `documents.birim_id` kolonu eklendi. Daha önce oluşturulmuş SQLite veritabanlarında `CREATE TABLE IF NOT EXISTS` mevcut `documents` tablosuna yeni kolon eklemez. Üretimde bu kolon için ayrı, sürümlü bir migration uygulanmalıdır. Eski `demo.sqlite` için yeni şemayı kullanmak üzere test veritabanını yeniden oluşturabilirsiniz.


## Next.js + React örnek arayüz

`examples/nextjs-demo/` altında Next.js App Router ile çalışan bir demo bulunur. Ayrıntılı kurulum ve özellikler için `examples/nextjs-demo/README.md` dosyasına bakın.

```bash
cd examples/nextjs-demo
npm install
npm run dev
```


## V4 Next.js Studio

`examples/nextjs-demo/` artık Document Engine Studio V4 arayüzüdür. Kurulum, özellikler ve kısıtlar için `examples/nextjs-demo/README.md` dosyasına bakın. Mevcut V3.2 engine API'si korunmuştur; Studio katmanı örnek bir yerel SQLite adaptörüdür.
