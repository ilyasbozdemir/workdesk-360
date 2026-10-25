import { YerTutucuTanimi } from './types'

/**
 * Yer tutucuları üç kapsamdan çözümler.
 * Öncelik sırası: Belge > Grup > Genel
 *
 * @param genelList Genel düzeydeki yer tutucular
 * @param grupList Belgenin bağlı olduğu gruba ait yer tutucular
 * @param belgeList Belgeye özel tanımlanmış yer tutucular
 * @returns Çözümlenmiş ve sıralanmış nihai yer tutucu listesi
 */
export function resolvePlaceholders(
  genelList: YerTutucuTanimi[] = [],
  grupList: YerTutucuTanimi[] = [],
  belgeList: YerTutucuTanimi[] = []
): YerTutucuTanimi[] {
  const mergedMap = new Map<string, YerTutucuTanimi>()

  // 1. Genel kapsamı ekle (en düşük öncelik)
  for (const item of genelList) {
    if (!item.anahtar) continue
    mergedMap.set(item.anahtar, { ...item, kapsam: 'genel' })
  }

  // 2. Grup kapsamını ekle (geneli ezer)
  for (const item of grupList) {
    if (!item.anahtar) continue
    mergedMap.set(item.anahtar, { ...item, kapsam: 'grup' })
  }

  // 3. Belge kapsamını ekle (en yüksek öncelik, grubu ve geneli ezer)
  for (const item of belgeList) {
    if (!item.anahtar) continue
    mergedMap.set(item.anahtar, { ...item, kapsam: 'belge' })
  }

  const result = Array.from(mergedMap.values())

  // Sıralama: sira değeri varsa ona göre, yoksa anahtar adına göre
  result.sort((a, b) => {
    const orderA = a.sira !== undefined && a.sira !== null ? a.sira : 9999
    const orderB = b.sira !== undefined && b.sira !== null ? b.sira : 9999
    if (orderA !== orderB) return orderA - orderB
    return a.anahtar.localeCompare(b.anahtar)
  })

  return result
}

/**
 * Belgedeki ham HTML metninden kullanılan data-ph anahtarlarını ayıklar
 */
export function extractUsedPlaceholderKeys(html: string): string[] {
  if (!html || typeof html !== 'string') return []
  const matches = html.match(/data-ph=["']([^"']+)["']/gi) || []
  const keys = matches.map((m) => {
    const val = m.replace(/data-ph=["']/i, '').replace(/["']$/, '')
    return val.trim()
  })
  return Array.from(new Set(keys)).filter(Boolean)
}

/**
 * Belgedeki ham HTML metninden kullanılan data-cond bayrak anahtarlarını ayıklar
 */
export function extractUsedConditionFlags(html: string): string[] {
  if (!html || typeof html !== 'string') return []
  const matches = html.match(/data-cond=["']([^"']+)["']/gi) || []
  const flags = matches.map((m) => {
    const val = m.replace(/data-cond=["']/i, '').replace(/["']$/, '')
    return val.trim()
  })
  return Array.from(new Set(flags)).filter(Boolean)
}
