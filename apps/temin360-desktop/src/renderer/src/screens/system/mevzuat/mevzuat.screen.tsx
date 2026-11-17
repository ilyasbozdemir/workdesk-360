import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  Calculator,
  Coins,
  FileCode,
  FileText,
  Library,
  Scale,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react'
import { InnerMenu, InnerMenuItem } from '../../../components/ui/InnerMenu'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { KikLimitleriSection } from './components/KikLimitleriSection'
import { OranlarTab } from './tabs/OranlarTab'
import { MaliTab } from './tabs/MaliTab'
import { FiyatFarkiTab } from './tabs/FiyatFarkiTab'
import { AsamalarTab } from './tabs/AsamalarTab'
import { BentlerTab } from './tabs/BentlerTab'
import { ButceKodlariTab } from './tabs/ButceKodlariTab'
import { MevzuatKutuphanesiTab } from './tabs/MevzuatKutuphanesiTab'
import { YiUfeEndeksTab } from './tabs/YiUfeEndeksTab'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { useWorkspaceContextStore } from '../../../store/workspaceContextStore'
import { useTabStore } from '../../../store/tabStore'

export type MevzuatTabType =
  | 'kutuphane'
  | 'limitler'
  | 'oranlar'
  | 'mali'
  | 'butcekodlari'
  | 'asamalar'
  | 'bentler'
  | 'fiyatfarki'
  | 'yi-ufe'

export interface MevzuatScreenProps {
  defaultTab?: MevzuatTabType
  initialCategory?: 'all' | 'kik' | 'mali'
  isBkmybsEmbed?: boolean
}

