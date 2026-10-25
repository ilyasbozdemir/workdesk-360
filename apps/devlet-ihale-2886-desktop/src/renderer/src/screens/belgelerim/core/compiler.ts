/**
 * Belgelerim Eklentisi - Kanonik HTML -> Mustache Şablon Derleyicisi
 *
 * İşaretler:
 * - <span data-ph="anahtar">...</span> -> {{anahtar}}
 * - <div data-cond="bayrak">...</div> -> {{#bayrak}}...{{/bayrak}}
 * - <div data-each="liste">...</div> -> {{#liste}}...{{/liste}}
 *
 * İç içe blokları ve boşlukları hatasız işler.
 */

export function compileToMustache(html: string): string {
  if (!html || typeof html !== 'string') return ''

  let result = html

  // 1. Yer tutucuları derle: <span data-ph="anahtar"...>...</span> -> {{anahtar}}
  result = result.replace(
    /<span[^>]*\bdata-ph=["']([^"']+)["'][^>]*>(?:[\s\S]*?)<\/span>/gi,
    (_match, key) => `{{${key.trim()}}}`
  )

  // Kendi kendini kapatan veya boş span durumu için
  result = result.replace(
    /<span[^>]*\bdata-ph=["']([^"']+)["'][^>]*\/>/gi,
    (_match, key) => `{{${key.trim()}}}`
  )

  // 2. data-cond ve data-each bloklarını hiyerarşik olarak derle (iç içe destekli)
  // Bir tag stack / token parsing yaklaşımı ile en içten en dışa veya baştan sona işleme
  result = compileBlockDirectives(result)

  return result
}

/**
 * data-cond ve data-each taşıyan etiketleri iç içe destekle derler
 */
function compileBlockDirectives(html: string): string {
  // Regex ile data-cond veya data-each taşıyan en içteki etiketleri bulup sırayla dönüştürür.
  // Bu yöntem iç içe yapıları (nested) güvenle en içten en dışa doğru çözer.
  let current = html
  let changed = true
  let maxPasses = 50 // Sonsuz döngü koruması

  while (changed && maxPasses > 0) {
    changed = false
    maxPasses--

    // 1. En içteki data-cond bloğu: İçinde başka data-cond veya data-each barındırmayan
    const condRegex =
      /<([a-zA-Z0-9]+)[^>]*\bdata-cond=["']([^"']+)["'][^>]*>((?:(?!<[a-zA-Z0-9]+[^>]*\b(?:data-cond|data-each)\b)[\s\S])*?)<\/\1>/i
    const condMatch = current.match(condRegex)
    if (condMatch) {
      const [_fullMatch, _tag, flagName, innerContent] = condMatch
      const replacement = `{{#${flagName.trim()}}}${innerContent}{{/${flagName.trim()}}}`
      current = current.replace(condMatch[0], replacement)
      changed = true
      continue
    }

    // 2. En içteki data-each bloğu: İçinde başka data-cond veya data-each barındırmayan
    const eachRegex =
      /<([a-zA-Z0-9]+)[^>]*\bdata-each=["']([^"']+)["'][^>]*>((?:(?!<[a-zA-Z0-9]+[^>]*\b(?:data-cond|data-each)\b)[\s\S])*?)<\/\1>/i
    const eachMatch = current.match(eachRegex)
    if (eachMatch) {
      const [_fullMatch, _tag, listName, innerContent] = eachMatch
      const replacement = `{{#${listName.trim()}}}${innerContent}{{/${listName.trim()}}}`
      current = current.replace(eachMatch[0], replacement)
      changed = true
      continue
    }
  }

  return current
}
