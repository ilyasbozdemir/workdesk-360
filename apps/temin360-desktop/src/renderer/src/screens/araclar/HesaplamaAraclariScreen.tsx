import React, { useState, useMemo, useEffect } from 'react'
import {
  Scale,
  Calendar,
  Percent,
  Clock,
  Coins,
  TrendingUp,
  FileSpreadsheet,
  Cpu,
  ArrowLeftRight,
  Ruler,
  Calculator,
  Search,
  ChevronRight,
  Sparkles,
  Layers,
  Wrench
} from 'lucide-react'
import {
  UsulBelirleyiciTab,
  VergiVeKesintiTab,
  ResmiTatilVeSureTab,
  GecikmeCezasiTab,
  ButceTavaniTab,
  FiyatFarkiTab,
  SayiyiYaziyaCevirTab,
  BirimDonusumTab,
  ExcelPanoTab,
  FormulMotoruTab,
  BelgeDonusturucuTab
} from './components'
import { HesapAraclariView } from '../../components/modals/HesapAraclariModal'

export type TabType =
  | 'hesap'
  | 'vergi'
  | 'ceza'
  | 'fiyatFarki'
  | 'butce'
  | 'formul'
  | 'usul'
  | 'sure'
  | 'belge'
  | 'pano'
  | 'yazi'
  | 'birim'

export interface ToolItem {
  id: TabType
  label: string
  shortLabel: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
  category: 'finans' | 'mevzuat' | 'ofis'
}

export const CATEGORIES = [
  { id: 'finans', name: 'Finans & Muhasebe', icon: Calculator },
  { id: 'mevzuat', name: 'Mevzuat & İhale', icon: Scale },
  { id: 'ofis', name: 'Belge & Ofis Araçları', icon: Wrench }
] as const

export const TOOLS: ToolItem[] = [
  // Finans & Muhasebe
  {
    id: 'hesap',
    label: 'Yüzde & Muhasebe Hesabı',
    shortLabel: 'Yüzde & Muhasebe',
    description: 'Hassas Decimal.js yüzde, indirim, KDV ve finansal hesaplar',
    icon: Calculator,
    badge: 'SÜİT',
    category: 'finans'
  },
  {
    id: 'vergi',
    label: 'Vergi & Tevkifat Hesabı',
    shortLabel: 'Vergi & Tevkifat',
    description: 'Brüt ↔ Net dönüşümü, KDV tevkifatı ve damga vergisi',
    icon: Coins,
    category: 'finans'
  },
  {
    id: 'ceza',
    label: 'Gecikme Cezası & Faiz',
    shortLabel: 'Gecikme Cezası & Faiz',
    description: 'Sözleşme gecikme cezası ve yasal temerrüt faizi',
    icon: Clock,
    category: 'finans'
  },
  {
    id: 'fiyatFarki',
    label: 'TÜİK Fiyat Farkı Hesabı',
    shortLabel: 'TÜİK Fiyat Farkı',
    description: 'Yİ-ÜFE ve TÜFE endeksleri üzerinden fiyat farkı formülü',
    icon: TrendingUp,
    category: 'finans'
  },
  {
    id: 'butce',
    label: '%10 Bütçe Tavanı Takibi',
    shortLabel: '%10 Bütçe Tavanı',
    description: '4734 Sayılı Kanun 21/f ve 22/d bütçe tavanı kontrolü',
    icon: Percent,
    category: 'finans'
  },
  {
    id: 'formul',
    label: 'Dinamik Formül Motoru',
    shortLabel: 'Formül Motoru',
    description: 'Özelleştirilebilir matematiksel ve mantıksal hesaplamalar',
    icon: Cpu,
    category: 'finans'
  },

  // Mevzuat & İhale
  {
    id: 'usul',
    label: 'Alım Usulü Belirleyici',
    shortLabel: 'Alım Usulü (4734/2886)',
    description: 'Tutar ve alım türüne göre mevzuat usul önerisi',
    icon: Scale,
    category: 'mevzuat'
  },
  {
    id: 'sure',
    label: 'Resmi Tatil & Süreler',
    shortLabel: 'Tatil & Süre Hesabı',
    description: 'Tebligat, teklif verme ve itiraz sürelerinin iş günü hesabı',
    icon: Calendar,
    category: 'mevzuat'
  },

  // Belge & Ofis Araçları
  {
    id: 'belge',
    label: 'Belge & Medya Dönüştürücü',
    shortLabel: 'Belge Dönüştürücü',
    description: 'Word, PDF ve görsel dosyaları arasında hızlı dönüşüm',
    icon: ArrowLeftRight,
    badge: 'YENİ',
    category: 'ofis'
  },
  {
    id: 'pano',
    label: "Excel'den Tablo Alıcı",
    shortLabel: 'Excel Tablo Alıcı',
    description: 'Excel panosundan doğrudan temiz HTML/şablon tablosu',
    icon: FileSpreadsheet,
    category: 'ofis'
  },
  {
    id: 'yazi',
    label: 'Çift Yönlü Sayı ↔ Yazı',
    shortLabel: 'Sayı ↔ Yazı Çevirici',
    description: 'Rakamla yazılan tutarları resmî yazı metnine çevirme',
    icon: ArrowLeftRight,
    category: 'ofis'
  },
  {
    id: 'birim',
    label: 'Ölçü Birimi Çevirici',
    shortLabel: 'Ölçü Birimi Çevirici',
    description: 'Alan, uzunluk, ağırlık ve hacim birimleri arası dönüşüm',
    icon: Ruler,
    category: 'ofis'
  }
]

