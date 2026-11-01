import { create } from 'zustand'
import { useTabStore } from './tabStore'
import { APP_ROUTES } from '../constants/routeConstants'

import { DocumentSource } from '../screens/dosya/components/DocumentPreviewModalV3/types'

export type { DocumentSource }

export interface DocumentPreviewTab {
  tabId: string
  documentId: string
  dosyaId?: number | null
  dosyaNo?: string | null
  documentTitle?: string | null
  invitedFirms?: unknown[]
  selectedFirma?: Record<string, unknown> | null
  initialData?: Record<string, unknown> | null
  stage?: number | string | null
  source?: DocumentSource
  raporId?: number | null
  initialTemplateId?: string
}

export interface GlobalDocumentPreviewState {
  isOpen: boolean
  isBalloon: boolean
  activeTabId: string | null
  tabs: DocumentPreviewTab[]
  documentId: string | null
  dosyaId?: number | null
  source?: DocumentSource
  raporId?: number | null
  invitedFirms?: unknown[]
  selectedFirma?: Record<string, unknown> | null
  initialData?: Record<string, unknown> | null
  onCloseCallback?: (() => void) | null

  getActiveTab: () => DocumentPreviewTab | null
  openDocument: (params: {
    documentId: string
    dosyaId?: number | null
    dosyaNo?: string | null
    documentTitle?: string
    invitedFirms?: unknown[]
    selectedFirma?: Record<string, unknown> | null
    initialData?: Record<string, unknown> | null
    stage?: number | string | null
    startAsBalloon?: boolean
    source?: DocumentSource
    raporId?: number | null
    initialTemplateId?: string
    onClose?: () => void
  }) => void

  switchTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  closeAllTabs: () => void
  closeDocument: () => void
  setIsBalloon: (isBalloon: boolean) => void
  toggleBalloon: () => void
}

export function generateTabId(params: {
  documentId: string
  dosyaId?: number | null
  source?: DocumentSource
  raporId?: number | null
  selectedFirma?: Record<string, unknown> | null
}): string {
  const f = params.selectedFirma
  const fKey =
    (f?.id as string | number) ||
    (f?.firma_id as string | number) ||
    (f?.temin_firma_id as string | number) ||
    (f?.unvan as string) ||
    'all'

  let effectiveRaporId: number | null | undefined = params.raporId
  if (params.source?.kind === 'ihtiyacRaporu') {
    effectiveRaporId = params.source.raporId
  }
  if (effectiveRaporId) {
    return `rapor::${effectiveRaporId}::${params.documentId}`
  }

  let effectiveDosyaId: number | null | undefined = params.dosyaId
  if (params.source?.kind === 'dosya') {
    effectiveDosyaId = params.source.dosyaId
  }
  if (effectiveDosyaId) {
    return `dosya::${effectiveDosyaId}::${params.documentId}::${fKey}`
  }

  return `doc::${params.documentId}::${fKey}`
}

