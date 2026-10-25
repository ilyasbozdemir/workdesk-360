import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookmarkCheck,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Plus,
  Printer,
  Scale,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Users
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useSettingsStore } from '../../../store/settingsStore'

export interface DigerGorevKaydi {
  id: string
  personelId: number
  gorevAdi: string
  kategori:
    | 'İdari'
    | 'Mali & Lojistik'
    | 'Teknik & Bilişim'
    | 'İSG & Güvenlik'
    | 'Basın & Halkla İlişkiler'
  makamOluru?: string
  tarih: string
}

interface PersonelGorevItem {
  id: number
  adSoyad: string
  unvan: string
  birim: string
  sicilNo: string
  istihdamTuru: '657_memur' | '4857_isci'
  komisyonSayisi: number
  nobetSayisi: number
  torenSayisi: number
  digerGorevSayisi: number
  digerGorevler: DigerGorevKaydi[]
  gorevListesi: string[]
  izinDurumu: 'gorevde' | 'izinde' | 'raporlu'
  izinDonusTarihi?: string
}

const HAZIR_KAMU_GOREV_SABLONLARI: Array<{
  gorevAdi: string
  kategori: DigerGorevKaydi['kategori']
  ornekOlur: string
  icon: string
}> = [
  {
    gorevAdi: 'EBYS & Resmî Yazışma Koordinatörü',
    kategori: 'İdari',
    ornekOlur: '2026/14 Sayılı Makam Oluru',
    icon: '📄'
  },
  {
    gorevAdi: 'Taşınır Kayıt ve Kontrol Yetkilisi (TİF)',
    kategori: 'Mali & Lojistik',
    ornekOlur: '5018 SK / 2026/08 Sayılı Görevlendirme',
    icon: '📦'
  },
  {
    gorevAdi: 'Kurum Web Sitesi & Basın / Sosyal Medya Sorumlusu',
    kategori: 'Basın & Halkla İlişkiler',
    ornekOlur: '2026/22 Sayılı İletişim Oluru',
    icon: '🌐'
  },
  {
    gorevAdi: 'İş Sağlığı ve Güvenliği (İSG) Saha Denetim Sorumlusu',
    kategori: 'İSG & Güvenlik',
    ornekOlur: '6331 SK / İSG Kurul Kararı No: 4',
    icon: '🦺'
  },
  {
    gorevAdi: 'Arşiv, Ayıklama ve İmha Komisyonu Sorumlusu',
    kategori: 'İdari',
    ornekOlur: 'Devlet Arşivleri Yön. / 2026-31 Kararı',
    icon: '📁'
  },
  {
    gorevAdi: 'Kurum Hizmet Aracı & Servis Sevk Amiri',
    kategori: 'Mali & Lojistik',
    ornekOlur: '237 SK / Taşıt İşletme Oluru 2026/05',
    icon: '🚐'
  },
  {
    gorevAdi: 'Kalite Yönetim Sistemi (KYS / ISO) ve İç Kontrol Temsilcisi',
    kategori: 'İdari',
    ornekOlur: 'İç Kontrol Eylem Planı 2026/19',
    icon: '📑'
  },
  {
    gorevAdi: 'Bilgi İşlem, Siber Güvenlik & Donanım İrtibat Yetkilisi',
    kategori: 'Teknik & Bilişim',
    ornekOlur: 'Bilgi Güvenliği Yönergesi 2026/11',
    icon: '💻'
  },
  {
    gorevAdi: 'CİMER ve Bilgi Edinme Başvuruları Koordinatörü',
    kategori: 'Basın & Halkla İlişkiler',
    ornekOlur: '4982 SK / CİMER Koordinasyon Oluru',
    icon: '📢'
  },
  {
    gorevAdi: 'Sivil Savunma, Afet & Tahliye Ekip Lideri',
    kategori: 'İSG & Güvenlik',
    ornekOlur: 'Afet ve Acil Durum Planı 2026/02',
    icon: '🚨'
  }
]

