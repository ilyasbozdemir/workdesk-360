import React, { useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTabStore } from '../../store/tabStore'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Coins, FileText, Layers } from 'lucide-react'
import { ProcessStepper } from './components/ProcessStepper'
import { APP_ROUTES } from '../../constants/routeConstants'

const STEPPER_ROUTES = [
  'hazirlik-ve-ihtiyac',
  'piyasa-fiyat-arastirmasi',
  'siparis-ve-sozlesme',
  'kabul-ve-odeme'
]

interface SubScreenProps {
  title: string
  icon: React.ElementType
  description: string
  children?: React.ReactNode
  hideStepper?: boolean
  requireActiveDosya?: boolean
  previewDocumentId?: string | null
  selectedFirma?: unknown
  invitedFirms?: unknown[]
  onClosePreview?: () => void
}

export function SubScreen({
  title,
  icon: Icon,
  description,
  children,
  hideStepper = false,
  requireActiveDosya = true
}: SubScreenProps): React.JSX.Element {
  const navigate = useNavigate()
  const addTab = useTabStore((s) => s.addTab)
  const activeTabPath = useTabStore((s) => s.activeTabPath)
  const canGoBack = useTabStore((s) => {
    const currentTab = s.tabs.find((t) => t.path === s.activeTabPath)
    return currentTab ? currentTab.currentIndex > 0 : false
  })
  const goBack = useTabStore((s) => s.goBack)
  const activeDosyaId = useWorkspaceStore((s) => s.activeDosyaId)
  const setActiveStarredDocs = useWorkspaceStore((s) => s.setActiveStarredDocs)

  useEffect(() => {
    document.title = `${title} - Doğrudan Temin`
  }, [title])

  useEffect(() => {
    if (!activeDosyaId) return
    window.electron.ipcRenderer
      .invoke('db:query', 'SELECT starred_docs FROM DATA_TeminDosyasi WHERE id = ?', [
        activeDosyaId
      ])
      .then((res) => {
        if (res.success && res.data.length > 0) {
          try {
            const docs = res.data[0].starred_docs ? JSON.parse(res.data[0].starred_docs) : []
            setActiveStarredDocs(docs)
          } catch (e) {
            console.error('Failed to parse active file starred docs:', e)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to query active file starred docs:', err)
      })
  }, [activeDosyaId, title, setActiveStarredDocs])

  // Mevcut sayfanın stepper'a dahil olup olmadığını belirle
  const currentPath =
    activeTabPath || (typeof window !== 'undefined' ? window.location.pathname : '')
  const showStepper = !hideStepper && STEPPER_ROUTES.some((r) => currentPath.includes(r))

  return (
    <div className="p-6 md:p-8 w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={() => goBack()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              title="Geri Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-855 dark:text-slate-100 flex items-center gap-2">
              <Icon className="w-7 h-7 text-blue-600" />
              {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">{description}</p>
          </div>
        </div>

        {activeDosyaId && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const route = `${APP_ROUTES.DOSYA_KUNYE}?id=${activeDosyaId}`
                addTab(route)
                navigate({ to: route })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              title="Dosya Künyesini ve Tüm Verileri İncele"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Dosya Künyesi
            </button>
            <button
              type="button"
              onClick={() => {
                addTab(APP_ROUTES.DOSYA_DETAY)
                navigate({ to: APP_ROUTES.DOSYA_DETAY })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              title="Süreç Takip Paneline Git"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Süreç Takip
            </button>
            <button
              type="button"
              onClick={() => {
                const route = `${APP_ROUTES.BKMYBS_MALI_YONETIM}?tab=mif&dosyaId=${activeDosyaId}`
                addTab(route)
                navigate({ to: route })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-xs"
              title="5018 BKMYBS Mali Masasına ve Ödeme Emri Taslağına Aktar"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mali Masaya Aktar
            </button>
          </div>
        )}
      </div>

      {/* PROCESS STEPPER */}
      {showStepper && activeDosyaId && <ProcessStepper currentRoute={currentPath} />}

      {/* ACTIVE DOSYA CONTEXT */}
      {requireActiveDosya && !activeDosyaId && (
        <div className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400 font-semibold shadow-sm print:hidden">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            Aktif bir doğrudan temin dosyası seçmediniz. Bu ekranda işlem yapabilmek için lütfen
            önce{' '}
            <Link to="/dosyalar" className="underline font-bold text-blue-600 dark:text-blue-400">
              dosyalar listesinden
            </Link>{' '}
            bir dosya seçin.
          </div>
        </div>
      )}

      {/* CHILDREN VIEW */}
      {(activeDosyaId || !requireActiveDosya) && children}
    </div>
  )
}
