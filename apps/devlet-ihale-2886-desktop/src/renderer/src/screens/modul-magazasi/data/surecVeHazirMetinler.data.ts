/**
 * Süreç ve Hazır Metin Kalıpları Veri Kaynağı
 * TEK GERÇEKLİK KAYNAĞI (Single Source of Truth):
 * Modül listesi, mevzuat, aşamalar ve resmi evrak tanımları moduller.data.ts üzerinden beslenir.
 * Bu dosya sadece ilgili modüllere ait hazır metin kalıplarını (dilekçe, tutanak, onay) ve rehberleri tanımlar;
 * Süreç paketlerini (SUREC_PAKETLERI_DATA) ise moduller.data.ts'teki RESMI_MODUL_PAKETLERI'nden dinamik türetir.
 */
import { RESMI_MODUL_PAKETLERI } from './moduller.data'
import type { HazirMetinKalibi, RehberMaddesi } from '../modulMagazasi.types'

export type { HazirMetinKalibi, RehberMaddesi }

export interface EvrakMaddesi {
  sira: number
  kod: string
  baslik: string
  aciklama: string
  tur: 'word' | 'pdf' | 'modul' | 'ekap'
  otomatikDolanAlanlar: string[]
  zorunluMu: boolean
  wordIndirilebilir: boolean
  pdfIndirilebilir: boolean
  formBuilderUyumlumu: boolean
}

export interface SurecPaketiVerisi {
  id: string
  kod: string
  baslik: string
  kisaBaslik: string
  kategori: string
  mevzuat: string
  aciklama: string
  otomatikDoldurmaBilgisi: string
  hazirMaddeSayisiMetni: string
  evraklar: EvrakMaddesi[]
  hazirMetinler: HazirMetinKalibi[]
  rehberMaddeleri: RehberMaddesi[]
}

// =============================================================================
// 1 & 2. MODÜLLERE BAĞLI HAZIR METİN KALIPLARI VE REHBERLER (Constants'tan çekilir)
// =============================================================================
import { HAZIR_METINLER_DATA } from '../constants/hazirMetinler.constants'
import { REHBERLER_DATA } from '../constants/mevzuatRehberi.constants'

export { HAZIR_METINLER_DATA, REHBERLER_DATA }

// =============================================================================
// 3. TEK KAYNAKTAN (RESMI_MODUL_PAKETLERI) DİNAMİK TÜRETİLEN SÜREÇ PAKETLERİ
// =============================================================================
export const SUREC_PAKETLERI_DATA: Record<string, SurecPaketiVerisi> = Object.fromEntries(
  RESMI_MODUL_PAKETLERI.map((modul) => {
    const hazirMetinler = HAZIR_METINLER_DATA[modul.id] || []
    const rehberMaddeleri = REHBERLER_DATA[modul.id] || []

    const evraklar: EvrakMaddesi[] = modul.belgeler.map((belge, idx) => {
      const kodUpper = (belge.kod || '').toUpperCase()
      const isPdf =
        kodUpper.includes('PDF') ||
        kodUpper.includes('023') ||
        kodUpper.includes('PUSULA') ||
        kodUpper.includes('FİHRİST')
      const isEkap = kodUpper.includes('EKAP')

      return {
        sira: idx + 1,
        kod: belge.kod,
        baslik: belge.ad,
        aciklama: belge.aciklama,
        tur: isEkap ? 'ekap' : isPdf ? 'pdf' : 'word',
        otomatikDolanAlanlar: ['Kurum Adı', 'Birim Adı', 'Tarih', 'Yetkili / İmza Makamı'],
        zorunluMu: belge.zorunluMu,
        wordIndirilebilir: !isEkap,
        pdfIndirilebilir: true,
        formBuilderUyumlumu: !isEkap
      }
    })

    const paket: SurecPaketiVerisi = {
      id: modul.id,
      kod: modul.kod,
      baslik: modul.baslik,
      kisaBaslik: modul.baslik,
      kategori: modul.kategori,
      mevzuat: modul.mevzuat,
      aciklama: modul.detayliAciklama || modul.kisaAciklama,
      otomatikDoldurmaBilgisi:
        'Belgeler çalışma dosyanızdaki kurum, birim, yaklaşık maliyet, firma teklifleri ve harcama yetkilisi bilgileriyle otomatik doldurulur. "Doldur ve İndir" dediğinizde alanlar kendiliğinden yazılır.',
      hazirMaddeSayisiMetni: `${evraklar.length} / ${evraklar.length} evrak için sistemde hazır şablon ve canlı üretim desteği var.`,
      evraklar,
      hazirMetinler,
      rehberMaddeleri
    }

    return [modul.id, paket]
  })
)
