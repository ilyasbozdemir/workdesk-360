/**
 * @file trCollator.ts
 * @description JavaScript tarafında Türkçe alfabetik sıralama için Intl.Collator karşılaştırıcısı.
 *
 * UYARI:
 * Bu nesne YALNIZCA SIRALAMA (sort) işlemleri için kullanılmalıdır.
 * Eşitlik veya kimlik kontrolünde KESİNLİKLE KULLANILMAZ.
 * sensitivity base: Ali = ali ve i = İ eşit sayılır; kimlik karşılaştırması için personel_id/firma_id kullan.
 */

export const trCollator = new Intl.Collator("tr-TR", {
  sensitivity: "base",
  numeric: true,
});
