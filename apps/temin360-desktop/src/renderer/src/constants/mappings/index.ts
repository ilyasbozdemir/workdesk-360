import {
  getTemplateMapping,
  toCanonicalDocId,
  resolveTemplateKey,
  type ProcessMapping,
  type TableColumnMapping
} from '@temin360/document-templates'

export type { ProcessMapping, TableColumnMapping }
export * from './types'

/**
 * Electron ekran rotası ile belge şablon kimliği arasındaki eşleme tablosu.
 * Yalnızca arayüz rotalarının hangi belge şablonunu açacağını tanımlar.
 * Belge alanlarının SQL kaynakları ve kolon tanımları packages/document-templates paketindedir.
 */
export const screenTemplateMap: Record<string, string> = {
  // İhtiyaç Listesi & Maliyet & Onay
  '/dosya/hazirlik-ve-ihtiyac': 'ihtiyac-listesi',
  '/dosya/malzemeler/liste': 'ihtiyac-listesi',
  '/dosya/luzum/talep-formu': 'ihtiyac-talep-formu',
  '/dosya/luzum/belge': 'luzum-muzekkeresi',
  '/dosya/luzum/onay-eki': 'luzum-muzekkeresi-onay-eki',
  '/dosya/luzum/teslim-tesellum': 'luzum-muzekkeresi-teslim-tesellum',
  '/dosya/malzemeler/son-alim': 'son-alim-fiyat-cetveli',

  // Komisyon & Harcama
  '/dosya/komisyon/fiyat-arastirma': 'komisyon-gorevlendirme-onayi',
  '/dosya/komisyon/onay-eki': 'komisyon-gorevlendirme-onayi-eki',
  '/dosya/komisyon/muayene-kabul': 'muayene-kabul-komisyonu',
  '/dosya/harcama/talimat': 'harcama-talimati',
  '/dosya/firmalar-maliyet/yaklasik': 'yaklasik-maliyet-cetveli',

  // Diğer süreç ve onay sayfaları
  '/dosya/firmalar-maliyet/tutanak': 'piyasa-fiyat-arastirma-tutanagi',
  '/dosya/onay/dt-onay': 'dogrudan-temin-onay-belgesi',
  '/dosya/onay/ihale-onay': 'idare-onay-belgesi',
  '/dosya/onay/butce-sorgu': 'butce-sorgusu',
  '/dosya/harcama/pusula': 'harcama-pusulasi',

  // Wizard subscreen fallbacks
  '/dosya/piyasa-fiyat-arastirmasi': 'piyasa-fiyat-arastirma-tutanagi',
  '/dosya/siparis-ve-sozlesme': 'dogrudan-temin-sozlesmesi',
  '/dosya/kabul-ve-odeme': 'muayene-kabul-tutanagi',
  '/dosya/fatura-ve-irsaliye': 'hakedis-raporu',
  '/dosya/klasor-ve-kapaklar': 'ihale-kapagi',
  '/dosya/imzali-belgeler': 'dogrudan-temin-sonuc-onay-belgesi',

  // URL Segment alias'ları
  'ihtiyac-listesi': 'ihtiyac-listesi',
  'malzeme-hizmet-kalem-listesi': 'ihtiyac-listesi',
  'liste': 'ihtiyac-listesi',
  'hazirlik-ve-ihtiyac': 'ihtiyac-listesi',
  'luzum-muzekkeresi': 'luzum-muzekkeresi',
  'luzum-muzekkeresi-belgesi': 'luzum-muzekkeresi',
  'belge': 'luzum-muzekkeresi',
  'luzum-muzekkeresi-onay-eki': 'luzum-muzekkeresi-onay-eki',
  'luzum-onay-eki': 'luzum-muzekkeresi-onay-eki',
  'onay-eki': 'luzum-muzekkeresi-onay-eki',
  'luzum-muzekkeresi-teslim-tesellum': 'luzum-muzekkeresi-teslim-tesellum',
  'teslim-tesellum-belgesi': 'luzum-muzekkeresi-teslim-tesellum',
  'teslim-tesellum': 'luzum-muzekkeresi-teslim-tesellum',
  'ihtiyac-talep-formu': 'ihtiyac-talep-formu',
  'talep-formu': 'ihtiyac-talep-formu',
  'son-alim-fiyat-cetveli': 'son-alim-fiyat-cetveli',
  'son-alim': 'son-alim-fiyat-cetveli',
  'komisyon-gorevlendirme-onayi': 'komisyon-gorevlendirme-onayi',
  'fiyat-arastirma': 'komisyon-gorevlendirme-onayi',
  'yaklasik-maliyet-tespit-komisyonu': 'komisyon-gorevlendirme-onayi',
  'yaklasik-maliyet-komisyonu': 'komisyon-gorevlendirme-onayi',
  'komisyon-gorevlendirme-onayi-eki': 'komisyon-gorevlendirme-onayi-eki',
  'muayene-kabul-komisyonu': 'muayene-kabul-komisyonu',
  'muayene-kabul': 'muayene-kabul-komisyonu',
  'piyasa-fiyat-arastirma-gorevlendirmesi': 'piyasa-fiyat-arastirma-gorevlendirmesi',
  'harcama-talimati': 'harcama-talimati',
  'talimat': 'harcama-talimati',
  'yaklasik-maliyet-cetveli': 'yaklasik-maliyet-cetveli',
  'yaklasik-maliyet-hesap-cetveli': 'yaklasik-maliyet-cetveli',
  'yaklasik': 'yaklasik-maliyet-cetveli',
  'tutanak': 'piyasa-fiyat-arastirma-tutanagi',
  'butce-sorgu': 'butce-sorgusu',
  'dt-onay': 'dogrudan-temin-onay-belgesi',
  'ihale-onay': 'idare-onay-belgesi',
  'pusula': 'harcama-pusulasi',
  'kik048': 'kik048-yapim-gecici-kabul-teklif',
  'kik049': 'kik049-yapim-gecici-kabul-tutanagi',
  'kik050': 'kik050-yapim-kesin-kabul-teklif',
  'kik051': 'kik051-yapim-kesin-kabul-tutanagi'
}

