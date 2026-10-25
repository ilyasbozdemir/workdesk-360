import React from 'react'
import {
  Sparkles,
  Printer,
  Save,
  CheckCircle2,
  Code2,
  BookOpen,
  Send,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useDTEbysStudio } from '../hooks/useDTEbysStudio'
import { EbysSidebar } from '../../../ebys/components/EbysSidebar'
import { EbysPreview } from '../../../ebys/components/EbysPreview'
import { EbysCodeViewer } from '../../../ebys/components/EbysCodeViewer'
import { EbysMevzuatGuide } from '../../../ebys/components/EbysMevzuatGuide'
import { ResmiUstYaziTab } from '../../../ebys/components/ResmiUstYaziTab'

export interface DTEbysStudyosuTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dosya: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kalemler: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firmalar: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  komisyonlar: any[]
  toplamBedel: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dosyaContext?: any
}

export function DTEbysStudyosuTab({
  dosya,
  kalemler,
  firmalar,
  komisyonlar,
  toplamBedel,
  dosyaContext
}: DTEbysStudyosuTabProps): React.JSX.Element {
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
    isSaved,
    setSelectedTemplateId,
    setActiveCategory,
    setSearchQuery,
    setActiveTab,
    setZoomLevel,
    setSidebarTab,
    handleVariableChange,
    handleResetVariables,
    handleCopyCode,
    handlePrint,
    handleSaveToDosya
  } = useDTEbysStudio({
    dosya,
    kalemler,
    firmalar,
    komisyonlar,
    toplamBedel,
    dosyaContext
  })

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* 1. ÜST BİLGİ & EYLEM ÇUBUĞU */}
      <div className="bg-linear-to-r from-indigo-900/20 via-blue-900/10 to-slate-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">
                Doğrudan Temin Resmî Yazışma Stüdyosu
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                EYP 2.0 & Yönetmelik Uyumlu
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Dosya İçi Evrak (Harici Gönderim Yoktur)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Evraklar resmî yazışma formatında doğrudan temin dosyasında arşivlenmek ve yazdırılmak
              üzere hazırlanır; dış EBYS/KEP servisine gönderilme yapılmaz.
            </p>
          </div>
        </div>

        {/* Eylem Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Kontrolleri */}
          <div className="flex items-center bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 50))}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1.5 min-w-[38px] text-center">
              %{zoomLevel}
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dosyaya Kaydet Butonu */}
          <button
            onClick={handleSaveToDosya}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Dosyaya Kaydedildi!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Bu Evrakı Dosyaya Kaydet
              </>
            )}
          </button>

          {/* Yazdır Butonu */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Yazdır / PDF
          </button>
        </div>
      </div>

      {/* 2. GÖRÜNÜM SEÇİCİ SEKMELER */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> A4 Önizleme & Düzenleme
        </button>

        <button
          onClick={() => setActiveTab('resmi_yazi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'resmi_yazi'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Resmî Üst Yazı Motoru (DETSİS / Rota)
        </button>

        <button
          onClick={() => setActiveTab('html')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'html'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> HTML / CSS İncele
        </button>

        <button
          onClick={() => setActiveTab('mevzuat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'mevzuat'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Resmî Yazışma Rehberi
        </button>
      </div>

      {/* 3. ANA GÖVDE */}
      {activeTab === 'resmi_yazi' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <ResmiUstYaziTab />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[720px] items-stretch">
          {/* SOL PANEL (4 Kolon): Şablon Listesi ve Değişken Formu */}
          <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
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
          </div>

          {/* SAĞ PANEL (8 Kolon): Aktif Sekmeye Göre Görünüm */}
          <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
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
                onDownloadHtml={() => {}}
                onDownloadCss={() => {}}
              />
            )}

            {activeTab === 'mevzuat' && <EbysMevzuatGuide />}
          </div>
        </div>
      )}
    </div>
  )
}
