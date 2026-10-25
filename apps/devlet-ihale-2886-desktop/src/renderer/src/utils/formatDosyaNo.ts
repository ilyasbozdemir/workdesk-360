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

  const rawNo = (d.temin_no !== undefined && d.temin_no !== null ? String(d.temin_no) : '').trim()

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
