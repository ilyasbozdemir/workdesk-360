import { PresetData, RotaAdimi } from './types'

export const TURLER: RotaAdimi['t'][] = ['Hazırlayan', 'Paraf', 'İmza', 'Bilgi']

export const BASE_DATA = {
  antet: 'T.C.\nSAĞLIK BAKANLIĞI\nAnkara İl Sağlık Müdürlüğü\nDestek Hizmetleri Başkanlığı',
  yil: '2026',
  sayisi: '123',
  detsis: '98765432',
  adres: 'Mustafa Kemal Mah. Dumlupınar Blv. No:1 Çankaya/Ankara',
  web: 'www.saglik.gov.tr',
  eposta: 'ankara.destek@saglik.gov.tr',
  kep: 'saglikbakanligi@hs01.kep.tr',
  hazad: 'Ayşe Demir',
  hazun: 'V.H.K.İ.',
  haztel: '0312 555 44 33'
}

export const PRESETS: Record<'arastirma' | 'bos', PresetData> = {
  arastirma: {
    konu: 'Fiyat Araştırması',
    muhatap: 'Sayın İlgili,',
    aciklama:
      'Aşağıda cins ve miktarları belirtilen mal/hizmet kalemlerinin yaklaşık maliyet tespiti için piyasa araştırması yapılmaktadır, birim fiyatlarını KDV hariç bildirmenizi rica ederim/ederiz.',
    imzalar:
      'Komisyon Başkanı | Ahmet Yılmaz | Mühendis\nKomisyon Üyesi | Mehmet Karaca | Teknisyen\nKomisyon Üyesi | Ayşe Demir | Memur',
    kalemler:
      'A4 Fotokopi Kağıdı | 80 gr/m2 Beyaz | Kutu | 50\nTükenmez Kalem | Mavi Renk | Adet | 100',
    fiyat: true,
    firma: true,
    kurumici: false,
    ilgi: '',
    ek: '',
    gereg: '',
    bilgi: '',
    eimza: false
  },
  bos: {
    konu: '',
    muhatap: '',
    aciklama: '',
    imzalar: 'Daire Başkanı | Ad SOYAD | Unvan',
    kalemler: '',
    fiyat: false,
    firma: false,
    kurumici: false,
    ilgi: '',
    ek: '',
    gereg: '',
    bilgi: '',
    eimza: true
  }
}
