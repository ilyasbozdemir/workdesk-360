import React, { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTabStore, normalizePath } from '../../../store/tabStore'
import { routeComponents } from '../routeComponents'
import { useTheme } from '../../providers/ThemeProvider'
import { useGlobalDocumentPreviewStore } from '../../../store/globalDocumentPreviewStore'
import { TEMPLATE_NAMES } from '../../../../../shared/constants/templateConstants'

// Parçalanmış alt bileşenler, hook ve stiller
import { SimpleStyles } from './SimpleStyles'
import { useSimpleLayoutData } from './hooks/useSimpleLayoutData'
import { SimpleTopbar } from './components/SimpleTopbar'
import { SimpleSidebar } from './components/SimpleSidebar'
import { SimpleTabsBar } from './components/SimpleTabsBar'
import { SimpleDashboard } from './components/SimpleDashboard'
import { SimpleFileDetail } from './components/SimpleFileDetail'
import { SimpleDocumentPreview } from './components/SimpleDocumentPreview'
import { SimpleTemplateGallery } from './components/SimpleTemplateGallery'
import { SimpleModals } from './components/SimpleModals'
import { SimpleViewMode } from './types'

export function SimpleLayout(): React.JSX.Element {
  const navigate = useNavigate()
  const { institutionName, adminName, adminTitle, setLayoutMode } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const { tabs, activeTabPath, setActiveTab, closeTab, addTab } = useTabStore()

  // Veri ve state yönetimi custom hook'tan sağlanır
  const {
    files,
    selectedFileId,
    setSelectedFileId,
    selectedFile,
    numericDosyaId,
    setActiveDosyaId,
    filteredFiles,
    globalSearch,
    setGlobalSearch,
    fileSearch,
    setFileSearch,
    statusFilter,
    setStatusFilter,
    toastMsg,
    showToast,
    activeModal,
    setActiveModal,
    items,
    offers,
    addFile,
    addItem,
    addOffer
  } = useSimpleLayoutData()

  // Sidebar daralıp genişleme (Collapse / Expand)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('simple_sidebar_collapsed') === 'true'
  })
  const handleToggleCollapsed = (val: boolean) => {
    setIsCollapsed(val)
    localStorage.setItem('simple_sidebar_collapsed', String(val))
  }

  // Görünüm modu: 'simple-dashboard' | 'tab-view'
  const [viewMode, setViewMode] = useState<SimpleViewMode>('simple-dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('Genel Bakış')
  const [currentTab, setCurrentTab] = useState('Genel Bilgiler')
  const [selectedTemplateId, setSelectedTemplateId] = useState('piyasa-fiyat-arastirma-tutanagi')

  const cleanPath = useMemo(() => {
    return normalizePath(activeTabPath).split('?')[0]
  }, [activeTabPath])

  const ActiveComponent = useMemo(() => {
    return routeComponents[cleanPath] || null
  }, [cleanPath])

  const handleNavigateTab = (path: string, pageName?: string) => {
    if (pageName) setCurrentPage(pageName)
    addTab(path)
    setActiveTab(path)
    setViewMode('tab-view')
    navigate({ to: path })
  }

  const handleOpenDocumentEngineModal = (docId: string, title?: string) => {
    useGlobalDocumentPreviewStore.getState().openDocument({
      documentId: docId,
      dosyaId: numericDosyaId,
      documentTitle: title || TEMPLATE_NAMES[docId] || docId
    })
    showToast(`"${title || docId}" şablonu açılıyor...`)
  }

  return (
    <div className={`simple-root ${theme === 'dark' ? 'dark' : ''}`}>
      <SimpleStyles isCollapsed={isCollapsed} />

      {/* 1. ÜST ÇUBUK (TOPBAR & WINDOW CONTROLS) */}
      <SimpleTopbar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        institutionName={institutionName}
        adminName={adminName}
        adminTitle={adminTitle}
        files={files}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        setActiveDosyaId={setActiveDosyaId}
        onOpenSelectedFile={() => {
          setCurrentTab('Genel Bilgiler')
          setCurrentPage('Dosya Detayı')
          setViewMode('simple-dashboard')
        }}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        onSwitchToAdvanced={() => {
          setLayoutMode('advanced')
          showToast('Gelişmiş çalışma alanı ekranına geçildi')
        }}
        theme={theme}
        setTheme={setTheme}
        showToast={showToast}
      />

      {/* 2. SOL MENÜ (COLLAPSIBLE SIDEBAR) */}
      <SimpleSidebar
        isCollapsed={isCollapsed}
        sidebarOpen={sidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filesCount={files.length}
        onNavigateTab={handleNavigateTab}
      />

      {/* 3. ANA ÇALIŞMA ALANI */}
      <main className="simple-main" style={{ padding: 0 }}>
        {/* SEKME ÇUBUĞU (SIMPLE TABS BAR) */}
        <SimpleTabsBar
          viewMode={viewMode}
          onSelectDashboard={() => {
            setViewMode('simple-dashboard')
            setCurrentPage('Genel Bakış')
          }}
          tabs={tabs}
          activeTabPath={activeTabPath}
          onSelectTab={(path) => {
            setActiveTab(path)
            setViewMode('tab-view')
            navigate({ to: path })
          }}
          onCloseTab={(path) => {
            closeTab(path)
            if (activeTabPath === path) {
              setViewMode('simple-dashboard')
            }
          }}
        />

        <div style={{ padding: '24px 28px 40px' }}>
          {viewMode === 'tab-view' && ActiveComponent ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 min-h-[600px] overflow-auto">
              <ActiveComponent />
            </div>
          ) : (
            <>
              <div className="simple-breadcrumb">
                TEMİN 360 <span style={{ padding: '0 7px', color: '#b4bdc9' }}>/</span>
                <b>{currentPage}</b>
              </div>

              <div className="simple-page-head">
                <div>
                  <div className="simple-eyebrow">SATIN ALMA VE İHALE YÖNETİMİ</div>
                  <h1>{currentPage}</h1>
                  <p className="simple-subtitle">
                    {currentPage === 'Genel Bakış'
                      ? 'Satın alma süreçlerinizi ve bekleyen işlemlerinizi tek noktadan takip edin.'
                      : `${currentPage} çalışma alanı ve yönetim görünümü.`}
                  </p>
                </div>
                <div className="simple-actions">
                  <button className="simple-btn" onClick={() => window.print()}>
                    ⇩ &nbsp; Raporu dışa aktar
                  </button>
                  <button
                    className="simple-btn primary"
                    onClick={() => setActiveModal('newFile')}
                  >
                    ＋ &nbsp; Yeni dosya oluştur
                  </button>
                </div>
              </div>

              {/* 3.1. GENEL BAKIŞ / DASHBOARD */}
              {currentPage === 'Genel Bakış' && (
                <SimpleDashboard
                  files={files}
                  filteredFiles={filteredFiles}
                  fileSearch={fileSearch}
                  setFileSearch={setFileSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onSelectFile={(f) => {
                    setSelectedFileId(f.id)
                    setCurrentTab('Genel Bilgiler')
                    setCurrentPage('Dosya Detayı')
                  }}
                  onOpenNewFileModal={() => setActiveModal('newFile')}
                />
              )}

              {/* 3.2. DOSYA DETAYI */}
              {currentPage === 'Dosya Detayı' && (
                <SimpleFileDetail
                  selectedFile={selectedFile}
                  currentTab={currentTab}
                  setCurrentTab={setCurrentTab}
                  items={items}
                  offers={offers}
                  onOpenNewItemModal={() => setActiveModal('addItem')}
                  onOpenNewOfferModal={() => setActiveModal('addOffer')}
                  onOpenPreview={() => setCurrentPage('Belge Önizleme')}
                />
              )}

              {/* 3.3. A4 RESMÎ BELGE ÖNİZLEME */}
              {currentPage === 'Belge Önizleme' && (
                <SimpleDocumentPreview
                  selectedFile={selectedFile}
                  selectedTemplateId={selectedTemplateId}
                  setSelectedTemplateId={setSelectedTemplateId}
                  institutionName={institutionName}
                  adminName={adminName}
                  offers={offers}
                  onBackToDetail={() => setCurrentPage('Dosya Detayı')}
                  onOpenDocumentEngineModal={handleOpenDocumentEngineModal}
                />
              )}

              {/* 3.4. BELGELER & ŞABLONLAR GALERİSİ */}
              {currentPage === 'Belgeler & Şablonlar' && (
                <SimpleTemplateGallery
                  onSelectTemplateForPreview={(tplId) => {
                    setSelectedTemplateId(tplId)
                    setCurrentPage('Belge Önizleme')
                  }}
                  onOpenDocumentEngineModal={handleOpenDocumentEngineModal}
                  onGoToPreview={() => setCurrentPage('Belge Önizleme')}
                />
              )}

              <div className="simple-notice">
                <span>ⓘ</span>
                <div>
                  <b>Bilgilendirme:</b> Basit Ekran arayüzü entegre edilmiştir. Ayarlar veya üst bardaki 
                  <b>"⊞ Gelişmiş Ekran"</b> butonu üzerinden dilediğiniz an geçiş yapabilirsiniz.
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* 4. MODALLAR (YENİ DOSYA, KALEM, TEKLİF) */}
      <SimpleModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        filesCount={files.length}
        onAddFile={addFile}
        onAddItem={addItem}
        onAddOffer={addOffer}
      />

      {/* 5. BİLDİRİM TOAST */}
      {toastMsg && <div className="simple-toast">{toastMsg}</div>}
    </div>
  )
}