export function MevzuatScreen({
  defaultTab,
  initialCategory = 'all',
  isBkmybsEmbed = false
}: MevzuatScreenProps = {}): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'kik' | 'mali'>(initialCategory)

  function isValidTab(val: string): val is MevzuatTabType {
    return [
      'kutuphane',
      'limitler',
      'oranlar',
      'mali',
      'butcekodlari',
      'asamalar',
      'bentler',
      'fiyatfarki',
      'yi-ufe'
    ].includes(val)
  }

  // Hash veya search params üzerinden tab parametresini çözümle
  const parseTabParam = (): MevzuatTabType => {
    if (defaultTab && isBkmybsEmbed) return defaultTab

    const searchObj = location.search as Record<string, unknown> | string | undefined
    if (searchObj && typeof searchObj === 'object' && 'tab' in searchObj) {
      const val = String(searchObj.tab)
      if (isValidTab(val)) return val
    }
    if (typeof searchObj === 'string' && searchObj) {
      const p = new URLSearchParams(searchObj)
      const val = p.get('tab')
      if (val && isValidTab(val)) return val
    }
    if (typeof window !== 'undefined' && window.location.hash.includes('?')) {
      const query = window.location.hash.slice(window.location.hash.indexOf('?'))
      const p = new URLSearchParams(query)
      const val = p.get('tab')
      if (val && isValidTab(val)) return val
    }
    return defaultTab || 'kutuphane'
  }

  const [embedActiveTab, setEmbedActiveTab] = useState<MevzuatTabType>(defaultTab || 'oranlar')
  const activeTab = isBkmybsEmbed ? embedActiveTab : parseTabParam()

  const handleTabChange = (tabId: string): void => {
    if (isValidTab(tabId)) {
      if (isBkmybsEmbed) {
        setEmbedActiveTab(tabId)
      } else {
        navigate({
          to: APP_ROUTES.MEVZUAT,
          search: (prev: any) => ({ ...prev, tab: tabId })
        })
      }
    }
  }

  // Mali Masaya Hızlı Geçiş
  const handleSwitchToFinance = (): void => {
    useWorkspaceContextStore.getState().setActiveWorkspace('finance')
    useTabStore.getState().addTab(APP_ROUTES.BKMYBS_MALI_YONETIM)
    useTabStore.getState().setActiveTab(APP_ROUTES.BKMYBS_MALI_YONETIM)
    navigate({ to: APP_ROUTES.BKMYBS_MALI_YONETIM })
  }

  // Satın Alma Masasına Hızlı Geçiş
  const handleSwitchToProcurement = (): void => {
    useWorkspaceContextStore.getState().setActiveWorkspace('procurement')
    useTabStore.getState().addTab(APP_ROUTES.MEVZUAT)
    useTabStore.getState().setActiveTab(APP_ROUTES.MEVZUAT)
    navigate({ to: APP_ROUTES.MEVZUAT })
  }

  // Menü Elemanları Tanımı
  const allMenuItems: InnerMenuItem[] = useMemo(() => {
    const kikGroup: InnerMenuItem[] = [
      {
        id: 'hdr-kik',
        label: '⚖️ 4734 KİK & Satın Alma',
        icon: null,
        isHeader: true
      },
      {
        id: 'kutuphane',
        label: 'Mevzuat Kütüphanesi',
        description: '4734 Kanun, yönetmelik & tebliğler',
        icon: <Library className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />,
        badge: 'MEVZUAT',
        badgeVariant: 'slate'
      },
      {
        id: 'limitler',
        label: 'KİK Kanun Limitleri',
        description: 'Madde 22/d doğrudan temin limitleri',
        icon: <Scale className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />,
        badge: '4734 / 22-d',
        badgeVariant: 'blue'
      },
      {
        id: 'bentler',
        label: 'Madde 22 Bentleri',
        description: 'KİK alım usulleri ve gerekçeleri',
        icon: <BookOpen className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />,
        badge: 'KİK',
        badgeVariant: 'blue'
      },
      {
        id: 'asamalar',
        label: 'İşlem Aşamaları',
        description: '4 aşamalı satın alma iş akışı',
        icon: <FileText className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />,
        badge: 'SÜREÇ',
        badgeVariant: 'slate'
      }
    ]

    const maliGroup: InnerMenuItem[] = [
      {
        id: 'hdr-mali',
        label: '💰 5018 Mali Hizmetler & Bütçe',
        icon: null,
        isHeader: true
      },
      {
        id: 'oranlar',
        label: 'Vergi & Kesinti Oranları',
        description: 'KDV, Damga, Tevkifat & Karar Pulu',
        icon: <Calculator className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
        badge: '5018 / VERGİ',
        badgeVariant: 'emerald'
      },
      {
        id: 'butcekodlari',
        label: 'ABS Bütçe Kodları',
        description: 'Analitik bütçe ekonomik kodları (03.2)',
        icon: <FileText className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />,
        badge: 'BÜTÇE',
        badgeVariant: 'amber'
      },
      {
        id: 'mali',
        label: 'Kurumsal Mali Kodlar',
        description: 'Muhasebe birimi & fonksiyonel kodlar',
        icon: <FileCode className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />,
        badge: 'MUHASEBE',
        badgeVariant: 'purple'
      },
      {
        id: 'fiyatfarki',
        label: 'Fiyat Farkı Katsayıları',
        description: 'Kararname ağırlık katsayıları (a, b1, b2)',
        icon: <Coins className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />,
        badge: 'HAKEDİŞ',
        badgeVariant: 'blue'
      },
      {
        id: 'yi-ufe',
        label: 'Yİ-ÜFE Endeksleri (TÜİK)',
        description: '1994-2026 Fiyat Farkı & Değerleme',
        icon: <TrendingUp className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />,
        badge: 'TÜİK',
        badgeVariant: 'rose'
      }
    ]

    if (selectedCategory === 'kik') return kikGroup
    if (selectedCategory === 'mali') return maliGroup
    return [...kikGroup, { id: 'div-separator', label: '', icon: null, isDivider: true }, ...maliGroup]
  }, [selectedCategory])

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* ── ÜST BAŞLIK VE ÇALIŞMA MASASI GEÇİŞ BANNERI ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              Mevzuat ve Sistem Parametreleri
            </h1>
            {isBkmybsEmbed && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                5018 BKMYBS Bütünleşik
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            4734 Sayılı Kamu İhale Kanunu doğrudan temin limitleri ile 5018 Sayılı Kamu Malî Yönetimi bütçe,
            vergi oranları ve hakediş endekslerini merkezi olarak yönetebilirsiniz.
          </p>
        </div>

        {/* SAĞ ÜST: ÇALIŞMA MASASI GEÇİŞ BUTONU */}
        <div className="flex items-center gap-2 shrink-0">
          {!isBkmybsEmbed ? (
            <button
              type="button"
              onClick={handleSwitchToFinance}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-xs transition-all cursor-pointer group"
              title="5018 BKMYBS Bütçe ve Mali Yönetim Masasına Geç"
            >
              <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>🏛️ 5018 Mali Hizmetler Masasına Git</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSwitchToProcurement}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-xs transition-all cursor-pointer group"
              title="4734 Doğrudan Temin & Satın Alma Masasındaki Tam Ekrana Geç"
            >
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span>🛒 4734 Satın Alma Masasında Aç</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* ── KATEGORİ FİLTRELEME ŞERİDİ (TÜMÜ / 4734 KİK / 5018 MALİ) ── */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tüm Parametreler (9)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('kik')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'kik'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>⚖️ 4734 Satın Alma (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('mali')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'mali'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>💰 5018 Mali Hizmetler (5)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium hidden sm:block">
          {selectedCategory === 'mali'
            ? '💰 5018 Mali Hizmetler: Vergi, Damga, ABS Bütçe Kodları ve Hakediş Endeksleri'
            : selectedCategory === 'kik'
            ? '⚖️ 4734 Satın Alma: KİK Limitleri, Madde 22 Bentleri ve İşlem Aşamaları'
            : 'Tüm Satın Alma ve Mali Hizmetler Parametreleri'}
        </div>
      </div>

      {/* ── İKİ KOLONLU ÇALIŞMA DÜZENİ (İNNER MENU + İÇERİK) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* SOL MENÜ */}
        <InnerMenu
          className="lg:col-span-3 shrink-0"
          items={allMenuItems}
          activeId={activeTab}
          onChange={handleTabChange}
        />

        {/* SAĞ PANEL İÇERİK */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-h-[480px] flex flex-col overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar flex-1">
          {activeTab === 'kutuphane' && <MevzuatKutuphanesiTab />}
          {activeTab === 'limitler' && (
            <div className="p-6">
              <KikLimitleriSection />
            </div>
          )}
          {activeTab === 'oranlar' && <OranlarTab />}
          {activeTab === 'mali' && <MaliTab />}
          {activeTab === 'fiyatfarki' && (
            <div className="p-6">
              <FiyatFarkiTab />
            </div>
          )}
          {activeTab === 'yi-ufe' && (
            <div className="p-6">
              <YiUfeEndeksTab />
            </div>
          )}
          {activeTab === 'butcekodlari' && (
            <div className="p-6">
              <ButceKodlariTab />
            </div>
          )}
          {activeTab === 'asamalar' && (
            <div className="p-6">
              <AsamalarTab />
            </div>
          )}
          {activeTab === 'bentler' && (
            <div className="p-6">
              <BentlerTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MevzuatScreen
