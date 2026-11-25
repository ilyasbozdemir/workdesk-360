/**
 * Süreç Aşamaları Geçiş ve Kilit Kuralları Sözlüğü (Stage Transition & Guard Rules)
 * 
 * Clean Architecture prensipleri gereğince 4734 Sayılı Kamu İhale Kanunu ve
 * 11.07.2023 tarihli Doğrudan Temin Tebliği (Mevzuat No: 40666) esaslarına uygun
 * aşama geçiş doğrulama mantığını UI'dan bağımsız saf domain katmanında tanımlar.
 */

export interface StageRule {
  id: string
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
    firma_id?: number
    teklif_toplami?: number
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
  1: [
    {
      id: 'step1_has_items',
      targetStageId: 2,
      requiredStageId: 1,
      title: 'En Az 1 İhtiyaç Kalemi Eklenmeli',
      description: 'Piyasa fiyat araştırmasına başlamadan önce dosyanın malzeme, hizmet veya yapım kalemleri tanımlanmış olmalıdır.',
      isMandatory: true,
      check: (ctx) => Array.isArray(ctx.kalemler) && ctx.kalemler.length > 0
    },
    {
      id: 'step1_has_official_doc',
      targetStageId: 2,
      requiredStageId: 1,
      title: 'İhtiyaç Listesi veya Onay Belgesi Hazırlanmalı',
      description: 'Satın alma sürecinin resmî dayanağı olan İhtiyaç Listesi, Onay Belgesi veya Lüzum Müzekkeresi kaydedilmelidir.',
      isMandatory: true,
      check: (ctx) => {
        const docs = (ctx.snapshots || []).map((s) => s.toLowerCase().replace(/[-_]/g, ''))
        return (
          docs.includes('ihtiyaclistesi') ||
          docs.includes('dogrudanteminonaybelgesi') ||
          docs.includes('luzummuzekkeresi') ||
          docs.includes('ihtiyactalepformu')
        )
      }
    },
    {
      id: 'step1_has_unit_assigned',
      targetStageId: 2,
      requiredStageId: 1,
      title: 'Harcama Birimi Seçilmiş Olmalı',
      description: 'Dosyanın resmî evraklarında antet ve harcama yetkilisinin doğru görünmesi için harcama birimi seçilmelidir.',
      isMandatory: false,
      check: (ctx) => Boolean(ctx.dosya?.birim_id)
    }
  ],

  // 2. AŞAMA (Araştırma) Tamamlanma Şartları -> 3. Aşamaya (Yüklenici İşlemleri) Geçiş İçin
  2: [
    {
      id: 'step2_has_firms',
      targetStageId: 3,
      requiredStageId: 2,
      title: 'En Az 1 İstekli Firma Eklenmeli',
      description: 'Fiyat araştırması için dosyaya teklif verecek tedarikçi firmalar davet edilmiş olmalıdır.',
      isMandatory: true,
      check: (ctx) => Array.isArray(ctx.firmalar) && ctx.firmalar.length > 0
    },
    {
      id: 'step2_has_bids',
      targetStageId: 3,
      requiredStageId: 2,
      title: 'Teklif Fiyatları Girilmiş Olmalı',
      description: 'İstekli firmalardan toplanan birim fiyat teklifleri teklif matrisine işlenmiş olmalıdır.',
      isMandatory: true,
      check: (ctx) => {
        const bidKeys = Object.keys(ctx.teklifler || {})
        return bidKeys.length > 0 && bidKeys.some((k) => Number(ctx.teklifler[k]) > 0)
      }
    },
    {
      id: 'step2_has_winner',
      targetStageId: 3,
      requiredStageId: 2,
      title: 'Kazanan / En Uygun İstekli Belirlenmeli',
      description: 'Sözleşme veya sipariş düzenlenebilmesi için teklifler değerlendirilip en uygun istekli firma seçilmiş olmalıdır.',
      isMandatory: true,
      check: (ctx) => {
        const winnerId = ctx.kazananFirmaId || ctx.dosya?.kazanan_firma_id || ctx.dosya?.firma_id
        return Boolean(winnerId && Number(winnerId) > 0)
      }
    },
    {
      id: 'step2_has_tutanak',
      targetStageId: 3,
      requiredStageId: 2,
      title: 'Piyasa Fiyat Araştırma Tutanağı Kaydedilmeli',
      description: 'Mevzuat gereği piyasa araştırma görevlilerinin tutanağı ve yaklaşık maliyet cetveli oluşturulmalıdır.',
      isMandatory: false,
      check: (ctx) => {
        const docs = (ctx.snapshots || []).map((s) => s.toLowerCase().replace(/[-_]/g, ''))
        return (
          docs.includes('piyasafiyatarastirmatutanagi') ||
          docs.includes('yaklasikmaliyetcetveli') ||
          docs.includes('yaklasikmaliyethesapcetveli')
        )
      }
    }
  ],

  // 3. AŞAMA (Yüklenici İşlemleri) Tamamlanma Şartları -> 4. Aşamaya (Muayene Kabul & Ödeme) Geçiş İçin
  3: [
    {
      id: 'step3_has_contract_or_order',
      targetStageId: 4,
      requiredStageId: 3,
      title: 'Sipariş Mektubu veya Sözleşme Düzenlenmeli',
      description: 'Yükleniciye tebligat / sipariş mektubu veya doğrudan temin sözleşmesi hazırlanmış olmalıdır.',
      isMandatory: true,
      check: (ctx) => {
        const docs = (ctx.snapshots || []).map((s) => s.toLowerCase().replace(/[-_]/g, ''))
        return (
          docs.includes('dogrudanteminsozlesmesi') ||
          docs.includes('siparisvekararmektubu') ||
          docs.includes('siparismektubu') ||
          docs.includes('kabuledilenteklif') ||
          docs.includes('harcamatalimati')
        )
      }
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
