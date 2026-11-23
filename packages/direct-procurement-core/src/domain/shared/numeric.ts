import { DomainError } from "./DomainError";
import { Money } from "../money";

/**
 * Bir kalemin toplam tutarını hesaplar (Birim Fiyat × Miktar).
 * Miktar kamu alımlarında en fazla 3 ondalık basamak içerebilir (Örn: 12.375 Kg).
 * 
 * @param unit - KDV hariç birim fiyat (Money)
 * @param quantity - Alım miktarı (sayı)
 * @returns Satır toplam tutarı (Money)
 * @throws {DomainError} `QTY_PRECISION` miktar 3 basamaktan fazla ondalık içeriyorsa
 */
export function lineTotal(unit: Money, quantity: number): Money {
  const scaled = Math.round(quantity * 1000);
  if (Math.abs(scaled / 1000 - quantity) > 1e-9) {
    throw new DomainError(
      "QTY_PRECISION",
      `Miktar en çok 3 ondalık içerebilir: ${quantity}`,
    );
  }
  return unit.mulRate(scaled, 1000);
}

/**
 * KDV hariç tutardan KDV dahil tutarı hesaplar.
 * 
 * @param haric - KDV hariç tutar (Money)
 * @param kdvPercent - KDV oranı yüzdesi (örn: 20)
 * @returns KDV dahil tutar (Money)
 */
export const withKdv = (haric: Money, kdvPercent: number): Money =>
  haric.mulRate(100 + kdvPercent, 100);

/**
 * Mevzuattaki binde oranını (örn: 5.69 binde karar pulu) `Money.mulRate` için
 * hassas pay / payda ikilisine dönüştürür (4 ondalık basamağa kadar tam hassasiyet).
 * 
 * @param perMille - Binde oranı
 * @returns BigInt pay ve payda nesnesi
 */
export function perMilleToFraction(
  perMille: number,
): { pay: bigint; payda: bigint } {
  return { pay: BigInt(Math.round(perMille * 10_000)), payda: 10_000_000n };
}

/**
 * Miktar değerini 3 ondalık basamağa standart yuvarlar.
 * 
 * @param q - Ham miktar değeri
 * @returns 3 ondalığa yuvarlanmış sayı
 */
export const roundQty = (q: number): number => Math.round(q * 1000) / 1000;