const MOCK_PERSONEL_GOREVLER: PersonelGorevItem[] = [
  {
    id: 1,
    adSoyad: 'Ahmet Yılmaz',
    unvan: 'V.H.K.İ. (Veri Hazırlama)',
    birim: 'İdari ve Mali İşler Servisi',
    sicilNo: 'TR-882910',
    istihdamTuru: '657_memur',
    komisyonSayisi: 2,
    nobetSayisi: 1,
    torenSayisi: 1,
    digerGorevSayisi: 1,
    digerGorevler: [
      {
        id: 'dg-1',
        personelId: 1,
        gorevAdi: 'Taşınır Kayıt ve Kontrol Yetkilisi (TİF)',
        kategori: 'Mali & Lojistik',
        makamOluru: '5018 SK / 2026/08 Sayılı Görevlendirme',
        tarih: '10.01.2026'
      }
    ],
    gorevListesi: [
      'Doğrudan Temin Piyasa Fiyat Araştırma Görevlisi',
      'Muayene ve Kabul Komisyonu (Asil Üye)',
      'Çarşamba İdari Bina Nöbetçisi',
      '29 Ekim Cumhuriyet Bayramı Tören Komitesi',
      'Taşınır Kayıt ve Kontrol Yetkilisi (TİF)'
    ],
    izinDurumu: 'gorevde'
  },
  {
    id: 2,
    adSoyad: 'Mehmet Demir',
    unvan: 'Mühendis (Teknik Hizmetler)',
    birim: 'Destek & Fen İşleri',
    sicilNo: 'TR-771920',
    istihdamTuru: '657_memur',
    komisyonSayisi: 3,
    nobetSayisi: 1,
    torenSayisi: 0,
    digerGorevSayisi: 1,
    digerGorevler: [
      {
        id: 'dg-2',
        personelId: 2,
        gorevAdi: 'EBYS & Resmî Yazışma Koordinatörü',
        kategori: 'İdari',
        makamOluru: '2026/14 Sayılı Makam Oluru',
        tarih: '05.02.2026'
      }
    ],
    gorevListesi: [
      'Yaklaşık Maliyet Tespit Komisyonu (Başkan)',
      'İhale Komisyonu (Asil Üye)',
      'Hasar Tespit & Kıymet Takdir Komisyonu',
      'Pazartesi Tesis Güvenlik Nöbeti',
      'EBYS & Resmî Yazışma Koordinatörü'
    ],
    izinDurumu: 'gorevde'
  },
  {
    id: 3,
    adSoyad: 'Mustafa Kaya',
    unvan: 'Sürekli İşçi (Teknisyen)',
    birim: 'Bakım Onarım & İntikal',
    sicilNo: 'İSC-40192',
    istihdamTuru: '4857_isci',
    komisyonSayisi: 1,
    nobetSayisi: 2,
    torenSayisi: 0,
    digerGorevSayisi: 1,
    digerGorevler: [
      {
        id: 'dg-3',
        personelId: 3,
        gorevAdi: 'Kurum Hizmet Aracı & Servis Sevk Amiri',
        kategori: 'Mali & Lojistik',
        makamOluru: '237 SK / Taşıt İşletme Oluru 2026/05',
        tarih: '15.01.2026'
      }
    ],
    gorevListesi: [
      'Taşınır Sayım ve Hurda Düşüm Komisyonu (Üye)',
      'Salı & Cuma Alan Nöbet Görevlisi',
      'Kurum Hizmet Aracı & Servis Sevk Amiri'
    ],
    izinDurumu: 'gorevde'
  },
  {
    id: 4,
    adSoyad: 'Zeynep Şahin',
    unvan: 'Şef / Büro Personeli',
    birim: 'Yazı İşleri & EBYS',
    sicilNo: 'TR-992014',
    istihdamTuru: '657_memur',
    komisyonSayisi: 1,
    nobetSayisi: 0,
    torenSayisi: 1,
    digerGorevSayisi: 1,
    digerGorevler: [
      {
        id: 'dg-4',
        personelId: 4,
        gorevAdi: 'CİMER ve Bilgi Edinme Başvuruları Koordinatörü',
        kategori: 'Basın & Halkla İlişkiler',
        makamOluru: '4982 SK / CİMER Koordinasyon Oluru',
        tarih: '02.01.2026'
      }
    ],
    gorevListesi: [
      'İş Sağlığı ve Güvenliği (İSG) Kurulu Sekreteryası',
      'Resmî Tören ve Protokol Karşılama',
      'CİMER ve Bilgi Edinme Başvuruları Koordinatörü'
    ],
    izinDurumu: 'izinde',
    izinDonusTarihi: '24 Ekim 2026'
  },
  {
    id: 5,
    adSoyad: 'Ali Çelik',
    unvan: 'Memur',
    birim: 'Stok ve Taşınır Kayıt',
    sicilNo: 'TR-619283',
    istihdamTuru: '657_memur',
    komisyonSayisi: 0,
    nobetSayisi: 0,
    torenSayisi: 0,
    digerGorevSayisi: 0,
    digerGorevler: [],
    gorevListesi: [],
    izinDurumu: 'gorevde'
  }
]

