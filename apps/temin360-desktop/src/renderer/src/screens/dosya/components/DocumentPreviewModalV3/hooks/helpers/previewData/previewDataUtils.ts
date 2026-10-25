import { TemplateRegistryService } from '@temin360/document-templates'

export function applyRolePolicy(
  baseData: any,
  templateId: string,
  _komisyonSatirlari?: any[]
): void {
  TemplateRegistryService.applyRolePolicy(baseData, templateId)
}

export function dedupeMembers(members: any[]) {
  if (!Array.isArray(members)) return []
  const seen = new Set<string>()
  return members.filter((m: any) => {
    const rawName = (m.ad_soyad || m.adSoyad || '').trim().toLowerCase()
    const pid = m.personel_id ? `pid_${m.personel_id}` : null
    const key = pid || (rawName ? `name_${rawName}` : null)
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
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
