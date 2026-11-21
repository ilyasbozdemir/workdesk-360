import { DomainError } from '../shared/DomainError'

/** İhtiyaç kalemi. Doğrudan teminde sipariş miktarı = ihtiyaç miktarı. */
export class NeedItem {
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
