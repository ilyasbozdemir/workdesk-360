import React from 'react'
import {
  Coins,
  Scale,
  ShieldCheck,
  Building2,
  FileText,
  Boxes,
  Lock,
  FileCheck2,
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  FolderOpen
} from 'lucide-react'
import { KamuRole, KAMU_ROLES, BkmybsTabKey, KikKotaModel } from '../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { APP_ROUTES } from '@renderer/constants/routeConstants'
import { useTabStore } from '@renderer/store/tabStore'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'
import { useNavigate } from '@tanstack/react-router'

interface BkmybsHeaderProps {
  activeRole: KamuRole
  onRoleChange: (role: KamuRole) => void
  activeTab: BkmybsTabKey
  onTabChange: (tab: BkmybsTabKey) => void
  kikKota: KikKotaModel
  toplamKullanilabilirOdenek: number
  toplamBaslangicOdenegi: number
  bekleyenMifSayisi: number
  onayliMifSayisi: number
  bekleyenTifSayisi: number
  aktifTeminatToplami: number
  yururlukteSozlesmeBedeli: number
}

export const BkmybsHeader: React.FC<BkmybsHeaderProps> = ({
  activeRole,
  onRoleChange,
  activeTab,
  onTabChange,
  kikKota,
  toplamKullanilabilirOdenek,
  toplamBaslangicOdenegi,
  bekleyenMifSayisi,
  onayliMifSayisi,
  bekleyenTifSayisi,
  aktifTeminatToplami,
  yururlukteSozlesmeBedeli
}) => {
  const navigate = useNavigate()
  const { addTab } = useTabStore()

  const handleGoToDogrudanTemin = () => {
    useWorkspaceContextStore.getState().setActiveWorkspace('procurement')
    addTab(APP_ROUTES.DOSYALAR)
    navigate({ to: APP_ROUTES.DOSYALAR })
  }

  const roleInfo = KAMU_ROLES[activeRole]

  return (
    <div className="space-y-4">
      {/* 1. ÜST COMMAND BAR: İKİ BÜYÜK MASAYI BİRBİRİNE BAĞLAYAN HIZLI GEÇİŞ SWITCHER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sol Hızlı Merkez Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            onClick={handleGoToDogrudanTemin}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            title="4734 Sayılı KİK Kapsamındaki Doğrudan Temin ve Satın Alma Masasına Geç"
          >
            <Briefcase size={14} className="text-slate-400" />
            <span>🛒 4734 Doğrudan Temin Masası</span>
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5" />

          <button
            disabled
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-600 text-white shadow-xs cursor-default"
            title="5018 Sayılı Kanun Kapsamındaki BKMYBS ve Bütçe / Muhasebe Masası"
          >
            <Coins size={14} className="text-amber-300" />
            <span>💰 5018 BKMYBS Mali Masası (Aktif)</span>
          </button>
        </div>

        {/* Sağ: ROL MODELİ & GÖREVLER AYRILIĞI (RBAC) SEÇİCİ */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Aktif Kamu Rolü
            </span>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {roleInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(Object.keys(KAMU_ROLES) as KamuRole[]).map((rKey) => {
              const r = KAMU_ROLES[rKey]
              const isSelected = activeRole === rKey
              return (
                <button
                  key={rKey}
                  onClick={() => onRoleChange(rKey)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={`${r.title} (${r.law}) - ${r.description}`}
                >
                  {r.law}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ROL BİLGİLENDİRME BANNER'I */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 border border-blue-200/60 dark:border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            <strong className="text-blue-700 dark:text-blue-300">{roleInfo.title}:</strong>{' '}
            {roleInfo.description}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-300/60">
          Yetkiler: {roleInfo.permissions.length} Alan
        </span>
      </div>

      {/* 2. 6 BÜTÜNLEŞİK MALİ METRİK (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Serbest Ödenek</span>
            <Coins size={14} className="text-blue-500" />
          </div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(toplamKullanilabilirOdenek)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Bütçe: {formatCurrency(toplamBaslangicOdenegi)}
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">22/d KİK Kotası</span>
            <Scale size={14} className="text-purple-500" />
          </div>
          <div className="text-sm font-mono font-extrabold text-purple-600 dark:text-purple-400">
            %{kikKota.kullanimOrani.toFixed(1)} Dolu
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Kalan: {formatCurrency(kikKota.kalanKotaTutari)}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">MİF & ÖEB</span>
            <FileCheck2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            {onayliMifSayisi} Onaylı
          </div>
          <div className="text-[10px] text-amber-500 font-bold truncate mt-0.5">
            {bekleyenMifSayisi} Taslak / Bekleyen
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">TKYS Taşınır</span>
            <Boxes size={14} className="text-amber-500" />
          </div>
          <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {bekleyenTifSayisi} Bekleyen TİF
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">Muayene kabul bağlı</div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Emanet & Teminat</span>
            <Lock size={14} className="text-indigo-500" />
          </div>
          <div className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(aktifTeminatToplami)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">Banka teyitli mektuplar</div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taahhüt & Sözleşme</span>
            <FileText size={14} className="text-rose-500" />
          </div>
          <div className="text-sm font-mono font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(yururlukteSozlesmeBedeli)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">Yürürlükte olan harcama</div>
        </div>
      </div>

      {/* 3. 6 SEKMELİ BÜTÜNLEŞİK ÇALIŞMA MASASI SEKMELERİ */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => onTabChange('butce')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'butce'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Coins size={14} />
            <span>1. Analitik Bütçe & Ödenek Takibi</span>
          </button>

          <button
            onClick={() => onTabChange('limit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'limit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Scale size={14} />
            <span>2. 22/d Limit & %10 KİK Kotası</span>
            {kikKota.kikIzinRiski && (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle size={10} /> İzin Riski
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('mif')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mif'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCheck2 size={14} />
            <span>3. MİF & Ödeme Emri Belgesi (ÖEB)</span>
            {bekleyenMifSayisi > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {bekleyenMifSayisi}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('tkys')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tkys'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Boxes size={14} />
            <span>4. TKYS Taşınır & Zimmet</span>
          </button>

          <button
            onClick={() => onTabChange('emanet')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'emanet'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Lock size={14} />
            <span>5. Emanetler & Teminat Mektubu</span>
          </button>

          <button
            onClick={() => onTabChange('sozlesme')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sozlesme'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText size={14} />
            <span>6. 4734 Harcama Sözleşmeleri & Taahhüt</span>
          </button>

          <button
            onClick={() => onTabChange('dosyalar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'dosyalar'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FolderOpen size={14} />
            <span>7. Dosyalar & Faturaları</span>
          </button>

          <button
            onClick={() => onTabChange('mevzuat')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mevzuat'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Scale size={14} />
            <span>8. Mevzuat & Parametreler</span>
          </button>
        </div>
      </div>
    </div>
  )
}

