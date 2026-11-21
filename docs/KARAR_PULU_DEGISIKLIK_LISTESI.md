# Karar pulu / kesinti hesabı: değişiklik listesi

Kaynak: repo `220170a8`, `apps/temin360-desktop/src/renderer/src` (yol önekleri kısaltıldı). Satır numaraları o sürüme göre.

## 0. Önceki teşhisimin düzeltmesi
Daha önce "858,04 ₺'nin sebebi `calculateDamgaVergisi`'nin `includeKararPulu = true` varsayılanı" demiştim. **Yanlış.**
Bu fonksiyonu yalnızca `screens/playground/components/DamgaVergisiTool.tsx` (hesap aracı) çağırıyor. Dosya akışında değil.
Ayrıca `TANIM_Mevzuat.karar_pulu_orani` hiçbir yerde OKUNMUYOR (ölü veri); oran her yerde elle yazılmış.

## 1. Doğrudan temin için durum (tarama sonucu)
| Yer | Davranış | DT'de güvenli mi |
|---|---|---|
| `screens/dosya/.../KabulVeOdeme/useKabulVeOdemeData.ts:168` | `calculateInvoiceFinancials(..., false)` | Evet |
| `screens/bkmybs.../utils/invoiceFinancials.ts:20` | `kararPuluUygula = false` varsayılan | Evet (çağırana bağlı) |
| `screens/bkmybs.../MaliIslemlereAktarModal.tsx:36` | kutucuk, varsayılan false, kullanıcı işaretleyebilir | Kısmen |
| `workspaces/finance/.../TaxDeductionsPage.tsx:129-131` | `!isDogrudanTemin && ...` korumalı | Evet |
| `workspaces/finance/.../IncomingProcurementsPage.tsx:90` | `const kp = 0` | Evet |
| `screens/bkmybs.../DosyalarVeFaturalariTab.tsx:296,694,1142` | `calculateInvoiceFinancials` 3 çağrı; fatura bazında `kararPuluUygula` bayrağı | **Kontrol et** (694, 1142 argümanlarını okumadım) |
| `services/finance/bkmybsDataService.ts:329` | `d.kesinti_karar_pulu > 0` ise `brut * 0.00569` YENİDEN hesaplar | **Risk**: kolonda herhangi bir pozitif değer varsa farklı matrahla yeniden hesaplanır |
| `screens/hakedis/HakedisScreen.tsx:111` | `kararPuluOrani: 0.00569` varsayılan, **DT kontrolü yok** | **Hayır** |
| `resources/templates/4-kabul-ve-odeme-islemleri/hakedis-raporu/index.mustache.json:31` | varsayılan etiket "İhale Kararı Damga Vergisi (Binde 5.69)" | **Hayır** |

**858,04 ₺'nin kaynağını kesin belirleyemedim** (hangi ekranda gördüğünü bilmiyorum). En güçlü adaylar: hakediş ekranı varsayılanı ve şablondaki etiket; sonra `bkmybsDataService:329` ve fatura bazlı bayrak.
Sayının kendisi ipucu: 858,04 = 150.798,33 × ‰5,69 ve 150.798,33 = 180.958 / 1,2. Yani matrah, 180.958 KDV DAHİLMİŞ gibi ayrıştırılarak bulunmuş.

## 2. Asıl bulgu: KDV matrah kuralı tutarsız
Ekranlarda 180.958 ₺ **KDV hariç** ("Onaylanacak Tutar (KDV Hariç)"). Kod ise iki ayrı varsayım kullanıyor:
- `invoiceFinancials.ts:22-23`: `brutTutar`'ı KDV **dahil** sayar (`matrah = brut / 1.2`).
- `bkmybsDataService.ts:329-332`: `brut`'ü KDV **hariç** sayar (`kdv = brut * 0.2`, net = brut + kdv - ...).
- `IncomingProcurementsPage.tsx:83,145,162`: `brut / 1.2` (KDV'yi 1,2 olarak SABİT yazmış).
Aynı tutar farklı yerlerde farklı matrahla damga/karar pulu üretir. Karar pulu bu sorunun sadece görünen yüzü.

## 3. Önerilen değişiklikler (sırayla)
1. **Etkilenen kayıtları bul** (kod değiştirmeden):
   ```sql
   SELECT id, temin_no, ihale_tipi, kesinti_karar_pulu, net_odenen
   FROM DATA_TeminDosyasi
   WHERE COALESCE(ihale_tipi,'Doğrudan Temin') = 'Doğrudan Temin' AND kesinti_karar_pulu > 0 AND is_deleted = 0;
   ```
2. **Tek oran dosyası**: `utils/kesinti/oranlar.ts` (veya `@temin360/domain`) içinde `KARAR_PULU_BINDE = 5.69`, `DAMGA_BINDE = 9.48`; 15 dosyadaki `0.00569` / `0.00948` bunu kullansın. Sonraki adımda değeri `TANIM_Mevzuat`'tan okuyup yıla göre ver.
3. **Politika tek yerde**: `kararPuluVarMi(ihaleTipi)`: `'Doğrudan Temin'` ve boş değer için `false`. Şu 4 yer bunu kullansın: `MaliIslemlereAktarModal` (kutucuğu DT'de kapat/gizle), `DosyalarVeFaturalariTab` (fatura bayrağını DT'de zorla false), `bkmybsDataService:329` (DT'de 0), `HakedisScreen` (DT dosyasında `kararPuluOrani: 0`).
4. **Hakediş şablonu**: `digerKesinti1Adi` varsayılanını boş yap veya hesaplanan alandan türet; sabit "İhale Kararı Damga Vergisi" etiketi DT çıktısına sızmasın.
5. **KDV matrahı tek fonksiyonda**: `kdvHaricMatrah(tutar, tutarKdvDahilMi, kdvOrani)`. 1,2 sabiti ve `brut * 0.2` yerine bunu çağır; "tutar KDV dahil mi" bilgisi parametre olsun (varsayım gizli kalmasın).
6. **`bkmybsDataService:329`**: kolonu "bayrak" gibi kullanıp yeniden hesaplamak yerine, kayıtlı değeri olduğu gibi kullan.
7. Son aşamada (isteğe bağlı): bu hesapları `temin-direct`'in `DeductionCalculator`'ına taşı.

## 4. Önce yazılacak testler
- Genel ihale, 180.958 ₺ KDV **dahil**: karar pulu = 858,04 ₺.
- Doğrudan temin, aynı tutar: karar pulu = 0, tüm 4 yer için.
- Aynı 180.958 ₺ KDV **hariç** girilirse karar pulu 1.029,64 ₺ (matrah farkı görünür olsun).
- `kesinti_karar_pulu > 0` olan DT dosyası `bkmybsDataService`'ten 0 ile dönmeli.

## 5. Kaynağı kesinleştirmek için
Hangi ekranda gördüğünü söylersen 5 dakikada ayırt edilir. Ya da geçici olarak `console.log(new Error().stack)` ile karar pulu > 0 olduğu yerde yığın izi al.
