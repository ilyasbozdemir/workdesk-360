export interface AIFormContext {
  /** Form hakkında genel bilgi (hangi form olduğu, hangi ekran) */
  formTitle: string
  /** Kurum / Birim bilgisi */
  kurumBilgisi?: {
    birimAdi?: string
    sunulacakMakam?: string
    antetEkSatir?: string
    ihtiyacYeri?: string
    kurumAdi?: string
  }
  /** Mevcut form değerleri (dolu olanlar) */
  mevcutDegerler?: Record<string, string | number | null | undefined>
  /** Doldurulması istenen alanlar */
  doldurulacakAlanlar: Array<{
    alan: string // "konu", "isin_aciklamasi" vb.
    etiket: string // "İhale Konusu", "İşin Açıklaması" vb.
    tip?: 'text' | 'textarea' | 'date' | 'select' | 'number'
    zorunlu?: boolean
    ornekDeger?: string
  }>
}

export interface AIFilledValues {
  [key: string]: string | number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIFormFillModalProps {
  isOpen: boolean
  onClose: () => void
  context: AIFormContext
  /** Hızlı Doldur sonucunda çağrılır */
  onApply: (values: AIFilledValues) => void
}
