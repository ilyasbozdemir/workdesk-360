import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  BookmarkPlus,
  FolderOpen,
  Printer,
  Download,
  Sparkles,
  Check,
  FileCode,
  FileText,
  RotateCcw,
  Tag
} from 'lucide-react'
import { A4Editor } from '../../../../components/editor/A4Editor'
import { useEbysStudioStore, type EbysDraftItem } from '../../store/ebysStudioStore'
import { SaveTemplateModal } from './SaveTemplateModal'
import { DraftsModal } from './DraftsModal'
import type { EbysTemplate } from '../../ebys.types'

interface EbysTipTapEditorTabProps {
  selectedTemplate?: EbysTemplate
  currentTemplateHtml?: string
}

const EBYS_PLACEHOLDERS = [
  { key: 'kurumAdi', label: 'T.C. Kurum Adı', group: 'Antet & Başlık' },
  { key: 'birimAdi', label: 'Birim / Müdürlük Adı', group: 'Antet & Başlık' },
  { key: 'sayi', label: 'Sayı / Evrak Kayıt No', group: 'Evrak Bilgileri' },
  { key: 'konu', label: 'Konu', group: 'Evrak Bilgileri' },
  { key: 'tarih', label: 'Tarih', group: 'Evrak Bilgileri' },
  { key: 'muhatap', label: 'Muhatap Kurum / Makam', group: 'Muhatap & Dağıtım' },
  { key: 'muhatapEk', label: 'Muhatap Alt Birim', group: 'Muhatap & Dağıtım' },
  { key: 'ilgi', label: 'İlgi Resmî Yazı', group: 'Metin & Dayanak' },
  { key: 'sonucParagrafi', label: 'Sonuç Paragrafı (Arz/Rica)', group: 'Metin & Dayanak' },
  { key: 'imzaAdi', label: 'İmza Yetkilisi Adı', group: 'İmza & Onay' },
  { key: 'imzaUnvani', label: 'İmza Yetkilisi Unvanı', group: 'İmza & Onay' },
  { key: 'ekler', label: 'Ek Listesi', group: 'Ek & Dağıtım' },
  { key: 'dagitimGeregi', label: 'Dağıtım Gereği', group: 'Ek & Dağıtım' },
  { key: 'dagitimBilgi', label: 'Dağıtım Bilgi', group: 'Ek & Dağıtım' },
  { key: 'iletisimAdres', label: 'İletişim Adresi', group: 'İletişim' },
  { key: 'iletisimTelefon', label: 'Telefon Numarası', group: 'İletişim' },
  { key: 'iletisimKep', label: 'KEP Adresi', group: 'İletişim' }
]

const EDITOR_VARIABLES = EBYS_PLACEHOLDERS.map((p) => ({
  label: p.label,
  var: `{{${p.key}}}`,
  group: p.group
}))

