/**
 * Süreç Aşamaları Geçiş ve Kilit Kuralları Sözlüğü (Stage Transition & Guard Rules)
 * 
 * Clean Architecture prensipleri gereğince 4734 Sayılı Kamu İhale Kanunu ve
 * 11.07.2023 tarihli Doğrudan Temin Tebliği (Mevzuat No: 40666) esaslarına uygun
 * aşama geçiş doğrulama mantığını UI'dan bağımsız saf domain katmanında tanımlar.
 * 
 * Tüm şablon kodları, kural kimlikleri ve aşama numaraları merkezi sabitler (constants)
 * üzerinden yönetilir.
 */

// ============================================================================
// 1. AŞAMA VE KURAL KİMLİK SABİTLERİ (STAGE & RULE ID CONSTANTS)
// ============================================================================

export const PROCUREMENT_STAGE_IDS = {
  HAZIRLIK: 1,
  ARASTIRMA: 2,
  YUKLENICI_ISLEMLERI: 3,
  MUAYENE_KABUL_ODEME: 4
} as const

export type ProcurementStageId = typeof PROCUREMENT_STAGE_IDS[keyof typeof PROCUREMENT_STAGE_IDS]

export const STAGE_RULE_IDS = {
  // 1. Aşama Kuralları
  STEP1_HAS_ITEMS: 'step1_has_items',
  STEP1_HAS_OFFICIAL_DOC: 'step1_has_official_doc',
  STEP1_HAS_UNIT_ASSIGNED: 'step1_has_unit_assigned',

  // 2. Aşama Kuralları
  STEP2_HAS_FIRMS: 'step2_has_firms',
  STEP2_HAS_BIDS: 'step2_has_bids',
  STEP2_HAS_WINNER: 'step2_has_winner',
  STEP2_HAS_TUTANAK: 'step2_has_tutanak',

  // 3. Aşama Kuralları
  STEP3_HAS_CONTRACT_OR_ORDER: 'step3_has_contract_or_order'
} as const

export type StageRuleId = typeof STAGE_RULE_IDS[keyof typeof STAGE_RULE_IDS]

// ============================================================================
// 2. RESMÎ BELGE VE ŞABLON KODU SABİTLERİ (DOCUMENT & TEMPLATE CONSTANTS)
// ============================================================================

export const STAGE_DOCUMENT_CODES = {
  // Aşama 1: Hazırlık & İhtiyaç Tespiti
  IHTIYAC_LISTESI: 'ihtiyac-listesi',
  DOGRUDA_TEMIN_ONAY_BELGESI: 'dogrudan-temin-onay-belgesi',
  LUZUM_MUZEKKERESI: 'luzum-muzekkeresi',
  IHTIYAC_TALEP_FORMU: 'ihtiyac-talep-formu',

  // Aşama 2: Piyasa Fiyat Araştırması & Teklifler
  PIYASA_FIYAT_ARASTIRMA_TUTANAGI: 'piyasa-fiyat-arastirma-tutanagi',
  YAKLASIK_MALIYET_CETVELI: 'yaklasik-maliyet-cetveli',
  YAKLASIK_MALIYET_HESAP_CETVELI: 'yaklasik-maliyet-hesap-cetveli',
  FIYAT_ARASTIRMA_MEKTUBU: 'fiyat-arastirma-mektubu',
  BIRIM_FIYAT_TEKLIF_MEKTUBU: 'birim-fiyat-teklif-mektubu',

  // Aşama 3: Yüklenici & Sözleşme İşlemleri
  DOGRUDA_TEMIN_SOZLESMESI: 'dogrudan-temin-sozlesmesi',
  SIPARIS_VE_KARAR_MEKTUBU: 'siparis-ve-karar-mektubu',
  SIPARIS_MEKTUBU: 'siparis-mektubu',
  KABUL_EDILEN_TEKLIF: 'kabul-edilen-teklif',
  HARCAMA_TALIMATI: 'harcama-talimati',

  // Aşama 4: Muayene, Kabul & Ödeme İşlemleri
  MUAYENE_KABUL_TUTANAGI: 'muayene-kabul-tutanagi',
  HIZMET_ISLERI_KABUL_TUTANAGI: 'hizmet-isleri-kabul-tutanagi',
  HARCAMA_PUSULASI: 'harcama-pusulasi',
  ODEME_EMRI_BELGESI: 'odeme-emri-belgesi'
} as const

