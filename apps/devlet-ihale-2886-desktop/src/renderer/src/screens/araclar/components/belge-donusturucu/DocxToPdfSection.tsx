import React, { useState, useRef } from 'react'
import {
  FileText,
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react'
import { DocxFile, StatusMessage, formatBytes } from './types'

export function DocxToPdfSection(): React.JSX.Element {
  const [docxFile, setDocxFile] = useState<DocxFile | null>(null)
  const [docxFont, setDocxFont] = useState("'Segoe UI', Roboto, Helvetica, Arial, sans-serif")
  const [docxFontSize, setDocxFontSize] = useState('11pt')
  const [docxMargin, setDocxMargin] = useState('20mm')
  const [docxLineHeight, setDocxLineHeight] = useState('1.6')
  const [isConvertingDocx, setIsConvertingDocx] = useState(false)
  const [docxPreviewHtml, setDocxPreviewHtml] = useState<string | null>(null)
  const [convertedPdfBase64, setConvertedPdfBase64] = useState<string | null>(null)
  const [docxStatusMessage, setDocxStatusMessage] = useState<StatusMessage | null>(null)

  const docxInputRef = useRef<HTMLInputElement>(null)

  const handleDocxSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setDocxFile({
        name: file.name,
        size: file.size,
        base64
      })
      setDocxPreviewHtml(null)
      setConvertedPdfBase64(null)
      setDocxStatusMessage(null)
    }
    reader.readAsDataURL(file)
  }

  const handleNativeDocxPick = async () => {
    if (!window.electron?.ipcRenderer) return
    try {
      setIsConvertingDocx(true)
      setDocxStatusMessage(null)
      const res = await window.electron.ipcRenderer.invoke('belge:convert-docx-to-pdf', {
        fontFamily: docxFont,
        fontSize: docxFontSize,
        margins: docxMargin,
        lineHeight: docxLineHeight
      })

      if (res?.success) {
        setDocxFile({
          name: res.fileName || 'Dokuman.docx',
          size: 0
        })
        setDocxPreviewHtml(res.html || '')
        setConvertedPdfBase64(res.data || null)
        setDocxStatusMessage({
          type: 'success',
          text: 'Word dokümanı başarıyla çözümlendi ve Türkçe karakter uyumlu PDF haline getirildi.'
        })
      } else if (res?.error && res.error !== 'Dosya seçimi iptal edildi') {
        setDocxStatusMessage({ type: 'error', text: res.error })
      }
    } catch (err: unknown) {
      setDocxStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Dönüştürme hatası'
      })
    } finally {
      setIsConvertingDocx(false)
    }
  }

  const handleConvertDocx = async (saveImmediately = false) => {
    if (!docxFile?.base64 || !window.electron?.ipcRenderer) return
    setIsConvertingDocx(true)
    setDocxStatusMessage(null)

    try {
      const res = await window.electron.ipcRenderer.invoke('belge:convert-docx-to-pdf', {
        base64: docxFile.base64,
        fileName: docxFile.name,
        fontFamily: docxFont,
        fontSize: docxFontSize,
        margins: docxMargin,
        lineHeight: docxLineHeight,
        saveImmediately
      })

      if (res?.success) {
        setDocxPreviewHtml(res.html || '')
        setConvertedPdfBase64(res.data || null)
        setDocxStatusMessage({
          type: 'success',
          text: saveImmediately
            ? `PDF başarıyla kaydedildi: ${res.filePath || ''}`
            : 'PDF başarıyla hazırlandı! Aşağıdan önizleyebilir veya indirebilirsiniz.'
        })
      } else {
        setDocxStatusMessage({
          type: 'error',
          text: res?.error || 'Dönüştürme sırasında hata oluştu'
        })
      }
    } catch (err: unknown) {
      setDocxStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'İşlem hatası'
      })
    } finally {
      setIsConvertingDocx(false)
    }
  }

  const handleSavePdf = async () => {
    if (!convertedPdfBase64 || !window.electron?.ipcRenderer) return
    const defaultName = (docxFile?.name || 'Dokuman').replace(/\.docx$/i, '') + '.pdf'
    const res = await window.electron.ipcRenderer.invoke('belge:save-base64-file', {
      dataBase64: convertedPdfBase64,
      defaultFilename: defaultName,
      filterName: 'PDF Dokümanı',
      extensions: ['pdf']
    })
    if (res?.success) {
      setDocxStatusMessage({
        type: 'success',
        text: `Dosya kaydedildi: ${res.filePath}`
      })
    }
  }

  const handlePreviewPdfExternal = async () => {
    if (!docxPreviewHtml || !window.electron?.ipcRenderer) return
    await window.electron.ipcRenderer.invoke('belge:open-pdf-external', docxPreviewHtml)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
      {/* Sol Kolon: Dosya Yükleme & Ayarlar */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Word (.docx) Dosyası Seçimi
            </h2>
          </div>

          {/* Gizli Input */}
          <input
            type="file"
            ref={docxInputRef}
            accept=".docx"
            onChange={handleDocxSelect}
            className="hidden"
          />

          {/* Yükleme Alanı */}
          <div
            onClick={() => docxInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 dark:border-blue-900/60 hover:border-blue-500 rounded-2xl p-6 text-center bg-blue-50/40 dark:bg-blue-950/20 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {docxFile ? docxFile.name : 'Word (.docx) dosyasını buraya tıklayarak seçin'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {docxFile
                ? `Boyut: ${formatBytes(docxFile.size)}`
                : 'Microsoft Word .docx formatındaki evrak, şartname veya sözleşmeler'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativeDocxPick}
              disabled={isConvertingDocx}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              <span>Doğrudan Bilgisayardan Seç & Çevir</span>
            </button>
          </div>

          {/* Türkçe Karakter & Tipografi Ayarları */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Türkçe Tipografi & PDF Düzen Ayarları</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Yazı Tipi (Türkçe Güvenli)
                </label>
                <select
                  value={docxFont}
                  onChange={(e) => setDocxFont(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                    Segoe UI (Modern Kamu)
                  </option>
                  <option value="'Times New Roman', Times, serif">Times New Roman (Resmi)</option>
                  <option value="'Arial', sans-serif">Arial</option>
                  <option value="'Calibri', Candara, Segoe, sans-serif">Calibri</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Yazı Boyutu
                </label>
                <select
                  value={docxFontSize}
                  onChange={(e) => setDocxFontSize(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="10pt">10 pt (Kompakt)</option>
                  <option value="11pt">11 pt (Standart)</option>
                  <option value="12pt">12 pt (Büyük Resmi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Sayfa Kenar Boşluğu
                </label>
                <select
                  value={docxMargin}
                  onChange={(e) => setDocxMargin(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="10mm">10 mm (Dar / Çok Verili)</option>
                  <option value="20mm">20 mm (Standart A4)</option>
                  <option value="25mm">25 mm (Geniş Resmi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Satır Aralığı
                </label>
                <select
                  value={docxLineHeight}
                  onChange={(e) => setDocxLineHeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
                >
                  <option value="1.3">1.3 (Sıkı)</option>
                  <option value="1.6">1.6 (Standart)</option>
                  <option value="1.8">1.8 (Ferah)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              disabled={!docxFile?.base64 || isConvertingDocx}
              onClick={() => handleConvertDocx(false)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isConvertingDocx ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF Dönüştürülüyor...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Önizleme Oluştur & Hazırla</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!docxFile?.base64 || isConvertingDocx}
              onClick={() => handleConvertDocx(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Doğrudan PDF Olarak Kaydet</span>
            </button>
          </div>

          {/* Durum Mesajı */}
          {docxStatusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                docxStatusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {docxStatusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              )}
              <span>{docxStatusMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Kolon: PDF & İçerik Önizleme */}
      <div className="lg:col-span-7">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Dönüştürülen Doküman Önizlemesi
              </h3>
            </div>

            {convertedPdfBase64 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviewPdfExternal}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Sistem PDF Görüntüleyicisinde Aç / Yazdır"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Harici Görüntüle</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePdf}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF İndir</span>
                </button>
              </div>
            )}
          </div>

          {docxPreviewHtml ? (
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[600px] custom-scrollbar shadow-inner">
              <div
                className="max-w-[750px] mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-md text-slate-800 dark:text-slate-200 leading-relaxed text-xs"
                style={{
                  fontFamily: docxFont,
                  fontSize: docxFontSize,
                  lineHeight: docxLineHeight
                }}
                dangerouslySetInnerHTML={{ __html: docxPreviewHtml }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-2">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-xs font-semibold">Henüz bir Word dokümanı dönüştürülmedi.</p>
              <p className="text-[11px] max-w-sm">
                Sol taraftan bir .docx dosyası yükleyip &ldquo;Önizleme Oluştur & Hazırla&rdquo;
                butonuna bastığınızda burada canlı A4 çıktısını göreceksiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