export default function HesaplamaAraclariScreen(): React.JSX.Element {
  const getTabFromUrl = (): TabType => {
    if (typeof window === 'undefined') return 'hesap'
    const hash = window.location.hash || ''
    const hashIdx = hash.indexOf('?')
    const hashParams = hashIdx !== -1 ? new URLSearchParams(hash.substring(hashIdx)) : null
    const searchParams = new URLSearchParams(window.location.search)
    const rawTab = hashParams?.get('tab') || searchParams.get('tab')
    if (rawTab && TOOLS.some((t) => t.id === rawTab)) {
      return rawTab as TabType
    }
    return 'hesap'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleLocationChange = () => {
      setActiveTab(getTabFromUrl())
    }
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const hashPath = hash.split('?')[0] || '#/araclar'
      window.location.hash = `${hashPath}?tab=${tabId}`
    }
  }

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS
    const q = searchQuery.toLocaleLowerCase('tr-TR').trim()
    return TOOLS.filter(
      (t) =>
        t.label.toLocaleLowerCase('tr-TR').includes(q) ||
        t.shortLabel.toLocaleLowerCase('tr-TR').includes(q) ||
        t.description.toLocaleLowerCase('tr-TR').includes(q)
    )
  }, [searchQuery])

  const activeTool = useMemo(() => {
    return TOOLS.find((t) => t.id === activeTab) || TOOLS[0]
  }, [activeTab])

  const ActiveIcon = activeTool.icon

  return (
    <div className="p-4 md:p-6 w-full space-y-6 animate-in fade-in duration-200">
      {/* BAŞLIK BANNER (Derli Toplu & Modern) */}
      <div className="p-5 md:p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-lg border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white">
                İhale, Belge & Hesaplama Araçları
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4734, 2886 & Ofis Araçları
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1">
              Decimal.js hassas finans süiti, Word/PDF dönüştürücüler, mevzuat limitleri, vergi ve
              formül motoru
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-xl border font-bold bg-white/10 text-white border-white/20">
            {TOOLS.length} Entegre Araç
          </span>
        </div>
      </div>

      {/* BİRLEŞİK SIDEBAR + İÇERİK DÜZENİ */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SOL PANEL: ARAÇLAR LİSTESİ (SIDEBAR) */}
        <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 shadow-xs space-y-3">
          {/* Hızlı Arama Kutusu */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Araçlarda ara..."
              className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Kategoriler ve Araç Butonları */}
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const catTools = filteredTools.filter((t) => t.category === cat.id)
              if (catTools.length === 0) return null

              const CatIcon = cat.icon

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CatIcon size={13} className="text-slate-400" />
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {catTools.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {catTools.map((tool) => {
                      const Icon = tool.icon
                      const isActive = tool.id === activeTab

                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleSelectTab(tool.id)}
                          className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/80 shadow-xs'
                              : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isActive ? 'text-blue-900 dark:text-blue-100' : ''
                                  }`}
                                >
                                  {tool.shortLabel}
                                </span>
                                {tool.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-600 text-white font-extrabold shrink-0">
                                    {tool.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                {tool.description}
                              </p>
                            </div>
                          </div>

                          <ChevronRight
                            size={14}
                            className={`shrink-0 transition-transform ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400 translate-x-0.5'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {filteredTools.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Aradığınız kriterde araç bulunamadı.
              </div>
            )}
          </div>
        </aside>

        {/* SAĞ PANEL: AKTİF ÇALIŞMA ALANI */}
        <main className="flex-1 w-full min-w-0 space-y-4">
          {/* Aktif Araç Başlık Çubuğu */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ActiveIcon size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {activeTool.label}
                  </h2>
                  {activeTool.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
                      {activeTool.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {activeTool.description}
                </p>
              </div>
            </div>
          </div>

          {/* Aktif Araç İçerik Görünümü */}
          <div className="w-full">
            {activeTab === 'hesap' && <HesapAraclariView hideHeader={true} />}
            {activeTab === 'belge' && <BelgeDonusturucuTab />}
            {activeTab === 'usul' && <UsulBelirleyiciTab />}
            {activeTab === 'vergi' && <VergiVeKesintiTab />}
            {activeTab === 'fiyatFarki' && <FiyatFarkiTab />}
            {activeTab === 'yazi' && <SayiyiYaziyaCevirTab />}
            {activeTab === 'birim' && <BirimDonusumTab />}
            {activeTab === 'sure' && <ResmiTatilVeSureTab />}
            {activeTab === 'ceza' && <GecikmeCezasiTab />}
            {activeTab === 'butce' && <ButceTavaniTab />}
            {activeTab === 'pano' && <ExcelPanoTab />}
            {activeTab === 'formul' && <FormulMotoruTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
