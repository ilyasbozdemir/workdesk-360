import { denormDosya } from './engine'
import type { DtDosyaNorm, DtFirma, DtKatalogKalemi, DtYedekRoot } from './types'

export interface StatikApiPaketi {
  manifest?: {
    schemaVersion: number
    uygulamaDurumu?: {
      aktifIndeks?: number
      winV2?: boolean
      mockTemizlendi?: boolean
    }
  }
  genel?: {
    kurum?: { kurumAdi: string }
    firmalar?: DtFirma[]
    katalog?: DtKatalogKalemi[]
    varsayilanlar?: DtYedekRoot['defs']
  }
  dosyalar?: DtDosyaNorm[]
}

/**
 * Statik API (ayrılmış JSON klasörü veya ZIP) yapısını yeniden denormalize edip
 * tek bir DtYedekRoot (Doğrudan Temin kök yedeği) haline getirir.
 */
export function denormStatikApi(paket: StatikApiPaketi): DtYedekRoot {
  const files = (paket.dosyalar || []).map(denormDosya)
  const genel = paket.genel || {}
  const uydurma = paket.manifest?.uygulamaDurumu || {}

  return {
    files,
    cur: uydurma.aktifIndeks ?? 0,
    defs: genel.varsayilanlar || {
      f: {},
      yak: [],
      muay: []
    },
    kurum: genel.kurum || { kurumAdi: '' },
    firmalar: genel.firmalar || [],
    katalog: genel.katalog || [],
    mockTemizlendi: uydurma.mockTemizlendi,
    winV2: uydurma.winV2
  }
}