export const EbysTipTapEditorTab: React.FC<EbysTipTapEditorTabProps> = ({
  selectedTemplate,
  currentTemplateHtml
}) => {
  const {
    currentHtml,
    currentTitle,
    setCurrentHtml,
    setCurrentTitle,
    saveCurrentDraft,
    loadDraft,
    saveAsCustomTemplate
  } = useEbysStudioStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [showVariableDropdown, setShowVariableDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Otomatik bildirim gösterme
  const showToast = (msg: string): void => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Dışarı tıklandığında değişken dropdown'ını kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariableDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Aktif şablonun HTML'ini editöre yükleme
  const handleLoadFromActiveTemplate = (): void => {
    if (currentTemplateHtml) {
      setCurrentHtml(currentTemplateHtml)
      setCurrentTitle(
        selectedTemplate ? `${selectedTemplate.name} (Düzenleme)` : 'Şablon Düzenleme'
      )
      showToast('Aktif şablon TipTap editörüne aktarıldı.')
    }
  }

  // Taslak Kaydetme
  const handleSaveDraft = (): void => {
    saveCurrentDraft(currentTitle)
    showToast('Çalışma taslağı başarıyla kaydedildi.')
  }

  // Taslak Seçildiğinde
  const handleSelectDraft = (draft: EbysDraftItem): void => {
    loadDraft(draft.id)
    showToast(`"${draft.title}" taslağı yüklendi.`)
  }

  // Şablon Olarak Kaydetme
  const handleSaveTemplate = (data: {
    name: string
    category: any
    categoryLabel?: string
    description: string
    tags?: string[]
  }): void => {
    saveAsCustomTemplate(data)
    showToast(`"${data.name}" EBYS Şablon Kütüphanesine kaydedildi!`)
  }

  // Yazdırma (Resmî Yazışma Standardı)
  const handlePrint = (): void => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>${currentTitle}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm 25mm 20mm 25mm; }
          body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.45; color: #000; margin: 0; padding: 0; background: #fff; }
          table { width: 100%; border-collapse: collapse; }
          p { margin: 0 0 1em 0; text-indent: 10mm; }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${currentHtml}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // HTML İndir
  const handleDownloadHtml = (): void => {
    const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('HTML belgesi indirildi.')
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* 1. ÜST ÇALIŞMA & AKSİYON ÇUBUĞU */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs z-20">
        {/* Sol: Başlık Düzenleme */}
        <div className="flex items-center gap-3 min-w-72 flex-1 max-w-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Çalışma / Belge Başlığı..."
              className="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 focus:border-blue-500 text-xs font-bold text-slate-900 dark:text-slate-100 px-1 py-0.5 focus:outline-none transition"
              title="Çalışma başlığını değiştirmek için tıklayın"
            />
            <span className="text-[10px] text-slate-400 block px-1 mt-0.5 font-medium">
              A4 TipTap Canlı Resmî Yazı Stüdyosu
            </span>
          </div>
        </div>

        {/* Sağ: Aksiyon Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Aktif Şablondan Yükle Butonu */}
          {currentTemplateHtml && (
            <button
              type="button"
              onClick={handleLoadFromActiveTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
              title="Mevcut EBYS şablonunun içeriğini editöre yükler"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
              <span>Şablondan Aktar</span>
            </button>
          )}

          {/* Değişken Ekle Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowVariableDropdown(!showVariableDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Değişkenler ({'{{}}'})</span>
            </button>

            {showVariableDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 text-xs max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Resmî Yazışma Yer Tutucuları
                </div>
                {EBYS_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setCurrentHtml(
                        `${currentHtml} <span class="ebys-ph font-mono text-blue-600 bg-blue-50 px-1 rounded">{{${p.key}}}</span> `
                      )
                      setShowVariableDropdown(false)
                      showToast(`{{${p.key}}} değişkeni eklendi.`)
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{`{{${p.key}}}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kayıtlı Taslaklar Listesi */}
          <button
            type="button"
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
            title="Önceden kaydedilen taslakları aç"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Kayıtlı Çalışmalar</span>
          </button>

          {/* Taslağı Kaydet */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
            title="Mevcut çalışmayı taslak olarak sakla"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Taslağı Kaydet</span>
          </button>

          {/* Şablon Olarak Kaydet */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition cursor-pointer"
            title="Bu metni diğer süreçlerde de kullanmak üzere şablon kütüphanesine ekle"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Şablon Olarak Kaydet</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Yazdır & HTML İndir */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Resmî Standartta Yazdır (A4)"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="HTML Belgesi Olarak İndir"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BİLGİLENDİRME TOAST / BANNER */}
      {toastMessage && (
        <div className="absolute top-16 right-8 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. ANA A4 TIPTAP ÇALIŞMA ALANI */}
      <div className="flex-1 p-4 md:p-6 bg-slate-100/70 dark:bg-slate-950 overflow-y-auto custom-scrollbar flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[750px]">
          <A4Editor
            content={currentHtml}
            onChange={(html) => setCurrentHtml(html)}
            variables={EDITOR_VARIABLES}
            availablePlaceholders={EBYS_PLACEHOLDERS}
            enableKutuphaneExtensions={true}
          />
        </div>
      </div>

      {/* 4. MODALLER */}
      <SaveTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
      />

      <DraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onSelectDraft={handleSelectDraft}
      />
    </div>
  )
}
