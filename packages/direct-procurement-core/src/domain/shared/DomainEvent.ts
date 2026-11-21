/**
 * Etki Alanı Olayı (Domain Event - Soyut Temel Sınıf).
 * 
 * Aggregate içinde gerçekleşen önemli bir iş olayını (teklif değişti, kazanan seçildi, sonuç onaylandı vb.)
 * diğer alt sistemlere (yan etkiler, e-posta, stok, bildirimler) asenkron veya senkron duyurmak için kullanılır.
 * Zaman bilgisini (`occurredAt`) dışarıdan parametre olarak alır (Domain katmanı `Date.now()` veya sistem saatine bağımlı değildir).
 */
export abstract class DomainEvent {
  protected constructor(
    /** Olayın benzersiz tür adı */
    readonly name: string,
    /** Olayın gerçekleştiği dosya kimliği */
    readonly dosyaId: number,
    /** Olayın gerçekleştiği zaman damgası (ISO formatı) */
    readonly occurredAt: string,
  ) {}
}
