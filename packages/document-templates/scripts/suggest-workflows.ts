/**
 * Capabilities Tabanlı Profil Öneri Betiği
 *
 * Şablonların capabilities bayraklarına bakarak otomatik profil tahmini üretir
 * ve kayıt defterindeki mevcut eşleme ile karşılaştırır.
 *
 * Çalıştırma: tsx packages/document-templates/scripts/suggest-workflows.ts
 */

import { TEMPLATE_REGISTRY } from '../src/registry'
import { TemplateCapabilities, WorkflowProfileName } from '../src/types'

export interface WorkflowSuggestion {
  id: string
  title: string
  suggestedProfile: WorkflowProfileName
  currentWorkflowState: string
  ruleApplied: string
  differsFromCurrent: boolean
}

export function suggestProfileFromCapabilities(
  caps: TemplateCapabilities,
  id: string
): { profile: WorkflowProfileName; rule: string } {
  // 1. Ek belge tespiti (id adlandırması)
  if (id.includes('-eki') || id.includes('teslim-tesellum')) {
    return { profile: 'ek_belge', rule: 'id naming (-eki / teslim-tesellum)' }
  }

  // 2. supportsCommission -> komisyon_tutanagi
  if (caps.supportsCommission) {
    return { profile: 'komisyon_tutanagi', rule: 'supportsCommission: true' }
  }

  // 3. supportsFirmaListesi + supportsPersonnelList: false -> firma_belgesi
  if (caps.supportsFirmaListesi && caps.supportsPersonnelList === false) {
    return {
      profile: 'firma_belgesi',
      rule: 'supportsFirmaListesi: true & supportsPersonnelList: false'
    }
  }

  // 4. supportsFirmaListesi + supportsOlur: false -> dis_yazi (dış firma mektubu vb.)
  if (caps.supportsFirmaListesi && !caps.supportsOlur) {
    return { profile: 'dis_yazi', rule: 'supportsFirmaListesi: true (firma mektubu)' }
  }

  // 5. supportsOlur -> olur_onay
  if (caps.supportsOlur) {
    return { profile: 'olur_onay', rule: 'supportsOlur: true' }
  }

  // 6. Varsayılan iç idari form
  return { profile: 'ic_form', rule: 'default fallback (iç form)' }
}

export function runWorkflowSuggestions(): WorkflowSuggestion[] {
  return TEMPLATE_REGISTRY.map((t) => {
    const { profile, rule } = suggestProfileFromCapabilities(t.capabilities, t.id)
    const currentState = t.workflow?.explicitState ?? 'undefined'
    const isInherited = Boolean(t.workflow?.inheritsFrom)

    // Mevcut atanan profil veya tip ile öneriyi kıyasla
    let currentEquivalent = ''
    if (t.id === 'harcama-talimati') currentEquivalent = 'olur_onay'
    else if (t.id === 'komisyon-gorevlendirme-onayi') currentEquivalent = 'olur_onay'
    else if (t.id === 'komisyon-gorevlendirme-onayi-eki') currentEquivalent = 'komisyon_tutanagi'
    else if (isInherited) currentEquivalent = 'ek_belge'
    else if (t.workflow?.routing?.mode === 'role') currentEquivalent = 'olur_onay'
    else if (t.workflow?.signatures?.some((s) => s.role === 'komisyon_baskani')) currentEquivalent = 'komisyon_tutanagi'
    else if (t.workflow?.signatures?.some((s) => s.role === 'firma_yetkilisi')) currentEquivalent = 'firma_belgesi'
    else if (t.workflow?.routing?.mode === 'external') currentEquivalent = 'dis_yazi'
    else if (t.workflow?.routing?.mode === 'none') currentEquivalent = 'ic_form'

    return {
      id: t.id,
      title: t.title,
      suggestedProfile: profile,
      currentWorkflowState: `${currentState} (${currentEquivalent || 'none'})`,
      ruleApplied: rule,
      differsFromCurrent: currentEquivalent !== '' && currentEquivalent !== profile
    }
  })
}

// Konsola tablo formatında çıktı
if (require.main === module || !process.env.VITEST) {
  const suggestions = runWorkflowSuggestions()
  console.log('\n========================================================================================')
  console.log('                 CAPABILITIES TABANLI WORKFLOW PROFİLİ ÖNERİ RAPORU')
  console.log('========================================================================================\n')
  console.table(
    suggestions.map((s) => ({
      ID: s.id,
      Başlık: s.title,
      'Önerilen Profil': s.suggestedProfile,
      'Kural': s.ruleApplied,
      'Mevcut Eşleme': s.currentWorkflowState,
      'Fark Var Mı?': s.differsFromCurrent ? 'FARK' : 'UYUMLU'
    }))
  )
}