/**
 * Süreç yolunu (URL / ekran rotası) veya alias'ını şablon kimliğine (templateId) çözümler.
 */
export function resolveTemplateIdFromPath(processPath: string | null | undefined): string {
  if (!processPath) return ''
  const trimmed = processPath.trim()

  if (screenTemplateMap[trimmed]) {
    return screenTemplateMap[trimmed]
  }

  const parts = trimmed.replace(/\.html$/, '').split('/')
  let cleanPath = parts.pop() || ''
  if (cleanPath === 'index' && parts.length > 0) {
    cleanPath = parts.pop() || ''
  }

  if (screenTemplateMap[cleanPath]) {
    return screenTemplateMap[cleanPath]
  }

  const canonical = toCanonicalDocId(cleanPath)
  if (canonical) {
    return canonical
  }

  const byRegistry = resolveTemplateKey(cleanPath)
  if (byRegistry) {
    return byRegistry
  }

  return cleanPath
}

/**
 * Süreç yolundan veya şablon kimliğinden merkezi templateRegistry üzerinden
 * ilgili şablonun veri eşlemesini (ProcessMapping) döner.
 */
export function getDefaultMappingForProcess(processPath: string): ProcessMapping {
  const templateId = resolveTemplateIdFromPath(processPath)
  if (!templateId) return {}
  return getTemplateMapping(templateId)
}

/**
 * Geriye dönük uyumluluk için processMappingRegistry nesnesi.
 * Doğrudan sözlük okumalarını tek şablon kayıt sistemine yönlendirir.
 */
export const processMappingRegistry: Record<string, ProcessMapping> = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      return getDefaultMappingForProcess(prop)
    },
    has: (_target, prop: string) => {
      return Boolean(resolveTemplateIdFromPath(prop))
    }
  }
)
