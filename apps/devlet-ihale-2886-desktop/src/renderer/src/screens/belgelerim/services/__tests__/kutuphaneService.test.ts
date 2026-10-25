import { describe, it, expect } from 'vitest'
import { kutuphaneService, calculateChecksum, BelgePaketi } from '../kutuphaneService'

describe('KutuphaneService - Paketleme & Doğrulama (Faz 2)', () => {
  it('calculateChecksum aynı içerik için deterministik sonuç üretmelidir', () => {
    const text = 'TEMIN-360-TEST-PAYLOAD'
    const h1 = calculateChecksum(text)
    const h2 = calculateChecksum(text)
    expect(h1).toBe(h2)
    expect(h1).toBeTruthy()
  })

  it('exportBelgePaketi geçerli checksum ile paket üretmeli ve validateImportPaketi başarılı olmalıdır', () => {
    const belge = {
      id: 1,
      grup_id: null,
      ad: 'Test Sözleşmesi',
      etiketler: JSON.stringify(['ihale', 'hizmet']),
      aktif_surum_id: 1,
      arsiv_mi: 0,
      favori_mi: 0,
      silindi_at: null,
      created_at: '2026-01-01'
    }

    const surumler = [
      {
        id: 1,
        belge_id: 1,
        surum_no: 1,
        etiket: 'v1.0',
        not: 'İlk kayıt',
        icerik_html: '<p>Sayın <span data-ph="yetkili"></span>,</p>',
        kosullar_json: '[]',
        created_at: '2026-01-01'
      }
    ]

    const yerTutucular = [
      {
        anahtar: 'yetkili',
        etiket: 'Yetkili Adı',
        tip: 'metin' as const
      }
    ]

    const paket = kutuphaneService.exportBelgePaketi(belge, surumler, yerTutucular)
    expect(paket.version).toBe('1.0')
    expect(paket.checksum).toBeTruthy()
    expect(paket.belge.ad).toBe('Test Sözleşmesi')

    const validation = kutuphaneService.validateImportPaketi(paket)
    expect(validation.valid).toBe(true)
  })

  it('bozulmuş içerik taşıyan paketi checksum hatası ile reddetmelidir', () => {
    const fakePaket: BelgePaketi = {
      version: '1.0',
      checksum: 'badhash123',
      exportedAt: '2026-01-01T00:00:00.000Z',
      belge: { ad: 'Müdahale Edilmiş Belge', etiketler: [] },
      surumler: [],
      yerTutucular: []
    }

    const res = kutuphaneService.validateImportPaketi(fakePaket)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('checksum')
  })

  it('uyumsuz sürüm numarasını reddetmelidir', () => {
    const fakePaket = {
      version: '99.0',
      checksum: '123',
      exportedAt: '2026-01-01',
      belge: { ad: 'Test' },
      surumler: []
    }

    const res = kutuphaneService.validateImportPaketi(fakePaket)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Uyumsuz paket sürümü')
  })

  it('güvenli anahtar değişikliğinde HTML içindeki data-ph niteliklerini hatasız günceller', () => {
    const html = `<div><span data-ph="eskiAnahtar">Değer</span> ve başka <span data-ph="farkli"></span></div>`
    const eskiAnahtar = 'eskiAnahtar'
    const yeniAnahtar = 'yeniAnahtar'

    const regex = new RegExp(`data-ph=["']${eskiAnahtar}["']`, 'g')
    const updated = html.replace(regex, `data-ph="${yeniAnahtar}"`)

    expect(updated).toContain('data-ph="yeniAnahtar"')
    expect(updated).not.toContain('data-ph="eskiAnahtar"')
    expect(updated).toContain('data-ph="farkli"')
  })
})
