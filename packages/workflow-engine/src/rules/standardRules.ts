import { RuleDefinition, WorkflowContext } from '../types'

/**
 * 1. MEVZUAT KURALLARI (LEGAL)
 */
export const RULE_ONAY_BELGESI_REQUIRED: RuleDefinition = {
  id: 'RULE_ONAY_BELGESI_REQUIRED',
  version: 1,
  title: 'Onay Belgesi Bulunmalıdır',
  category: 'LEGAL',
  severity: 'BLOCKING',
  sourceReference: '4734 Sayılı KİK Madde 22 & İhale Uygulama Yönetmeliği',
  evaluate: (ctx: WorkflowContext) => {
    const passed = Boolean(ctx.hasOnayBelgesi)
    return {
      ruleId: 'RULE_ONAY_BELGESI_REQUIRED',
      ruleTitle: 'Onay Belgesi Bulunmalıdır',
      passed,
      severity: 'BLOCKING',
      category: 'LEGAL',
      message: passed
        ? 'Onay belgesi düzenlenmiş ve kaydı mevcut.'
        : 'Harcama yetkilisinden onay belgesi alınmadan sonraki aşamalara geçilemez.',
      explanation: '4734 sayılı Kamu İhale Kanunu uyarınca doğrudan temin işlemlerine başlanmadan önce Onay Belgesi düzenlenmesi zorunludur.',
      suggestedAction: passed ? undefined : 'Dosya detayından "Onay Belgesi" matbu evrağını oluşturup onaylayınız.',
      sourceReference: '4734 Sayılı KİK Md. 22'
    }
  }
}

export const RULE_MUAYENE_KABUL_REQUIRED: RuleDefinition = {
  id: 'RULE_MUAYENE_KABUL_REQUIRED',
  version: 1,
  title: 'Muayene ve Kabul Tutanağı Tamamlanmalıdır',
  category: 'LEGAL',
  severity: 'BLOCKING',
  sourceReference: '5018 Sayılı Kanun Md. 33 & Muayene Kabul Yönetmeliği',
  evaluate: (ctx: WorkflowContext) => {
    const passed = Boolean(ctx.hasMuayeneKabul)
    return {
      ruleId: 'RULE_MUAYENE_KABUL_REQUIRED',
      ruleTitle: 'Muayene ve Kabul Tutanağı Tamamlanmalıdır',
      passed,
      severity: 'BLOCKING',
      category: 'LEGAL',
      message: passed
        ? 'Muayene kabul komisyon kararı veya kabul tutanağı kayıtlı.'
        : 'Teslim alınan mal veya hizmetin muayene ve kabul işlemi yapılmadan ödeme aşamasına sevk edilemez.',
      explanation: '5018 sayılı Kanunun 33. maddesi gereğince bütçeden ödeme yapılabilmesi için işin mevzuata ve sözleşmeye uygun gerçekleştirildiğinin kabul belgesiyle tevsiki şarttır.',
      suggestedAction: passed ? undefined : 'Kabul & Muayene modülünden teslimat tutanağını onaylayınız.',
      sourceReference: '5018 Sayılı Kanun Md. 33'
    }
  }
}

export const RULE_WINNER_FIRM_ASSIGNED: RuleDefinition = {
  id: 'RULE_WINNER_FIRM_ASSIGNED',
  version: 1,
  title: 'Ekonomik Açıdan En Avantajlı Teklif (Kazanan Firma) Belirlenmelidir',
  category: 'LEGAL',
  severity: 'BLOCKING',
  sourceReference: '4734 Sayılı KİK Madde 22',
  evaluate: (ctx: WorkflowContext) => {
    const passed = Boolean(ctx.kazananFirmaId && ctx.kazananFirmaId > 0)
    return {
      ruleId: 'RULE_WINNER_FIRM_ASSIGNED',
      ruleTitle: 'Kazanan Firma Belirlenmelidir',
      passed,
      severity: 'BLOCKING',
      category: 'LEGAL',
      message: passed
        ? `Kazanan yüklenici belirlenmiş: ${ctx.kazananFirmaUnvan || '#' + ctx.kazananFirmaId}`
        : 'Piyasa fiyat araştırması sonucunda sipariş verilecek istekli belirlenmemiştir.',
      explanation: 'Sipariş veya sözleşme düzenlenebilmesi için teklifler değerlendirilip kazanan firmanın seçilmiş olması gerekir.',
      suggestedAction: passed ? undefined : 'Teklif listesinden en uygun teklifi veren firmayı onaylayınız.',
      sourceReference: '4734 Sayılı KİK Md. 22'
    }
  }
}

/**
 * 2. KURUM İŞ AKIŞI KURALLARI (ORGANIZATIONAL)
 */
