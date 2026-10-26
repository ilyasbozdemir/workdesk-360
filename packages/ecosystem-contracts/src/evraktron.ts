/**
 * Workspace 360 — Evraktron Entegrasyonu ve Arşiv Modülü Sözleşmeleri
 * 
 * Evraktron, kurumsal evrak kayıt, takip ve arşivleme için bağımsız bir Windows .exe
 * masaüstü uygulamasıdır (.etap dosya formatı, SQLite + Zip, FTS5 arama).
 * 
 * Arşiv 360 ayrı bir masaüstü uygulaması olarak değil, Evraktron bünyesinde bir
 * "Arşiv Modülü" olarak konumlandırılmıştır.
 */

// ============================================================================
// 1. Evrak Kayıt ve Metadata Yapısı
// ============================================================================

export type EvrakTuru = 'gelen' | 'giden' | 'kurum_ici'

export type EvrakDurumu = 'kaydedildi' | 'havale_edildi' | 'islemde' | 'cevaplandi' | 'arsivlendi'

export interface EvrakEki {
  id: string
  dosyaAdi: string
  mimeType: string
  boyutBytes: number
  sha256?: string
  dosyaYolu?: string
  eklenmeTarihi: string
}

export interface EvrakKayitPayload {
  kaynakUygulama: 'flowdesk' | 'personel-360' | 'temin-360' | 'ihale-360' | 'diger'
  kaynakSurecId?: string
  kaynakBelgeId?: string
  evrakTuru: EvrakTuru
  konu: string
  tarih: string           // ISO date: 'YYYY-MM-DD'
  gonderen?: string
  alici?: string
  ilgiliBirim?: string
  guvenlikDerecesi?: 'normal' | 'hizmete_ozel' | 'gizli'
  ekler?: Array<{
    dosyaAdi: string
    mimeType: string
    boyutBytes: number
    dosyaYolu?: string
  }>
  aciklama?: string
}

export interface EvrakReferans {
  evrakId: string
  evrakNo: string
  kayitTarihi: string
  evrakTuru: EvrakTuru
  durum: EvrakDurumu
  etapDosyaYolu?: string
}

// ============================================================================
// 2. Evraktron İç Arşiv Modülü (.etap Yapısı ve İndeksleme)
// ============================================================================

export interface EvraktronArsivPaketi {
  etapVersion: number
  paketId: string
  arsivTarihi: string
  toplamEvrakSayisi: number
  toplamEkBoyutuBytes: number
  evraklar: Array<{
    evrakId: string
    evrakNo: string
    konu: string
    tarih: string
    ekSayisi: number
  }>
  checksumSha256: string
}

export interface EvrakAramaFiltresi {
  kelime?: string           // FTS5 tam metin araması
  evrakTuru?: EvrakTuru
  baslangicTarihi?: string
  bitisTarihi?: string
  birim?: string
  durum?: EvrakDurumu
  yalnizcaEkli?: boolean
}

// ============================================================================
// 3. FlowDesk <-> Evraktron Entegrasyon Sözleşmesi
// ============================================================================

/**
 * FlowDesk'te üretilen bir belgenin (EBYS çıktısı) Evraktron'a aktarılması için sözleşme.
 */
export interface FlowdeskToEvraktronBridge {
  aktarEvrak(payload: EvrakKayitPayload): Promise<EvrakReferans>
  getirEvrakDurumu(evrakId: string): Promise<EvrakReferans | null>
}
