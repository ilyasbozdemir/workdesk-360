import { ImzaciSatiri, IslakImzaBelgeBilgileri, SurecAsamasi } from './types'

export const INITIAL_BELGE_BILGILERI: IslakImzaBelgeBilgileri = {
  belgeTuru: 'Piyasa Fiyat Araştırma Tutanağı',
  konu: 'Doğrudan Temin Kapsamında Mal Alımı Fiyat Tespit Tutanağı',
  belgeSayisi: '2026/TEMİN-0142',
  muhatap: 'Destek Hizmetleri Dairesi Başkanlığı',
  hitap: 'Sayın Daire Başkanlığına',
  tarih: new Date().toISOString().split('T')[0],
  aciliyet: 'Normal',
  ekSayisi: 3,
  icerikGovde:
    'Yukarıda adı geçen doğrudan temin işlemine ilişkin yapılan piyasa fiyat araştırması neticesinde en avantajlı teklif veren firma belirlenmiş olup, komisyon üyelerince tanzim edilen işbu tutanak ıslak imza için onaya sunulmuştur.'
}

export const INITIAL_IMZACILAR: ImzaciSatiri[] = [
  {
    id: 'imz-1',
    sira: 1,
    adSoyad: 'Ahmet Yılmaz',
    unvan: 'Satınalma Görevlisi',
    imzaTipi: 'Hazırlayan',
    parafVar: true,
    imzaKutusuVar: true,
    tarihVar: true
  },
  {
    id: 'imz-2',
    sira: 2,
    adSoyad: 'Mehmet Demir',
    unvan: 'Şube Müdürü',
    imzaTipi: 'Kontrol',
    parafVar: true,
    imzaKutusuVar: true,
    tarihVar: true
  },
  {
    id: 'imz-3',
    sira: 3,
    adSoyad: 'İlyas Bozdemir',
    unvan: 'Harcama Yetkilisi',
    imzaTipi: 'Onay',
    parafVar: false,
    imzaKutusuVar: true,
    tarihVar: true
  }
]

export const INITIAL_SUREC_ASAMALARI: SurecAsamasi[] = [
  {
    durum: 'Taslak',
    etiket: 'Taslak Hazırlandı',
    tarih: '2026-10-14 09:30',
    not: 'Belge taslağı oluşturuldu ve imzacı rotası tanımlandı.',
    tamamlandi: true
  },
  {
    durum: 'CiktiAlindi',
    etiket: 'Çıktı Alındı',
    tarih: '2026-10-14 10:15',
    not: 'Lazer yazıcıdan A4 formatında 2 nüsha çıktı alındı.',
    tamamlandi: true
  },
  {
    durum: 'Imzada',
    etiket: 'İmzada (Fiziki Dolaşım)',
    tarih: '2026-10-14 11:00',
    not: 'Evrak Harcama Yetkilisi makamına imza dosyasıyla iletildi.',
    tamamlandi: false
  },
  {
    durum: 'ImzaliTeslimAlindi',
    etiket: 'İmzalı Teslim Alındı',
    not: 'Islak imzalı evrak teslim alınıp taranarak sisteme yüklenecek.',
    tamamlandi: false
  }
]

export const BELGE_TURU_SECENEKLERI = [
  'Piyasa Fiyat Araştırma Tutanağı',
  'Onay Belgesi (Olur)',
  'Lüzum Müzekkeresi',
  'Muayene ve Kabul Komisyon Tutanağı',
  'Sözleşme / Sipariş Mektubu',
  'Taşınır İstek Belgesi',
  'Harcama Talimatı'
]
