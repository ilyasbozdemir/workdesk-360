import {
  toPossessiveSuffix as toPossessiveSuffixBase,
  toLocativeSuffix as toLocativeSuffixBase
} from '@temin360/document-templates'

export interface SubInstOption {
  value: string
  label: string
}

export interface InstitutionSuffixes {
  label: string
  kurumumuz: string // 1st person plural (bizim)
  kurumunuz: string // 2nd person plural (sizin)
  kurumu: string // 3rd person singular possessive (onun)
  kurumlari: string // 3rd person plural possessive (onların)
  bulunma: string // locative (-de/-da, e.g. "Müdürlüğümüzde", "Belediyemizde")
}

export const INSTITUTION_MAP: Record<string, InstitutionSuffixes> = {
  mudurluk: {
    label: 'İl / İlçe Müdürlüğü',
    kurumumuz: 'Müdürlüğümüz',
    kurumunuz: 'Müdürlüğünüz',
    kurumu: 'Müdürlüğü',
    kurumlari: 'Müdürlükleri',
    bulunma: 'Müdürlüğümüzde'
  },
  bakanlik: {
    label: 'Bakanlık',
    kurumumuz: 'Bakanlığımız',
    kurumunuz: 'Bakanlığınız',
    kurumu: 'Bakanlığı',
    kurumlari: 'Bakanlıkları',
    bulunma: 'Bakanlığımızda'
  },
  valilik: {
    label: 'Valilik',
    kurumumuz: 'Valiliğimiz',
    kurumunuz: 'Valiliğiniz',
    kurumu: 'Valiliği',
    kurumlari: 'Valilikleri',
    bulunma: 'Valiliğimizde'
  },
  kaymakamlik: {
    label: 'Kaymakamlık',
    kurumumuz: 'Kaymakamlığımız',
    kurumunuz: 'Kaymakamlığınız',
    kurumu: 'Kaymakamlığı',
    kurumlari: 'Kaymakamlıkları',
    bulunma: 'Kaymakamlığımızda'
  },
  universite: {
    label: 'Üniversite',
    kurumumuz: 'Üniversitemiz',
    kurumunuz: 'Üniversiteniz',
    kurumu: 'Üniversitesi',
    kurumlari: 'Üniversiteleri',
    bulunma: 'Üniversitemizde'
  },
  belediye: {
    label: 'Belediye',
    kurumumuz: 'Belediyemiz',
    kurumunuz: 'Belediyeniz',
    kurumu: 'Belediyesi',
    kurumlari: 'Belediyeleri',
    bulunma: 'Belediyemizde'
  },
  il_ozel: {
    label: 'İl Özel İdaresi',
    kurumumuz: 'İl Özel İdaremiz',
    kurumunuz: 'İl Özel İdareniz',
    kurumu: 'İl Özel İdaresi',
    kurumlari: 'İl Özel İdareleri',
    bulunma: 'İl Özel İdaremizde'
  },
  koy: {
    label: 'Köy Muhtarlığı',
    kurumumuz: 'Muhtarlığımız',
    kurumunuz: 'Muhtarlığınız',
    kurumu: 'Muhtarlığı',
    kurumlari: 'Muhtarlıkları',
    bulunma: 'Muhtarlığımızda'
  },
  sgk: {
    label: 'Sosyal Güvenlik İl Müdürlüğü',
    kurumumuz: 'Müdürlüğümüz',
    kurumunuz: 'Müdürlüğünüz',
    kurumu: 'Müdürlüğü',
    kurumlari: 'Müdürlükleri',
    bulunma: 'Müdürlüğümüzde'
  },
  kurul: {
    label: 'Kurul / Kurum',
    kurumumuz: 'Kurulumuz',
    kurumunuz: 'Kurulunuz',
    kurumu: 'Kurulu',
    kurumlari: 'Kurulları',
    bulunma: 'Kurulumuzda'
  },
  diger: {
    label: 'Diğer',
    kurumumuz: 'İdaremiz',
    kurumunuz: 'İdareniz',
    kurumu: 'İdaresi',
    kurumlari: 'İdareleri',
    bulunma: 'İdaremizde'
  }
}

