import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRotaConfigForTemplate,
  getDirectRotaConfig,
  saveRotaConfigForTemplate,
  removeRotaConfigForTemplate,
  applyRotaConfigToAllTemplates,
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
    expect(resolved?.rota[0].a).toBe('Ahmet Yılmaz')
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
    expect(getRotaConfigForTemplate('luzum-muzekkeresi')?.rota[0].a).toBe('Mehmet Demir')
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
    expect(getRotaConfigForTemplate('yaklasik-maliyet-cetveli', 42)?.rota[0].a).toBe(
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
})

