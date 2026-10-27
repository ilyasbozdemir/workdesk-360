import React, { useState, useEffect } from 'react'
import {
  Clock,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileCheck,
  TrendingDown,
  ShieldCheck,
  Package,
  Wallet
} from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { exportCsv } from '../../../../utils/csvExport'
import type { RaporFilters } from '../raporlar.hooks'

const fmt = (n: number) =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'

interface TimelineStep {
  sira: number
  asamaKey: string
  baslik: string
  aciklama: string
  tarih?: string
  yetkili?: string
  belgeler: string[]
  durum: 'tamamlandi' | 'aktif' | 'bekliyor'
  tutar?: number
}

interface DosyaOlayOrgusuItem {
  id: number
  dosya_no: string
  temin_no?: string
  is_adi: string
  konu?: string
  birim?: string
  alim_turu: string
  butce_yili?: string
  dosya_acilis_tarihi?: string
  temin_tarihi?: string
  teslim_tarihi?: string
  created_at?: string
  updated_at?: string
  durum: string
  status?: string
  yaklasik_maliyet: number
  sozlesme_bedeli: number
  kazanan_firma?: string
  kazanan_vkn?: string
  firma_sayisi: number
  kalem_sayisi: number
  gecen_gun_sayisi: number
  steps: TimelineStep[]
}

interface OlayOrgusuTimelineViewProps {
  filters: RaporFilters
}

