import { RateDeduction } from './DeductionRule'
import { ProcurementProfile } from './ProcurementProfile'

/**
 * Taban Alım Profili.
 * Tüm kamu alım süreçlerinde zorunlu olan en temel onay ve muayene kabul belgelerini içerir.
 */
export const BASE_PROFILE = ProcurementProfile.root('base', 'Taban', {
  documents: ['dogrudan-temin-onay-belgesi', 'muayene-kabul-tutanagi'],
})

/** 
 * Doğrudan Temin (4734 Sayılı Kanun Madde 22/d) Profili.
 * 
 * 4734 Sayılı Kanun Madde 22 ve ilgili Doğrudan Temin Tebliği (Mevzuat No: 40666) gereğince:
 * - Doğrudan temin bir "ihale usulü" değil, bir "satın alma yöntemi"dir.
 * - İhale komisyonu kurulmaz, ihale kararı alınmaz ve ihale karar pulu kesilmez.
 * - En az 2 firmadan piyasa araştırması yapılır; piyasa fiyat araştırma tutanağı ve yaklaşık maliyet cetveli düzenlenir.
 */
export const DIRECT_PROCUREMENT_PROFILE = BASE_PROFILE.extend('dogrudan-temin', 'Doğrudan Temin (22/d)', {
  addDocuments: ['piyasa-fiyat-arastirma-tutanagi', 'yaklasik-maliyet-cetveli', 'kabul-edilen-teklif'],
})

/** 
 * Açık İhale Profili (4734 Sayılı Kanun Madde 19).
 * İhale kararı alınır, ihale karar pulu kesilir ve sözleşme akdedilir.
 */
export const OPEN_TENDER_PROFILE = BASE_PROFILE.extend('acik-ihale', 'Açık İhale', {
  hasTenderDecision: true,
  addDocuments: ['ihale-karari', 'sozlesme'],
  addDeductions: [new RateDeduction('karar-pulu', 'Karar Pulu', 'kdvHaric', 'kararPuluBinde')],
})
