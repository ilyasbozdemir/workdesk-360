import { describe, it, expect } from 'vitest'
import {
  mapIhtiyacKalemToLuzumMuzekkeresiItem,
  mapRaporToLuzumMuzekkeresiData,
  mapIhtiyacKalemToTeminKalem
} from '../ihtiyacRaporuAdapter'
import { IhtiyacRaporu, IhtiyacRaporuKalem } from '../ihtiyacRaporuService'

describe('ihtiyacRaporuAdapter Tests', () => {
  const sampleKalem: IhtiyacRaporuKalem = {
    id: 10,
    rapor_id: 1,
    sira_no: 1,
    kalem_adi: 'Çimento Portland CEM I 42.5',
    tipi: 'Mal',
    birim: 'Torba',
    miktar: 100,
    kdv_orani: 20,
    tasinir_kodu: '150.01.02.03',
    okas_kodu: 'OKAS-445',
    poz_no: 'POZ-04.001',
    aciklama: '50 kg torbalar halinde, TS EN 197-1 standardına uygun',
    tahmini_birim_fiyat: 250
  }

  const sampleRapor: IhtiyacRaporu = {
    id: 1,
    rapor_no: 'IR-2026/001',
    baslik: 'Ana Hizmet Binası Onarımı',
    gerekce: 'Çatlakların onarımı ve su yalıtımı için acil ihtiyaç duyulmaktadır.',
    birim_id: 2,
    birim_adi: 'Destek Hizmetleri Dairesi',
    talep_eden_personel_id: 5,
    talep_eden_personel: 'Ahmet Yılmaz',
    talep_eden_unvan: 'İnşaat Mühendisi',
    durum: 'taslak',
    temin_dosya_id: null,
    tarih: '2026-10-17',
    tahmini_butce: 25000,
    notlar: 'Depo teslimi istenecektir.'
  }

  it('1. mapIhtiyacKalemToLuzumMuzekkeresiItem should map fields correctly and prioritize tasinir_kodu', () => {
    const item = mapIhtiyacKalemToLuzumMuzekkeresiItem(sampleKalem, 0)

    expect(item.siraNo).toBe(1)
    expect(item.kodu).toBe('150.01.02.03')
    expect(item.malzemeAdi).toBe('Çimento Portland CEM I 42.5')
    expect(item.ozelligi).toBe('50 kg torbalar halinde, TS EN 197-1 standardına uygun')
    expect(item.birimi).toBe('Torba')
    expect(item.kdvOrani).toBe(20)
    expect(item.miktar).toBe(100)
    expect(item.tahminiBirimFiyat).toBe(250)
    expect(item.satirTutari).toBe(25000)
    // Ayrı kodlar saklanmalı
    expect(item.tasinirKodu).toBe('150.01.02.03')
    expect(item.okasKodu).toBe('OKAS-445')
    expect(item.pozNo).toBe('POZ-04.001')
  })

  it('2. mapIhtiyacKalemToLuzumMuzekkeresiItem should fallback to okas_kodu then poz_no when tasinir_kodu missing', () => {
    const withoutTasinir = { ...sampleKalem, tasinir_kodu: null }
    const res1 = mapIhtiyacKalemToLuzumMuzekkeresiItem(withoutTasinir, 1)
    expect(res1.kodu).toBe('OKAS-445')

    const withoutOkas = { ...sampleKalem, tasinir_kodu: null, okas_kodu: null }
    const res2 = mapIhtiyacKalemToLuzumMuzekkeresiItem(withoutOkas, 1)
    expect(res2.kodu).toBe('POZ-04.001')
  })

  it('3. mapRaporToLuzumMuzekkeresiData should construct complete document payload for Luzum Muzekkeresi', () => {
    const doc = mapRaporToLuzumMuzekkeresiData(sampleRapor, [sampleKalem], {
      kurum_anteti: ['T.C.', 'DEVLET KURUMLARI GENEL MÜDÜRLÜĞÜ'],
      makam_adi: 'Genel Müdürlük Makamına'
    })

    expect(doc.antetSatirlari).toEqual(['T.C.', 'DEVLET KURUMLARI GENEL MÜDÜRLÜĞÜ'])
    expect(doc.dosyaKonusu).toBe('Ana Hizmet Binası Onarımı')
    expect(doc.raporNo).toBe('IR-2026/001')
    expect(doc.evrakSayisi).toBe('')
    expect(doc.sunulacakMakamAdi).toBe('Genel Müdürlük Makamına')
    expect(doc.talepEdenPersonelAdi).toBe('Ahmet Yılmaz')
    expect(doc.talepEdenPersonelUnvan).toBe('İnşaat Mühendisi')
    expect(doc.ihtiyacYeri).toBe('Destek Hizmetleri Dairesi')
    expect(doc.ihtiyacKalemleri.length).toBe(1)
    expect(doc.ihtiyacKalemleri[0].malzemeAdi).toBe('Çimento Portland CEM I 42.5')
  })

  it('4. mapIhtiyacKalemToTeminKalem should map to DATA_TeminKalem schema format', () => {
    const payload = mapIhtiyacKalemToTeminKalem(sampleKalem, 99, 3)

    expect(payload.temin_dosya_id).toBe(99)
    expect(payload.sira_no).toBe(3)
    expect(payload.kalem_adi).toBe('Çimento Portland CEM I 42.5')
    expect(payload.tipi).toBe('Mal')
    expect(payload.birim).toBe('Torba')
    expect(payload.miktar).toBe(100)
    expect(payload.kdv_orani).toBe(20)
    expect(payload.tasinir_kodu).toBe('150.01.02.03')
    expect(payload.okas_kodu).toBe('OKAS-445')
    expect(payload.poz_no).toBe('POZ-04.001')
    expect(payload.aciklama).toBe('50 kg torbalar halinde, TS EN 197-1 standardına uygun')
  })
})
