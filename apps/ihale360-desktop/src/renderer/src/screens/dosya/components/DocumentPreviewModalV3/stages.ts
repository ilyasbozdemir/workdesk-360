import { TemplateOptionItem } from './templateResolver'

export interface DocumentStageInfo {
  id: number
  key: string
  name: string
  shortName: string
  color: string
  badgeBg: string
  badgeText: string
  categories: string[]
  recommendedTemplates: string[]
}

export const IHTIYAC_RAPORU_STAGE: DocumentStageInfo = {
  id: 0,
  key: 'ihtiyac-raporu',
  name: 'İhtiyaç Raporu Belgeleri',
  shortName: 'İhtiyaç Raporu',
  color: 'emerald',
  badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
  badgeText: 'text-emerald-700 dark:text-emerald-300',
  categories: ['ihtiyac-raporu', 'İhtiyaç & Talep'],
  recommendedTemplates: [
    'luzum_muzekkeresi',
    'luzum_onay_eki',
    'luzum-muzekkeresi',
    'luzum-onay-eki'
  ]
}

export const DOCUMENT_STAGES: DocumentStageInfo[] = [
  {
    id: 1,
    key: '1-ihtiyac-tespiti-ve-baslangic',
    name: '1. Aşama: Hazırlık & İhtiyaç Tespiti',
    shortName: '1. Hazırlık',
    color: 'blue',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
    categories: [
      '1-ihtiyac-tespiti-ve-baslangic',
      'Hazırlık & İhtiyaç',
      '1. İhtiyaç Tespiti & Başlangıç'
    ],
    recommendedTemplates: [
      'ihtiyac_listesi',
      'ihtiyac-listesi',
      'ihtiyac_talep_formu',
      'ihtiyac-talep-formu',
      'tasinir_kayit_yetkilisi_gorusu',
      'tasinir-kayit-yetkilisi-gorusu',
      'teknik_sartname',
      'teknik-sartname',
      'luzum_muzekkeresi',
      'luzum-muzekkeresi',
      'luzum_onay_eki',
      'luzum-onay-eki',
      'luzum_muzekkeresi_teslim_tesellum',
      'luzum-muzekkeresi-teslim-tesellum',
      'harcama_talimati',
      'harcama-talimati',
      'dogrudan_temin_onay_belgesi',
      'dogrudan-temin-onay-belgesi',
      'komisyon_gorevlendirme_onayi',
      'komisyon-gorevlendirme-onayi',
      'komisyon_gorevlendirme_onayi_eki',
      'komisyon-gorevlendirme-onayi-eki'
    ]
  },
  {
    id: 2,
    key: '2-piyasa-fiyat-arastirmasi',
    name: '2. Aşama: Teklifler & Piyasa Fiyat Araştırması',
    shortName: '2. Araştırma',
    color: 'indigo',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    categories: ['2-piyasa-fiyat-arastirmasi', 'Teklifler & Piyasa', '2. Piyasa Fiyat Araştırması'],
    recommendedTemplates: [
      'piyasa_fiyat_arastirma_gorevlendirmesi',
      'piyasa-fiyat-arastirma-gorevlendirmesi',
      'fiyat_arastirma_mektubu',
      'fiyat-arastirma-mektubu',
      'birim_fiyat_teklif_mektubu',
      'birim-fiyat-teklif-mektubu',
      'arastirma_mektubu',
      'arastirma-mektubu',
      'piyasa_fiyat_arastirma_tutanagi',
      'piyasa-fiyat-arastirma-tutanagi',
      'yaklasik_maliyet_cetveli',
      'yaklasik-maliyet-cetveli',
      'son_alim_fiyat_cetveli',
      'son-alim-fiyat-cetveli',
      'butce_sorgusu',
      'butce-sorgusu'
    ]
  },
  {
    id: 3,
    key: '3-siparis-ve-sozlesme',
    name: '3. Aşama: Sipariş & Sözleşme',
    shortName: '3. Sipariş',
    color: 'purple',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
    categories: ['3-siparis-ve-sozlesme', 'Sipariş & Sözleşme'],
    recommendedTemplates: [
      'siparis_mektubu',
      'siparis-mektubu',
      'siparis_formu',
      'siparis-formu',
      'kabul_edilen_teklif',
      'kabul-edilen-teklif',
      'sozlesmeye_davet',
      'sozlesmeye-davet',
      'dogrudan_temin_sozlesmesi',
      'dogrudan-temin-sozlesmesi',
      'dogrudan_temin_sonuc_onay_belgesi',
      'dogrudan-temin-sonuc-onay-belgesi'
    ]
  },
  {
    id: 4,
    key: '4-kabul-ve-odeme-islemleri',
    name: '4. Aşama: Muayene & Kabul & Ödeme',
    shortName: '4. Kabul & Ödeme',
    color: 'teal',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800',
    badgeText: 'text-teal-700 dark:text-teal-300',
    categories: ['4-kabul-ve-odeme-islemleri', 'Muayene & Kabul & Ödeme', '4. Kabul & Muayene'],
    recommendedTemplates: [
      'muayene_kabul_komisyonu',
      'muayene-kabul-komisyonu',
      'muayene_kabul_tutanagi',
      'muayene-kabul-tutanagi',
      'kik048_yapim_gecici_kabul_teklif',
      'kik048-yapim-gecici-kabul-teklif',
      'kik049_yapim_gecici_kabul_tutanagi',
      'kik049-yapim-gecici-kabul-tutanagi',
      'kik050_yapim_kesin_kabul_teklif',
      'kik050-yapim-kesin-kabul-teklif',
      'kik051_yapim_kesin_kabul_tutanagi',
      'kik051-yapim-kesin-kabul-tutanagi',
      'harcama_pusulasi',
      'harcama-pusulasi',
      'odeme_yazisi',
      'odeme-yazisi'
    ]
  },
  {
    id: 5,
    key: '5-klasor-ve-kapaklar',
    name: '5. Aşama: Klasör & Kapaklar',
    shortName: '5. Kapaklar',
    color: 'amber',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
    categories: ['5-klasor-ve-kapaklar', 'Klasör & Kapaklar', 'Kapak & Arşiv'],
    recommendedTemplates: ['dosya_kapagi', 'dosya-kapagi', 'arsiv_etiketi', 'arsiv-etiketi']
  }
]

