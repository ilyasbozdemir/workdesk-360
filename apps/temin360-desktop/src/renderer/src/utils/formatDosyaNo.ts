/**
 * Doğrudan Temin ve Hakediş Dosya Numarası Standart Formatlayıcı
 * Örnek Çıktılar:
 * - "2026/1" -> "DT-2026/1"
 * - "2026/2026/1" -> "DT-2026/1" (çift yıl temizlenir)
 * - "1" -> "DT-2026/1"
 * - "DT-2026/1" -> "DT-2026/1"
 * - Hakediş dosyası -> "HAK-2026/1"
 */
export function formatDosyaNo(d: any): string {
  if (!d) return 'NO BELİRSİZ'

  const isHakedis =
    d.tur === 'hakedis' ||
    d.ihale_sekli?.toLowerCase().includes('hakedis') ||
    d.ihale_tipi === 'Hakediş'

  const prefix = isHakedis ? 'HAK' : 'DT'

  const yil =
    d.butce_yili ||
    (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null) ||
    (d.created_at ? new Date(d.created_at).getFullYear() : null) ||
    new Date().getFullYear()

  // Belgeye verilen resmi evrak sayısı varsa (örn: 56383307-934.01-0020):
  // Kamu idaresinde dosya numarası belgeye verilen sayıdır.
  const rawEvrak = (d.evrak_sayisi !== undefined && d.evrak_sayisi !== null ? String(d.evrak_sayisi) : '')
    .replace(/^E-/i, '')
    .trim()
  let evrakSeq: number | null = null
  if (rawEvrak) {
    const match = rawEvrak.match(/-(\d+)$/)
    if (match) {
      const parsed = parseInt(match[1], 10)
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
        evrakSeq = parsed
      }
    }
  }

  const rawNo = (d.temin_no !== undefined && d.temin_no !== null ? String(d.temin_no) : '').trim()

  if (evrakSeq !== null) {
    let rawSeq: number | null = null
    if (rawNo) {
      const parts = rawNo.split(/[/_ -]+/)
      for (let i = parts.length - 1; i >= 0; i--) {
        const num = parseInt(parts[i], 10)
        if (!isNaN(num) && num !== yil && num > 0 && num < 100000) {
          rawSeq = num
          break
        }
      }
    }
    // Eğer temin_no boşsa veya resmi evrak sayısının sıra numarası ile uyumsuzsa,
    // kamu idaresi kuralı gereği belgeye verilen sayıyı esas al
    if (rawSeq === null || rawSeq !== evrakSeq) {
      return `${prefix}-${yil}/${evrakSeq}`
    }
  }

  if (!rawNo) {
    return d.id ? `${prefix}-${yil}/${d.id}` : `${prefix}-${yil}/1`
  }

  // 1. Başta olabilecek DT- veya HAK- ön eklerini temizle
  let cleaned = rawNo.replace(/^(DT|HAK)[-_/ ]+/i, '').trim()

  // 2. Çift yıl tekrarlarını temizle (Örn: "2026/2026/1" veya "2026-2026-1")
  const doubleYearRegex = /^(\d{4})[/-]\1[/-](\d+)$/
  const doubleMatch = cleaned.match(doubleYearRegex)
  if (doubleMatch) {
    return `${prefix}-${doubleMatch[1]}/${doubleMatch[2]}`
  }

  // 3. Tek yıl ve sıra içeren desen (Örn: "2026/1" veya "2026-1")
  const singleYearRegex = /^(\d{4})[/-](\d+)$/
  const singleMatch = cleaned.match(singleYearRegex)
  if (singleMatch) {
    return `${prefix}-${singleMatch[1]}/${singleMatch[2]}`
  }

  // 4. Sadece düz sıra numarası (Örn: "1", "2", "15")
  if (/^\d+$/.test(cleaned)) {
    return `${prefix}-${yil}/${cleaned}`
  }

  // 5. Yıl ile başlayan özel metin (Örn: "2026/ÖZEL-01")
  if (cleaned.startsWith(`${yil}/`) || cleaned.startsWith(`${yil}-`)) {
    const rest = cleaned.substring(5)
    return `${prefix}-${yil}/${rest}`
  }

  return `${prefix}-${yil}/${cleaned}`
}
