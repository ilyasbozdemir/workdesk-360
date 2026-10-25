import { describe, it, expect } from 'vitest'
import {
  STANDARD_2886_TEMPLATES,
  getFormDataForDosya,
  getCustomFieldsForDosya,
  getEditorContentForDosya
} from '../index'
import type { Dosya2886Item } from '../../../../../components/layout/temin-selector/teminSelector.types'

describe('BelgeVeSablonStudyo - Modular Components and Data', () => {
  it('STANDARD_2886_TEMPLATES contains all 5 official 2886 templates', () => {
    expect(STANDARD_2886_TEMPLATES.length).toBe(5)
    const codes = STANDARD_2886_TEMPLATES.map((t) => t.kod)
    expect(codes).toContain('2886-EVR-01')
    expect(codes).toContain('2886-EVR-02')
    expect(codes).toContain('2886-EVR-05')
    expect(codes).toContain('2886-EVR-07')
    expect(codes).toContain('2886-EVR-12')
  })

  it('getFormDataForDosya correctly parses null dosya with fallback values', () => {
    const data = getFormDataForDosya(null, 3)
    expect(data.ihaleKayitNo).toBe('2026/2886-ST-04')
    expect(data.ihaleAdi).toBe('Yeni 2886 Taşınmaz İhalesi')
    expect(data.islemTuru).toBe('satis')
    expect(data.usul).toBe('acik_teklif_45')
    expect(data.muhammenBedel).toBe(3000000)
  })

  it('getFormDataForDosya correctly maps existing dosya properties', () => {
    const mockDosya: Partial<Dosya2886Item> = {
      id: 'd-1',
      ihaleKayitNo: '2026/01-TEST',
      ihaleAdi: 'Test Parsel Satışı',
      islemTuru: 'kiralama',
      usul: 'kapali_teklif_36',
      muhammenBedel: {
        takdirEdilenMuhammenBedel: 1500000,
        hesaplananBedel: 1200000,
        geciciTeminatTutari: 45000,
        kdvOrani: 20
      },
      tasinmaz: {
        il: 'İstanbul',
        ilce: 'Kadıköy',
        mahalleKoy: 'Moda',
        ada: '200',
        parsel: '5',
        yuzolcumuM2: 800,
        cinsi: 'Dükkan',
        hisseOrani: '1/1',
        mevcutDurumu: 'Dolu',
        adres: 'Moda Cad.'
      }
    }

    const data = getFormDataForDosya(mockDosya as Dosya2886Item)
    expect(data.ihaleKayitNo).toBe('2026/01-TEST')
    expect(data.ihaleAdi).toBe('Test Parsel Satışı')
    expect(data.islemTuru).toBe('kiralama')
    expect(data.usul).toBe('kapali_teklif_36')
    expect(data.muhammenBedel).toBe(1500000)
    expect(data.il).toBe('İstanbul')
    expect(data.ada).toBe('200')
  })

  it('getCustomFieldsForDosya returns existing or defaults', () => {
    const defaults = getCustomFieldsForDosya(null)
    expect(defaults.length).toBe(2)
    expect(defaults[0].key).toBe('imar_durumu')
    expect(defaults[1].key).toBe('ozel_sartlar')

    const customDosya: Partial<Dosya2886Item> = {
      ozelAlanlar: [
        { id: '1', key: 'custom_key', label: 'Custom Label', tip: 'metin', deger: 'val' }
      ]
    }
    const result = getCustomFieldsForDosya(customDosya as Dosya2886Item)
    expect(result.length).toBe(1)
    expect(result[0].key).toBe('custom_key')
  })

  it('getEditorContentForDosya resolves template HTML correctly', () => {
    const content = getEditorContentForDosya(null)
    expect(content).toContain('BAŞKANLIK MAKAMINA (İHALE ONAY BELGESİ)')

    const customContentDosya: Partial<Dosya2886Item> = {
      belgeIcerikHtml: '<p>Özel Belge İçeriği</p>'
    }
    expect(getEditorContentForDosya(customContentDosya as Dosya2886Item)).toBe(
      '<p>Özel Belge İçeriği</p>'
    )

    const templateCodeDosya: Partial<Dosya2886Item> = {
      aktifSablonKodu: '2886-EVR-02'
    }
    expect(getEditorContentForDosya(templateCodeDosya as Dosya2886Item)).toContain(
      'TAŞINMAZ {{islem_turu_adi}} İHALE ŞARTNAMESİ'
    )
  })
})
