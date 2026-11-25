/**
 * @file trSortKey.ts
 * @description Türk alfabesi sırasını (a, b, c, ç, d, e, f, g, ğ, h, ı, i, j, k, l, m, n, o, ö, p, r, s, ş, t, u, ü, v, y, z)
 * birebir koruyan ikili/metin sıralama anahtarı üretir.
 *
 * ÖNEMLİ FARKLILIK:
 * `trKey` arama için Ç'yi C'ye indirger; ancak `trSortKey` Türk alfabesi sıralamasını
 * korumak için Ç'yi C'den sonra, D'den önce konumlandırır (C < Ç < D, I < İ, O < Ö, S < Ş, U < Ü).
 */

const TR_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz";
const CHAR_SORT_MAP: Record<string, string> = {};

// Her Türkçe harfe alfabedeki mutlak sırasına göre iki haneli ('01' .. '29') öncelik kodu atanır
for (let i = 0; i < TR_ALPHABET.length; i++) {
  CHAR_SORT_MAP[TR_ALPHABET[i]] = String(i + 1).padStart(2, "0");
}
// Boşluk karakteri alfabetik karakterlerin önünde yer alır ('00')
CHAR_SORT_MAP[" "] = "00";

/**
 * Türkçe alfabetik sıralama kuralına uygun deterministik sıralama anahtarı üretir.
 *
 * Sıralama Garantisi:
 * C < Ç < D | I < İ < J | O < Ö < P | S < Ş < T | U < Ü < V
 *
 * @param text - Giriş metni
 * @returns Sıralama için iki haneli indeks dizgisi
 */
export function trSortKey(text?: string | null): string {
  if (text === null || text === undefined) {
    return "";
  }

  const clean = String(text).normalize("NFC").toLocaleLowerCase("tr-TR");
  let result = "";

  for (let idx = 0; idx < clean.length; idx++) {
    const ch = clean[idx];
    const mapped = CHAR_SORT_MAP[ch];
    if (mapped) {
      result += mapped;
    } else {
      // Türkçe alfabe harici karakterler (sayılar, semboller) '99_' önekiyle korunur
      result += "99_" + ch;
    }
  }

  return result;
}