export const useGlobalDocumentPreviewStore = create<GlobalDocumentPreviewState>((set, get) => ({
  isOpen: false,
  isBalloon: false,
  activeTabId: null,
  tabs: [],
  documentId: null,
  dosyaId: null,
  source: undefined,
  raporId: null,
  invitedFirms: [],
  selectedFirma: null,
  initialData: null,
  onCloseCallback: null,

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.tabId === activeTabId) || tabs[0] || null
  },

  openDocument: (params) => {
    let effectiveRaporId: number | null | undefined = params.raporId
    if (params.source?.kind === 'ihtiyacRaporu') {
      effectiveRaporId = params.source.raporId
    }

    let effectiveDosyaId: number | null | undefined = params.dosyaId
    if (params.source?.kind === 'dosya') {
      effectiveDosyaId = params.source.dosyaId
    }

    let effectiveSource: DocumentSource | undefined = params.source
    if (!effectiveSource) {
      if (effectiveRaporId) {
        effectiveSource = { kind: 'ihtiyacRaporu', raporId: effectiveRaporId }
      } else if (effectiveDosyaId) {
        effectiveSource = { kind: 'dosya', dosyaId: effectiveDosyaId }
      }
    }

    const tabId = generateTabId({
      documentId: params.documentId,
      dosyaId: effectiveDosyaId,
      source: effectiveSource,
      raporId: effectiveRaporId,
      selectedFirma: params.selectedFirma
    })

    const { tabs } = get()
    const existingIndex = tabs.findIndex((t) => t.tabId === tabId)

    // Uygulama sekmesine dahil et (yeni tab olarak aç veya mevcut sekmeye odaklan)
    if (!params.startAsBalloon) {
      const titleParam = params.documentTitle
        ? `&title=${encodeURIComponent(params.documentTitle)}`
        : ''
      const idParam = effectiveDosyaId ? `&id=${effectiveDosyaId}` : ''
      const raporParam = effectiveRaporId ? `&raporId=${effectiveRaporId}` : ''
      const sourceKindParam = effectiveSource?.kind ? `&sourceKind=${effectiveSource.kind}` : ''
      const docParam = `doc=${encodeURIComponent(params.documentId)}`
      const targetPath = `${APP_ROUTES.BELGE_ONIZLEME}?${docParam}${idParam}${raporParam}${sourceKindParam}${titleParam}`

      const currentActiveTabPath = useTabStore.getState().activeTabPath
      const isAlreadyOnBelgeOnizleme = currentActiveTabPath
        .split('?')[0]
        .startsWith(APP_ROUTES.BELGE_ONIZLEME)

      if (!isAlreadyOnBelgeOnizleme) {
        // Belge önizleme henüz aktif değilse workspace tabı olarak aç
        useTabStore.getState().addTab(targetPath)
        if (typeof window !== 'undefined') {
          const cleanHash = window.location.hash.replace(/^#/, '')
          if (cleanHash !== targetPath) {
            window.location.hash = targetPath
          }
        }
      } else {
        // Zaten belge önizleme sekmesindeyiz! Üst bara kesinlikle yeni sekme eklenmeyecek.
        // Sadece mevcut tek sekmenin başlığını aktif belgeye göre güncelle.
        if (params.documentTitle) {
          useTabStore.getState().updateTabLabel(currentActiveTabPath, `📄 ${params.documentTitle}`)
        }
      }
    }

    if (existingIndex >= 0) {
      // Sekme zaten açık, sadece o sekmeye odaklan
      if (params.stage !== undefined && tabs[existingIndex].stage !== params.stage) {
        tabs[existingIndex].stage = params.stage
      }
      if (effectiveSource && !tabs[existingIndex].source) {
        tabs[existingIndex].source = effectiveSource
      }
      if (effectiveRaporId && !tabs[existingIndex].raporId) {
        tabs[existingIndex].raporId = effectiveRaporId
      }
      set({
        isOpen: true,
        isBalloon: params.startAsBalloon ?? false,
        activeTabId: tabId,
        source: effectiveSource,
        raporId: effectiveRaporId || null,
        dosyaId: effectiveDosyaId || null,
        onCloseCallback: params.onClose || get().onCloseCallback
      })
      return
    }

    const newTab: DocumentPreviewTab = {
      tabId,
      documentId: params.documentId,
      dosyaId: effectiveDosyaId || null,
      dosyaNo: params.dosyaNo || (effectiveDosyaId ? `#${effectiveDosyaId}` : null),
      documentTitle: params.documentTitle || null,
      invitedFirms: params.invitedFirms || [],
      selectedFirma: params.selectedFirma || null,
      initialData: params.initialData || null,
      stage: params.stage ?? null,
      source: effectiveSource,
      raporId: effectiveRaporId || null,
      initialTemplateId: params.initialTemplateId || params.documentId
    }

    set({
      isOpen: true,
      isBalloon: params.startAsBalloon ?? false,
      tabs: [...tabs, newTab],
      activeTabId: tabId,
      source: effectiveSource,
      raporId: effectiveRaporId || null,
      dosyaId: effectiveDosyaId || null,
      onCloseCallback: params.onClose || get().onCloseCallback
    })
  },

  switchTab: (tabId: string) => {
    set({ activeTabId: tabId })
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId, onCloseCallback } = get()
    const targetIdx = tabs.findIndex((t) => t.tabId === tabId)
    if (targetIdx < 0) return

    const newTabs = tabs.filter((t) => t.tabId !== tabId)

    if (newTabs.length === 0) {
      if (onCloseCallback) {
        try {
          onCloseCallback()
        } catch (e) {
          console.error('Error executing onCloseCallback', e)
        }
      }
      set({
        isOpen: false,
        isBalloon: false,
        tabs: [],
        activeTabId: null,
        onCloseCallback: null
      })
      return
    }

    // Aktif sekme kapatıldıysa bir öncekine veya bir sonrakine geç
    let nextActiveId = activeTabId
    if (activeTabId === tabId) {
      const nextIdx = Math.max(0, targetIdx - 1)
      nextActiveId = newTabs[nextIdx]?.tabId || newTabs[0].tabId
    }

    set({
      tabs: newTabs,
      activeTabId: nextActiveId
    })
  },

  closeAllTabs: () => {
    const { onCloseCallback } = get()
    if (onCloseCallback) {
      try {
        onCloseCallback()
      } catch (e) {
        console.error('Error executing onCloseCallback', e)
      }
    }
    set({
      isOpen: false,
      isBalloon: false,
      tabs: [],
      activeTabId: null,
      documentId: null,
      dosyaId: null,
      source: undefined,
      raporId: null,
      initialData: null,
      onCloseCallback: null
    })
  },

  closeDocument: () => {
    get().closeAllTabs()
  },

  setIsBalloon: (isBalloon) => {
    set({ isBalloon })
    if (!isBalloon && get().isOpen && get().tabs.length > 0) {
      const activeTab = get().getActiveTab()
      if (activeTab) {
        const titleParam = activeTab.documentTitle
          ? `&title=${encodeURIComponent(activeTab.documentTitle)}`
          : ''
        const idParam = activeTab.dosyaId ? `&id=${activeTab.dosyaId}` : ''
        const raporParam = activeTab.raporId ? `&raporId=${activeTab.raporId}` : ''
        const sourceKindParam = activeTab.source?.kind ? `&sourceKind=${activeTab.source.kind}` : ''
        const docParam = `doc=${encodeURIComponent(activeTab.documentId)}`
        const targetPath = `${APP_ROUTES.BELGE_ONIZLEME}?${docParam}${idParam}${raporParam}${sourceKindParam}${titleParam}`

        const currentActiveTabPath = useTabStore.getState().activeTabPath
        if (!currentActiveTabPath.split('?')[0].startsWith(APP_ROUTES.BELGE_ONIZLEME)) {
          useTabStore.getState().addTab(targetPath)
          if (typeof window !== 'undefined') {
            window.location.hash = targetPath
          }
        }
      }
    }
  },
  toggleBalloon: () => {
    const nextVal = !get().isBalloon
    get().setIsBalloon(nextVal)
  }
}))
