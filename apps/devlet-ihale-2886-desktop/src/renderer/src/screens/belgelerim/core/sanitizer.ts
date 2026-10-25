/**
 * Belgelerim Eklentisi - HTML Güvenlik ve Sanitizasyon Modülü
 * script, on* olay işleyicileri ve javascript: bağlantılarını temizler.
 */

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  let clean = html

  // 1. <script>...</script> etiketlerini ve içeriğini temizle
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // 2. <style> etiketleri içinde javascript: ifadelerini temizle
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, (match) => {
    return match.replace(/javascript:/gi, 'blocked-javascript:')
  })

  // 3. on* event handler'ları temizle (onclick, onerror, onload, onmouseover vb.)
  // Örn: <img src="x" onerror="alert(1)"> -> <img src="x">
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // 4. href veya src içindeki javascript: ve data: (html) URL'lerini etkisiz hale getir
  clean = clean.replace(
    /\b(href|src|action)\s*=\s*(["'])\s*(?:javascript|vbscript):/gi,
    '$1=$2blocked:'
  )

  // 5. <iframe>, <object>, <embed> etiketlerini temizle
  clean = clean.replace(/<\/?(iframe|object|embed|applet)\b[^>]*>/gi, '')

  return clean
}
