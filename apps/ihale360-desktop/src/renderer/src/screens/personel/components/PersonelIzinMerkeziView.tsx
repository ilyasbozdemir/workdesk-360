import React, { useState, useMemo } from 'react'
import {
  Clock,
  FileCheck2,
  Printer,
  Sparkles,
  Info,
  Scale,
  PlusCircle,
  CheckCircle2,
  Download
} from 'lucide-react'
import { Personel } from '../personel.hooks'
import { useSettingsStore } from '../../../store/settingsStore'

interface PersonelIzinMerkeziViewProps {
  personelList: Personel[]
  kurumAdi?: string
  harcamaYetkilisiAdi?: string
}

type IzinTuru =
  | 'yillik'
  | 'mazeret_evlilik'
  | 'mazeret_vefat'
  | 'mazeret_babalik'
  | 'saglik_tek_hekim'
  | 'saglik_heyet'
  | 'refakat'
  | 'idari_izin'

interface IzinKaydi {
  id: string
  personelId: number
  personelAdi: string
  unvan: string
  rejim: '657_memur' | '4857_isci'
  izinTuru: IzinTuru
  baslangicTarihi: string
  bitisTarihi: string
  gunSayisi: number
  vekilPersonel: string
  onayDurumu: 'onaylandi' | 'beklemede' | 'reddedildi'
  aciklama: string
}

const HAZIR_MATBU_IZIN_FORMLARI = [
  {
    id: 'f-657-yillik',
    ad: '657 Yıllık İzin Talep Dilekçesi',
    tur: 'yillik' as IzinTuru,
    rejim: '657_memur' as const,
    gun: 10,
    aciklama: '657 Sayılı Kanun m.102 gereğince yıllık izin talebi',
    ipucu:
      '657 DMK m.102: Hizmeti 1-10 yıl olanlara 20, 10 yıldan fazla olanlara 30 takvim günü verilir. Hafta sonu izin süresine dahildir.'
  },
  {
    id: 'f-4857-ucretli',
    ad: '4857 İşçi Ücretli İzin Cetveli',
    tur: 'yillik' as IzinTuru,
    rejim: '4857_isci' as const,
    gun: 14,
    aciklama: '4857 Sayılı İş Kanunu m.53 gereğince yıllık ücretli izin',
    ipucu:
      '4857 İş Kanunu m.53: Kıdem 1-5 yıl: 14, 5-15 yıl: 20, 15+ yıl: 26 iş günüdür. Hafta tatili (Pazar) ve akdi tatiller düşülmez.'
  },
  {
    id: 'f-mazeret-evlilik',
    ad: 'Evlilik / Düğün Mazeret İzni',
    tur: 'mazeret_evlilik' as IzinTuru,
    rejim: '657_memur' as const,
    gun: 7,
    aciklama: 'Memurun kendisinin veya çocuğunun evlenmesi halinde mazeret izni',
    ipucu:
      '657 DMK m.104/B: Memura kendisinin veya çocuğunun evlenmesi halinde 7 gün mazeret izni verilir. 4857 SK için 3 iş günüdür.'
  },
  {
    id: 'f-mazeret-vefat',
    ad: 'Ölüm / Taziye Mazeret İzni',
    tur: 'mazeret_vefat' as IzinTuru,
    rejim: '657_memur' as const,
    gun: 7,
    aciklama: 'Birinci derece yakının vefatı nedeniyle mazeret izni',
    ipucu: '657 DMK m.104/A: Eş, çocuk, anne, baba, kardeş vefatında 7 takvim günü izin verilir.'
  },
  {
    id: 'f-saglik-rapor',
    ad: 'Tek Hekim İstirahat Raporu İntikal Yazısı',
    tur: 'saglik_tek_hekim' as IzinTuru,
    rejim: '657_memur' as const,
    gun: 5,
    aciklama: 'Aile hekimi veya uzman hekim istirahat raporunun izne çevrilmesi',
    ipucu:
      '657 DMK m.105: Tek hekim tek seferde en çok 10 gün rapor verebilir; rapordan itibaren en geç ertesi gün kuruma intikal ettirilmelidir.'
  },
  {
    id: 'f-vekalet-onay',
    ad: 'Görev Devir-Teslim ve Vekalet Onayı',
    tur: 'idari_izin' as IzinTuru,
    rejim: '657_memur' as const,
    gun: 1,
    aciklama: 'İzin süresince imza ve birim sorumluluğunun devri',
    ipucu:
      'Kamu idarelerinde amir veya şef izinli iken harcama ve resmi evrak işlemlerinin aksamaması için vekil personel belirlenir.'
  }
]