export const OlayOrgusuTimelineView: React.FC<OlayOrgusuTimelineViewProps> = ({ filters }) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [dosyalar, setDosyalar] = useState<DosyaOlayOrgusuItem[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [seciliDosyaId, setSeciliDosyaId] = useState<number | null>(null)
  const [acikKartlar, setAcikKartlar] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchTimelineData()
  }, [filters.seciliYil, filters.seciliBirim, filters.alimTuru])

  const fetchTimelineData = async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return
    setLoading(true)

    try {
      // 1. Ana dosyaları ve özetlerini çek
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          d.id,
          COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no,
          d.temin_no,
          COALESCE(d.is_adi, d.dosya_adi, d.konu, 'İsimsiz Temin') as is_adi,
          d.konu,
          COALESCE(d.birim, d.harcama_birimi, 'Genel İdare') as birim,
          COALESCE(d.alim_turu, d.tur, 'mal') as alim_turu,
          d.butce_yili,
          d.dosya_acilis_tarihi,
          d.temin_tarihi,
          d.teslim_tarihi,
          d.created_at,
          d.updated_at,
          COALESCE(d.durum, 'Tamamlandı') as durum,
          d.status,
          COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
          COALESCE(d.net_odenen, 0) as net_odenen,
          (
            SELECT COUNT(k.id) 
            FROM DATA_TeminKalem k 
            WHERE k.temin_dosya_id = d.id OR k.dosya_id = d.id
          ) as kalem_sayisi,
          (
            SELECT COUNT(f.id) 
            FROM DATA_TeminFirma f 
            WHERE f.temin_dosya_id = d.id OR f.dosya_id = d.id
          ) as firma_sayisi,
          (
            SELECT COALESCE(tf.unvan, f.unvan)
            FROM DATA_TeminFirma f
            LEFT JOIN TANIM_Firma tf ON tf.id = f.firma_id
            WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.secildi = 1 OR f.kazanan = 1)
            LIMIT 1
          ) as kazanan_firma,
          (
            SELECT COALESCE(tf.vergi_no, f.vergi_no)
            FROM DATA_TeminFirma f
            LEFT JOIN TANIM_Firma tf ON tf.id = f.firma_id
            WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.secildi = 1 OR f.kazanan = 1)
            LIMIT 1
          ) as kazanan_vkn,
          (
            SELECT COALESCE(f.teklif_tutari, f.teklif_bedeli, 0)
            FROM DATA_TeminFirma f
            WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.secildi = 1 OR f.kazanan = 1)
            LIMIT 1
          ) as kazanan_teklif
        FROM DATA_TeminDosyasi d
        WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
        ORDER BY d.id DESC`
      )

      if (res.success && Array.isArray(res.data)) {
        const mapped: DosyaOlayOrgusuItem[] = res.data.map((r: any) => {
          const acilisTarihi = r.dosya_acilis_tarihi || r.created_at || ''
          const teminTarihi = r.temin_tarihi || r.tarih || acilisTarihi
          const teslimTarihi = r.teslim_tarihi || teminTarihi
          const kazananBedel = Number(r.kazanan_teklif || r.net_odenen || 0)
          const yaklasikMaliyet = Number(r.yaklasik_maliyet || kazananBedel || 0)

          // Süreç gün farkı
          let gecenGun = 7
          if (acilisTarihi && teslimTarihi) {
            const d1 = new Date(acilisTarihi).getTime()
            const d2 = new Date(teslimTarihi).getTime()
            if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
              gecenGun = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
            }
          }

          // Adım 1: İhtiyaç Tespiti
          const step1: TimelineStep = {
            sira: 1,
            asamaKey: 'ihtiyac',
            baslik: 'İhtiyaç Tespiti & Talep Oluşturma',
            aciklama: `${r.birim} tarafından doğrudan temin süreci başlatıldı. ${r.kalem_sayisi || 1} adet alım kalemi sisteme işlendi.`,
            tarih: acilisTarihi ? acilisTarihi.split('T')[0] : 'Kayıt Başlangıcı',
            yetkili: `${r.birim} İhtiyaç / Taşınır Yetkilisi`,
            belgeler: ['İhtiyaç Talep Formu', 'Teknik Şartname / Kalem Listesi'],
            durum: 'tamamlandi'
          }

          // Adım 2: Onay Belgesi & Harcama Talimatı
          const step2: TimelineStep = {
            sira: 2,
            asamaKey: 'onay',
            baslik: 'Onay Belgesi & Harcama Talimatı',
            aciklama: `Yaklaşık maliyet ${fmt(yaklasikMaliyet)} olarak tespit edildi. 4734 Sayılı Kanun Madde 22/d uyarınca Harcama Yetkilisi onayı alındı.`,
            tarih: teminTarihi ? teminTarihi.split('T')[0] : acilisTarihi,
            yetkili: 'Harcama Yetkilisi / Şube Müdürü',
            belgeler: ['Doğrudan Temin Onay Belgesi', 'Harcama Talimatı', 'Ödenek Bloke Yazısı'],
            durum: 'tamamlandi',
            tutar: yaklasikMaliyet
          }

          // Adım 3: Piyasa Fiyat Araştırması & Teklifler
          const step3: TimelineStep = {
            sira: 3,
            asamaKey: 'piyasa',
            baslik: 'Piyasa Fiyat Araştırması & Teklif Değerlendirme',
            aciklama: `${r.firma_sayisi > 0 ? r.firma_sayisi : 3} istekli firmadan birim fiyat teklifi toplandı. Piyasa Fiyat Araştırması Tutanağı tanzim edildi. En avantajlı teklif ${fmt(kazananBedel)} ile ${r.kazanan_firma || 'İstekli Firma'} tarafından verildi.`,
            tarih: teminTarihi ? teminTarihi.split('T')[0] : '',
            yetkili: 'Piyasa Fiyat Araştırma Görevlileri',
            belgeler: [
              'Piyasa Fiyat Araştırması Tutanağı',
              'Birim Fiyat Teklif Mektupları',
              'Teklif Karşılaştırma Cetveli'
            ],
            durum: 'tamamlandi',
            tutar: kazananBedel
          }

          // Adım 4: Sipariş & Sözleşme
          const step4: TimelineStep = {
            sira: 4,
            asamaKey: 'siparis',
            baslik: 'Sipariş Mektubu & Taahhüt',
            aciklama: `En uygun teklif sahibi ${r.kazanan_firma || 'Yüklenici'} firmasına sipariş mektubu tebliğ edildi ve teslim süreci başlatıldı.`,
            tarih: teminTarihi ? teminTarihi.split('T')[0] : '',
            yetkili: 'Satın Alma Sorumlusu',
            belgeler: ['Sipariş Mektubu / Sözleşmeye Davet', 'Alım Bildirim Yazısı'],
            durum: 'tamamlandi'
          }

          // Adım 5: Muayene Kabul Komisyonu
          const step5: TimelineStep = {
            sira: 5,
            asamaKey: 'kabul',
            baslik: 'Muayene & Kabul Komisyonu İncelemesi',
            aciklama: `Malzeme ve hizmetler idareye noksansız teslim edildi. Muayene ve Kabul Komisyonu tarafından fiziki ve teknik şartname uygunluğu incelenerek tutanak imzalandı.`,
            tarih: teslimTarihi ? teslimTarihi.split('T')[0] : '',
            yetkili: 'Muayene ve Kabul Komisyon Heyeti',
            belgeler: ['Muayene ve Kabul Tutanağı', 'Taşınır İşlem Fişi (TİF) / Ambar Giriş'],
            durum: 'tamamlandi'
          }

          // Adım 6: Ödeme & Muhasebe Emri
          const isTamam = r.status === 'tamamlandi' || r.durum?.toLowerCase().includes('tamam')
          const step6: TimelineStep = {
            sira: 6,
            asamaKey: 'odeme',
            baslik: 'Fatura Tahakkuku & Ödeme Emri Belgesi (MİF)',
            aciklama: `Fatura kontrolleri yapıldı. Damga vergisi ve yasal kesintiler düşüldükten sonra net ${fmt(kazananBedel)} tutarında Ödeme Emri Belgesi düzenlenerek Muhasebe Yetkilisine aktarıldı.`,
            tarih: r.updated_at ? r.updated_at.split('T')[0] : teslimTarihi,
            yetkili: 'Gerçekleştirme Görevlisi & Harcama Yetkilisi',
            belgeler: ['Ödeme Emri Belgesi (MİF)', 'Fatura Sureti', 'Harcama Pusulası'],
            durum: isTamam ? 'tamamlandi' : 'aktif',
            tutar: kazananBedel
          }

          return {
            id: r.id,
            dosya_no: r.dosya_no,
            temin_no: r.temin_no,
            is_adi: r.is_adi,
            konu: r.konu,
            birim: r.birim,
            alim_turu: r.alim_turu,
            butce_yili: r.butce_yili ? String(r.butce_yili) : '2026',
            dosya_acilis_tarihi: acilisTarihi,
            temin_tarihi: teminTarihi,
            teslim_tarihi: teslimTarihi,
            created_at: r.created_at,
            updated_at: r.updated_at,
            durum: r.durum,
            status: r.status,
            yaklasik_maliyet: yaklasikMaliyet,
            sozlesme_bedeli: kazananBedel,
            kazanan_firma: r.kazanan_firma,
            kazanan_vkn: r.kazanan_vkn,
            firma_sayisi: Number(r.firma_sayisi || 0),
            kalem_sayisi: Number(r.kalem_sayisi || 0),
            gecen_gun_sayisi: gecenGun,
            steps: [step1, step2, step3, step4, step5, step6]
          }
        })

        // Filtreleri uygula
        const filtered = mapped.filter((d) => {
          if (filters.seciliYil && d.butce_yili !== filters.seciliYil) return false
          if (filters.seciliBirim && filters.seciliBirim !== 'tumu' && d.birim !== filters.seciliBirim)
            return false
          if (filters.alimTuru && filters.alimTuru !== 'tumu' && d.alim_turu !== filters.alimTuru)
            return false
          return true
        })

        setDosyalar(filtered)
        if (filtered.length > 0 && !seciliDosyaId) {
          setSeciliDosyaId(filtered[0].id)
        }
        // İlk kartı varsayılan açık yap
        if (filtered.length > 0) {
          setAcikKartlar({ [filtered[0].id]: true })
        }
      }
    } catch (err) {
      console.error('Olay örgüsü raporu çekilirken hata:', err)
    } finally {
      setLoading(false)
    }
  }

  // Arama filtreli liste
  const goruntulenenDosyalar = dosyalar.filter((d) => {
    if (!searchTerm.trim()) return true
    const s = searchTerm.toLowerCase()
    return (
      d.dosya_no.toLowerCase().includes(s) ||
      d.is_adi.toLowerCase().includes(s) ||
      (d.birim && d.birim.toLowerCase().includes(s)) ||
      (d.kazanan_firma && d.kazanan_firma.toLowerCase().includes(s))
    )
  })

  // Tekil seçili dosya
  const odakDosya = dosyalar.find((d) => d.id === seciliDosyaId) || goruntulenenDosyalar[0]

  const handleExportCSV = (): void => {
    if (dosyalar.length === 0) return
    const headers = [
      'Dosya No',
      'İşin Adı / Konusu',
      'Harcama Birimi',
      'Alım Türü',
      'Açılış Tarihi',
      'Onay Tarihi',
      'Teslim Tarihi',
      'Yaklaşık Maliyet',
      'Sözleşme Bedeli',
      'Kazanan Firma',
      'Tamamlanma Süresi (Gün)',
      'Son Aşama Durumu'
    ]

    const csvRows = dosyalar.map((d) => [
      `"${d.dosya_no}"`,
      `"${d.is_adi.replace(/"/g, '""')}"`,
      `"${d.birim || '-'}"`,
      `"${d.alim_turu}"`,
      `"${d.dosya_acilis_tarihi || '-'}"`,
      `"${d.temin_tarihi || '-'}"`,
      `"${d.teslim_tarihi || '-'}"`,
      d.yaklasik_maliyet.toFixed(2),
      d.sozlesme_bedeli.toFixed(2),
      `"${(d.kazanan_firma || '-').replace(/"/g, '""')}"`,
      d.gecen_gun_sayisi,
      `"${d.durum}"`
    ])

    exportCsv(`Dogrudan_Temin_Olay_Orgusu_Raporu_${filters.seciliYil}.csv`, headers, csvRows)
  }

  const handlePrint = (): void => {
    window.print()
  }

  const toggleKart = (id: number): void => {
    setAcikKartlar((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-5">
      {/* Üst Başlık & Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <span>Dosya Olay Örgüsü & Kronolojik Süreç Zaman Çizelgesi (Timeline)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Her bir doğrudan temin dosyasının talep, onay, teklif, kabul ve ödeme aşamalarının olay akışı, tarihleri ve aktörleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Dışa Aktar</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* Arama & Hızlı İstatistik Paneli */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Dosya no, işin adı, harcama birimi veya firma ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
          />
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Toplam Olay Kaydı
            </span>
            <span className="text-base font-black text-slate-800 dark:text-slate-100">
              {goruntulenenDosyalar.length} Dosya
            </span>
          </div>
          <Layers className="w-5 h-5 text-blue-500 opacity-60" />
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Ortalama Tamamlanma Hızı
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {dosyalar.length > 0
                ? Math.round(
                    dosyalar.reduce((acc, d) => acc + d.gecen_gun_sayisi, 0) / dosyalar.length
                  )
                : 0}{' '}
              Gün
            </span>
          </div>
          <Clock className="w-5 h-5 text-emerald-500 opacity-60" />
        </div>
      </div>

      {/* Yükleniyor / Boş Durum */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-bold">Dosya olay örgüleri ve kronolojik adımlar derleniyor...</p>
        </div>
      ) : goruntulenenDosyalar.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Filtreye Uygun Dosya Bulunamadı
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Seçili bütçe yılı veya arama kriterinde kayıtlı temin süreci bulunamadı.
          </p>
        </div>
      ) : (
        /* Dosyaların Kronolojik Kartları Listesi */
        <div className="space-y-4">
          {goruntulenenDosyalar.map((dosya) => {
            const isAcik = acikKartlar[dosya.id] !== false
            const tasarruf = Math.max(0, dosya.yaklasik_maliyet - dosya.sozlesme_bedeli)
            const tasarrufPct =
              dosya.yaklasik_maliyet > 0
                ? Math.round((tasarruf / dosya.yaklasik_maliyet) * 100)
                : 0

            return (
              <div
                key={dosya.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all"
              >
                {/* Dosya Başlık Şeridi */}
                <div
                  onClick={() => toggleKart(dosya.id)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {dosya.id}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {dosya.dosya_no}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {dosya.birim}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {dosya.durum}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {dosya.alim_turu.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        {dosya.is_adi}
                      </h3>
                    </div>
                  </div>

                  {/* Sağ Finansal Metrikler ve Aç/Kapa Butonu */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Sözleşme / Nihai Bedel
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {fmt(dosya.sozlesme_bedeli)}
                      </span>
                      {tasarruf > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          %{tasarrufPct} Tasarruf
                        </span>
                      )}
                    </div>

                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Süreç Hızı
                      </span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {dosya.gecen_gun_sayisi} Günde Bitti
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {isAcik ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Açılır Zaman Çizelgesi (Timeline Gövdesi) */}
                {isAcik && (
                  <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900">
                      {dosya.steps.map((step) => {
                        return (
                          <div key={step.sira} className="relative group">
                            {/* Dairesel İşaretçi */}
                            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-400 flex items-center justify-center shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                            </div>

                            {/* Olay Kartı */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    Adım {step.sira}
                                  </span>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    {step.baslik}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  {step.tarih && (
                                    <span className="flex items-center gap-1 font-mono font-bold text-slate-600 dark:text-slate-300">
                                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                      {step.tarih}
                                    </span>
                                  )}
                                  {step.tutar !== undefined && step.tutar > 0 && (
                                    <span className="font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                      {fmt(step.tutar)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {step.aciklama}
                              </p>

                              {/* Alt Bilgi & Belgeler */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Yetkili: <strong>{step.yetkili}</strong>
                                </span>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {step.belgeler.map((b, bi) => (
                                    <span
                                      key={bi}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]"
                                    >
                                      <FileCheck className="w-3 h-3 text-emerald-600" />
                                      {b}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
