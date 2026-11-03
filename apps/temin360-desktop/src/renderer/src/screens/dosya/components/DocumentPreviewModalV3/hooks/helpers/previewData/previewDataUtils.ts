import { TemplateRegistryService, cleanPersonelName } from '@temin360/document-templates'

export { cleanPersonelName }

export function applyRolePolicy(
  baseData: any,
  templateId: string,
  _komisyonSatirlari?: any[]
): void {
  TemplateRegistryService.applyRolePolicy(baseData, templateId)
}

export function dedupeMembers(members: any[]) {
  if (!Array.isArray(members)) return []
  const seenNames = new Set<string>()
  const seenIds = new Set<string>()

  return members.filter((m: any) => {
    if (!m) return false
    const pid = m.personel_id || m.personelId || m.id
    const raw = m.adSoyad || m.ad_soyad || ''
    const clean = cleanPersonelName(raw)
    const lower = clean.toLowerCase()

    if (!lower && !pid) return false

    if (pid && seenIds.has(String(pid))) {
      return false
    }

    if (lower && seenNames.has(lower)) {
      return false
    }

    if (pid) seenIds.add(String(pid))
    if (lower) seenNames.add(lower)

    // Üye üzerindeki adı da temizlenmiş isimle güncelle
    if (m.ad_soyad) m.ad_soyad = clean
    if (m.adSoyad) m.adSoyad = clean

    return true
  })
}

export function parseNumericPrice(priceVal: any): number {
  if (priceVal === undefined || priceVal === null || priceVal === '' || priceVal === '-') {
    return 0
  }
  if (typeof priceVal === 'number') {
    return isNaN(priceVal) ? 0 : priceVal
  }
  const clean = String(priceVal).replace(/[^0-9.,-]/g, '')
  let parsed = 0
  if (clean.includes(',') && !clean.includes('.')) {
    parsed = parseFloat(clean.replace(',', '.'))
  } else if (clean.includes('.') && clean.includes(',')) {
    parsed = parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  } else {
    parsed = parseFloat(clean)
  }
  return isNaN(parsed) ? 0 : parsed
}
