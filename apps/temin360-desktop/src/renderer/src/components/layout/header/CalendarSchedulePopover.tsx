import React, { useRef, useState, useEffect, useMemo } from 'react'
import {
  CalendarDays,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Download,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useClickOutside } from '@renderer/hooks/useClickOutside'
import { formatDate } from '@renderer/utils/formatters'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'

export interface CalendarEventItem {
  id: string
  title: string
  dosyaNo: string
  dosyaKonu: string
  date: string
  time: string
  type: 'dogrudan_temin' | 'ihale' | 'sozlesme' | 'hakedis'
  typeLabel: string
  typeColor: string
  isOverdue: boolean
}

export const CalendarSchedulePopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [loading, setLoading] = useState(false)

  // Dışarı tıklandığında veya ESC tuşuna basıldığında kapanma
  useClickOutside(popoverRef, () => setIsOpen(false), isOpen)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Veritabanındaki gerçek dosyalardan takvim olaylarını oluştur
  const loadScheduleEvents = async () => {
    try {
      setLoading(true)
      const res = await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `SELECT 
          id, 
          COALESCE(temin_no, '#' || id) as dosyaNo,
          COALESCE(konu, 'Doğrudan Temin Dosyası') as konu,
          COALESCE(tur, 'mal') as tur,
          COALESCE(temin_tarihi, tarih, SUBSTR(created_at, 1, 10), DATE('now')) as tarih,
          COALESCE(teslim_tarihi, DATE('now', '+7 days')) as teslimTarihi,
          durum_asama_id as durumAsamaId,
          status
        FROM DATA_TeminDosyasi
        WHERE is_deleted = 0
        ORDER BY id DESC
        LIMIT 6`
      )

      const rows = res && Array.isArray(res) ? res : []
      const todayStr = new Date().toISOString().split('T')[0]

      const generatedEvents: CalendarEventItem[] = []

      rows.forEach((r: any, idx: number) => {
        const dNo = r.dosyaNo || `2026/DT-${r.id}`
        const dDate = r.tarih || todayStr

        // 1. Son Teklif Verme Tarihi
        generatedEvents.push({
          id: `evt-teklif-${r.id}`,
          title: 'Son Teklif Verme Tarihi',
          dosyaNo: dNo,
          dosyaKonu: r.konu,
          date: dDate,
          time: '14:00',
          type: 'dogrudan_temin',
          typeLabel: 'Doğrudan Temin',
          typeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          isOverdue: dDate < todayStr && r.durumAsamaId < 2
        })

        // 2. Muayene Kabul & Hakediş Tahakkuk
        if (r.teslimTarihi) {
          generatedEvents.push({
            id: `evt-teslim-${r.id}`,
            title: 'Mal/Hizmet Teslim & Muayene Kabul',
            dosyaNo: dNo,
            dosyaKonu: r.konu,
            date: r.teslimTarihi,
            time: '16:30',
            type: idx % 2 === 0 ? 'sozlesme' : 'hakedis',
            typeLabel: idx % 2 === 0 ? 'Sözleşme' : 'Kesin Hakediş',
            typeColor:
              idx % 2 === 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            isOverdue: r.teslimTarihi < todayStr && r.durumAsamaId < 4
          })
        }
      })

      // Eğer hiç dosya yoksa örnek kurumsal süreç takvimi verileri
      if (generatedEvents.length === 0) {
        generatedEvents.push(
          {
            id: 'evt-sample-1',
            title: 'Son Teklif Verme ve Piyasa Araştırması',
            dosyaNo: '2026/DT-101',
            dosyaKonu: 'Kırtasiye ve Büro Malzemeleri Alımı',
            date: '2026-11-12',
            time: '14:00',
            type: 'dogrudan_temin',
            typeLabel: 'Doğrudan Temin',
            typeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            isOverdue: false
          },
          {
            id: 'evt-sample-2',
            title: 'İhale Komisyonu Teklif Değerlendirme Toplantısı',
            dosyaNo: '2026/İH-04',
            dosyaKonu: 'Hizmet Binası Güvenlik Kamera Sistemi Kurulumu',
            date: '2026-11-15',
            time: '10:30',
            type: 'ihale',
            typeLabel: 'Açık İhale',
            typeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            isOverdue: false
          },
          {
            id: 'evt-sample-3',
            title: 'Sözleşme İmzası ve Kesin Teminat Teslimi',
            dosyaNo: '2026/DT-098',
            dosyaKonu: 'Veri Merkezi İklimlendirme Bakım Sözleşmesi',
            date: '2026-11-18',
            time: '16:00',
            type: 'sozlesme',
            typeLabel: 'Sözleşme',
            typeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            isOverdue: false
          },
          {
            id: 'evt-sample-4',
            title: '1. No\'lu Hakediş Tahakkuk & ÖEB Vizesi',
            dosyaNo: '2026/HK-01',
            dosyaKonu: 'İdari Bina Tadilat ve Donanım İşi',
            date: '2026-11-25',
            time: '15:00',
            type: 'hakedis',
            typeLabel: 'Kesin Hakediş',
            typeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            isOverdue: false
          }
        )
      }

      setEvents(generatedEvents)
    } catch (err) {
      console.warn('[CalendarPopover] Takvim olayları yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadScheduleEvents()
    }
  }, [isOpen])

  // Geciken işlem sayısı
  const overdueCount = useMemo(() => {
    return events.filter((e) => e.isOverdue).length
  }, [events])

  // RFC 5545 Uyumlu iCalendar (.ics) Dosyası Üret ve İndir
  const handleExportICal = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Temin 360//Kamu Ihale ve Surec Takvimi//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ]

    const pad = (n: number) => (n < 10 ? '0' + n : String(n))
    const now = new Date()
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    events.forEach((evt) => {
      const cleanDate = evt.date.replace(/-/g, '')
      const [h, m] = evt.time.split(':')
      const startIso = `${cleanDate}T${h || '09'}${m || '00'}00`

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${evt.id}@temin360.gov.tr`)
      lines.push(`DTSTAMP:${dtstamp}`)
      lines.push(`DTSTART:${startIso}`)
      lines.push(`SUMMARY:${evt.dosyaNo} - ${evt.title}`)
      lines.push(`DESCRIPTION:Konu: ${evt.dosyaKonu}\\nTur: ${evt.typeLabel}`)
      lines.push(`STATUS:CONFIRMED`)
      lines.push('END:VEVENT')
    })

    lines.push('END:VCALENDAR')

    const icsContent = lines.join('\r\n')
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ihale-termin-takvimi-${now.toISOString().split('T')[0]}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Tarih Biçimlendirme (15 Kas 2026)
  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative ${
          isOpen
            ? 'bg-[#eef3ff] text-[#2d62d7] dark:bg-blue-950/50 dark:text-blue-400 font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#f1f4f9] dark:hover:bg-slate-800'
        }`}
        title="İhale & Süreç Takvimi"
      >
        <CalendarDays size={18} />
      </button>

      {/* Açılır Panel (Dropdown Menu: ~380px) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[380px] max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 select-none text-left flex flex-col max-h-[560px]">
          {/* 1. Başlık Çubuğu */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CalendarDays size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-850 dark:text-slate-100">
                  İhale &amp; Termin Takvimi
                </h3>
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date().getFullYear()} Mali Yılı Dönemi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Canlı Akış
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* 2. Kritik Yaklaşan Süreçler Listesi (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-0">
            {events.map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border transition-all text-xs bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-400/60 dark:hover:border-blue-500/50 flex flex-col gap-1.5 ${
                  evt.isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Üst Satır: Etkinlik Başlığı ve Tarih */}
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-850 dark:text-slate-100 truncate flex-1">
                    {evt.title}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[11px] text-slate-700 dark:text-slate-300 shrink-0">
                    <Calendar size={12} className="text-blue-500" />
                    <span>{formatEventDate(evt.date)}</span>
                  </div>
                </div>

                {/* Orta Satır: Dosya Numarası, Konu ve Saat */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span className="truncate">
                    Dosya: <strong className="text-slate-700 dark:text-slate-300">{evt.dosyaNo}</strong> • {evt.dosyaKonu}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-slate-400">
                    <Clock size={11} />
                    <span>{evt.time}</span>
                  </div>
                </div>

                {/* Alt Satır: Süreç Türü Rozeti ve Uyarı */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${evt.typeColor}`}>
                    {evt.typeLabel}
                  </span>

                  {evt.isOverdue ? (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      <span>Süresi Geçti</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Zamanında</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Alt İşlem Çubuğu */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${overdueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>Geciken İşlem: <strong>{overdueCount} Adet</strong></span>
            </div>

            <button
              type="button"
              onClick={handleExportICal}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              title="Outlook, Google Calendar ve Apple Calendar ile uyumlu takvim dosyası (.ics)"
            >
              <Download size={12} />
              <span>iCal Olarak Dışa Aktar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

