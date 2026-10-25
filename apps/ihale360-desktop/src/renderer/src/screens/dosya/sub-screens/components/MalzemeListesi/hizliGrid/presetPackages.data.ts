export interface PresetPackageItem {
  kalem_adi: string
  miktar: number
  birim: string
  aciklama: string
}

export interface PresetPackage {
  name: string
  tipi: string
  okas_kodu: string
  tasinir_kodu: string
  kdv: number
  birim: string
  items: PresetPackageItem[]
}

export const DEFAULT_UNITS = [
  'Adet',
  'Paket',
  'Kutu',
  'Koli',
  'Metre',
  'm²',
  'm³',
  'Kg',
  'Litre',
  'Takım',
  'Set',
  'Gün',
  'Ay',
  'Yıl'
]

export const PRESET_PACKAGES: PresetPackage[] = [
  {
    name: '📁 Kırtasiye Temel Paketi',
    tipi: 'Mal',
    okas_kodu: '30192700-6',
    tasinir_kodu: '150.01.01',
    kdv: 20,
    birim: 'Adet',
    items: [
      {
        kalem_adi: "A4 80 gr/m² Fotokopi Kağıdı (500'lü Paket)",
        miktar: 10,
        birim: 'Paket',
        aciklama: 'Beyaz 80 gr lazer yazıcı uyumlu'
      },
      {
        kalem_adi: "Telli Plastik Dosya (50'li Paket)",
        miktar: 2,
        birim: 'Paket',
        aciklama: 'Mavi/kırmızı telli standart dosya'
      },
      {
        kalem_adi: "Şeffaf Poşet Dosya A4 (100'lü Paket)",
        miktar: 5,
        birim: 'Paket',
        aciklama: 'Evrak koruma poşeti'
      },
      {
        kalem_adi: 'Geniş Klasör A4 Plastik Kaplı',
        miktar: 20,
        birim: 'Adet',
        aciklama: 'Mekanizmalı sırt etiketli'
      },
      {
        kalem_adi: "Mavi Tükenmez Kalem 0.7mm (50'li Kutu)",
        miktar: 1,
        birim: 'Kutu',
        aciklama: 'Akıcı yazım yağ bazlı mürekkep'
      },
      {
        kalem_adi: "Zımba Teli No:24/6 (1000'li Kutu)",
        miktar: 5,
        birim: 'Kutu',
        aciklama: 'Standart zımba makinesi teli'
      }
    ]
  },
  {
    name: '🧹 Temizlik & Hijyen Paketi',
    tipi: 'Mal',
    okas_kodu: '39830000-9',
    tasinir_kodu: '150.02.01',
    kdv: 20,
    birim: 'Adet',
    items: [
      {
        kalem_adi: 'Yoğun Kıvamlı Çamaşır Suyu (5 Lt)',
        miktar: 6,
        birim: 'Adet',
        aciklama: 'Hijyenik temizlik klor bazlı'
      },
      {
        kalem_adi: 'Sıvı El Sabunu Gliserinli (5 Lt)',
        miktar: 4,
        birim: 'Adet',
        aciklama: 'Dermatolojik testli antibakteriyel'
      },
      {
        kalem_adi: 'Z Katlama Havlu Kağıt (12 Paket)',
        miktar: 5,
        birim: 'Koli',
        aciklama: 'Çift katlı emici dispenser uyumlu'
      },
      {
        kalem_adi: 'Yüzey Temizleyici Çam Kokulu (5 Lt)',
        miktar: 4,
        birim: 'Adet',
        aciklama: 'Fayans ve mermer uyumlu leke bırakmaz'
      },
      {
        kalem_adi: 'Büyük Boy Çöp Torbası 80x110 (10 Rulo)',
        miktar: 10,
        birim: 'Rulo',
        aciklama: 'Siyah dayanıklı sızdırmaz'
      },
      {
        kalem_adi: 'Mikrofiber Genel Temizlik Bezi (40x40 cm 5li)',
        miktar: 4,
        birim: 'Paket',
        aciklama: 'Çizmez tüy bırakmaz'
      }
    ]
  },
  {
    name: '💻 Bilişim & Ofis Donanımı',
    tipi: 'Mal',
    okas_kodu: '30200000-1',
    tasinir_kodu: '255.02.01',
    kdv: 20,
    birim: 'Adet',
    items: [
      {
        kalem_adi: 'Kablosuz Klavye & Mouse Seti (Türkçe Q)',
        miktar: 5,
        birim: 'Set',
        aciklama: '2.4 GHz USB alıcılı pil dahil'
      },
      {
        kalem_adi: '24" IPS Full HD Çerçevesiz Monitör (HDMI/DP)',
        miktar: 3,
        birim: 'Adet',
        aciklama: '75Hz VESA uyumlu ofis monitörü'
      },
      {
        kalem_adi: 'Siyah Lazer Yazıcı Toneri (Muadil Yüksek Kapasite)',
        miktar: 4,
        birim: 'Adet',
        aciklama: 'Standart ofis yazıcısı uyumlu'
      },
      {
        kalem_adi: 'USB 3.0 Çoklayıcı Hub (4 Port Alüminyum Gövde)',
        miktar: 5,
        birim: 'Adet',
        aciklama: 'Aşırı akım korumalı'
      },
      {
        kalem_adi: 'Cat6 UTP Ağ Kablosu Fabrikasyon (3 Metre)',
        miktar: 10,
        birim: 'Adet',
        aciklama: 'Gigabit uyumlu RJ45 uçlu'
      }
    ]
  },
  {
    name: '🔧 Araç Bakım & Sarf Paketi',
    tipi: 'Mal',
    okas_kodu: '09211000-1',
    tasinir_kodu: '150.03.01',
    kdv: 20,
    birim: 'Adet',
    items: [
      {
        kalem_adi: 'Tam Sentetik Motor Yağı 5W-30 (4 Lt)',
        miktar: 4,
        birim: 'Kutu',
        aciklama: 'Dizel/benzinli partiküllü motor uyumlu'
      },
      {
        kalem_adi: 'Konsantre Dört Mevsim Cam Suyu -30°C (5 Lt)',
        miktar: 8,
        birim: 'Adet',
        aciklama: 'Antifrizli kireç önleyicili'
      },
      {
        kalem_adi: 'Kırmızı Organik Antifriz Konsantre (3 Lt)',
        miktar: 4,
        birim: 'Kutu',
        aciklama: 'Alüminyum radyatör uyumlu -56°C'
      },
      {
        kalem_adi: 'Balata & Fren Parça Temizleme Spreyi (500 ml)',
        miktar: 12,
        birim: 'Adet',
        aciklama: 'Kalıntı bırakmayan hızlı uçucu sprey'
      }
    ]
  }
]
