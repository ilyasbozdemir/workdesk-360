/**
 * İstekli Firma (Entity).
 * 
 * Piyasa fiyat araştırması kapsamında kendisinden fiyat teklifi istenen
 * veya teklif mektubu gönderilen gerçek/tüzel kişiyi temsil eder.
 */
export class Bidder {
  /**
   * Yeni bir istekli firma tanımlar.
   * 
   * @param id - Firmanın kimliği (TANIM_Firma.id veya DATA_TeminFirma.id)
   * @param title - Firmanın resmî unvanı veya ticari adı
   * @param taxNo - Vergi Kimlik Numarası (VKN) veya TC Kimlik Numarası
   */
  constructor(
    readonly id: number,
    readonly title: string,
    readonly taxNo?: string,
  ) {}
}