export const RULE_MIN_QUOTES_RECOMMENDED: RuleDefinition = {
  id: 'RULE_MIN_QUOTES_RECOMMENDED',
  version: 1,
  title: 'Piyasa Fiyat Araştırması Teklif Sayısı Kontrolü',
  category: 'ORGANIZATIONAL',
  severity: 'WARNING',
  sourceReference: 'Kurum İç Kontrol ve Harcama Yönergesi',
  evaluate: (ctx: WorkflowContext) => {
    const count = ctx.teklifSayisi || 0
    const passed = count >= 3
    return {
      ruleId: 'RULE_MIN_QUOTES_RECOMMENDED',
      ruleTitle: 'Piyasa Fiyat Araştırması Teklif Sayısı',
      passed,
      severity: 'WARNING',
      category: 'ORGANIZATIONAL',
      message: passed
        ? `Piyasa araştırmasında ${count} adet teklif toplanmış (Yeterli).`
        : `Piyasa araştırmasında sadece ${count} teklif girilmiş. Rekabet ve kurum iç kontrol ilkeleri gereğince en az 3 teklif alınması önerilir.`,
      explanation: 'Kurum iç denetim standartları uyarınca piyasa fiyat araştırmasında en az 3 gerçek teklifin dosyalanması tavsiye edilmektedir.',
      suggestedAction: passed ? undefined : 'Piyasa araştırmasına ek teklif mektubu girmeniz tavsiye edilir.',
      sourceReference: 'Kurum İç Kontrol Standartları'
    }
  }
}

export const RULE_FATURA_INFORMATION_RECORDED: RuleDefinition = {
  id: 'RULE_FATURA_INFORMATION_RECORDED',
  version: 1,
  title: 'Fatura ve E-Fatura Bilgisi Kaydı',
  category: 'ORGANIZATIONAL',
  severity: 'WARNING',
  sourceReference: 'Muhasebe İşlem Standartları',
  evaluate: (ctx: WorkflowContext) => {
    const passed = Boolean(ctx.hasFatura || (ctx.faturaNo && ctx.faturaNo.trim().length > 0))
    return {
      ruleId: 'RULE_FATURA_INFORMATION_RECORDED',
      ruleTitle: 'Fatura Bilgisi',
      passed,
      severity: 'WARNING',
      category: 'ORGANIZATIONAL',
      message: passed
        ? `Fatura bilgisi kayıtlı (${ctx.faturaNo || 'Kayıt mevcut'}).`
        : 'Yüklenici faturası sisteme henüz girilmemiş.',
      explanation: 'Mali hizmetler ve muhasebe aşamasında MİF/ÖEB kesilmeden önce yüklenicinin e-fatura/arşiv faturasının işlenmesi gerekmektedir.',
      suggestedAction: passed ? undefined : 'Mali İnceleme ekranından fatura seri/sıra numarasını kaydediniz.',
      sourceReference: 'VUK & Kamu Muhasebe Yönetmeliği'
    }
  }
}

/**
 * 3. SİSTEM ÖNERİLERİ (ADVISORY)
 */
export const RULE_BUDGET_CODE_CHECK: RuleDefinition = {
  id: 'RULE_BUDGET_CODE_CHECK',
  version: 1,
  title: 'Analitik Bütçe Tertibi Uygunluğu',
  category: 'ADVISORY',
  severity: 'INFO',
  sourceReference: 'Analitik Bütçe Sınıflandırma Rehberi',
  evaluate: (ctx: WorkflowContext) => {
    const hasTertip = Boolean(ctx.butceTertibi && ctx.butceTertibi.length >= 7)
    return {
      ruleId: 'RULE_BUDGET_CODE_CHECK',
      ruleTitle: 'Bütçe Tertibi Doğrulaması',
      passed: hasTertip,
      severity: 'INFO',
      category: 'ADVISORY',
      message: hasTertip
        ? `Bütçe ekonomik kodu tanımlı: ${ctx.butceTertibi}`
        : 'Dosyada analitik bütçe ekonomik kodu henüz seçilmemiş (Varsayılan 03.2.1.01 kullanılır).',
      explanation: '5018 BKMYBS uyumu için alım konusuna uygun 4 düzeyli ekonomik kodun seçilmesi raporlamayı kolaylaştırır.',
      suggestedAction: hasTertip ? undefined : 'Mali Hizmetler bütçe ekranından uygun tertibi atayabilirsiniz.',
      sourceReference: 'Analitik Bütçe Rehberi'
    }
  }
}

export const ALL_STANDARD_RULES: RuleDefinition[] = [
  RULE_ONAY_BELGESI_REQUIRED,
  RULE_MUAYENE_KABUL_REQUIRED,
  RULE_WINNER_FIRM_ASSIGNED,
  RULE_MIN_QUOTES_RECOMMENDED,
  RULE_FATURA_INFORMATION_RECORDED,
  RULE_BUDGET_CODE_CHECK
]

