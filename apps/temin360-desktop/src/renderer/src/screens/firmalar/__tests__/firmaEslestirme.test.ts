import { describe, it, expect } from 'vitest'

function cleanDigits(s?: string | null): string {
  if (!s) return ''
  return String(s).replace(/\D/g, '')
}

function normalizeTitle(s?: string | null): string {
  if (!s) return ''
  return String(s)
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,\-_/\\()&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleTokenSet(s?: string | null): Set<string> {
  const norm = normalizeTitle(s)
  const stopWords = new Set([
    'ltd', 'sti', 'şti', 'as', 'a', 'ş', 'san', 'tic', 've', 'sanayi', 'ticaret',
    'insaat', 'inşaat', 'taahhut', 'taahhüt', 'muh', 'müh', 'muhendislik', 'mühendislik',
    'dan', 'danismanlik', 'danışmanlık', 'hiz', 'hizmetleri', 'limited', 'sirketi', 'şirketi',
    'anonim', 'gida', 'gıda', 'pet', 'petrol', 'nak', 'nakliyat', 'otom', 'otomotiv', 'yapı', 'yapi'
  ])
  const tokens = norm.split(/\s+/).filter((t) => t.length >= 3 && !stopWords.has(t))
  return new Set(tokens)
}

function calculateMatchScore(stub: any, master: any): { score: number; reason: string } {
  // 1. VKN / TCKN match
  const stubVkn = cleanDigits(stub.vergi_no || stub.tc_kimlik_no)
  const masterVkn = cleanDigits(master.vergi_no || master.tc_kimlik_no)
  if (stubVkn && masterVkn && stubVkn.length >= 8 && stubVkn === masterVkn) {
    return { score: 100, reason: `Vergi No / TCKN Birebir (${stubVkn})` }
  }

  // 2. Telefon match
  const stubPhone = cleanDigits(stub.telefon)
  const masterPhone = cleanDigits(master.telefon)
  if (stubPhone && masterPhone && stubPhone.length >= 7) {
    const sSuffix = stubPhone.slice(-7)
    const mSuffix = masterPhone.slice(-7)
    if (sSuffix === mSuffix) {
      return { score: 98, reason: `Telefon Eşleşmesi (${stub.telefon})` }
    }
  }

  // 3. Compact Title Prefix Match
  const stubCompact = normalizeTitle(stub.unvan).replace(/\s+/g, '')
  const masterCompact = normalizeTitle(master.unvan).replace(/\s+/g, '')
  if (stubCompact.length >= 4) {
    if (masterCompact.startsWith(stubCompact) || stubCompact.startsWith(masterCompact)) {
      return { score: 95, reason: `Unvan Birebir Başlangıç Uyumu` }
    }
    if (masterCompact.includes(stubCompact) || stubCompact.includes(masterCompact)) {
      return { score: 90, reason: `Unvan Kapsama Uyumu` }
    }
  }

  // 4. Token Intersection Match
  const stubTokens = titleTokenSet(stub.unvan)
  const masterTokens = titleTokenSet(master.unvan)
  if (stubTokens.size > 0 && masterTokens.size > 0) {
    let intersection = 0
    for (const t of stubTokens) {
      if (masterTokens.has(t)) intersection++
    }
    if (intersection > 0) {
      const matchRatio = intersection / Math.min(stubTokens.size, masterTokens.size)
      if (matchRatio >= 0.8) {
        return { score: 85, reason: `Anahtar Kelime Benzerliği (${intersection} kelime)` }
      }
      if (matchRatio >= 0.5) {
        return { score: 70, reason: `Kısmi İsim Benzerliği` }
      }
    }
  }

  return { score: 0, reason: '' }
}

describe('Firma Eşleştirme & Birleştirme Mantığı', () => {
  it('GÖKŞEN taslak firmasını 0026 GÖKŞEN MÜHENDİSLİK ile telefon ve unvan üzerinden başarıyla eşleştirir', () => {
    const stub = {
      id: 62,
      firma_kodu: null,
      unvan: 'GÖKŞEN',
      telefon: '03323534574',
      vergi_no: null
    }

    const master = {
      id: 26,
      firma_kodu: '0026',
      unvan: 'GÖKŞEN MÜHENDİSLİK MÜŞAVİRLİK İNŞAAT TAAHHÜT SANAYİ TİCARET LTD.ŞTİ',
      telefon: '03323534574',
      vergi_no: '4050312325'
    }

    const match = calculateMatchScore(stub, master)
    expect(match.score).toBeGreaterThanOrEqual(95)
    expect(match.reason).toContain('Telefon Eşleşmesi')
  })

  it('GÜL TES YAPI taslak firmasını 0028 GÜLTES YAPI ile unvan kökü üzerinden eşleştirir', () => {
    const stub = {
      id: 67,
      firma_kodu: null,
      unvan: 'GÜL TES YAPI',
      telefon: '03382124040'
    }

    const master = {
      id: 28,
      firma_kodu: '0028',
      unvan: 'GÜLTES YAPI ENERJİ SİS KAL.DOĞ SU.SAN TİÇ.LTD.ŞTİ',
      telefon: ''
    }

    const match = calculateMatchScore(stub, master)
    expect(match.score).toBeGreaterThanOrEqual(90)
    expect(match.reason).toContain('Unvan')
  })

  it('PARMOSAN taslak firmasını 0049 PARMOSAN PEYZAJ ile eşleştirir', () => {
    const stub = {
      id: 54,
      firma_kodu: null,
      unvan: 'PARMOSAN'
    }

    const master = {
      id: 49,
      firma_kodu: '0049',
      unvan: 'PARMOSAN PEYZAJ İNŞ.MOB. ve PLAST.İML.SAN.TİC.LTD.ŞTİ'
    }

    const match = calculateMatchScore(stub, master)
    expect(match.score).toBeGreaterThanOrEqual(90)
  })

  it('VKN eşleşmesi olduğunda %100 tam uyum skoru verir', () => {
    const stub = {
      id: 99,
      firma_kodu: null,
      unvan: 'Firma X',
      vergi_no: '1234567890'
    }

    const master = {
      id: 15,
      firma_kodu: '0015',
      unvan: 'Firma X Sanayi A.Ş.',
      vergi_no: '1234567890'
    }

    const match = calculateMatchScore(stub, master)
    expect(match.score).toBe(100)
    expect(match.reason).toContain('Vergi No')
  })
})

