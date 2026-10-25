import { describe, it, expect } from 'vitest'
import {
  OLCU_BIRIMLERI_LIST,
  POZ_TIPLERI,
  FASIKULLER_MAP,
  ORNEK_POZ_SABLONLARI
} from '../yeni.constants'

describe('yeni poz constants and templates', () => {
  it('OLCU_BIRIMLERI_LIST has standard units', () => {
    const unitCodes = OLCU_BIRIMLERI_LIST.map((u) => u.kod)
    expect(unitCodes).toContain('m²')
    expect(unitCodes).toContain('m³')
    expect(unitCodes).toContain('ton')
    expect(unitCodes).toContain('Adet')
  })

  it('POZ_TIPLERI includes Analiz and Rayic', () => {
    const types = POZ_TIPLERI.map((t) => t.id)
    expect(types).toContain('Analiz')
    expect(types).toContain('Rayiç')
  })

  it('FASIKULLER_MAP has ÇŞB and KGM entries', () => {
    expect(FASIKULLER_MAP.ÇŞB).toBeDefined()
    expect(FASIKULLER_MAP.ÇŞB.length).toBeGreaterThan(0)
    expect(FASIKULLER_MAP.KGM).toBeDefined()
  })

  it('ORNEK_POZ_SABLONLARI are well-structured with prices', () => {
    expect(ORNEK_POZ_SABLONLARI.length).toBeGreaterThan(0)
    for (const tpl of ORNEK_POZ_SABLONLARI) {
      expect(tpl.poz_no).toBeTruthy()
      expect(tpl.kalem_adi).toBeTruthy()
      expect(tpl.fiyatlar.length).toBeGreaterThan(0)
    }
  })
})
