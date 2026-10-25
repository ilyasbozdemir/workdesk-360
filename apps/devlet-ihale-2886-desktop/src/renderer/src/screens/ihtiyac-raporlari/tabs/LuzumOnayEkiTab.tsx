import React, { useMemo } from 'react'
import { Package, Layers, ExternalLink, CheckCircle2 } from 'lucide-react'
import {
  useGlobalDocumentPreviewStore,
  generateTabId
} from '../../../store/globalDocumentPreviewStore'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { useTabStore } from '../../../store/tabStore'

interface LuzumOnayEkiTabProps {
  raporId: number
  dosyaId?: number | null
  onClose?: () => void
  className?: string
}

export function LuzumOnayEkiTab({
  raporId,
  dosyaId,
  className
}: LuzumOnayEkiTabProps): React.JSX.Element {
  const { tabs, activeTabId, isBalloon, openDocument, switchTab, setIsBalloon } =
    useGlobalDocumentPreviewStore()

  const documentId = 'luzum_onay_eki'
  const documentTitle = 'Lüzum Onay Eki (Çizelge)'
  const source = useMemo(() => ({ kind: 'ihtiyacRaporu' as const, raporId }), [raporId])

  const targetTabId = useMemo(
    () => generateTabId({ documentId, source, raporId, dosyaId }),
    [documentId, source, raporId, dosyaId]
  )

  const isOpenInStore = useMemo(
    () => tabs.some((t) => t.tabId === targetTabId),
    [tabs, targetTabId]
  )

  const handleOpenWorkspace = (): void => {
    openDocument({
      documentId,
      source,
      raporId,
      dosyaId: dosyaId || null,
      documentTitle,
      startAsBalloon: false
    })
    setIsBalloon(false)
  }

  const handleOpenBalloon = (): void => {
    openDocument({
      documentId,
      source,
      raporId,
      dosyaId: dosyaId || null,
      documentTitle,
      startAsBalloon: true
    })
  }

  const handleFocusExisting = (): void => {
    switchTab(targetTabId)
    if (isBalloon) {
      setIsBalloon(false)
    }
    const currentActiveTabPath = useTabStore.getState().activeTabPath
    if (!currentActiveTabPath.split('?')[0].startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
      const docParam = `doc=${encodeURIComponent(documentId)}`
      const idParam = dosyaId ? `&id=${dosyaId}` : ''
      const raporParam = `&raporId=${raporId}`
      const sourceKindParam = `&sourceKind=ihtiyacRaporu`
      const titleParam = `&title=${encodeURIComponent(documentTitle)}`
      const targetPath = `${APP_ROUTES.BELGE_ONIZLEME}?${docParam}${idParam}${raporParam}${sourceKindParam}${titleParam}`
      useTabStore.getState().addTab(targetPath)
      if (typeof window !== 'undefined') {
        window.location.hash = targetPath
      }
    }
  }

  return (
    <div
      className={
        className ||
        'relative w-full h-[85vh] min-h-187.5 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs bg-slate-50 dark:bg-slate-900/60 p-6 flex flex-col items-center justify-center'
      }
    >
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center ring-8 ring-purple-500/5">
          <Package className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Lüzum Onay Eki &amp; İhtiyaç Çizelgesi
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Merkezi V3 Önizleme
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Malzeme ve hizmet kalemlerini tablo formatında içeren resmî onay ekini merkezi belge
            motoruyla açın, düzenleyin veya yazdırın.
          </p>
        </div>

        {isOpenInStore && (
          <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                {isBalloon
                  ? 'Belge şu anda yüzen balon modunda açık'
                  : 'Belge önizleme sekmesinde açık'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleFocusExisting}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs"
            >
              Önizlemeye Git
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full text-left text-xs bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Rapor No:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">#{raporId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Bağlı Satın Alma Dosyası:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {dosyaId ? `#${dosyaId}` : 'Bağlı dosya yok'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Kaynak Türü:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              İhtiyaç Raporu (ihtiyacRaporu)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Doğrudan Düzenleme:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Aktif (Veritabanı Kalıcı)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
          <button
            type="button"
            onClick={handleOpenWorkspace}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer active:scale-98"
          >
            <ExternalLink className="w-4 h-4" />
            <span>
              {isOpenInStore && !isBalloon ? 'Önizleme Sekmesine Git' : 'Önizleme Sekmesinde Aç'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenBalloon}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Yüzen Balonda Aç</span>
          </button>
        </div>
      </div>
    </div>
  )
}
