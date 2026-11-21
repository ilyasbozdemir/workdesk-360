# @temin360/direct-procurement-core

Doğrudan temin (4734 md. 22/d) ve Doğrudan Temin Tebliği (Mevzuat No: 40666) için katmanlı, nesne tabanlı çekirdek (Clean / Onion Architecture).

```
infrastructure  ──►  application  ──►  domain
 (SQLite, IPC)       (use-case, bus,     (aggregate, kurallar,
                      reaction, portlar)   profil, hesap)
```
Bağımlılık yalnızca içeri doğru akar. `domain` hiçbir dış çerçeveyi (Electron, UI, veritabanı) içe aktarmaz (yalnızca `@temin360/domain` Money / limit).

## Olay -> Tepki Tablosu (FileReactionManager)

| Olay | Ne Olur? |
|---|---|
| `QuoteChanged` | Tamamlanmış araştırma belgeleri `beklemede` + "Teklif fiyatı değişti, yeniden üretin" nedeni |
| `WinnerSelected` | Denetim kaydı (`LOG_SystemLog`) |
| `ResultApproved` | Aşama 3'e (`yuklenici`) ilerler, denetim kaydı düşülür, dosya kilitlenir |
| `AcceptanceApproved` | Aşama 4'e (`kabul`) ilerler, denetim kaydı düşülür |

Tepki hatası dosya kaydını geri almaz; `LOG_SystemLog`'a `error` olarak yazılır.

## Çalıştırma

Yeni tablo veya göç (migration) gerekmez. Mevcut şema kullanılır:

```ts
import { composeDirectProcurement, IpcSqlExecutor, BetterSqliteExecutor } from '@temin360/direct-procurement-core';

// Main süreçte (apps/temin360-desktop)
const app = composeDirectProcurement(mainSqlExecutor);

// Renderer sürecinde (UI / IPC)
const app = composeDirectProcurement(new IpcSqlExecutor(window.electron.ipcRenderer.invoke));

// Birim teklif girişi
await app.enterQuote.execute({ fileId: 348, itemId: 1, bidderId: 10, unitPriceTL: '1550.00', at: '2026-11-21' });

// Kazanan seçimi ve sonuç onayı
const winner = await app.selectWinner.execute({ fileId: 348, at: '2026-11-21' });
await app.approveResult.execute({ fileId: 348, at: '2026-11-21' });
```

## Veri Nereye Yazılır (Mevcut Şemaya Uyum)

| Alan / Nesne | Tablo ve Sütun | Açıklama |
|---|---|---|
| Kalem, İstekli | `DATA_TeminKalem`, `DATA_TeminFirma` | Yalnızca **OKUNUR**; ekranlar yönetir |
| Teklifler | `DATA_TeminKalemTeklif` | `birim_fiyat`, `teklif_verildi_mi` (+ `DATA_TeminFirma.teklif_toplami`) |
| Kazanan | `DATA_TeminDosyasi.firma_id` | `DATA_TeminFirma.kazandi_mi / kazanan_mi` (`winnerSyncService` ile aynı sözleşme) |
| Kabul Tutanakları | `DATA_TeminDosyasi.sablon_tercihleri` $\rightarrow$ `kabulTutanaklari` | Mevcut `KabulTutanakItem` biçimi; UI alanları korunur |
| Sonuç Onayı | `DATA_TeminDosyasi.sablon_tercihleri` $\rightarrow$ `sonucOnayDurumu` | `{ onaylandi, tarih }` |
| Dış Kilit | `DATA_TeminDosyasi.is_locked` / `lock_reason` | Kilitliyse aggregate tümüyle salt okunur |

Yazma işlemi SQLite yerel `json_set` ile yalnızca bu iki anahtara yapılır; `faturalar` gibi diğer şablon tercihlerine dokunulmaz.

## Testler

```bash
cd packages/direct-procurement-core
pnpm test
```
- `directProcurement.test.ts`: Saf domain / use-case birim testleri
- `sqlite.integration.test.ts`: Uygulamanın tablo tanımlarından üretilen bellek içi SQLite şeması testleri
- `realSchema.test.ts`: Uygulamanın gerçek `initializeDatabase` şeması üzerinde uçtan uca testler
