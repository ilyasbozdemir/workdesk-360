/**
 * @file matchesSearch.ts
 * @description Çok kelimeli, kısmi ve Türkçe karakter duyarsız arama filtresi.
 */

import { trKey } from "./trKey";

/**
 * Belirtilen alanların içinde arama sorgusunun tüm kelimelerinin geçip geçmediğini denetler.
 * Arama Türkçe karakter duyarsızdır (trKey kullanılır) ve kelime sırasından bağımsızdır.
 *
 * Örnek:
 * - query: "john dee", field: "John Deere (Tedarikçi)" -> true
 * - query: "calis", field: "John Deere (Çalışan)" -> true
 * - query: "", field: "Herhangi bir şey" -> true (Boş sorgu her kaydı kabul eder)
 *
 * @param query - Kullanıcının girdiği arama metni
 * @param fields - Aranacak metin alanları (ad, soyad, unvan vb.)
 * @returns Tüm sorgu parçaları alanlardan en az birinde bulunursa true, aksi halde false
 */
export function matchesSearch(
  query?: string | null,
  ...fields: (string | null | undefined)[]
): boolean {
  if (!query || query.trim().length === 0) {
    return true;
  }

  const queryKey = trKey(query);
  const queryTokens = queryKey.split(" ").filter((tok) => tok.length > 0);

  if (queryTokens.length === 0) {
    return true;
  }

  // Aranacak alanların trKey değerlerini önceden hazırla
  const fieldKeys = fields
    .filter((f): f is string => f !== null && f !== undefined && String(f).trim().length > 0)
    .map((f) => trKey(f));

  if (fieldKeys.length === 0) {
    return false;
  }

  // Bütün sorgu token'larının en az bir alanda geçmesi gerekir (AND kuralı)
  return queryTokens.every((token) =>
    fieldKeys.some((fieldKey) => fieldKey.includes(token))
  );
}