const MOCK_IZINLER: IzinKaydi[] = [
  {
    id: 'IZN-001',
    personelId: 1,
    personelAdi: 'Ahmet Yılmaz',
    unvan: 'V.H.K.İ. (657 DMK)',
    rejim: '657_memur',
    izinTuru: 'yillik',
    baslangicTarihi: '2026-10-18',
    bitisTarihi: '2026-10-25',
    gunSayisi: 8,
    vekilPersonel: 'Mehmet Demir (Şef)',
    onayDurumu: 'onaylandi',
    aciklama: 'Yıllık izin hakkının 1. dilimi'
  },
  {
    id: 'IZN-002',
    personelId: 2,
    personelAdi: 'Mustafa Kaya',
    unvan: 'Sürekli İşçi (Teknisyen - 4857)',
    rejim: '4857_isci',
    izinTuru: 'yillik',
    baslangicTarihi: '2026-10-20',
    bitisTarihi: '2026-10-27',
    gunSayisi: 6, // İş günü
    vekilPersonel: 'Ali Çelik (Sürekli İşçi)',
    onayDurumu: 'onaylandi',
    aciklama: 'Yıllık ücretli izin (Pazar ve Cumartesi akdi tatil düşülmüştür)'
  },
  {
    id: 'IZN-003',
    personelId: 3,
    personelAdi: 'Zeynep Şahin',
    unvan: 'Mühendis (Teknik Hizmetler - 657 DMK)',
    rejim: '657_memur',
    izinTuru: 'saglik_tek_hekim',
    baslangicTarihi: '2026-10-14',
    bitisTarihi: '2026-10-17',
    gunSayisi: 4,
    vekilPersonel: 'Derya Korkmaz',
    onayDurumu: 'onaylandi',
    aciklama: 'Tek Hekim İstirahat Raporu İntikali'
  }
]

