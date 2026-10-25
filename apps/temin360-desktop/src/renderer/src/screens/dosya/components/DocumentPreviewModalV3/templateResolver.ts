import {
  templateRegistry,
  getTemplateDefinition,
  getAllTemplateDefinitions,
  TemplateKey,
  TemplateComponentType,
  TemplateDefinition,
  normalizeTemplateKey
} from '@temin360/document-templates'

export interface TemplateOptionItem {
  id: string
  name: string
  title: string
  category: string
  categoryLabel: string
  description?: string
  kikKodu?: string
  kikAdi?: string
  standartFormKodu?: string
  standartFormAdi?: string
}

/**
 * Registry'den türetilen şablon seçenek listesi
 */
export const TEMPLATE_OPTIONS: TemplateOptionItem[] = getAllTemplateDefinitions().map((def) => ({
  id: def.id,
  name: def.name,
  title: def.title,
  category: def.category,
  categoryLabel: def.categoryLabel,
  description: def.description,
  kikKodu: def.kikKodu,
  kikAdi: def.kikAdi,
  standartFormKodu: def.standartFormKodu,
  standartFormAdi: def.standartFormAdi
}))

export { normalizeTemplateKey }

/**
 * Verilen documentId veya şablon anahtarına göre registry'den tanım ve bileşeni çözümler.
 */
export function resolveTemplateConfig(documentId: string | null | undefined): {
  config: TemplateDefinition<React.ComponentType<any>>
  component: TemplateComponentType
  resolvedId: string
} {
  const defaultKey: TemplateKey = 'ihtiyac_listesi'
  const defaultDef = templateRegistry[defaultKey]

  if (!documentId) {
    return {
      config: defaultDef,
      component: defaultDef.component as unknown as TemplateComponentType,
      resolvedId: defaultDef.id
    }
  }

  // 1. Registry'den doğrudan veya normalize edilmiş anahtarla bul
  const def = getTemplateDefinition(documentId)
  if (def) {
    return {
      config: def,
      component: def.component as unknown as TemplateComponentType,
      resolvedId: def.id
    }
  }

  // 2. Sezgisel (Heuristic) anahtar eşleştirme
  const cleanKey = normalizeTemplateKey(documentId)
  let heuristicKey: TemplateKey = 'ihtiyac_listesi'

  if (cleanKey.includes('luzum')) {
    if (cleanKey.includes('onay') || cleanKey.includes('ek')) {
      heuristicKey = 'luzum_onay_eki'
    } else if (cleanKey.includes('teslim') || cleanKey.includes('tesellum')) {
      heuristicKey = 'luzum_muzekkeresi_teslim_tesellum'
    } else {
      heuristicKey = 'luzum_muzekkeresi'
    }
  } else if (cleanKey.includes('harcama') && cleanKey.includes('talimat')) {
    heuristicKey = 'harcama_talimati'
  } else if (cleanKey.includes('harcama') && cleanKey.includes('pusula')) {
    heuristicKey = 'harcama_pusulasi'
  } else if (cleanKey.includes('dogrudan-temin-onay') || cleanKey.includes('dt-onay')) {
    heuristicKey = 'dogrudan_temin_onay_belgesi'
  } else if (cleanKey.includes('sonuc')) {
    heuristicKey = 'dogrudan_temin_sonuc_onay_belgesi'
  } else if (cleanKey.includes('komisyon') || cleanKey.includes('atama')) {
    if (cleanKey.includes('ek')) {
      heuristicKey = 'komisyon_gorevlendirme_onayi_eki'
    } else if (cleanKey.includes('piyasa')) {
      heuristicKey = 'piyasa_fiyat_arastirma_gorevlendirmesi'
    } else {
      heuristicKey = 'komisyon_gorevlendirme_onayi'
    }
  } else if (cleanKey.includes('teklif') || cleanKey.includes('birim-fiyat')) {
    heuristicKey = 'birim_fiyat_teklif_mektubu'
  } else if (cleanKey.includes('fiyat-arastirma-mektubu') || cleanKey.includes('karma')) {
    heuristicKey = 'fiyat_arastirma_mektubu'
  } else if (cleanKey.includes('arastirma-mektubu') || cleanKey.includes('isteme')) {
    heuristicKey = 'arastirma_mektubu'
  } else if (cleanKey.includes('piyasa-fiyat') || cleanKey.includes('tutanak')) {
    heuristicKey = 'piyasa_fiyat_arastirma_tutanagi'
  } else if (cleanKey.includes('yaklasik') || cleanKey.includes('maliyet')) {
    heuristicKey = 'yaklasik_maliyet_cetveli'
  } else if (cleanKey.includes('son-alim') || cleanKey.includes('mukayese')) {
    heuristicKey = 'son_alim_fiyat_cetveli'
  } else if (cleanKey.includes('butce') || cleanKey.includes('bloke')) {
    heuristicKey = 'butce_sorgusu'
  } else if (cleanKey.includes('siparis') || cleanKey.includes('kabul-edilen')) {
    heuristicKey = 'kabul_edilen_teklif'
  } else if (cleanKey.includes('davet')) {
    heuristicKey = 'sozlesmeye_davet'
  } else if (cleanKey.includes('sozlesme')) {
    heuristicKey = 'dogrudan_temin_sozlesmesi'
  } else if (cleanKey.includes('muayene') && cleanKey.includes('tutanak')) {
    heuristicKey = 'muayene_kabul_tutanagi'
  } else if (cleanKey.includes('muayene') || cleanKey.includes('kabul')) {
    heuristicKey = 'muayene_kabul_komisyonu'
  } else if (cleanKey.includes('odeme') && cleanKey.includes('yazi')) {
    heuristicKey = 'odeme_yazisi'
  } else if (cleanKey.includes('tasinir') && cleanKey.includes('gorus')) {
    heuristicKey = 'tasinir_kayit_yetkilisi_gorusu'
  } else if (cleanKey.includes('sartname') || cleanKey.includes('teknik')) {
    heuristicKey = 'teknik_sartname'
  } else if (cleanKey.includes('talep')) {
    heuristicKey = 'ihtiyac_talep_formu'
  }

  const resolvedDef = templateRegistry[heuristicKey] || defaultDef
  return {
    config: resolvedDef,
    component: resolvedDef.component as unknown as TemplateComponentType,
    resolvedId: resolvedDef.id
  }
}
