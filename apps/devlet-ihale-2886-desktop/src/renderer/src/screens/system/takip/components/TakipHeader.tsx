import React from 'react'
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Columns3,
  FilePlus2,
  FileText,
  LayoutGrid,
  List,
  Pencil
} from 'lucide-react'

export type TakipViewMode = 'kanban' | 'grid' | 'list' | 'metrik' | 'detay'

interface TakipHeaderProps {
  activeDosya?: any
  onEditClick: () => void
  activeView: TakipViewMode
  setActiveView: (view: TakipViewMode) => void
  onOpenWizard: () => void
}

const VIEW_OPTIONS: {
  id: Exclude<TakipViewMode, 'detay'>
  label: string
  icon: typeof Columns3
  title: string
}[] = [
  {
    id: 'kanban',
    label: 'Kanban',
    icon: Columns3,
    title: 'Aşamalara göre iş akışı'
  },
  {
    id: 'grid',
    label: 'Kartlar',
    icon: LayoutGrid,
    title: 'Dosyaları kart görünümünde listele'
  },
  {
    id: 'list',
    label: 'Liste',
    icon: List,
    title: 'Dosyaları kompakt listede görüntüle'
  },
  {
    id: 'metrik',
    label: 'Metrikler',
    icon: BarChart3,
    title: 'Süreç istatistikleri ve grafikler'
  }
]

export function TakipHeader({
  activeDosya,
  onEditClick,
  activeView,
  setActiveView,
  onOpenWizard
}: TakipHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-200/80 pb-5 dark:border-slate-800">
      {/* Başlık ve ana aksiyonlar */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400">
            <ClipboardList size={23} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Süreç Takip Paneli
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Doğrudan temin dosyalarını, işlem aşamalarını ve belge tamamlama durumlarını tek
              noktadan takip edin.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Müstakil Detaya Git / Panoya Dön Butonu (En üst aksiyon alanında) */}
          {activeView === 'detay' ? (
            <button
              type="button"
              onClick={() => setActiveView('kanban')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
              title="Panoya / Listeye Geri Dön"
            >
              <ArrowLeft size={16} />
              <span>Panoya Dön</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('detay')}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                activeDosya
                  ? 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 cursor-pointer'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer'
              }`}
              title={
                activeDosya
                  ? `Seçili dosyanın detayına git (${activeDosya.temin_no || activeDosya.konu || '#' + activeDosya.id})`
                  : 'Aktif dosyanın detaylarını görüntüle'
              }
            >
              <FileText size={16} />
              <span>Detaya Git</span>
              {activeDosya?.temin_no && (
                <span className="hidden sm:inline-block rounded-md bg-blue-100/90 px-1.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/70 dark:text-blue-300">
                  {activeDosya.temin_no}
                </span>
              )}
            </button>
          )}

          {activeDosya && activeView === 'detay' && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
            >
              <Pencil size={15} />
              Düzenle
            </button>
          )}

          <button
            type="button"
            onClick={onOpenWizard}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-800 dark:focus-visible:ring-offset-slate-950"
          >
            <FilePlus2 size={17} strokeWidth={2} />
            Yeni Dosya Oluştur
          </button>
        </div>
      </div>

      {/* Görünüm seçici (Dosyaları toplu görüntüleme biçimleri) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Görünüm
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Dosyaları görüntüleme biçimi
          </span>
        </div>

        <nav
          aria-label="Dosya görünüm seçenekleri"
          className="flex w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/70 sm:w-fit"
        >
          {VIEW_OPTIONS.map(({ id, label, icon: Icon, title }) => {
            const isActive = activeView === id

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                title={title}
                aria-label={label}
                aria-pressed={isActive}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-none sm:px-3.5 ${
                  isActive
                    ? 'border border-slate-200/80 bg-white text-blue-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400'
                    : 'border border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