export const PersonelIzinMerkeziView: React.FC<PersonelIzinMerkeziViewProps> = ({
  personelList,
  kurumAdi,
  harcamaYetkilisiAdi
}) => {
  const storeInstitutionName = useSettingsStore((s) => s.institutionName)
  const storeAdminName = useSettingsStore((s) => s.adminName)
  const aktifKurumAdi = kurumAdi || storeInstitutionName || 'T.C. KAMU İDARESİ BAŞKANLIĞI'
  const aktifHarcamaYetkilisi =
    harcamaYetkilisiAdi || storeAdminName || 'Harcama Yetkilisi / Kurum Amiri'

  const [activeRejimTab, setActiveRejimTab] = useState<'hepsi' | '657_memur' | '4857_isci'>('hepsi')
  const [seciliPersonelId, setSeciliPersonelId] = useState<number | string>(
    personelList[0]?.id || 1
  )
  const [izinTuru, setIzinTuru] = useState<IzinTuru>('yillik')
  const [baslangicTarihi, setBaslangicTarihi] = useState('2026-10-20')
  const [gunSayisi, setGunSayisi] = useState(5)
  const [vekilPersonel, setVekilPersonel] = useState('Mehmet Demir')
  const [gorevYeriAdresi, setGorevYeriAdresi] = useState('İkametgah Adresi')
  const [aciklama, setAciklama] = useState('Yıllık izin talebi')
  const [kayitlar, setKayitlar] = useState<IzinKaydi[]>(MOCK_IZINLER)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [seciliFormIpucu, setSeciliFormIpucu] = useState<string | null>(null)

  // Seçilen personel bilgisi
  const seciliPersonel = useMemo(() => {
    return (
      personelList.find((p) => p.id === Number(seciliPersonelId)) || {
        id: Number(seciliPersonelId) || 1,
        ad_soyad: 'Ahmet Yılmaz',
        unvan: 'V.H.K.İ. (Veri Hazırlama)',
        sicil_no: 'TR-884920',
        birim: 'İdari ve Mali İşler Şubesi'
      }
    )
  }, [personelList, seciliPersonelId])

  // Rejim tespiti (unvan içinde 'işçi' veya 'sürekli' geçiyorsa 4857, yoksa 657)
  const personelRejimi: '657_memur' | '4857_isci' = useMemo(() => {
    const unvan = (seciliPersonel.unvan || '').toLowerCase()
    if (unvan.includes('işçi') || unvan.includes('surekli') || unvan.includes('tasaron')) {
      return '4857_isci'
    }
    return '657_memur'
  }, [seciliPersonel])

  // Mevzuat hak ediş özeti
  const hakEdisBilgisi = useMemo(() => {
    if (personelRejimi === '657_memur') {
      return {
        kanun: '657 Sayılı Devlet Memurları Kanunu m.102-108',
        yillikHak: 'Hizmeti 1-10 yıl: 20 Gün | 10 Yıldan Fazla: 30 Gün',
        devirKurali: 'Önceki yıldan devreden izin cari yılda kullanılır, 2. yıl sonunda yanar.',
        mazeretler: 'Babalık: 10 gün | Evlilik: 7 gün | Vefat: 7 gün',
        hesapTuru: 'Takvim Günü (Hafta sonları izin süresine dahildir)'
      }
    }
    return {
      kanun: '4857 Sayılı İş Kanunu m.53-60 (Sürekli İşçiler)',
      yillikHak: '1-5 Yıl: 14 İş Günü | 5-15 Yıl: 20 İş Günü | 15+ Yıl: 26 İş Günü',
      devirKurali: 'Kullanılmayan izin ücreti fesih halinde son ücretten ödenir.',
      mazeretler: 'Evlilik: 3 iş günü | Vefat: 3 iş günü | Babalık: 5 iş günü',
      hesapTuru: 'İş Günü Esası (Hafta tatili Pazar ve akdi tatiller izin gününden DÜŞÜLMEZ)'
    }
  }, [personelRejimi])

  // İzin Başvurusu Ekle
  const handleIzinKaydet = (e: React.FormEvent): void => {
    e.preventDefault()
    const yeniKayit: IzinKaydi = {
      id: `IZN-${String(kayitlar.length + 1).padStart(3, '0')}`,
      personelId: Number(seciliPersonel.id),
      personelAdi: seciliPersonel.ad_soyad,
      unvan: seciliPersonel.unvan || 'Personel',
      rejim: personelRejimi,
      izinTuru,
      baslangicTarihi,
      bitisTarihi: '2026-10-27',
      gunSayisi,
      vekilPersonel,
      onayDurumu: 'onaylandi',
      aciklama
    }
    setKayitlar([yeniKayit, ...kayitlar])
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const filtrelenmisKayitlar = useMemo(() => {
    if (activeRejimTab === 'hepsi') return kayitlar
    return kayitlar.filter((k) => k.rejim === activeRejimTab)
  }, [kayitlar, activeRejimTab])

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-16">
      {/* Üst Bilgi Kartı & İdareci Raconu */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
              🏛️ İDARİ İŞLER & MEVZUAT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
              657 DMK + 4857 İŞ KANUNU
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-blue-400" />
            Personel İzin & Rapor Takip Merkezi
          </h2>
          <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
            Memurların takvim günü esasına göre 657 Sayılı Kanun, sürekli işçilerin ise iş günü
            esasına göre 4857 Sayılı İş Kanunu mevzuatına uygun izin hak edişleri, resmi onay
            belgeleri ve canlı A4 dilekçe üretimi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-sky-300" />
            <span>Resmî Formu Yazdır</span>
          </button>
        </div>
      </div>

      {showSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          İzin kaydı başarıyla oluşturuldu ve resmî onay belgesine aktarıldı.
        </div>
      )}

      {/* İki Bölmeli Ana Alan (Sol: Form ve Mevzuat Denetleyicisi, Sağ: Canlı A4 Onay Formu Simülatörü) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL: 7 Kolon - İzin Giriş Formu ve Mevzuat Paneli */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mevzuat Raconu Bilgi Kartı */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                Mevzuat Kuralları ({hakEdisBilgisi.kanun})
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  personelRejimi === '657_memur'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {personelRejimi === '657_memur' ? '657 MEMUR REJİMİ' : '4857 İŞÇİ REJİMİ'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950">
                <div className="text-[10px] text-slate-500 font-bold">YILLIK İZİN HAKKI:</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {hakEdisBilgisi.yillikHak}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950">
                <div className="text-[10px] text-slate-500 font-bold">HESAPLAMA METODU:</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {hakEdisBilgisi.hesapTuru}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-snug">
              📌 <strong>Mazeretler:</strong> {hakEdisBilgisi.mazeretler}
            </div>
          </div>

          {/* Hızlı Matbu İzin Formları & Kalıpları (Referans Tasarıma Göre Chip Butonlar) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Kurumsal Matbu İzin Şablonları & Hızlı Doldurma</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                Tıklayarak formu doldurun
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {HAZIR_MATBU_IZIN_FORMLARI.map((form) => {
                const isActive = form.tur === izinTuru
                return (
                  <div
                    key={form.id}
                    className={`inline-flex items-center rounded-xl border transition-all p-1 shadow-xs group ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIzinTuru(form.tur)
                        setGunSayisi(form.gun)
                        setAciklama(form.aciklama)
                        setSeciliFormIpucu(form.ipucu)
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'}`}
                      />
                      <span>{form.ad}</span>
                    </button>
                    <button
                      type="button"
                      title="Mevzuat Bilgisini Göster"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSeciliFormIpucu(seciliFormIpucu === form.ipucu ? null : form.ipucu)
                      }}
                      className="px-1.5 py-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
            {seciliFormIpucu && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300 flex items-start justify-between gap-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mevzuat Uyarısı: </span>
                    <span>{seciliFormIpucu}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSeciliFormIpucu(null)}
                  className="text-blue-400 hover:text-blue-700 text-xs font-bold px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* İzin Formu */}
          <form
            onSubmit={handleIzinKaydet}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              Yeni İzin / Rapor Kaydı Oluştur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Personel Seçin
                </label>
                <select
                  value={seciliPersonelId}
                  onChange={(e) => setSeciliPersonelId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {personelList.length > 0 ? (
                    personelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ad_soyad} ({p.unvan || 'Kadro'})
                      </option>
                    ))
                  ) : (
                    <option value={1}>Ahmet Yılmaz (V.H.K.İ. - 657)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  İzin / Rapor Türü
                </label>
                <select
                  value={izinTuru}
                  onChange={(e) => setIzinTuru(e.target.value as IzinTuru)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="yillik">Yıllık İzin (Hakkından Mahsuben)</option>
                  <option value="mazeret_babalik">Mazeret: Babalık İzni</option>
                  <option value="mazeret_evlilik">Mazeret: Evlilik İzni</option>
                  <option value="mazeret_vefat">Mazeret: Ölüm / Vefat İzni</option>
                  <option value="saglik_tek_hekim">Sağlık: Tek Hekim İstirahat Raporu</option>
                  <option value="saglik_heyet">Sağlık: Heyet / Kurul Raporu</option>
                  <option value="refakat">Refakat İzni (Hayati Bakım)</option>
                  <option value="idari_izin">İdari İzin / Valilik Genelgesi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gün Sayısı
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={gunSayisi}
                  onChange={(e) => setGunSayisi(Number(e.target.value))}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vekil Personel
                </label>
                <input
                  type="text"
                  value={vekilPersonel}
                  onChange={(e) => setVekilPersonel(e.target.value)}
                  placeholder="Görevi devralan personel"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                İzindeki Adres & İrtibat
              </label>
              <input
                type="text"
                value={gorevYeriAdresi}
                onChange={(e) => setGorevYeriAdresi(e.target.value)}
                placeholder="İznini geçireceği açık adres ve telefon"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gerekçe / Açıklama
              </label>
              <input
                type="text"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Örn: 2026 yılı 1. dönem yıllık izin talebi"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>İzin Belgesini Onayla ve Kaydet</span>
            </button>
          </form>

          {/* İzin Geçmişi Tablosu */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Kurum İzin & Rapor Takip Listesi
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveRejimTab('hepsi')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    activeRejimTab === 'hepsi'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tümü ({kayitlar.length})
                </button>
                <button
                  onClick={() => setActiveRejimTab('657_memur')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    activeRejimTab === '657_memur'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  657 Memur
                </button>
                <button
                  onClick={() => setActiveRejimTab('4857_isci')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    activeRejimTab === '4857_isci'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4857 İşçi
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-2">Personel</th>
                    <th className="py-2 px-2">Rejim</th>
                    <th className="py-2 px-2">İzin Türü</th>
                    <th className="py-2 px-2">Süre</th>
                    <th className="py-2 px-2">Vekil</th>
                    <th className="py-2 px-2">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtrelenmisKayitlar.map((kayit) => (
                    <tr
                      key={kayit.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {kayit.personelAdi}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{kayit.unvan}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            kayit.rejim === '657_memur'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {kayit.rejim === '657_memur' ? '657 DMK' : '4857 İŞÇİ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-medium capitalize">
                        {kayit.izinTuru.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-2 font-bold text-indigo-600 dark:text-indigo-400">
                        {kayit.gunSayisi} Gün
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                        {kayit.vekilPersonel}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Onaylandı
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SAĞ: 6 Kolon - Canlı Resmî A4 İzin Belgesi Simülasyonu */}
        <div className="lg:col-span-6 sticky top-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-2xl space-y-6 font-serif text-slate-900 dark:text-slate-100 text-xs leading-relaxed max-w-[595px] mx-auto print:shadow-none print:border-none print:p-0">
            {/* T.C. Antet */}
            <div className="text-center space-y-1 border-b pb-4">
              <div className="font-bold text-sm tracking-widest uppercase">T.C.</div>
              <div className="font-extrabold text-xs uppercase">{aktifKurumAdi}</div>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {personelRejimi === '657_memur'
                  ? '657 SAYILI KANUN GEREĞİNCE RESMÎ İZİN FORMU'
                  : '4857 SAYILI İŞ KANUNU GEREĞİNCE ÜCRETLİ İZİN FORMU'}
              </div>
            </div>

            {/* Belge Sayı & Tarih */}
            <div className="flex justify-between text-[11px]">
              <div>
                <strong>Sayı:</strong> E-92847102-903.02-2026/142
              </div>
              <div>
                <strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>

            {/* İlgili Makam */}
            <div className="text-center font-bold text-sm uppercase py-2">
              {aktifKurumAdi} MÜDÜRLÜĞÜNE / HARCAMA YETKİLİSİNE
            </div>

            {/* Personel Bilgi Tablosu */}
            <table className="w-full border border-slate-400 text-[11px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 w-1/3 border-r border-slate-400">
                    Adı ve Soyadı:
                  </td>
                  <td className="p-2 font-bold">{seciliPersonel.ad_soyad}</td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    Kadro Unvanı / Sicil No:
                  </td>
                  <td className="p-2">
                    {seciliPersonel.unvan || 'Kadro Personeli'} / (
                    {seciliPersonel.sicil_no || 'TR-772910'})
                  </td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    İstihdam Rejimi:
                  </td>
                  <td className="p-2 font-bold text-indigo-700 dark:text-indigo-400">
                    {personelRejimi === '657_memur'
                      ? '657 Sayılı D.M.K. (Devlet Memuru)'
                      : '4857 Sayılı İş Kanunu (Sürekli İşçi)'}
                  </td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    Talep Edilen İzin Türü:
                  </td>
                  <td className="p-2 font-semibold capitalize">{izinTuru.replace('_', ' ')}</td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    İzin Başlama Tarihi & Süresi:
                  </td>
                  <td className="p-2">
                    <strong>{baslangicTarihi}</strong> tarihinden itibaren{' '}
                    <strong>{gunSayisi}</strong> gün
                  </td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    Görevi Devralan Vekil Personel:
                  </td>
                  <td className="p-2">{vekilPersonel}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-400">
                    İzindeki Tebligat Adresi & Tel:
                  </td>
                  <td className="p-2">{gorevYeriAdresi}</td>
                </tr>
              </tbody>
            </table>

            {/* Talep Metni */}
            <p className="text-justify text-[11px] indent-6 leading-relaxed">
              Yukarıda belirtilen tarihler arasında tarafıma kanunen tanınmış bulunan{' '}
              <strong>{gunSayisi}</strong> günlük iznimi kullanmak istiyorum. Gereğini
              müsaadelerinize arz ederim.
            </p>

            {/* İmzalar */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[11px]">
              <div className="space-y-1">
                <div className="font-bold">İzni Talep Eden Personel</div>
                <div className="pt-8 font-bold">{seciliPersonel.ad_soyad}</div>
                <div className="text-[10px] text-slate-500 font-sans">İmza</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold">Görevi Yürütecek Vekil</div>
                <div className="pt-8 font-bold">{vekilPersonel}</div>
                <div className="text-[10px] text-slate-500 font-sans">İmza</div>
              </div>
            </div>

            {/* Onay Makamı */}
            <div className="border-t border-slate-300 dark:border-slate-700 pt-6 text-center space-y-1">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                UYGUNDUR
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date().toLocaleDateString('tr-TR')}
              </div>
              <div className="pt-6 font-bold text-xs">{aktifHarcamaYetkilisi}</div>
              <div className="text-[10px] text-slate-500 font-sans">
                Harcama Yetkilisi / Kurum Amiri (Mühür ve İmza)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
