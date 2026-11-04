import { describe, it, expect } from 'vitest'
import { evaluateRules } from '../engine'
import { FileRecord } from '../../../shared/types'

const baseMockFile: FileRecord = {
  id: 1,
  path: 'C:\\Belgeler\\2026\\Teklif_Goksen.pdf',
  relativePath: '2026/Teklif_Goksen.pdf',
  name: 'Teklif_Goksen.pdf',
  ext: '.pdf',
  size: 5 * 1024 * 1024, // 5 MB
  mtimeMs: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 gün önce
  ctimeMs: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 gün önce
  sha256: 'abc123hash',
  category: 'pdf',
  tags: ['onaylı', 'ihale']
}

describe('Arşiv 360 - Kural Motoru (evaluateRules)', () => {
  it('boş veya tanımsız kuralda tüm dosyaları kabul etmelidir', () => {
    expect(evaluateRules(baseMockFile, null)).toBe(true)
    expect(evaluateRules(baseMockFile, {})).toBe(true)
  })

  it('uzantı (ext[]) kriterini doğru eşleştirmelidir', () => {
    expect(evaluateRules(baseMockFile, { ext: ['pdf'] })).toBe(true)
    expect(evaluateRules(baseMockFile, { ext: ['.pdf', 'docx'] })).toBe(true)
    expect(evaluateRules(baseMockFile, { ext: ['docx', 'xlsx'] })).toBe(false)
  })

  it('isim regex (nameRegex) kriterini güvenle çalıştırmalı ve Türkçe karakterleri desteklemelidir', () => {
    expect(evaluateRules(baseMockFile, { nameRegex: 'goksen' })).toBe(true)
    expect(evaluateRules(baseMockFile, { nameRegex: '^Teklif.*\\.pdf$' })).toBe(true)
    expect(evaluateRules(baseMockFile, { nameRegex: 'fatura' })).toBe(false)
  })

  it('hatalı kullanıcı regex girdilerinde çökmeyip false dönmelidir', () => {
    // Geçersiz regex (kapanmamış parantez)
    expect(evaluateRules(baseMockFile, { nameRegex: '[a-z(' })).toBe(false)
  })

  it('dosya yolu glob (pathGlob) kriterini doğru denetlemelidir', () => {
    expect(evaluateRules(baseMockFile, { pathGlob: '2026/*.pdf' })).toBe(true)
    expect(evaluateRules(baseMockFile, { pathGlob: '**/*.pdf' })).toBe(true)
    expect(evaluateRules(baseMockFile, { pathGlob: '2025/**' })).toBe(false)
  })

  it('dosya boyutu (minSizeMB / maxSizeMB) kriterlerini doğru filtrelemelidir', () => {
    // 5 MB olan dosya
    expect(evaluateRules(baseMockFile, { minSizeMB: 1, maxSizeMB: 10 })).toBe(true)
    expect(evaluateRules(baseMockFile, { minSizeMB: 6 })).toBe(false)
    expect(evaluateRules(baseMockFile, { maxSizeMB: 4 })).toBe(false)
  })

  it('gün bazlı tarih kriterlerini (modifiedWithinDays / createdWithinDays) doğru filtrelemelidir', () => {
    // 2 gün önce değiştirildi
    expect(evaluateRules(baseMockFile, { modifiedWithinDays: 7 })).toBe(true)
    expect(evaluateRules(baseMockFile, { modifiedWithinDays: 1 })).toBe(false)

    // 5 gün önce oluşturuldu
    expect(evaluateRules(baseMockFile, { createdWithinDays: 10 })).toBe(true)
    expect(evaluateRules(baseMockFile, { createdWithinDays: 3 })).toBe(false)
  })

  it('etiket (tags[]) kriterini doğru eşleştirmelidir', () => {
    expect(evaluateRules(baseMockFile, { tags: ['onaylı'] })).toBe(true)
    expect(evaluateRules(baseMockFile, { tags: ['arşiv', 'ihale'] })).toBe(true)
    expect(evaluateRules(baseMockFile, { tags: ['taslak'] })).toBe(false)
  })

  it('birden çok kriterin AND mantığıyla birleşimini doğru hesaplamalıdır', () => {
    const combinedRule = {
      ext: ['pdf'],
      nameRegex: 'Goksen',
      pathGlob: '2026/**',
      minSizeMB: 2,
      maxSizeMB: 8,
      modifiedWithinDays: 5,
      tags: ['onaylı']
    }
    expect(evaluateRules(baseMockFile, combinedRule)).toBe(true)

    // Bir kriter tutmazsa sonuç false olmalıdır
    expect(evaluateRules(baseMockFile, { ...combinedRule, minSizeMB: 10 })).toBe(false)
  })
})

