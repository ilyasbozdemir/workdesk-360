import React, { useState, useEffect } from 'react'
import {
  Coins,
  Scale,
  Receipt,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export const FinanceDashboard: React.FC<{
  onNavigateTab: (tabId: string) => void
}> = ({ onNavigateTab }) => {
  const { canAccessFinancialServices, canAccessAccounting } = useWorkspaceContextStore()

  const [metrics, setMetrics] = useState({
    toplamOdenek: 0,
    toplamHarcanan: 0,
    toplamBloke: 0,
    toplamSerbest: 0,
    dosyaSayisi: 0,
    odenenDosyaSayisi: 0,
    bekleyenDosyaSayisi: 0,
    kikHarcanan: 0
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true)

      // 1. DATA_TeminDosyasi toplamlarını çek
      const fileMetrics = await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `SELECT 
          COUNT(*) as totalFiles,
          SUM(CASE WHEN status = 'tamamlandi' OR durum_asama_id = 4 THEN 1 ELSE 0 END) as odenenCount,
          SUM(CASE WHEN (status != 'tamamlandi' OR status IS NULL) AND (durum_asama_id < 4 OR durum_asama_id IS NULL) THEN 1 ELSE 0 END) as bekleyenCount,
          COALESCE(SUM(CASE WHEN status = 'tamamlandi' OR durum_asama_id = 4 THEN COALESCE(net_odenen, yaklasik_maliyet) ELSE 0 END), 0) as harcananTutar,
          COALESCE(SUM(CASE WHEN (status != 'tamamlandi' OR status IS NULL) AND (durum_asama_id < 4 OR durum_asama_id IS NULL) THEN COALESCE(yaklasik_maliyet, 0) ELSE 0 END), 0) as blokeTutar,
          COALESCE(SUM(yaklasik_maliyet), 0) as toplamAlim
        FROM DATA_TeminDosyasi
        WHERE is_deleted = 0`
      )

      // 2. TANIM_ButceOdenek toplam başlangıç ödeneğini çek
      const odenekMetrics = await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `SELECT COALESCE(SUM(yillik_odenek), 0) as toplamBaslangic FROM TANIM_ButceOdenek`
      )

      const f = fileMetrics?.[0] || {}
      const o = odenekMetrics?.[0] || {}

      const baslangic = Number(o.toplamBaslangic) || 0
      const harcanan = Number(f.harcananTutar) || 0
      const bloke = Number(f.blokeTutar) || 0
      const serbest = baslangic > 0 ? Math.max(0, baslangic - harcanan - bloke) : Math.max(0, 1000000 - harcanan - bloke)

      setMetrics({
        toplamOdenek: baslangic > 0 ? baslangic : harcanan + bloke + 1000000,
        toplamHarcanan: harcanan,
        toplamBloke: bloke,
        toplamSerbest: serbest,
        dosyaSayisi: Number(f.totalFiles) || 0,
        odenenDosyaSayisi: Number(f.odenenCount) || 0,
        bekleyenDosyaSayisi: Number(f.bekleyenCount) || 0,
        kikHarcanan: harcanan + bloke
      })
    } catch (err) {
      console.error('Mali göstergeler yüklenirken hata:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardMetrics()
  }, [])

  return (
    <div className="space-y-6">
      {/* 4 Önemli Mali Metrik Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: 5018 Kullanılabilir Serbest Ödenek */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>5018 Serbest Ödenek</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Coins size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(metrics.toplamSerbest)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Bütçe Harcanabilir Limit
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('budget-tracking')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <span>Bütçe Tertipleri Masası</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 2: 4734 Md. 62/ı KİK %10 Kotası */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>22/d Harcama Toplamı</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Scale size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(metrics.kikHarcanan)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Gerçekleşen + Bloke Doğrudan Temin
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('compliance-check')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <span>Limit &amp; Kota Kontrolü</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 3: 4734'ten Gelen Dosyalar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Satın Alma Dosyaları</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {metrics.dosyaSayisi} Dosya
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              {metrics.bekleyenDosyaSayisi} Ödeme Bekleyen | {metrics.odenenDosyaSayisi} Ödenen
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('incoming-procurements')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <span>Gelen Dosyaları İncele</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 4: Onaylanan Ödemeler */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Muhasebeleştirilen Tutar</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Receipt size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(metrics.toplamHarcanan)}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">
              {metrics.odenenDosyaSayisi} Tamamlanan Dosya
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('oeb-drafts')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <span>ÖEB Masasına Git</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* İki Çalışma Alanı Özeti: Mali Hizmetler & Muhasebe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Kolon: Mali Hizmetler Birimi İşlemleri */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                5018
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Mali Hizmetler &amp; Bütçe Yönetimi
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Harcama Birimi Denetimi
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Doğrudan temin dosyalarının ödenek blokajı, KİK %10 kotaları, tevkifat oranları ve Ödeme Emri Belgesi (ÖEB) hazırlıkları bu masada yönetilir.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => onNavigateTab('incoming-procurements')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-blue-500" />
                <span>Gelen Satın Alma Dosyalarını Tetkik Et</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('budget-tracking')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-emerald-500" />
                <span>Analitik Bütçe Tertipleri ve Bloke Takibi</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Sağ Kolon: Merkezi Yönetim Muhasebe İşlemleri */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                MİF
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Merkezi Yönetim Muhasebe &amp; Saymanlık
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              BKMYBS Formatı
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Muhasebe İşlem Fişleri (MİF), hak sahibi IBAN aktarımları, kesin/geçici teminat emanet hesapları ve Sayıştay uyumlu yevmiye defteri kayıtları.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => onNavigateTab('oeb-drafts')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-purple-500" />
                <span>Ödeme Emri Belgeleri (ÖEB) ve Resmî Çıktılar</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('mif-drafts')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-blue-500" />
                <span>Muhasebe İşlem Fişleri (MİF) Listesi</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
