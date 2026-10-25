/**
 * dtExcelService.ts
 *
 * SheetJS (XLSX) kütüphanesini kullanarak Excel ve CSV dosyalarını
 * dosyalar.schema.json şemasına uygun modellere dönüştürür.
 */
import * as XLSX from 'xlsx'

export interface ColumnMapping {
  key: string
  etiket: string
  ornekler: string[]
}

export const EXCEL_ALANLARI: Record<string, ColumnMapping[]> = {
  malzeme: [
    { key: 'kod', etiket: 'Malzeme/Stok Kodu', ornekler: ['kod', 'malzeme kodu', 'stok kodu', 'barkod'] },
    { key: 'ad', etiket: 'Malzeme Adı / Cinsi', ornekler: ['ad', 'malzeme adi', 'cinsi', 'adi', 'malzeme'] },
    { key: 'aciklama', etiket: 'Açıklama / Özellik', ornekler: ['aciklama', 'ozellik', 'tanim', 'detay'] },
    { key: 'birim', etiket: 'Ölçü Birimi', ornekler: ['birim', 'olcu', 'olcu birimi'] },
    { key: 'kdvOrani', etiket: 'KDV Oranı (%)', ornekler: ['kdv', 'kdv orani', 'kdv %', 'vergi'] },
    { key: 'miktar', etiket: 'Miktar', ornekler: ['miktar', 'adet', 'sayi'] },
    { key: 'birimFiyat', etiket: 'Birim Fiyat', ornekler: ['birim fiyat', 'fiyat', 'tutar', 'yaklasik maliyet'] },
    { key: 'kazananFirma', etiket: 'Kazanan Firma', ornekler: ['kazanan', 'kazanan firma', 'yuklenici', 'firma'] },
    { key: 'tasinirKodu', etiket: 'Taşınır Kodu', ornekler: ['tasinir', 'tasinir kodu', 'tk'] },
    { key: 'okas', etiket: 'OKAS / CPV Kodu', ornekler: ['okas', 'cpv', 'okas kodu'] }
  ],
  firma: [
    { key: 'no', etiket: 'Firma / Cari No', ornekler: ['no', 'firma no', 'cari no', 'kod', 'vergi no'] },
    { key: 'unvan', etiket: 'Firma Unvanı', ornekler: ['unvan', 'firma unvani', 'ad', 'sirket adi'] },
    { key: 'ilet', etiket: 'İletişim (Tel/E-posta)', ornekler: ['ilet', 'iletisim', 'telefon', 'tel', 'e-posta', 'email'] },
    { key: 'yer', etiket: 'Adres / Semt / Şehir', ornekler: ['yer', 'adres', 'sehir', 'ilce', 'semt'] }
  ],
  katalog: [
    { key: 'kod', etiket: 'Ürün Kodu', ornekler: ['kod', 'urun kodu', 'barkod', 'stok kodu'] },
    { key: 'ad', etiket: 'Ürün Adı', ornekler: ['ad', 'urun adi', 'tanim'] },
    { key: 'tasinir', etiket: 'Taşınır Kodu / Türü', ornekler: ['tasinir', 'tasinir kodu'] },
    { key: 'okas', etiket: 'OKAS Kodu', ornekler: ['okas', 'cpv'] }
  ]
}

export function trTemizle(str: string): string {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '')
}

export function tahminEtEslesme(
  headers: string[],
  hedefTipi: 'malzeme' | 'firma' | 'katalog'
): Record<number, string> {
  const alanlar = EXCEL_ALANLARI[hedefTipi] || []
  const eslesme: Record<number, string> = {}

  headers.forEach((h, colIdx) => {
    const temizH = trTemizle(h)
    for (const a of alanlar) {
      for (const orn of a.ornekler) {
        if (temizH === trTemizle(orn)) {
          eslesme[colIdx] = a.key
          return
        }
      }
    }
    eslesme[colIdx] = ''
  })

  return eslesme
}

export function degerDonustur(val: unknown, tip: 'metin' | 'sayi' | 'tarih' = 'metin'): string {
  if (val === null || val === undefined) return ''
  let s = String(val).trim()
  if (!s) return ''

  // Tarih dönüştürme (gg.aa.yyyy veya gg/aa/yyyy -> YYYY-MM-DD)
  const mDate = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s)
  if (mDate) {
    const gun = ('0' + mDate[1]).slice(-2)
    const ay = ('0' + mDate[2]).slice(-2)
    const yil = mDate[3]
    return `${yil}-${ay}-${gun}`
  }

  // Ondalık sayı dönüştürme: "12,5" -> "12.5"
  if (/^-?\d+,\d+$/.test(s)) {
    s = s.replace(',', '.')
  }

  return s
}

export interface ExcelOnizlemeSonuc {
  toplamSatir: number
  onizleme: Array<{
    satirNo: number
    veri: Record<string, string>
    ham: unknown[]
  }>
  uyarilar: string[]
  hedefTipi: 'malzeme' | 'firma' | 'katalog'
}

export function onizlemeHesapla(
  rows: unknown[][],
  baslikSatirIdx: number,
  eslesme: Record<number, string>,
  hedefTipi: 'malzeme' | 'firma' | 'katalog'
): ExcelOnizlemeSonuc {
  const veriSatirlari = rows.slice(baslikSatirIdx + 1)
  const islenenler: ExcelOnizlemeSonuc['onizleme'] = []
  const uyarilar: string[] = []

  veriSatirlari.forEach((row, rIdx) => {
    let dolu = false
    for (let c = 0; c < row.length; c++) {
      if (String(row[c] || '').trim()) {
        dolu = true
        break
      }
    }
    if (!dolu) return

    const obj: Record<string, string> = {}
    Object.keys(eslesme).forEach((colStr) => {
      const colIdx = Number(colStr)
      const key = eslesme[colIdx]
      if (!key) return
      obj[key] = degerDonustur(row[colIdx])
    })

    if (hedefTipi === 'malzeme' && !obj.ad && !obj.kod) {
      uyarilar.push(`Satır ${rIdx + baslikSatirIdx + 2}: Malzeme adı veya kodu boş.`)
    }
    if (hedefTipi === 'firma' && !obj.unvan) {
      uyarilar.push(`Satır ${rIdx + baslikSatirIdx + 2}: Firma unvanı boş.`)
    }

    islenenler.push({
      satirNo: rIdx + baslikSatirIdx + 2,
      veri: obj,
      ham: row
    })
  })

  return {
    toplamSatir: islenenler.length,
    onizleme: islenenler.slice(0, 200),
    uyarilar,
    hedefTipi
  }
}
