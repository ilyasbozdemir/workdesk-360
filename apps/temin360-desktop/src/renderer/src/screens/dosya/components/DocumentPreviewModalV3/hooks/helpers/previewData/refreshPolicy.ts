/**
 * Refresh Policy & Field Categorization for Document Preview
 *
 * MİMARİ İLKE: Her şablon kendi liste ve veri yapısının sahibidir.
 *
 * - PRESERVE: Dosyadan miras alınan kurumsal / dosya sabitleri (snapshot'ta doluysa korunur)
 * - SOURCE: Ham veritabanı önbellekleri (items, bids, rawFirms vb. - sadece kaynakta boşsa snapshot'a başvurur)
 * - MANUAL: Şablon içeriği, tablo kalemleri (ihtiyacKalemleri, fiyatKalemleri vb.), metinler ve düzenlemeler
 *           (Kullanıcının şablon üzerinde yaptığı tüm tablo ve alan düzenlemeleri snapshot'tan tam korunur).
 */

export const PRESERVE_FIELDS = new Set([
  "evrakSayisi",
  "evrakNo",
  "dosyaNo",
  "teminNo",
  "kurumUst",
  "kurumAdi",
  "mudurluk",
  "harcamaBirimi",
  "birimId",
  "birim_id",
  "birimAdi",
  "birimAnteti",
  "antetSatirlari",
  "antetEkSatir",
  "butceYili",
  "solLogo",
  "sagLogo",
  "harcamaYetkilisiAdi",
  "harcamaYetkilisiUnvan",
  "onaylayanPersonelAdi",
  "onaylayanPersonelUnvan",
  "hazirlayanPersonelAdi",
  "hazirlayanPersonelUnvan",
  "gerceklestirmeGorevlisiAdi",
  "gerceklestirmeGorevlisiUnvani",
  "sunulacakMakamAdi",
  "ihtiyacYeri",
  "fiyatArastirmaGorevlileri",
  "fiyatKomisyonu",
  "muayeneKomisyonu",
  "komisyonUyeleri",
  "komisyon",
  "gorevliler",
  "gorevlendirilenler",
  "dagitimListesi",
  "rota",
  "routeOverrides",
]);

export const SOURCE_FIELDS = new Set([
  'items',
  'bids',
  'fileFirms',
  'invitedFirms',
  'rawFirms',
  'dbKalemler',
  'paraBirimi',
  'ihtiyacKalemleri',
  'fiyatKalemleri',
  'yaklasikMaliyet',
  'toplamTutar'
])

export type RefreshPolicyType = "preserve" | "source" | "manual";

export function getFieldRefreshPolicy(fieldKey: string): RefreshPolicyType {
  if (PRESERVE_FIELDS.has(fieldKey)) return "preserve";
  if (SOURCE_FIELDS.has(fieldKey)) return "source";
  return "manual";
}

function isNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Akıllı Belge Birleştirici (Smart Merge with Refresh Policy)
 *
 * @param sourceData DB ve kurumsal başlıktan çekilen taze kaynak veriler
 * @param savedSnapshot Kullanıcının önceden kaydettiği veya canlı düzenlediği snapshot verileri
 * @returns Refresh Policy kurallarına göre harmanlanmış nihai veri
 */
export function applyRefreshPolicy(
  sourceData: Record<string, any>,
  savedSnapshot?: Record<string, any> | null,
): Record<string, any> {
  const merged: Record<string, any> = { ...sourceData };
  if (!savedSnapshot || typeof savedSnapshot !== "object") {
    return merged;
  }

  for (const [key, val] of Object.entries(savedSnapshot)) {
    if (val === undefined || val === null) continue;

    const policy = getFieldRefreshPolicy(key);

    if (policy === "preserve") {
      // PRESERVE: Kullanıcının belge üzerinde veya rotada yaptığı dolu düzenlemeler senkronizasyonda korunur.
      if (isNonEmptyValue(val)) {
        merged[key] = val;
      }
    } else if (policy === "source") {
      // SOURCE: Ham veritabanı önbellekleri için kaynak veride değer boşsa snapshot'taki dolu değer fallback olarak alınır.
      if (!isNonEmptyValue(merged[key]) && isNonEmptyValue(val)) {
        merged[key] = val;
      }
    } else {
      // MANUAL / ŞABLON İÇERİĞİ:
      // Her şablon kendi verisinin ve listelerinin sahibidir.
      // Kullanıcının şablon üzerinde yaptığı tablo düzenlemeleri (kalemler, fiyatlar, metinler vb.)
      // snapshot'tan KORUNUR ve kaynak veriyi ezerek güncel tutar.
      if (
        (typeof val === "string" && val.trim() === "" &&
          isNonEmptyValue(merged[key])) ||
        (Array.isArray(val) && val.length === 0 && isNonEmptyValue(merged[key]))
      ) {
        continue;
      }
      merged[key] = val;
    }
  }

  return merged;
}
