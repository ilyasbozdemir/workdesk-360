import { KosulKurali, KosulGrubu, KosulTanimi, RenderContext } from './types'

/**
 * eval ve new Function KULLANMAYAN güvenli tekil kural değerlendiricisi
 */
export function evaluateSingleRule(rule: KosulKurali, context: RenderContext): boolean {
  const rawValue = context[rule.kaynak]
  const targetValue = rule.deger

  switch (rule.op) {
    case 'eq': {
      if (rawValue === targetValue) return true
      if (rawValue === undefined || rawValue === null)
        return targetValue === '' || targetValue === null || targetValue === undefined
      return String(rawValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase()
    }

    case 'ne': {
      if (rawValue === targetValue) return false
      if (rawValue === undefined || rawValue === null)
        return !(targetValue === '' || targetValue === null || targetValue === undefined)
      return String(rawValue).trim().toLowerCase() !== String(targetValue).trim().toLowerCase()
    }

    case 'gt': {
      const numRaw = Number(rawValue)
      const numTarget = Number(targetValue)
      if (isNaN(numRaw) || isNaN(numTarget)) return false
      return numRaw > numTarget
    }

    case 'gte': {
      const numRaw = Number(rawValue)
      const numTarget = Number(targetValue)
      if (isNaN(numRaw) || isNaN(numTarget)) return false
      return numRaw >= numTarget
    }

    case 'lt': {
      const numRaw = Number(rawValue)
      const numTarget = Number(targetValue)
      if (isNaN(numRaw) || isNaN(numTarget)) return false
      return numRaw < numTarget
    }

    case 'lte': {
      const numRaw = Number(rawValue)
      const numTarget = Number(targetValue)
      if (isNaN(numRaw) || isNaN(numTarget)) return false
      return numRaw <= numTarget
    }

    case 'dolu': {
      if (rawValue === undefined || rawValue === null) return false
      if (Array.isArray(rawValue)) return rawValue.length > 0
      return String(rawValue).trim() !== ''
    }

    case 'bos': {
      if (rawValue === undefined || rawValue === null) return true
      if (Array.isArray(rawValue)) return rawValue.length === 0
      return String(rawValue).trim() === ''
    }

    case 'icerir': {
      if (rawValue === undefined || rawValue === null) return false
      if (Array.isArray(rawValue)) {
        return rawValue.some(
          (item) => String(item).toLowerCase() === String(targetValue).toLowerCase()
        )
      }
      return String(rawValue)
        .toLowerCase()
        .includes(String(targetValue || '').toLowerCase())
    }

    default:
      return false
  }
}

/**
 * Koşul tanımını (tekil veya VE/VEYA grubu) boolean'a çevirir
 */
export function evaluateCondition(condition: KosulTanimi, context: RenderContext): boolean {
  // Koşul grubu ise (VE / VEYA)
  if ('baglac' in condition && Array.isArray(condition.kurallar)) {
    if (condition.kurallar.length === 0) return true

    if (condition.baglac === 'VE') {
      return condition.kurallar.every((k) => evaluateSingleRule(k, context))
    } else if (condition.baglac === 'VEYA') {
      return condition.kurallar.some((k) => evaluateSingleRule(k, context))
    }
  }

  // Tekil kural
  return evaluateSingleRule(condition as KosulKurali, context)
}

/**
 * Verilen tüm koşul tanımlarını değerlendirip Mustache bağlamına aktarılacak
 * isimli boolean bayraklar haritasını üretir.
 */
export function evaluateAllConditions(
  conditions: KosulTanimi[],
  context: RenderContext
): Record<string, boolean> {
  const flags: Record<string, boolean> = {}

  for (const cond of conditions) {
    if (!cond.ad || cond.ad.trim() === '') continue
    flags[cond.ad.trim()] = evaluateCondition(cond, context)
  }

  return flags
}
