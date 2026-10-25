import React, { useMemo, useEffect } from 'react'
import { Layers, Maximize2 } from 'lucide-react'
import { useGlobalDocumentPreviewStore } from '../../store/globalDocumentPreviewStore'
import { useTabStore } from '../../store/tabStore'
import { DocumentPreviewModalV3 } from './components/DocumentPreviewModalV3'
import { APP_ROUTES } from '@renderer/constants/routeConstants'
import type { DocumentSource } from './components/DocumentPreviewModalV3/types'

export function BelgeOnizlemeScreen(): React.JSX.Element | null {
  const {
    tabs,
    activeTabId,
    isBalloon,
    setIsBalloon,
    switchTab,
    closeTab,
    openDocument,
    closeDocument
  } = useGlobalDocumentPreviewStore()
  const { activeTabPath, closeTab: closeAppTab } = useTabStore()

  // URL'den olası parametreleri oku
  const searchParams = useMemo(() => {
    return new URLSearchParams(activeTabPath.split('?')[1] || '')
  }, [activeTabPath])

  const urlDocId = searchParams.get('doc') || searchParams.get('documentId') || null
  const urlDosyaId = searchParams.get('id') ? Number(searchParams.get('id')) : null
  const urlRaporId = searchParams.get('raporId') ? Number(searchParams.get('raporId')) : null
  const urlSourceKind =
    searchParams.get('sourceKind') ||
    (urlRaporId ? 'ihtiyacRaporu' : urlDosyaId ? 'dosya' : undefined)
  const urlTitle = searchParams.get('title')
    ? decodeURIComponent(searchParams.get('title') || '')
    : undefined

  const urlSource: DocumentSource | undefined = useMemo(() => {
    if (urlSourceKind === 'ihtiyacRaporu' && urlRaporId) {
      return { kind: 'ihtiyacRaporu', raporId: urlRaporId }
    }
    if (urlDosyaId) {
      return { kind: 'dosya', dosyaId: urlDosyaId }
    }
    return undefined
  }, [urlSourceKind, urlRaporId, urlDosyaId])

  // Eğer store'da henüz sekme yoksa ama URL'de parametre varsa otomatik olarak store'a yükle
  useEffect(() => {
    if (tabs.length === 0 && urlDocId) {
      openDocument({
        documentId: urlDocId,
        dosyaId: urlDosyaId,
        raporId: urlRaporId,
        source: urlSource,
        documentTitle: urlTitle
      })
    }
  }, [tabs.length, urlDocId, urlDosyaId, urlRaporId, urlSource, urlTitle, openDocument])

  const activeTab = useMemo(() => {
    if (activeTabId) {
      const match = tabs.find((t) => t.tabId === activeTabId)
      if (match) return match
    }
    if (urlDocId) {
      const match = tabs.find((t) => t.documentId === urlDocId)
      if (match) return match
    }
    return tabs[0] || null
  }, [tabs, activeTabId, urlDocId])

  // Aktif sekme değiştiğinde üst sekme başlığını güncelle
  useEffect(() => {
    if (activeTab && activeTabPath.startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
      const docTitle = activeTab.documentTitle || activeTab.documentId
      useTabStore.getState().updateTabLabel(activeTabPath, `📄 ${docTitle}`)
    }
  }, [activeTab, activeTabPath])

  // İç sekmeyi değiştirme
  const handleSwitchTab = (tabId: string): void => {
    switchTab(tabId)
    const target = tabs.find((t) => t.tabId === tabId)
    if (target && activeTabPath.startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
      const docTitle = target.documentTitle || target.documentId
      useTabStore.getState().updateTabLabel(activeTabPath, `📄 ${docTitle}`)
    }
  }

  // İç sekmeyi kapatma (son sekme kapandığında üst sekmeyi de kapat)
  const handleCloseInnerTab = (tabId: string): void => {
    const isLastTab = tabs.length <= 1
    closeTab(tabId)
    if (isLastTab) {
      if (activeTabPath.startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
        const nextPath = closeAppTab(activeTabPath)
        if (nextPath && typeof window !== 'undefined') {
          window.location.hash = nextPath
        }
      }
    }
  }

  // Tüm önizleme ekranını kapatma
  const handleClose = (): void => {
    closeDocument()
    if (activeTabPath.startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
      const nextPath = closeAppTab(activeTabPath)
      if (nextPath && typeof window !== 'undefined') {
        window.location.hash = nextPath
      }
    }
  }

  // Yüzen balon modundaysa, iki host'un aynı anda render edilmesini engelle
  if (isBalloon) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 gap-3 p-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Belge Yüzen Balon Modunda Açık
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {activeTab?.documentTitle || activeTab?.documentId || 'Belge'} ekranın sağ alt köşesinde
            kompakt balon olarak görüntüleniyor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsBalloon(false)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Tam Boyuta Genişlet</span>
        </button>
      </div>
    )
  }

  // Henüz sekme yüklenmemişse URL parametreleriyle tekil render et
  if (!activeTab) {
    if (!urlDocId) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 text-sm">
          Açık belge bulunamadı.
        </div>
      )
    }
    return (
      <DocumentPreviewModalV3
        isOpen={true}
        documentId={urlDocId}
        dosyaId={urlDosyaId}
        source={urlSource}
        isModal={false}
        onClose={handleClose}
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseInnerTab}
        onAddTab={openDocument}
        isBalloon={false}
        onToggleBalloon={() => setIsBalloon(true)}
      />
    )
  }

  const effectiveSource =
    activeTab.source ||
    (activeTab.raporId
      ? { kind: 'ihtiyacRaporu', raporId: activeTab.raporId }
      : activeTab.dosyaId
        ? { kind: 'dosya', dosyaId: activeTab.dosyaId }
        : undefined)

  return (
    <DocumentPreviewModalV3
      key={activeTab.tabId}
      isOpen={true}
      documentId={activeTab.documentId}
      dosyaId={activeTab.dosyaId}
      source={effectiveSource}
      initialTemplateId={activeTab.initialTemplateId || activeTab.documentId}
      currentStage={activeTab.stage || undefined}
      invitedFirms={activeTab.invitedFirms}
      selectedFirma={activeTab.selectedFirma}
      initialData={activeTab.initialData || undefined}
      isModal={false}
      onClose={handleClose}
      tabs={tabs}
      activeTabId={activeTab.tabId}
      onSwitchTab={handleSwitchTab}
      onCloseTab={handleCloseInnerTab}
      onAddTab={openDocument}
      isBalloon={false}
      onToggleBalloon={() => setIsBalloon(true)}
    />
  )
}

export default BelgeOnizlemeScreen
