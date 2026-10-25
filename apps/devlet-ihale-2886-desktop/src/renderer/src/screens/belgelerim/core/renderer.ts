import Mustache from 'mustache'
import { sanitizeHtml } from './sanitizer'
import { compileToMustache } from './compiler'
import { evaluateAllConditions } from './evaluator'
import { KosulTanimi, RenderContext } from './types'

export interface RenderBelgeOptions {
  /** Çıktı HTML'i ek güvenlik temizliğinden geçirilsin mi? (Varsayılan: true) */
  sanitizeOutput?: boolean
}

/**
 * Kanonik HTML belgesini yer tutucu verileri ve koşullar ile derleyip Mustache ile render eder.
 *
 * @param rawHtml TipTap kanonik HTML metni (data-ph, data-cond, data-each)
 * @param context Değişken bağlamı (yer tutucu değerleri, listeler)
 * @param conditions Koşul kuralları ve grupları
 * @param options Ek render opsiyonları
 * @returns Güvenli, doldurulmuş nihai HTML metni
 */
export function renderBelge(
  rawHtml: string,
  context: RenderContext = {},
  conditions: KosulTanimi[] = [],
  options: RenderBelgeOptions = {}
): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  // 1. Giriş HTML'ini temizle (XSS koruması)
  const cleanInput = sanitizeHtml(rawHtml)

  // 2. Kanonik işaretleri Mustache formatına derle
  const compiledTemplate = compileToMustache(cleanInput)

  // 3. Koşulları isimli boolean bayraklara dönüştür
  const conditionFlags = evaluateAllConditions(conditions, context)

  // 4. Bağlamları birleştir (Yer tutucular + Hesaplanan koşul bayrakları)
  // Not: Koşul bayrakları yer tutucu çakışmalarında öncelikli çalışır
  const finalContext = {
    ...context,
    ...conditionFlags
  }

  // 5. Mustache ile render et (HTML kaçışı varsayılan olarak AÇIK kalır)
  const rendered = Mustache.render(compiledTemplate, finalContext)

  // 6. Çıktıyı son temizlikten geçir
  if (options.sanitizeOutput !== false) {
    return sanitizeHtml(rendered)
  }

  return rendered
}
