import type { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import type { FormDataType, CustomField } from './studyoTypes'
import { STANDARD_2886_TEMPLATES } from './standard2886Templates.data'

export function getFormDataForDosya(d: Dosya2886Item | null, totalDosyalar = 0): FormDataType {
  const todayStr = new Date().toISOString().split('T')[0]
  if (d) {
    return {
      ihaleKayitNo: d.ihaleKayitNo || '',
      ihaleAdi: d.ihaleAdi || '',
      islemTuru: d.islemTuru || 'satis',
      usul: d.usul || 'acik_teklif_45',
      muhammenBedel:
        d.muhammenBedel?.takdirEdilenMuhammenBedel || d.muhammenBedel?.hesaplananBedel || 2500000,
      ihaleTarihi: d.ihaleTarihi || todayStr,
      ihaleSaati: d.ihaleSaati || '14:00',
      ihaleYeri: d.ihaleYeri || 'Belediye Encümen Toplantı Salonu',
      kurumAdi: 'ÇANKAYA BELEDİYESİ',
      sayiNo: 'E-84729103-755',
      kararNo: '2026/89',
      il: d.tasinmaz?.il || 'Ankara',
      ilce: d.tasinmaz?.ilce || 'Çankaya',
      mahalleKoy: d.tasinmaz?.mahalleKoy || 'Merkez Mah.',
      ada: d.tasinmaz?.ada || '101',
      parsel: d.tasinmaz?.parsel || '1',
      yuzolcumuM2: d.tasinmaz?.yuzolcumuM2 || 500,
      cinsi: d.tasinmaz?.cinsi || 'Ticari İmarlı Arsa',
      adres: d.tasinmaz?.adres || ''
    }
  }
  return {
    ihaleKayitNo: `2026/2886-ST-0${totalDosyalar + 1}`,
    ihaleAdi: 'Yeni 2886 Taşınmaz İhalesi',
    islemTuru: 'satis',
    usul: 'acik_teklif_45',
    muhammenBedel: 3000000,
    ihaleTarihi: todayStr,
    ihaleSaati: '14:00',
    ihaleYeri: 'Belediye Encümen Toplantı Salonu',
    kurumAdi: 'ÇANKAYA BELEDİYESİ',
    sayiNo: 'E-991823-01',
    kararNo: '2026/102',
    il: 'Ankara',
    ilce: 'Çankaya',
    mahalleKoy: 'Merkez Mah.',
    ada: '105',
    parsel: '4',
    yuzolcumuM2: 750,
    cinsi: 'Ticari İmarlı Arsa',
    adres: ''
  }
}

export function getCustomFieldsForDosya(d: Dosya2886Item | null): CustomField[] {
  if (d?.ozelAlanlar && d.ozelAlanlar.length > 0) {
    return d.ozelAlanlar
  }
  return [
    {
      id: 'cf-1',
      key: 'imar_durumu',
      label: 'İmar Durumu & Emsal',
      tip: 'metin',
      deger: 'Emsal: 1.50, Hmax: Serbest, Ticaret + Konut Alanı'
    },
    {
      id: 'cf-2',
      key: 'ozel_sartlar',
      label: 'Özel Şartlar & Notlar',
      tip: 'cok_satirli',
      deger:
        'İhale bedeli 15 gün içerisinde defaten ödenecektir. Tapu harç ve masrafları alıcıya aittir.'
    }
  ]
}

export function getEditorContentForDosya(d: Dosya2886Item | null): string {
  if (d?.belgeIcerikHtml) {
    return d.belgeIcerikHtml
  }
  const found = STANDARD_2886_TEMPLATES.find((t) => t.kod === (d?.aktifSablonKodu || '2886-EVR-01'))
  return found ? found.templateHtml : STANDARD_2886_TEMPLATES[0].templateHtml
}