export const PersonelGorevDagilimiTab: React.FC = () => {
  const institutionName = useSettingsStore((s) => s.institutionName)
  const adminName = useSettingsStore((s) => s.adminName)
  const aktifKurumAdi = institutionName || 'T.C. İDARE BAŞKANLIĞI / DESTEK VE MALİ HİZMETLER'
  const aktifHarcamaYetkilisi = adminName || 'Harcama Yetkilisi / Birim Amiri'

  const [subTab, setSubTab] = useState<'matris' | 'diger_gorevler'>('matris')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDurum, setFilterDurum] = useState<
    'hepsi' | 'atanabilir' | 'dengeli' | 'yuksek' | 'izinde'
  >('hepsi')
  const [filterRejim, setFilterRejim] = useState<'hepsi' | '657_memur' | '4857_isci'>('hepsi')
  const [personeller, setPersoneller] = useState<PersonelGorevItem[]>(MOCK_PERSONEL_GOREVLER)
  const [seciliPersonel, setSeciliPersonel] = useState<PersonelGorevItem | null>(null)
  const [showA4Modal, setShowA4Modal] = useState(false)

  // Diğer Görev Ekleme Form State
  const [yeniGorevPersonelId, setYeniGorevPersonelId] = useState<number>(1)
  const [yeniGorevAdi, setYeniGorevAdi] = useState('')
  const [yeniGorevKategori, setYeniGorevKategori] = useState<DigerGorevKaydi['kategori']>('İdari')
  const [yeniGorevMakamOluru, setYeniGorevMakamOluru] = useState('')
  const [eklemeSuccess, setEklemeSuccess] = useState(false)

  // Metrikler
  const totalPersonel = personeller.length
  const totalKomisyonAtamasi = personeller.reduce((acc, p) => acc + p.komisyonSayisi, 0)
  const totalNobetGorevlisi = personeller.filter((p) => p.nobetSayisi > 0).length
  const totalDigerGorev = personeller.reduce((acc, p) => acc + p.digerGorevSayisi, 0)
  const atamaBekleyenler = personeller.filter(
    (p) => p.komisyonSayisi + p.nobetSayisi + p.torenSayisi + p.digerGorevSayisi === 0
  ).length

  // Tüm Diğer Görevler Düz Liste
  const allDigerGorevler = useMemo(() => {
    return personeller.flatMap((p) =>
      p.digerGorevler.map((g) => ({
        ...g,
        personelAdSoyad: p.adSoyad,
        personelUnvan: p.unvan,
        personelBirim: p.birim,
        personelRejim: p.istihdamTuru
      }))
    )
  }, [personeller])

  // Görev Ekleme
  const handleGorevEkle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!yeniGorevAdi.trim()) return

    const hedefPersonel = personeller.find((p) => p.id === yeniGorevPersonelId)
    if (!hedefPersonel) return

    const yeniKayit: DigerGorevKaydi = {
      id: `dg-${Date.now()}`,
      personelId: yeniGorevPersonelId,
      gorevAdi: yeniGorevAdi.trim(),
      kategori: yeniGorevKategori,
      makamOluru: yeniGorevMakamOluru.trim() || 'Makam Oluru',
      tarih: new Date().toLocaleDateString('tr-TR')
    }

    setPersoneller((prev) =>
      prev.map((p) => {
        if (p.id !== yeniGorevPersonelId) return p
        return {
          ...p,
          digerGorevSayisi: p.digerGorevSayisi + 1,
          digerGorevler: [yeniKayit, ...p.digerGorevler],
          gorevListesi: [...p.gorevListesi, yeniKayit.gorevAdi]
        }
      })
    )

    setYeniGorevAdi('')
    setYeniGorevMakamOluru('')
    setEklemeSuccess(true)
    setTimeout(() => setEklemeSuccess(false), 3000)
  }

  // Görev Silme
  const handleGorevSil = (personelId: number, gorevId: string, gorevAdi: string) => {
    setPersoneller((prev) =>
      prev.map((p) => {
        if (p.id !== personelId) return p
        return {
          ...p,
          digerGorevSayisi: Math.max(0, p.digerGorevSayisi - 1),
          digerGorevler: p.digerGorevler.filter((g) => g.id !== gorevId),
          gorevListesi: p.gorevListesi.filter((g) => g !== gorevAdi)
        }
      })
    )
  }

  // Şablon Seçme
  const handleSablonSec = (sablon: (typeof HAZIR_KAMU_GOREV_SABLONLARI)[number]) => {
    setYeniGorevAdi(sablon.gorevAdi)
    setYeniGorevKategori(sablon.kategori)
    setYeniGorevMakamOluru(sablon.ornekOlur)
  }

  // Filtreleme
  const filteredPersonel = useMemo(() => {
    return personeller.filter((p) => {
      const matchSearch =
        p.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.birim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sicilNo.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchSearch) return false

      if (filterRejim !== 'hepsi' && p.istihdamTuru !== filterRejim) {
        return false
      }

      const toplamGorev = p.komisyonSayisi + p.nobetSayisi + p.torenSayisi + p.digerGorevSayisi
      if (filterDurum === 'atanabilir' && toplamGorev > 0) return false
      if (filterDurum === 'dengeli' && (toplamGorev === 0 || toplamGorev > 2)) {
        return false
      }
      if (filterDurum === 'yuksek' && toplamGorev < 3) return false
      if (filterDurum === 'izinde' && p.izinDurumu === 'gorevde') return false

      return true
    })
  }, [personeller, searchTerm, filterDurum, filterRejim])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. ÜST İKİLİ SUB-NAVBAR & MAKAM ÇIKTISI BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('matris')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'matris'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>📊 Görev Dağılım Matrisi</span>
          </button>

          <button
            onClick={() => setSubTab('diger_gorevler')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'diger_gorevler'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-300" />
            <span>📋 Diğer Görevler</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                subTab === 'diger_gorevler'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
              }`}
            >
              {allDigerGorevler.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowA4Modal(true)}
            className="gap-2 bg-slate-800 hover:bg-slate-700 text-white shadow-xs rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>🏛️ Makam Onaylı Dağılım Çizelgesi</span>
          </Button>
        </div>
      </div>

      {/* SUB-TAB 1: GÖREV DAĞILIM MATRİSİ */}
      {subTab === 'matris' && (
        <div className="space-y-6">
          {/* ÜST BİLGİLENDİRME BANNER'I */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-blue-50 via-indigo-50/70 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Kurumsal Personel Görev Dağılımı & Ortak Görev Havuzu
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                TÜM KAMU KURUMLARI & İDARELER
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              Kurumunuzdaki personeli ekleyin; her birinin aldığı{' '}
              <strong className="text-blue-700 dark:text-blue-400 font-bold">kurul/komisyon</strong>
              ,{' '}
              <strong className="text-indigo-700 dark:text-indigo-400 font-bold">
                belirli gün & tören
              </strong>
              , <strong className="text-emerald-700 dark:text-emerald-400 font-bold">nöbet</strong>{' '}
              ve{' '}
              <strong className="text-amber-700 dark:text-amber-400 font-bold">
                diğer idari görev sayısı (TİF, EBYS, İSG vb.)
              </strong>{' '}
              otomatik burada görünür. Bu havuz <strong>Nöbet Çizelgesi</strong>,{' '}
              <strong>Personel İzin/Devam</strong> ve <strong>Satınalma Komisyonları</strong> ile
              ortaktır.
            </p>
          </div>

          {/* STAT KARTLARI */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Personel Havuzu
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {totalPersonel}
              </div>
              <div className="text-[10px] text-slate-400">Kayıtlı memur & işçi</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                Komisyon Görevleri
              </div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {totalKomisyonAtamasi}
              </div>
              <div className="text-[10px] text-slate-400">İhale, kabul, sayım</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Nöbet Görevlileri
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {totalNobetGorevlisi}
              </div>
              <div className="text-[10px] text-slate-400">Bina & alan nöbeti</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                Diğer İdari Görevler
              </div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                {totalDigerGorev}
              </div>
              <div className="text-[10px] text-slate-400">TİF, EBYS, İSG, Araç</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Görev Atanabilir
              </div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                {atamaBekleyenler}
              </div>
              <div className="text-[10px] text-slate-400">Henüz görev almayan</div>
            </div>
          </div>

          {/* ARAMA VE FİLTRELEME */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Personel adı, unvan, birim veya sicil no ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterDurum('hepsi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterDurum === 'hepsi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Tümü ({personeller.length})
                </button>
                <button
                  onClick={() => setFilterDurum('atanabilir')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterDurum === 'atanabilir'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Görev Atanabilir ({atamaBekleyenler})
                </button>
                <button
                  onClick={() => setFilterDurum('yuksek')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterDurum === 'yuksek'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Yüksek İş Yükü (3+)
                </button>
                <button
                  onClick={() => setFilterDurum('izinde')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterDurum === 'izinde'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  İzindekiler
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterRejim('hepsi')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  filterRejim === 'hepsi'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                Tüm Rejimler
              </button>
              <button
                onClick={() => setFilterRejim('657_memur')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  filterRejim === '657_memur'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                657 Memur
              </button>
              <button
                onClick={() => setFilterRejim('4857_isci')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  filterRejim === '4857_isci'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                4857 İşçi
              </button>
            </div>
          </div>

          {/* MATRİS TABLOSU */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="py-3 px-4">Personel Bilgisi</th>
                    <th className="py-3 px-3">İstihdam Rejimi</th>
                    <th className="py-3 px-3">Kurul & Komisyon</th>
                    <th className="py-3 px-3">Nöbet Görevi</th>
                    <th className="py-3 px-3">Tören & Koordinasyon</th>
                    <th className="py-3 px-3">📋 Diğer Görevler</th>
                    <th className="py-3 px-3">Toplam Görev</th>
                    <th className="py-3 px-3">İzin / Devam</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredPersonel.map((personel) => {
                    const toplamGorev =
                      personel.komisyonSayisi +
                      personel.nobetSayisi +
                      personel.torenSayisi +
                      personel.digerGorevSayisi

                    return (
                      <tr
                        key={personel.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {personel.adSoyad}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {personel.unvan} ·{' '}
                            <span className="font-mono text-[10px]">{personel.sicilNo}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{personel.birim}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              personel.istihdamTuru === '657_memur'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {personel.istihdamTuru === '657_memur' ? '657 MEMUR' : '4857 İŞÇİ'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {personel.komisyonSayisi > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <Building className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{personel.komisyonSayisi} Komisyon</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Yok</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {personel.nobetSayisi > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Shield className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{personel.nobetSayisi} Nöbet</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Yok</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {personel.torenSayisi > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Calendar className="w-3.5 h-3.5 text-purple-500" />
                              <span>{personel.torenSayisi} Tören</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>

                        {/* DİĞER GÖREVLER SÜTUNU */}
                        <td className="py-3 px-3">
                          {personel.digerGorevler.length > 0 ? (
                            <div className="flex flex-col gap-1 max-w-xs">
                              {personel.digerGorevler.map((g) => (
                                <span
                                  key={g.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate"
                                  title={`${g.gorevAdi} (${g.makamOluru || ''})`}
                                >
                                  <Tag className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                                  <span className="truncate">{g.gorevAdi}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setYeniGorevPersonelId(personel.id)
                                setSubTab('diger_gorevler')
                              }}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Görev Ekle
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                toplamGorev === 0
                                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  : toplamGorev <= 2
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold'
                              }`}
                            >
                              {toplamGorev} Görev
                            </span>
                            {toplamGorev >= 3 && (
                              <span
                                title="Personel üzerinde 3'ten fazla aktif görev var; yeni görev atamalarında öncelik sırasını değiştirin."
                                className="cursor-help"
                              >
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {personel.izinDurumu === 'gorevde' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Görevinin Başında
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                              <Clock className="w-3.5 h-3.5" />
                              İzinde ({personel.izinDonusTarihi} dönüş)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSeciliPersonel(personel)
                              setShowA4Modal(true)
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                          >
                            Tebliğ & Yazdır
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REFERANS GÖRSELDEKİ "DİĞER GÖREVLER" ALANI */}
      {subTab === 'diger_gorevler' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BAŞLIK */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📋</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Diğer Görevler</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Kayıtlı Özel / İdari Sorumluluk:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono">
                {allDigerGorevler.length} Atama
              </span>
            </div>
          </div>

          {/* REFERANS GÖRSELDEKİ BİLGİ KUTUSU (Mavi Kart Birebir Uyarlandı) */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 pl-5 relative overflow-hidden flex items-start gap-3.5 shadow-xs">
            <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-blue-600 rounded-l" />
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Buraya{' '}
              <strong className="text-blue-900 dark:text-blue-300 font-bold">
                kurul-komisyon, belirli gün ve törenler, nöbet
              </strong>{' '}
              dışında kalan kurumsal idari ve teknik görevleri yazabilir veya aşağıdaki hazır
              şablonlardan seçebilirsiniz —{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                EBYS resmî yazışma koordinatörü, taşınır kayıt (TİF) yetkilisi, kurum web sitesi &
                sosyal medya sorumluluğu, İSG saha denetimi, arşiv/ayıklama komisyonu, araç & servis
                filo amirliği, kalite (ISO/KYS) yönetimi, CİMER koordinasyonu
              </span>{' '}
              gibi. Girdiğiniz görevler{' '}
              <strong className="text-blue-900 dark:text-blue-300 font-bold">
                Personel Görev Dağılımı
              </strong>{' '}
              ve{' '}
              <strong className="text-blue-900 dark:text-blue-300 font-bold">
                Makam Onaylı Dağılım Çizelgesi
              </strong>{' '}
              ekranlarına da otomatik yansır.
            </div>
          </div>

          {/* HAZIR KAMU GÖREV ŞABLONLARI ÇİPLERİ */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-indigo-500" />
              <span>Hızlı Seçim: Hazır Kurumsal Görev Şablonları</span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Tıklayarak forma otomatik aktarın)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {HAZIR_KAMU_GOREV_SABLONLARI.map((sablon, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSablonSec(sablon)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{sablon.icon}</span>
                  <span>{sablon.gorevAdi}</span>
                </button>
              ))}
            </div>
          </div>

          {/* YENİ DİĞER GÖREV ATAMA FORMU */}
          <form
            onSubmit={handleGorevEkle}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Personele Yeni İdari / Özel Görev Tanımla & Yetkilendir</span>
              </div>
              {eklemeSuccess && (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Görev başarıyla personele atandı ve çizelgeye yansıtıldı!
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Personel Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Görevlendirilecek Personel *
                </label>
                <select
                  value={yeniGorevPersonelId}
                  onChange={(e) => setYeniGorevPersonelId(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {personeller.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.adSoyad} ({p.unvan} - {p.birim})
                    </option>
                  ))}
                </select>
              </div>

              {/* Görev Adı */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Görev Tanımı / Unvanı *
                </label>
                <Input
                  type="text"
                  placeholder="Örn: Taşınır Kayıt ve Kontrol Yetkilisi (TİF) veya Web Sorumlusu..."
                  value={yeniGorevAdi}
                  onChange={(e) => setYeniGorevAdi(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Görev Kategorisi
                </label>
                <select
                  value={yeniGorevKategori}
                  onChange={(e) =>
                    setYeniGorevKategori(e.target.value as DigerGorevKaydi['kategori'])
                  }
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="İdari">İdari</option>
                  <option value="Mali & Lojistik">Mali & Lojistik</option>
                  <option value="Teknik & Bilişim">Teknik & Bilişim</option>
                  <option value="İSG & Güvenlik">İSG & Güvenlik</option>
                  <option value="Basın & Halkla İlişkiler">Basın & Halkla İlişkiler</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Yetki Dayanağı / Makam Oluru No (Opsiyonel)
                </label>
                <Input
                  type="text"
                  placeholder="Örn: 5018 SK / 2026/08 Sayılı Makam Oluru veya Kurul Kararı..."
                  value={yeniGorevMakamOluru}
                  onChange={(e) => setYeniGorevMakamOluru(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Görevi Ata ve Kaydet</span>
                </Button>
              </div>
            </div>
          </form>

          {/* AKTİF DİĞER GÖREVLER LİSTESİ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Kurum Bünyesinde Atanmış Özel ve İdari Görevler</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Silinen görevler anında matristen ve makam çıktısından düşülür.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="py-3 px-4">Personel</th>
                    <th className="py-3 px-3">Görevlendirme Tanımı</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Makam Oluru / Dayanak</th>
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {allDigerGorevler.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Henüz özel veya idari bir görev kaydı girilmemiş. Yukarıdaki formdan ekleme
                        yapabilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    allDigerGorevler.map((g) => (
                      <tr
                        key={g.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {g.personelAdSoyad}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {g.personelUnvan} · {g.personelBirim}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {g.gorevAdi}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {g.kategori}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                          {g.makamOluru || '-'}
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">{g.tarih}</td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleGorevSil(g.personelId, g.id, g.gorevAdi)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Görevi İptal Et"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. A4 RESMÎ GÖREV DAĞILIM VE TEBLİĞ ÇİZELGESİ MODALI */}
      {showA4Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Resmî Makam Onaylı Kurum Görev Dağılım Çizelgesi
                {seciliPersonel && ` (${seciliPersonel.adSoyad})`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Yazdır / PDF
                </button>
                <button
                  onClick={() => {
                    setSeciliPersonel(null)
                    setShowA4Modal(false)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 font-serif text-slate-900 dark:text-slate-100 text-xs leading-relaxed space-y-6">
              {/* T.C. Antet */}
              <div className="text-center space-y-1 border-b pb-4">
                <div className="font-bold text-sm tracking-widest uppercase">T.C.</div>
                <div className="font-extrabold text-xs uppercase">{aktifKurumAdi}</div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  2026-2027 İDARİ VE MALİ DÖNEMİ PERSONEL GÖREV, KOMİSYON VE NÖBET DAĞILIM ÇİZELGESİ
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <strong>Sayı:</strong> E-92847102-903.07-2026/89
                </div>
                <div>
                  <strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}
                </div>
              </div>

              <p className="text-justify text-[11px] indent-6 leading-relaxed">
                5018 Sayılı Kamu Malî Yönetimi ve Kontrol Kanunu, 4734 Sayılı Kamu İhale Kanunu ve
                ilgili mevzuat hükümleri uyarınca, kurumumuz bünyesinde yürütülen komisyon, nöbet,
                resmî tören ve diğer kurumsal idari görevlendirmelere (TİF, EBYS, İSG vb.) ait yetki
                ve sorumluluklar aşağıda belirtilen personellere tevdi edilmiş olup gereği için
                tebliğ olunur.
              </p>

              <table className="w-full border border-slate-400 text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-400 font-bold text-center">
                    <th className="p-2 border-r border-slate-400 w-12">S.No</th>
                    <th className="p-2 border-r border-slate-400 w-44">Adı Soyadı & Unvanı</th>
                    <th className="p-2 border-r border-slate-400">Tevdi Edilen Resmî Görevler</th>
                    <th className="p-2 w-24">Tebellüğ İmzası</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {(seciliPersonel ? [seciliPersonel] : personeller).map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-400">
                      <td className="p-2 text-center border-r border-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-400 font-bold">
                        {p.adSoyad}
                        <div className="font-normal text-[9px] text-slate-500">{p.unvan}</div>
                      </td>
                      <td className="p-2 border-r border-slate-400">
                        {p.gorevListesi.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5">
                            {p.gorevListesi.map((g, gIdx) => (
                              <li key={gIdx}>{g}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-slate-400">
                            Genel idari büro işleri yürütülmektedir.
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center align-bottom text-[9px] text-slate-400 font-sans">
                        İmza
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-300 dark:border-slate-700 pt-6 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  UYGUNDUR
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date().toLocaleDateString('tr-TR')}
                </div>
                <div className="pt-6 font-bold text-xs">{aktifHarcamaYetkilisi}</div>
                <div className="text-[10px] text-slate-500 font-sans">
                  Harcama Yetkilisi / Birim Amiri (Mühür ve İmza)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
