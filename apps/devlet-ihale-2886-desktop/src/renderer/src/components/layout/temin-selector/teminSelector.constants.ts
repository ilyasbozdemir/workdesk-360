import { Dosya2886Item } from './teminSelector.types'

export const DEFAULT_2886_DOSYALAR: Dosya2886Item[] = []

import { teminKisaLabel, teminMeta } from '../../../constants/teminTurleri'

export const TUR_LABEL: Record<string, string> = new Proxy(
  {},
  {
    get: (_, prop: string) => teminKisaLabel(prop)
  }
)

export const TUR_COLOR: Record<string, string> = new Proxy(
  {},
  {
    get: (_, prop: string) =>
      teminMeta(prop)?.badgeColor ?? 'bg-slate-100 text-slate-600 border-slate-200'
  }
)
