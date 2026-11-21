# temin-direct

Doğrudan temin (4734 md. 22/d) için onion mimarili çekirdek.

```
infrastructure  ──►  application  ──►  domain
 (SQLite, IPC)       (use-case, bus,     (aggregate, kurallar,
                      reaction, portlar)   profil, hesap)
```
Bağımlılık yalnızca içeri doğru akar. `domain` hiçbir şeyi içe aktarmaz (yalnızca `@temin360/domain` Money/limit).

## Olay -> tepki tablosu (FileReactionManager)

| Olay | Ne olur |
|---|---|
| QuoteChanged | Tamamlanmış araştırma belgeleri `beklemede` + "yeniden üretin" nedeni |
| WinnerSelected | Denetim kaydı (LOG_SystemLog) |
| ResultApproved | Aşama 3'e ilerler, denetim kaydı; dosya kilitli (kalıcı) |
| AcceptanceApproved | Aşama 4'e ilerler, denetim kaydı (stok düşümü mevcut akışta, burada yok) |

Tepki hatası dosya kaydını geri almaz; `LOG_SystemLog`'a `error` olarak yazılır.

## Çalıştırma
Yeni tablo / migration YOK. Mevcut şema kullanılır, sonra:

```ts
const app = composeDirectProcurement(new MainSqlExecutor(workspaceManager)) // main (apps/temin360-desktop)
const app = composeDirectProcurement(new IpcSqlExecutor(ipcRenderer.invoke)) // renderer
await app.enterQuote.execute({ fileId, itemId, bidderId, unitPriceTL: '1550.00', at })
```
`BetterSqliteExecutor` yalnızca testler içindir (sqlGuard / mutation kaydı / otomatik kaydetmeyi atlar).

Testler: `pnpm test` (gerçek tablo tanımlarından üretilen SQLite şemasına karşı).

## Veri nereye yazılır (mevcut şemaya uyum)

| Aggregate | Depo |
|---|---|
| Kalem, firma | `DATA_TeminKalem`, `DATA_TeminFirma` (yalnızca OKUNUR; ekranlar yönetir) |
| Teklifler | `DATA_TeminKalemTeklif` (+ `DATA_TeminFirma.teklif_toplami`) |
| Kazanan | `DATA_TeminDosyasi.firma_id`, `DATA_TeminFirma.kazandi_mi/kazanan_mi` (winnerSyncService ile aynı sözleşme) |
| Kabul tutanakları | `DATA_TeminDosyasi.sablon_tercihleri` -> `kabulTutanaklari` (mevcut `KabulTutanakItem` biçimi; UI alanları korunur) |
| Sonuç onayı | `DATA_TeminDosyasi.sablon_tercihleri` -> `sonucOnayDurumu` (`{ onaylandi, tarih }`) |
| Dış kilit | `DATA_TeminDosyasi.is_locked` / `lock_reason` (okunur; kilitliyse aggregate tümüyle salt okunur) |

Yazma `json_set` ile yalnızca bu iki anahtara yapılır; `faturalar` gibi diğer anahtarlara dokunulmaz.
Kimlik kuralı: tutanak JSON dizisindeki sıra (index+1) = `seqNo`; kalem eşlemesi `MalKalemiItem.siraNo` = `DATA_TeminKalem.sira_no`.

## Testler
- `directProcurement.test.ts`: saf domain/use-case
- `sqlite.integration.test.ts`: uygulamanın tablo tanımlarından üretilen şema
- `realSchema.test.ts`: uygulamanın gerçek `initializeDatabase` şeması (monorepo'da `packages/database` gerekir)
