import { describe, expect, it } from 'vitest'
import {
  screenTemplateMap,
  resolveTemplateIdFromPath,
  getDefaultMappingForProcess,
  processMappingRegistry
} from '../index'
import { IhtiyacListesiMapping } from '../ihtiyac-listesi.mapping'
import { PiyasaFiyatArastirmaTutanagiMapping } from '../all-templates.mapping'

describe('Desktop Screen & Mapping Bridge Testleri', () => {
  it('screenTemplateMap Electron ekran rotalarını doğru şablon kimliklerine eşler', () => {
    expect(screenTemplateMap['/dosya/hazirlik-ve-ihtiyac']).toBe('ihtiyac-listesi')
    expect(screenTemplateMap['/dosya/firmalar-maliyet/tutanak']).toBe(
      'piyasa-fiyat-arastirma-tutanagi'
    )
    expect(screenTemplateMap['/dosya/onay/dt-onay']).toBe('dogrudan-temin-onay-belgesi')
    expect(screenTemplateMap['/dosya/harcama/talimat']).toBe('harcama-talimati')
    expect(screenTemplateMap['/dosya/firmalar-maliyet/yaklasik']).toBe('yaklasik-maliyet-cetveli')
  })

  it('resolveTemplateIdFromPath tam URL, .html, index ve alias yollarını temizleyerek çözümler', () => {
    expect(resolveTemplateIdFromPath('/dosya/firmalar-maliyet/tutanak')).toBe(
      'piyasa-fiyat-arastirma-tutanagi'
    )
    expect(resolveTemplateIdFromPath('/dosya/hazirlik-ve-ihtiyac/index.html')).toBe('ihtiyac-listesi')
    expect(resolveTemplateIdFromPath('tutanak')).toBe('piyasa-fiyat-arastirma-tutanagi')
    expect(resolveTemplateIdFromPath('dt-onay')).toBe('dogrudan-temin-onay-belgesi')
    expect(resolveTemplateIdFromPath('')).toBe('')
  })

  it('getDefaultMappingForProcess ilgili ekran rotası için merkezi şablon paketinden mapping çeker', () => {
    const ihtiyacMap = getDefaultMappingForProcess('/dosya/hazirlik-ve-ihtiyac')
    expect(ihtiyacMap).toBeDefined()
    expect(ihtiyacMap.dosyaKonusu?.deger).toBe('İhtiyaç Listesi')

    const tutanakMap = getDefaultMappingForProcess('/dosya/firmalar-maliyet/tutanak')
    expect(tutanakMap).toBeDefined()
    expect(tutanakMap.toplamBedel?.tablo).toBe('DATA_TeminDosyasi')
  })

  it('processMappingRegistry Proxy üzerinden dinamik ve geriye dönük uyumlu erişim sağlar', () => {
    const mapping = processMappingRegistry['/dosya/firmalar-maliyet/tutanak']
    expect(mapping).toBeDefined()
    expect(mapping.toplamBedel?.tablo).toBe('DATA_TeminDosyasi')

    expect('/dosya/hazirlik-ve-ihtiyac' in processMappingRegistry).toBe(true)
  })

  it('Geriye dönük uyumluluk re-export dosyaları eksiksiz değer sağlar', () => {
    expect(IhtiyacListesiMapping.dosyaKonusu?.deger).toBe('İhtiyaç Listesi')
    expect(PiyasaFiyatArastirmaTutanagiMapping.toplamBedel?.tablo).toBe('DATA_TeminDosyasi')
  })
})