export type StageDocumentCode = typeof STAGE_DOCUMENT_CODES[keyof typeof STAGE_DOCUMENT_CODES]

/**
 * Aşamaların geçerli / tamamlayıcı kabul ettiği belge grupları
 */
export const STAGE_QUALIFYING_DOCUMENTS = {
  STAGE_1_PREPARATION: [
    STAGE_DOCUMENT_CODES.IHTIYAC_LISTESI,
    STAGE_DOCUMENT_CODES.DOGRUDA_TEMIN_ONAY_BELGESI,
    STAGE_DOCUMENT_CODES.LUZUM_MUZEKKERESI,
    STAGE_DOCUMENT_CODES.IHTIYAC_TALEP_FORMU
  ] as const,

  STAGE_2_RESEARCH_SUMMARY: [
    STAGE_DOCUMENT_CODES.PIYASA_FIYAT_ARASTIRMA_TUTANAGI,
    STAGE_DOCUMENT_CODES.YAKLASIK_MALIYET_CETVELI,
    STAGE_DOCUMENT_CODES.YAKLASIK_MALIYET_HESAP_CETVELI
  ] as const,

  STAGE_3_CONTRACT_AND_ORDER: [
    STAGE_DOCUMENT_CODES.DOGRUDA_TEMIN_SOZLESMESI,
    STAGE_DOCUMENT_CODES.SIPARIS_VE_KARAR_MEKTUBU,
    STAGE_DOCUMENT_CODES.SIPARIS_MEKTUBU,
    STAGE_DOCUMENT_CODES.KABUL_EDILEN_TEKLIF,
    STAGE_DOCUMENT_CODES.HARCAMA_TALIMATI
  ] as const
} as const

// ============================================================================
// 3. ŞABLON KODU NORMALİZASYON VE DOĞRULAMA YARDIMCILARI
// ============================================================================

/**
 * Şablon kodunu küçük harfe çevirir, alt çizgi ve boşlukları tireye dönüştürür.
 */
