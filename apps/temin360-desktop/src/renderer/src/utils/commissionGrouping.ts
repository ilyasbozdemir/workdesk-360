export interface CommissionerRoleAssignment {
  id: number
  komisyonId?: number
  komisyonTuru?: string
  gorev: string
  unvan?: string
  rol?: string
  asliYedek?: string
  imzaTuru?: string
}

export interface UniqueCommissioner {
  key: string
  personelId: number | null
  adSoyad: string
  unvan: string
  birim: string
  assignments: CommissionerRoleAssignment[]
  primaryGorev: string
}

export interface CommissionGroupingResult {
  uniqueCommissioners: UniqueCommissioner[]
  uniqueCount: number
  totalAssignmentCount: number
}

/**
 * Komisyon üyelerini aynı kişi (personel_id veya ad_soyad) bazında tekilleştirir.
 * Küçük kurumlarda aynı personel hem Piyasa Fiyat Araştırma hem de Muayene Kabul komisyonunda
 * veya farklı unvanlarla birden fazla görev alabilir. Bu fonksiyon tekil kişi sayısını
 * ve personelin üstlendiği tüm görevlendirmeleri bir arada sunar.
 */
export function groupUniqueCommissioners(members: any[]): CommissionGroupingResult {
  if (!Array.isArray(members) || members.length === 0) {
    return { uniqueCommissioners: [], uniqueCount: 0, totalAssignmentCount: 0 }
  }

  const map = new Map<string, UniqueCommissioner>()

  for (const m of members) {
    const rawName = (m.ad_soyad || m.adSoyad || '').trim()
    const pId = m.personel_id || m.personelId || null
    // Unique key: varsa personel_id, yoksa normalize edilmiş ad_soyad
    const key = pId ? `pid_${pId}` : `name_${rawName.toLowerCase()}`

    const roleAssignment: CommissionerRoleAssignment = {
      id: m.id,
      komisyonId: m.komisyon_id || m.komisyonId,
      komisyonTuru: m.komisyon_turu || m.komisyonTuru || m.komisyon_adi || 'Genel Komisyon',
      gorev: m.gorev || m.gorev_adi || m.gorevAd || 'Üye',
      unvan: m.unvan || m.personel_unvan || '',
      rol: m.rol || 'Asil',
      asliYedek: m.asli_yedek || m.asliYedek || (m.asil_mi === 0 ? 'Yedek' : 'Asil'),
      imzaTuru: m.imza_turu || m.imzaTuru || 'İmza'
    }

    if (!map.has(key)) {
      map.set(key, {
        key,
        personelId: pId ? Number(pId) : null,
        adSoyad: rawName || 'İsimsiz Görevli',
        unvan: m.unvan || m.personel_unvan || '',
        birim: m.birim || m.birim_adi || '',
        assignments: [roleAssignment],
        primaryGorev: roleAssignment.gorev
      })
    } else {
      const existing = map.get(key)!
      if (!existing.unvan && (m.unvan || m.personel_unvan)) {
        existing.unvan = m.unvan || m.personel_unvan
      }
      if (!existing.birim && (m.birim || m.birim_adi)) {
        existing.birim = m.birim || m.birim_adi
      }
      // Aynı görev mükerrer değilse ekle
      const isDuplicate = existing.assignments.some(
        (a) =>
          a.komisyonTuru === roleAssignment.komisyonTuru &&
          a.gorev === roleAssignment.gorev &&
          a.asliYedek === roleAssignment.asliYedek
      )
      if (!isDuplicate) {
        existing.assignments.push(roleAssignment)
      }
    }
  }

  const uniqueCommissioners = Array.from(map.values())
  return {
    uniqueCommissioners,
    uniqueCount: uniqueCommissioners.length,
    totalAssignmentCount: members.length
  }
}