export function getSubInstitutionOptions(instType: string, finKodu: string): SubInstOption[] {
  let keys: string[] = ['diger']
  if (instType === 'genel_butce' || finKodu === '1') {
    keys = ['mudurluk', 'bakanlik', 'valilik', 'kaymakamlik', 'diger']
  } else if (instType === 'ozel_butce' || finKodu === '2') {
    keys = ['universite', 'diger']
  } else if (instType === 'belediye' || finKodu === '5') {
    keys = ['belediye', 'il_ozel', 'koy', 'diger']
  } else if (instType === 'duzenleyici' || finKodu === '3') {
    keys = ['kurul', 'diger']
  } else if (instType === 'sosyal_guvenlik' || finKodu === '4') {
    keys = ['sgk', 'diger']
  }

  return keys.map((key) => {
    const item = INSTITUTION_MAP[key] || INSTITUTION_MAP.diger
    return {
      value: key,
      label: `${item.label} (Şablonlarda: "${item.kurumumuz}" / Bulunma: "${item.bulunma}")`
    }
  })
}

export function getInstitutionSuffixes(
  subInstType: string,
  customSuffixes?: Partial<InstitutionSuffixes>
): InstitutionSuffixes {
  const base = INSTITUTION_MAP[subInstType] || INSTITUTION_MAP.diger
  if (subInstType === 'diger' && customSuffixes) {
    return {
      label: customSuffixes.label || base.label,
      kurumumuz: customSuffixes.kurumumuz || base.kurumumuz,
      kurumunuz: customSuffixes.kurumunuz || base.kurumunuz,
      kurumu: customSuffixes.kurumu || base.kurumu,
      kurumlari: customSuffixes.kurumlari || base.kurumlari,
      bulunma: customSuffixes.bulunma || base.bulunma
    }
  }
  return base
}

export function getKurumumuzText(
  _instType: string,
  _finKodu: string,
  subInstType: string,
  customKurumumuz?: string
): string {
  if (subInstType === 'diger' && customKurumumuz) {
    return customKurumumuz
  }
  const item = INSTITUTION_MAP[subInstType] || INSTITUTION_MAP.diger
  return item.kurumumuz
}

export function toPossessiveSuffix(str: string): string {
  return toPossessiveSuffixBase(str, 'İdaremizin')
}

export function toLocativeSuffix(str: string): string {
  return toLocativeSuffixBase(str, 'İdaremizde')
}

export function getKurumIhtiyacYeriDefault(
  kurum?: {
    alt_kurum_bizim?: string
    alt_kurum_bulunma?: string
    alt_kurum_tipi?: string
    kurum_tipi?: string
  } | null
): string {
  if (!kurum) return 'İdaremizde'
  if (kurum.alt_kurum_bulunma && String(kurum.alt_kurum_bulunma).trim()) {
    return kurum.alt_kurum_bulunma.trim()
  }
  if (kurum.alt_kurum_bizim && String(kurum.alt_kurum_bizim).trim()) {
    return toLocativeSuffix(kurum.alt_kurum_bizim.trim())
  }
  if (kurum.alt_kurum_tipi) {
    const item = INSTITUTION_MAP[kurum.alt_kurum_tipi]
    if (item?.bulunma) return item.bulunma
  }
  if (kurum.kurum_tipi === 'belediye') return 'Belediyemizde'
  if (kurum.kurum_tipi === 'ozel_butce') return 'Üniversitemizde'
  if (kurum.kurum_tipi === 'duzenleyici') return 'Kurulumuzda'
  if (kurum.kurum_tipi === 'genel_butce') return 'Müdürlüğümüzde'
  return 'İdaremizde'
}
