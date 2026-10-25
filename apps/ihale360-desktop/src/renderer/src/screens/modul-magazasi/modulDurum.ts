import type { SurumAsamasi } from './modulMagazasi.types'

/**
 * Sürüm olgunluğu (Alfa / Beta / Kararlı) için tek kaynak.
 *
 * ÖNEMLİ: "Kurulu" olmak ile "kullanıma hazır" olmak aynı şey değildir.
 *  - Kurulum durumu (`useModuleStore.installedIds`) yalnızca paketin kullanıcının
 *    çalışma alanına eklenip eklenmediğini söyler.
 *  - Resmî işlemde güvenle kullanılıp kullanılamayacağını `surumAsamasi` belirler.
 * Bu yüzden Alfa/Beta bir paket kurulu olsa bile "kullanıma hazır" diye gösterilmez.
 */
export interface SurumAsamasiMeta {
  /** Rozet metni */
  etiket: string
  /** Rozet tooltip'i ve detay ekranındaki uyarı metni */
  aciklama: string
  /** Resmî evrak/işlemde doğrudan kullanılabilir mi? */
  resmiKullanimaUygun: boolean
  /** Rozet sınıfları */
  rozetClass: string
}

export const SURUM_ASAMASI_META: Record<SurumAsamasi, SurumAsamasiMeta> = {
  Alfa: {
    etiket: 'Alfa',
    aciklama:
      'Erken geliştirme sürümü. Özellikler eksik veya hatalı olabilir; yalnızca deneme amaçlı kullanın, resmî evrakta kullanmayın.',
    resmiKullanimaUygun: false,
    rozetClass:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40'
  },
  Beta: {
    etiket: 'Beta',
    aciklama:
      'Deneme sürümü. Temel akış çalışır ancak üretilen belgeleri resmî işlemde kullanmadan önce mutlaka kontrol edin.',
    resmiKullanimaUygun: false,
    rozetClass:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40'
  },
  Kararlı: {
    etiket: 'Kararlı',
    aciklama: 'Kararlı sürüm. Resmî işlemlerde kullanıma uygundur.',
    resmiKullanimaUygun: true,
    rozetClass:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
  }
}

/** `surumAsamasi` tanımsızsa paket Alfa kabul edilir (güvenli varsayılan). */
export function getSurumAsamasiMeta(asama?: SurumAsamasi): SurumAsamasiMeta {
  return SURUM_ASAMASI_META[asama ?? 'Alfa']
}