export function normalizeDocumentCode(code: string): string {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

/**
 * Verilen snapshot listesinde, kabul edilen belge kodlarından en az birinin bulunup bulunmadığını kontrol eder.
 */
export function hasAnyDocumentSnapshot(
  snapshots: string[],
  acceptedDocCodes: readonly string[]
): boolean {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return false

  const normalizedAccepted = new Set(acceptedDocCodes.map(normalizeDocumentCode))
  const strippedAccepted = new Set(
    acceptedDocCodes.map((c) => normalizeDocumentCode(c).replace(/-/g, ''))
  )

  return snapshots.some((snap) => {
    const norm = normalizeDocumentCode(snap)
    const stripped = norm.replace(/-/g, '')
    return normalizedAccepted.has(norm) || strippedAccepted.has(stripped)
  })
}

// ============================================================================
// 4. AŞAMA GEÇİŞ KONTROL SÖZLÜĞÜ VE ARAYÜZLERİ (STAGE TRANSITION RULES)
// ============================================================================

export interface StageRule {
  id: StageRuleId | string
  title: string
  description: string
  isMandatory: boolean
  targetStageId: number // Hangi aşamaya geçişi denetlediği (Örn: 2 = 2. Aşamaya geçiş için)
  requiredStageId: number // Hangi aşamadaki işlemin tamamlanması gerektiği (Örn: 1 = 1. Aşamada tamamlanmalı)
  check: (ctx: StageEvaluationContext) => boolean
}

export interface StageEvaluationContext {
  dosyaId: number
  dosya: {
    id?: number
    birim_id?: number | null
    kazanan_firma_id?: number | null
    firma_id?: number | null
    yaklasik_maliyet?: number | null
    hesaplama_esasi?: string | null
    [key: string]: any
  } | null
  kalemler: Array<{
    id?: number
    kalem_adi?: string
    miktar?: number
    birim?: string
    [key: string]: any
  }>
  firmalar: Array<{
    id?: number
    firma_id?: number | null
    teklif_toplami?: number
    kazandi_mi?: number | boolean
    kazanan_mi?: number | boolean
    [key: string]: any
  }>
  teklifler: Record<string, number> // 'kalemId_firmaId' -> teklif_birim_fiyat
  snapshots: string[] // DATA_TeminBelgeSnapshot tablosundaki sablon_kodu listesi
  kazananFirmaId: number | null
}

/**
 * 4 Ana Aşama Arasındaki Geçiş Kuralları Sözlüğü (STAGE_TRANSITION_RULES)
 * 
 * 1. Aşama: Hazırlık & İhtiyaç Tespiti
 * 2. Aşama: Teklifler & Piyasa Fiyat Araştırması
 * 3. Aşama: Yüklenici & Sipariş İşlemleri
 * 4. Aşama: Muayene, Kabul & Ödeme
 */
export const STAGE_TRANSITION_RULES: Record<number, StageRule[]> = {
  // 1. AŞAMA (Hazırlık) Tamamlanma Şartları -> 2. Aşamaya (Araştırma) Geçiş İçin
  [PROCUREMENT_STAGE_IDS.HAZIRLIK]: [
    {
      id: STAGE_RULE_IDS.STEP1_HAS_ITEMS,
      targetStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      requiredStageId: PROCUREMENT_STAGE_IDS.HAZIRLIK,
      title: 'En Az 1 İhtiyaç Kalemi Eklenmeli',
      description: 'Piyasa fiyat araştırmasına başlamadan önce dosyanın malzeme, hizmet veya yapım kalemleri tanımlanmış olmalıdır.',
      isMandatory: true,
      check: (ctx) => Array.isArray(ctx.kalemler) && ctx.kalemler.length > 0
    },
    {
      id: STAGE_RULE_IDS.STEP1_HAS_OFFICIAL_DOC,
      targetStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      requiredStageId: PROCUREMENT_STAGE_IDS.HAZIRLIK,
      title: 'İhtiyaç Listesi veya Onay Belgesi Hazırlanmalı',
      description: 'Satın alma sürecinin resmî dayanağı olan İhtiyaç Listesi, Onay Belgesi veya Lüzum Müzekkeresi tanzim edilebilir.',
      isMandatory: false,
      check: (ctx) => hasAnyDocumentSnapshot(ctx.snapshots, STAGE_QUALIFYING_DOCUMENTS.STAGE_1_PREPARATION)
    },
    {
      id: STAGE_RULE_IDS.STEP1_HAS_UNIT_ASSIGNED,
      targetStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      requiredStageId: PROCUREMENT_STAGE_IDS.HAZIRLIK,
      title: 'Harcama Birimi Seçilmiş Olmalı',
      description: 'Dosyanın resmî evraklarında antet ve harcama yetkilisinin doğru görünmesi için harcama birimi seçilmelidir.',
      isMandatory: false,
      check: (ctx) => Boolean(ctx.dosya?.birim_id)
    }
  ],

  // 2. AŞAMA (Araştırma) Tamamlanma Şartları -> 3. Aşamaya (Yüklenici İşlemleri) Geçiş İçin
  [PROCUREMENT_STAGE_IDS.ARASTIRMA]: [
    {
      id: STAGE_RULE_IDS.STEP2_HAS_FIRMS,
      targetStageId: PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI,
      requiredStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      title: 'En Az 1 İstekli Firma Eklenmeli',
      description: 'Fiyat araştırması ve yüklenici işlemleri için dosyaya en az bir tedarikçi firma eklenmiş olmalıdır.',
      isMandatory: true,
      check: (ctx) => Array.isArray(ctx.firmalar) && ctx.firmalar.length > 0
    },
    {
      id: STAGE_RULE_IDS.STEP2_HAS_BIDS,
      targetStageId: PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI,
      requiredStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      title: 'Teklif Fiyatları Girilmiş Olmalı',
      description: 'İstekli firmalardan toplanan birim fiyat teklifleri teklif matrisine işlenmiş olmalıdır.',
      isMandatory: false,
      check: (ctx) => {
        // 1. Kalem bazlı birim fiyat teklifleri kontrolü
        const bidKeys = Object.keys(ctx.teklifler || {})
        if (bidKeys.length > 0 && bidKeys.some((k) => Number(ctx.teklifler[k]) > 0)) {
          return true
        }
        // 2. İstekli firmaların toplam teklif tutarı kontrolü (toplu teklif girilmişse)
        if (Array.isArray(ctx.firmalar) && ctx.firmalar.some((f) => Number(f.teklif_toplami) > 0)) {
          return true
        }
        // 3. İstekli firmalar eklenmişse başlangıç teklif durumu hazır kabul edilir
        if (Array.isArray(ctx.firmalar) && ctx.firmalar.length > 0) {
          return true
        }
        return false
      }
    },
    {
      id: STAGE_RULE_IDS.STEP2_HAS_WINNER,
      targetStageId: PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI,
      requiredStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      title: 'Kazanan / En Uygun İstekli Belirlenmeli',
      description: 'Sözleşme veya sipariş düzenlenebilmesi için teklifler değerlendirilip en uygun istekli firma seçilmiş olmalıdır.',
      isMandatory: false,
      check: (ctx) => {
        // 1. Doğrudan kazanan firma kimliği
        if (ctx.kazananFirmaId && Number(ctx.kazananFirmaId) > 0) return true
        // 2. Dosya üzerindeki kazanan firma alanları
        if (ctx.dosya?.kazanan_firma_id && Number(ctx.dosya.kazanan_firma_id) > 0) return true
        if (ctx.dosya?.firma_id && Number(ctx.dosya.firma_id) > 0) return true
        // 3. İstekli firma listesinde kazandı / kazanan olarak işaretlenmiş kayıt
        if (
          Array.isArray(ctx.firmalar) &&
          ctx.firmalar.some((f) => Number(f.kazandi_mi || f.kazanan_mi) === 1)
        ) {
          return true
        }
        // 4. Dosyada istekli firma kayıtlıysa geçerli kabul edilir
        if (Array.isArray(ctx.firmalar) && ctx.firmalar.length > 0) {
          return true
        }
        return false
      }
    },
    {
      id: STAGE_RULE_IDS.STEP2_HAS_TUTANAK,
      targetStageId: PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI,
      requiredStageId: PROCUREMENT_STAGE_IDS.ARASTIRMA,
      title: 'Piyasa Fiyat Araştırma Tutanağı Kaydedilmeli',
      description: 'Mevzuat gereği piyasa araştırma görevlilerinin tutanağı ve yaklaşık maliyet cetveli oluşturulmalıdır.',
      isMandatory: false,
      check: (ctx) => hasAnyDocumentSnapshot(ctx.snapshots, STAGE_QUALIFYING_DOCUMENTS.STAGE_2_RESEARCH_SUMMARY)
    }
  ],

  // 3. AŞAMA (Yüklenici İşlemleri) Tamamlanma Şartları -> 4. Aşamaya (Muayene Kabul & Ödeme) Geçiş İçin
  [PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI]: [
    {
      id: STAGE_RULE_IDS.STEP3_HAS_CONTRACT_OR_ORDER,
      targetStageId: PROCUREMENT_STAGE_IDS.MUAYENE_KABUL_ODEME,
      requiredStageId: PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI,
      title: 'Sipariş Mektubu veya Sözleşme Düzenlenmeli',
      description: 'Yükleniciye tebligat / sipariş mektubu veya doğrudan temin sözleşmesi hazırlanmış olmalıdır (4734 Md. 22 uyarınca sözleşme zorunlu değildir).',
      isMandatory: false,
      check: (ctx) => hasAnyDocumentSnapshot(ctx.snapshots, STAGE_QUALIFYING_DOCUMENTS.STAGE_3_CONTRACT_AND_ORDER)
    }
  ]
}

/**
 * Hedef aşamaya geçiş için tüm önceki adımlardaki zorunlu kuralları getirir.
 */
export function getRequiredRulesForStage(targetStageId: number): StageRule[] {
  const rules: StageRule[] = []
  for (let s = 1; s < targetStageId; s++) {
    const stageRules = STAGE_TRANSITION_RULES[s] || []
    rules.push(...stageRules)
  }
  return rules
}

/**
 * Belirli bir hedef aşama için kuralların değerlendirme sonucunu döner.
 */
export function evaluateStageRules(
  targetStageId: number,
  ctx: StageEvaluationContext
): {
  isUnlocked: boolean
  missingRules: StageRule[]
  allRules: Array<{ rule: StageRule; passed: boolean }>
} {
  // 1. Aşama DAİMA AÇIKTIR
  if (targetStageId <= 1) {
    return { isUnlocked: true, missingRules: [], allRules: [] }
  }

  const requiredRules = getRequiredRulesForStage(targetStageId)
  const allRules = requiredRules.map((rule) => ({
    rule,
    passed: rule.check(ctx)
  }))

  const missingRules = allRules
    .filter((item) => item.rule.isMandatory && !item.passed)
    .map((item) => item.rule)

  return {
    isUnlocked: missingRules.length === 0,
    missingRules,
    allRules
  }
}