/**
 * ID veya key'e göre aşama bilgisini döner.
 */
export function getStageById(stageIdOrKey?: number | string | null): DocumentStageInfo | undefined {
  if (stageIdOrKey === undefined || stageIdOrKey === null) return undefined
  if (stageIdOrKey === 0 || stageIdOrKey === 'ihtiyac-raporu' || stageIdOrKey === '0') {
    return IHTIYAC_RAPORU_STAGE
  }

  const num = typeof stageIdOrKey === 'number' ? stageIdOrKey : parseInt(String(stageIdOrKey), 10)
  if (!isNaN(num)) {
    return DOCUMENT_STAGES.find((s) => s.id === num)
  }

  const keyStr = String(stageIdOrKey).toLowerCase()
  return (
    DOCUMENT_STAGES.find(
      (s) =>
        s.key.toLowerCase().includes(keyStr) ||
        s.categories.some((c) => c.toLowerCase().includes(keyStr))
    ) || DOCUMENT_STAGES[0]
  )
}

/**
 * Verilen şablon kimliği ve kategorisine göre ait olduğu aşamayı belirler.
 */
export function getStageForTemplate(
  templateId?: string | null,
  category?: string | null,
  sourceKind?: string | null
): DocumentStageInfo {
  if (sourceKind === 'ihtiyacRaporu') {
    return IHTIYAC_RAPORU_STAGE
  }

  if (category) {
    const cleanCat = category.toLowerCase()
    if (cleanCat.includes('ihtiyac-raporu')) return IHTIYAC_RAPORU_STAGE
    const matched = DOCUMENT_STAGES.find((s) =>
      s.categories.some(
        (c) => cleanCat.includes(c.toLowerCase()) || c.toLowerCase().includes(cleanCat)
      )
    )
    if (matched) return matched
  }

  if (templateId) {
    const cleanId = templateId.toLowerCase().replace(/_/g, '-')
    const matched = DOCUMENT_STAGES.find((s) =>
      s.recommendedTemplates.some((t) => t.toLowerCase().replace(/_/g, '-') === cleanId)
    )
    if (matched) return matched
  }

  return DOCUMENT_STAGES[0]
}

/**
 * Belirli bir aşamadaki şablon seçeneklerini filtreler.
 */
export function filterTemplatesByStage(
  stageId: number,
  templates: TemplateOptionItem[]
): TemplateOptionItem[] {
  if (stageId === 0) {
    return templates.filter(
      (t) =>
        t.category?.includes('ihtiyac-raporu') ||
        IHTIYAC_RAPORU_STAGE.recommendedTemplates.includes(t.id)
    )
  }

  const stage = DOCUMENT_STAGES.find((s) => s.id === stageId)
  if (!stage) return templates

  return templates.filter((t) => {
    if (
      t.category &&
      stage.categories.some((c) => t.category.toLowerCase().includes(c.toLowerCase()))
    ) {
      return true
    }
    return stage.recommendedTemplates.some(
      (rec) => rec.replace(/_/g, '-') === t.id.replace(/_/g, '-')
    )
  })
}

/**
 * Kılavuzlu modda bir sonraki veya bir önceki şablonu bulur.
 */
export function getAdjacentStageTemplate(
  currentDocId: string,
  stageId: number,
  templates: TemplateOptionItem[],
  direction: 'next' | 'prev'
): TemplateOptionItem | undefined {
  const stageTemplates = filterTemplatesByStage(stageId, templates)
  if (stageTemplates.length <= 1) return undefined

  const currentIndex = stageTemplates.findIndex(
    (t) => t.id.replace(/_/g, '-').toLowerCase() === currentDocId.replace(/_/g, '-').toLowerCase()
  )

  if (currentIndex === -1) {
    return direction === 'next' ? stageTemplates[0] : undefined
  }

  if (direction === 'next') {
    return currentIndex < stageTemplates.length - 1 ? stageTemplates[currentIndex + 1] : undefined
  } else {
    return currentIndex > 0 ? stageTemplates[currentIndex - 1] : undefined
  }
}
