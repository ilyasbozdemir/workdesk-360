import { RateDeduction } from './DeductionRule'
import { ProcurementProfile } from './ProcurementProfile'

export const BASE_PROFILE = ProcurementProfile.root('base', 'Taban', {
  documents: ['dogrudan-temin-onay-belgesi', 'muayene-kabul-tutanagi'],
})

/** Doğrudan temin: ihale kararı yok -> karar pulu kuralı da yok. */
export const DIRECT_PROCUREMENT_PROFILE = BASE_PROFILE.extend('dogrudan-temin', 'Doğrudan Temin (22/d)', {
  addDocuments: ['piyasa-fiyat-arastirma-tutanagi', 'yaklasik-maliyet-cetveli', 'kabul-edilen-teklif'],
})

/** Örnek: genel ihale. (Belge kimlikleri yer tutucu, şablon klasörüne göre düzelt.) */
export const OPEN_TENDER_PROFILE = BASE_PROFILE.extend('acik-ihale', 'Açık İhale', {
  hasTenderDecision: true,
  addDocuments: ['ihale-karari', 'sozlesme'],
  addDeductions: [new RateDeduction('karar-pulu', 'Karar Pulu', 'kdvHaric', 'kararPuluBinde')],
})
