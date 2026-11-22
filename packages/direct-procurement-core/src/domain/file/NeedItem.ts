import { DomainError } from '../shared/DomainError'

/**
 * İhtiyaç Kalemi (Entity).
 * 
 * Doğrudan temin kapsamında talep edilen mal, hizmet veya yapım kalemini temsil eder.
 * Doğrudan temin mevzuatında sipariş miktarı ile onaylanan ihtiyaç miktarı birebir örtüşür.
 */
export class NeedItem {
  /**
   * Yeni bir ihtiyaç kalemi oluşturur.
   * 
   * @param id - Kalemin sayısal kimliği (DATA_TeminKalem.id)
   * @param name - Kalemin adı / cinsi / tanımı
   * @param quantity - İhtiyaç miktarı (sıfırdan büyük pozitif bir sayı olmalıdır)
   * @param unit - Ölçü birimi (Adet, Kg, Metre vb.)
   * @param kdvPercent - Uygulanacak KDV oranı yüzdesi (0, 1, 10, 20 vb.)
   * @throws {DomainError} `ITEM_NAME` kalem adı boş bırakılamaz
   * @throws {DomainError} `ITEM_QTY` miktar pozitif olmalıdır
   * @throws {DomainError} `ITEM_KDV` KDV oranı negatif olamaz
   */
  constructor(
    readonly id: number,
    readonly name: string,
    readonly quantity: number,
    readonly unit: string,
    readonly kdvPercent: number,
  ) {
    if (!name.trim()) throw new DomainError('ITEM_NAME', 'Kalem adı boş olamaz.')
    if (!(quantity > 0)) throw new DomainError('ITEM_QTY', `Miktar pozitif olmalı: ${name}`)
    if (kdvPercent < 0) throw new DomainError('ITEM_KDV', `KDV oranı negatif olamaz: ${name}`)
  }
}
