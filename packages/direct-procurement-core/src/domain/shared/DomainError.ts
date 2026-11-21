/**
 * Etki Alanı Hatası (Domain Error).
 * 
 * Bir iş kuralı, aşama kısıtı veya mevzuat gereksinimi ihlal edildiğinde fırlatılır.
 * UI ve üst katmanlar `code` alanını kontrol ederek kullanıcıya lokalize edilmiş
 * ve anlamlı hata bildirimleri sunabilir.
 */
export class DomainError extends Error {
  /**
   * Yeni bir etki alanı hatası oluşturur.
   * 
   * @param code - Makine tarafından okunabilir hata kodu (örn: `ITEM_QTY`, `BIDDER_MAX`)
   * @param message - İnsan tarafından okunabilir hata açıklaması
   */
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
