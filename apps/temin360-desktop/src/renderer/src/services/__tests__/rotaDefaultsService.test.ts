import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRotaConfigForTemplate,
  getDirectRotaConfig,
  saveRotaConfigForTemplate,
  removeRotaConfigForTemplate,
  applyRotaConfigToAllTemplates,
  resolveTemplateRouteForDocument,
  GLOBAL_ROTA_KEY
} from '../rotaDefaultsService'

describe('rotaDefaultsService — Merkezi Belge Rota ve Onay Akışı Varsayılanları', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('genel (__global__) rota kaydedildiğinde özel ayarı olmayan tüm şablonlar için döner', () => {
    saveRotaConfigForTemplate(GLOBAL_ROTA_KEY, {
      belgeModu: 'koordinasyonlu',
      rota: [{ t: 'Paraf', a: 'Ahmet Yılmaz', u: 'Şube Müdürü' }],
      hazirlayanPersonelAdi: 'Zeynep Kaya',
      hazirlayanPersonelUnvan: 'Uzman'
    })

    const resolved = getRotaConfigForTemplate('ihtiyac-listesi')
    expect(resolved).not.toBeNull()
    expect(resolved?.belgeModu).toBe('koordinasyonlu')
    expect(resolved?.rota).toHaveLength(1)
    expect(resolved?.rota?.[0].a).toBe('Ahmet Yılmaz')
    expect(resolved?.hazirlayanPersonelAdi).toBe('Zeynep Kaya')
  })

  it('şablona özel rota ayarı, genel (__global__) ayarı ezer', () => {
    saveRotaConfigForTemplate(GLOBAL_ROTA_KEY, {
      belgeModu: 'standart',
      rota: []
    })

    saveRotaConfigForTemplate('luzum-muzekkeresi', {
      belgeModu: 'koordinasyonlu',
      rota: [{ t: 'Koordinasyon', a: 'Mehmet Demir', u: 'Daire Başkanı' }]
    })

    expect(getRotaConfigForTemplate('ihtiyac-listesi')?.belgeModu).toBe('standart')
    expect(getRotaConfigForTemplate('luzum-muzekkeresi')?.belgeModu).toBe('koordinasyonlu')
    expect(getRotaConfigForTemplate('luzum-muzekkeresi')?.rota?.[0].a).toBe('Mehmet Demir')
  })

  it('aktif dosyaya (dosyaId) özel şablon ayarı, global şablon ayarını ezer ve silindiğinde globale döner', () => {
    saveRotaConfigForTemplate('yaklasik-maliyet-cetveli', {
      belgeModu: 'standart',
      rota: []
    })

    saveRotaConfigForTemplate(
      'yaklasik-maliyet-cetveli',
      {
        belgeModu: 'koordinasyonlu',
        rota: [{ t: 'Paraf', a: 'Dosya Özel Personel', u: 'Mühendis' }]
      },
      42
    )

    expect(getDirectRotaConfig('yaklasik-maliyet-cetveli', 42)?.belgeModu).toBe('koordinasyonlu')
    expect(getRotaConfigForTemplate('yaklasik-maliyet-cetveli', 42)?.rota?.[0].a).toBe(
      'Dosya Özel Personel'
    )
    expect(getRotaConfigForTemplate('yaklasik-maliyet-cetveli', 99)?.belgeModu).toBe('standart')

    removeRotaConfigForTemplate('yaklasik-maliyet-cetveli', 42)
    expect(getRotaConfigForTemplate('yaklasik-maliyet-cetveli', 42)?.belgeModu).toBe('standart')
  })

  it('applyRotaConfigToAllTemplates seçilen tüm şablonlara aynı rotayı topluca uygular', () => {
    applyRotaConfigToAllTemplates(
      ['ihtiyac-listesi', 'luzum-muzekkeresi', 'fiyat-arastirma-tutanagi'],
      {
        belgeModu: 'hizli_onay',
        rota: [],
        onaylayanPersonelAdi: 'Dr. Kemal Öztürk',
        onaylayanPersonelUnvan: 'Başhekim'
      }
    )

    expect(getRotaConfigForTemplate('ihtiyac-listesi')?.belgeModu).toBe('hizli_onay')
    expect(getRotaConfigForTemplate('luzum-muzekkeresi')?.onaylayanPersonelAdi).toBe(
      'Dr. Kemal Öztürk'
    )
    expect(getRotaConfigForTemplate('fiyat-arastirma-tutanagi')?.onaylayanPersonelUnvan).toBe(
      'Başhekim'
    )
  })

  it('resolveTemplateRouteForDocument: settings, document ve override kaynaklarını çözüp şablon alanlarına yazar', () => {
    saveRotaConfigForTemplate('piyasa-fiyat-arastirma-tutanagi', {
      onaylayanPersonelAdi: 'Ayşe Demir',
      onaylayanPersonelUnvan: 'Birim Yetkilisi',
      komisyonUyeleri: [
        { id: 'p3', adSoyad: 'Zeynep Kaya', unvan: 'Memur' },
        { id: 'p4', adSoyad: 'Ali Çelik', unvan: 'Tekniker' }
      ]
    })

    const { resolvedRoute, enrichedData } = resolveTemplateRouteForDocument(
      'piyasa-fiyat-arastirma-tutanagi',
      {} as Record<string, any>,
      null,
      [{ slotId: 'onaylayan', value: { id: 'p5', name: 'Fatma Ak', title: 'Daire Başkanı' } }]
    )

    expect(resolvedRoute.steps.find((s) => s.id === 'komisyon')?.origin).toBe('settings')
    expect(resolvedRoute.steps.find((s) => s.id === 'onaylayan')?.origin).toBe('override')
    expect(enrichedData.fiyatArastirmaGorevlileri).toHaveLength(2)
    expect(enrichedData.fiyatArastirmaGorevlileri[0].adSoyad).toBe('Zeynep Kaya')
    expect(enrichedData.onaylayanPersonelAdi).toBe('Fatma Ak')
    expect(enrichedData.onaylayanPersonelUnvan).toBe('Daire Başkanı')
  })

  it('birimId ve antetSatirlari için Genel < Şablon < Dosya öncelik sırasını korur ve manuel snapshot verisini ezmez', () => {
    saveRotaConfigForTemplate(GLOBAL_ROTA_KEY, {
      birimId: 10,
      birimAdi: 'Destek Hizmetleri Müdürlüğü',
      antetSatirlari: ['T.C.', 'KURUM', 'Destek Hizmetleri Müdürlüğü']
    })

    saveRotaConfigForTemplate('ihtiyac-listesi', {
      birimId: 20,
      birimAdi: 'Fen İşleri Müdürlüğü',
      antetSatirlari: ['T.C.', 'KURUM', 'Fen İşleri Müdürlüğü']
    })

    saveRotaConfigForTemplate(
      'ihtiyac-listesi',
      {
        birimId: 30,
        birimAdi: 'Bilgi İşlem Müdürlüğü',
        antetSatirlari: ['T.C.', 'KURUM', 'Bilgi İşlem Müdürlüğü']
      },
      77
    )

    // 1. Özel ayarı olmayan şablon genel (birimId: 10) ayarı alır
    const globalRes = resolveTemplateRouteForDocument('luzum-muzekkeresi', {}, null)
    expect((globalRes.enrichedData as any).birimId).toBe(10)
    expect((globalRes.enrichedData as any).antetSatirlari).toEqual([
      'T.C.',
      'KURUM',
      'Destek Hizmetleri Müdürlüğü'
    ])

    // 2. Şablona özel ayar genel ayarı ezer (birimId: 20)
    const tplRes = resolveTemplateRouteForDocument('ihtiyac-listesi', {}, null)
    expect((tplRes.enrichedData as any).birimId).toBe(20)
    expect((tplRes.enrichedData as any).birimAdi).toBe('Fen İşleri Müdürlüğü')

    // 3. Dosyaya özel ayar şablon ayarını ezer (dosyaId: 77 -> birimId: 30)
    const dosyaRes = resolveTemplateRouteForDocument('ihtiyac-listesi', {}, 77)
    expect((dosyaRes.enrichedData as any).birimId).toBe(30)
    expect((dosyaRes.enrichedData as any).birimAdi).toBe('Bilgi İşlem Müdürlüğü')

    // 4. Belgede/snapshot'ta zaten tanımlı birimId ve antetSatirlari varsa sessizce EZİLMEZ
    const manualDocRes = resolveTemplateRouteForDocument(
      'ihtiyac-listesi',
      {
        birimId: 99,
        birimAdi: 'Manuel Seçilen Birim',
        antetSatirlari: ['T.C.', 'MANUEL ANTET SATIRI']
      },
      77
    )
    expect(manualDocRes.enrichedData.birimId).toBe(99)
    expect(manualDocRes.enrichedData.antetSatirlari).toEqual(['T.C.', 'MANUEL ANTET SATIRI'])

    // 5. Belge ilk açılışta (snapshot yokken, _isBaseDefaultAntet: true) şablona/dosyaya özel antet ve birim ayarını uygular
    const freshPreviewRes = resolveTemplateRouteForDocument(
      'ihtiyac-listesi',
      {
        _isBaseDefaultAntet: true,
        birimId: 10,
        birimAdi: 'Varsayılan Dosya Birimi',
        antetSatirlari: ['T.C.', 'KURUM', 'Varsayılan Dosya Birimi']
      },
      77
    )
    expect(freshPreviewRes.enrichedData.birimId).toBe(30)
    expect((freshPreviewRes.enrichedData as any).birimAdi).toBe('Bilgi İşlem Müdürlüğü')
    expect(freshPreviewRes.enrichedData.antetSatirlari).toEqual([
      'T.C.',
      'KURUM',
      'Bilgi İşlem Müdürlüğü'
    ])
  })
})

