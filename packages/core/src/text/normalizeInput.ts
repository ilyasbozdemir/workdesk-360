/**
 * @file normalizeInput.ts
 * @description Kullanıcı girdisini NFC standart formatına ve temiz boşluklara dönüştürür.
 */

/**
 * Kullanıcı tarafından girilen metni NFC kanonik formatına dönüştürür ve baş/son boşluklarını temizler.
 * Birleşik (NFC) ve ayrık (NFD) karakterleri (örn. 'İ') standartlaştırır.
 *
 * @param text - Giriş metni
 * @returns NFC formatında normalize edilmiş ve kırpılmış metin
 */
export function normalizeInput(text?: string | null): string {
  if (text === null || text === undefined) {
    return "";
  }
  return String(text).normalize("NFC").trim();
}
