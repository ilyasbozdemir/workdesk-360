import React from 'react'
import { useEbysStudio } from './hooks/useEbysStudio'
import { EbysHeader } from './components/EbysHeader'
import { EbysSidebar } from './components/EbysSidebar'
import { EbysPreview } from './components/EbysPreview'
import { EbysCodeViewer } from './components/EbysCodeViewer'
import { EbysMevzuatGuide } from './components/EbysMevzuatGuide'
import { ResmiUstYaziTab } from './components/ResmiUstYaziTab'
import { EbysTipTapEditorTab } from './components/tiptap-editor/EbysTipTapEditorTab'

export default function EbysScreen(): React.JSX.Element {
  const {
    selectedTemplate,
    selectedTemplateId,
    activeCategory,
    searchQuery,
    activeTab,
    zoomLevel,
    copyStatus,
    sidebarTab,
    variables,
    filteredTemplates,
    currentHtml,
    currentCss,
    setSelectedTemplateId,
    setActiveCategory,
    setSearchQuery,
    setActiveTab,
    setZoomLevel,
    setSidebarTab,
    handleVariableChange,
    handleResetVariables,
    handleCopyCode,
    handleDownloadHtml,
    handleDownloadCss,
    handlePrint
  } = useEbysStudio()

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. ÜST HEADER */}
      <EbysHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        onPrint={handlePrint}
        onDownloadHtml={handleDownloadHtml}
        onDownloadCss={handleDownloadCss}
        onOpenMevzuat={() => setActiveTab('mevzuat')}
        templateName={selectedTemplate.name}
      />

      {/* 2. ANA ÇALIŞMA ALANI */}
      {activeTab === 'editor' ? (
        <EbysTipTapEditorTab
          selectedTemplate={selectedTemplate}
          currentTemplateHtml={currentHtml}
        />
      ) : activeTab === 'resmi_yazi' ? (
        <ResmiUstYaziTab />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* SOL PANEL: Şablon Listesi ve Değişken Formu */}
          <EbysSidebar
            templates={filteredTemplates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
            variables={variables}
            onVariableChange={handleVariableChange}
            onResetVariables={handleResetVariables}
          />

          {/* ORTA / SAĞ PANEL: Aktif Sekmeye Göre Görünüm */}
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            {activeTab === 'preview' && (
              <EbysPreview
                template={selectedTemplate}
                html={currentHtml}
                css={currentCss}
                zoomLevel={zoomLevel}
              />
            )}

            {(activeTab === 'html' || activeTab === 'css') && (
              <EbysCodeViewer
                html={currentHtml}
                css={currentCss}
                copyStatus={copyStatus}
                onCopy={handleCopyCode}
                onDownloadHtml={handleDownloadHtml}
                onDownloadCss={handleDownloadCss}
              />
            )}

            {activeTab === 'mevzuat' && <EbysMevzuatGuide />}
          </main>
        </div>
      )}
    </div>
  )
}
