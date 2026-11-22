/**
 * @file trKey.ts
 * @description Türkçe metinleri arama ve karşılaştırma için kanonik ASCII anahtarına dönüştürür.
 *
 * DİKKAT:
 * Bu fonksiyon YALNIZCA arama ve filtreleme amacıyla kullanılır.
 * Ekran görünümü, resmî belge ve çıktı için orijinal metin asla bozulmadan kullanılmalıdır.
 */

/**
 * Türkçe metni normalize edilmiş, ASCII indirgenmiş arama anahtarına dönüştürür.
 *
 * Örnekler:
 * - "ASİL ÜYE", "Asil Üye", "asil uye" -> "asil uye"
 * - "ÇALIŞKAN", "çalışkan" -> "caliskan"
 * - "İlyas", "ılyas", "ILYAS" -> "ilyas"
 * - Birleşik ve ayrık 'İ' -> 'i'
 *
 * @param text - Giriş metni
 * @returns ASCII küçük harfli arama anahtarı
 */
export function trKey(text?: string | null): string {
  if (text === null || text === undefined) {
    return "";
  }

  // 1. NFC normalizasyonu (birleşik/ayrık karakter eşitliği)
  const nfc = String(text).normalize("NFC");

  // 2. Türkçe kurallarına göre küçük harfe çevirme (İ -> i, I -> ı)
  const lower = nfc.toLocaleLowerCase("tr-TR");

  // 3. Türkçe özel harfleri ASCII dengiyle değiştirme
  const ascii = lower
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");

  // 4. Harf ve rakam dışındaki tüm karakterleri (noktalama, semboller) boşluğa çevirme
  const clean = ascii.replace(/[^a-z0-9]/g, " ");

  // 5. Çoklu boşlukları teke indirme ve kenar boşluklarını kırpma
  return clean.replace(/\s+/g, " ").trim();
}
