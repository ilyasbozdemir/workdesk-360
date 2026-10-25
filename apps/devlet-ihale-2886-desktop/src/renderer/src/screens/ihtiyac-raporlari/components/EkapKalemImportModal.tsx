import React, { useState, useRef } from 'react'
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Download,
  X,
  FileCheck,
  Building,
  Sparkles
} from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { formatCurrency } from '../../../utils/formatters'
import {
  parseEkapFile,
  generateErrorReportCsv,
  getEkapTemplateMeta,
  EkapImportResult
} from '../../../services/ekapTemplateService'
import { IhtiyacRaporuKalem } from '../../../services/ihtiyacRaporuService'

interface EkapKalemImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (kalemler: IhtiyacRaporuKalem[]) => void
}

export function EkapKalemImportModal({
  isOpen,
  onClose,
  onImport
}: EkapKalemImportModalProps): React.JSX.Element | null {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<EkapImportResult | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'error'>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const templateMeta = getEkapTemplateMeta()

  if (!isOpen) return null

  const handleFileProcess = async (file: File): Promise<void> => {
    try {
      setError(null)

      const buffer = await file.arrayBuffer()
      const result = parseEkapFile(buffer, file.name)
      setImportResult(result)
    } catch (err: unknown) {
      console.error('EKAP ODS/Excel dosyası işlenemedi:', err)
      const msg =
        err instanceof Error ? err.message : 'Dosya okunurken beklenmeyen bir hata oluştu.'
      setError(msg)
      setImportResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      void handleFileProcess(e.target.files[0])
    }
  }

  const handleDownloadErrorReport = (): void => {
    if (!importResult || importResult.allErrors.length === 0) return

    const csvContent = generateErrorReportCsv(importResult.allErrors)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ekap_hata_raporu_${importResult.fileName}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleApplyImport = (onlyValid: boolean): void => {
    if (!importResult) return

    const selectedItems = onlyValid
      ? importResult.items.filter((item) => item.isValid)
      : importResult.items

    const convertedKalemler: IhtiyacRaporuKalem[] = selectedItems.map((item, index) => ({
      sira_no: index + 1,
      kalem_adi: item.kalemAdi,
      tipi: 'Yapım',
      birim: item.birim || 'Adet',
      miktar: item.miktar,
      tahmini_birim_fiyat: item.birimFiyat,
      okas_kodu: item.okasKodu || null,
      poz_no: item.pozNo || null,
      kdv_orani: 20,
      aciklama: item.pozNo ? `Poz No: ${item.pozNo}` : null
    }))

    onImport(convertedKalemler)
    onClose()
  }

  const filteredItems = (importResult?.items || []).filter((item) => {
    if (filterMode === 'valid') return item.isValid
    if (filterMode === 'error') return !item.isValid
    return true
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-4xl w-full">
      <div className="space-y-5 p-2">
        {/* Başlık ve Bilgilendirme */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
              <Building size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                  EKAP Yapım İhalesi / Yaklaşık Maliyet İçe Aktarma
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  .ODS / .XLSX
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Resmî EKAP birim fiyatlı yapım işleri ve malzeme cetvellerini otomatik eşleştirip
                doğrular.
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10.5px] font-mono text-slate-400 block">
              EKAP Sürüm: {templateMeta.version}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {templateMeta.stats.okasSayisi.toLocaleString('tr-TR')} OKAS •{' '}
              {templateMeta.stats.birimSayisi} Birim
            </span>
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
            <AlertTriangle size={18} className="shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Dosya Yükleme / Sürükle Bırak Alanı */}
        {!importResult ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".ods,.xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Upload size={26} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              EKAP Yapım İhalesi veya Birim Fiyatlı Cetvel Dosyasını Seçin
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              Bilgisayarınızdaki <strong>.ods</strong>, <strong>.xlsx</strong> veya{' '}
              <strong>.xls</strong> dosyasını buraya sürükleyip bırakabilir ya da dosya
              seçebilirsiniz.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-xs">
              <FileSpreadsheet size={14} className="text-emerald-500" />
              <span>YapimIhalesiBirimFiyatli.ods Şablonuyla %100 Uyumlu</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dosya Özeti & Doğrulama İstatistikleri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  İşlenen Dosya
                </span>
                <p
                  className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate"
                  title={importResult.fileName}
                >
                  {importResult.fileName}
                </p>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Geçerli Kalemler
                </span>
                <p className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  {importResult.validRows} / {importResult.totalRows}
                </p>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  Hatalı / Uyarılı Satır
                </span>
                <p className="text-base font-black font-mono text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1.5">
                  <AlertTriangle size={16} />
                  {importResult.errorRows}
                </p>
              </div>

              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Yaklaşık Maliyet Tutarı
                </span>
                <p className="text-sm font-black font-mono text-blue-800 dark:text-blue-300 mt-1 truncate">
                  {formatCurrency(importResult.toplamYaklasikMaliyet)}
                </p>
              </div>
            </div>

            {/* Filtre ve Arama Çubuğu */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Tümü ({importResult.totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('valid')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterMode === 'valid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Geçerli ({importResult.validRows})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('error')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterMode === 'error'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Hatalı ({importResult.errorRows})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {importResult.allErrors.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Hatalı satırları CSV raporu olarak indir"
                  >
                    <Download size={13} />
                    <span>Hata Raporu İndir ({importResult.allErrors.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setImportResult(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Farklı Dosya Seç
                </button>
              </div>
            </div>

            {/* Önizleme Tablosu */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden max-h-75 overflow-y-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Satır</th>
                    <th className="py-2.5 px-3 w-28">Poz No</th>
                    <th className="py-2.5 px-3 w-28">OKAS Kodu</th>
                    <th className="py-2.5 px-3">Kalem / İşin Adı</th>
                    <th className="py-2.5 px-3 w-24 text-right">Miktar</th>
                    <th className="py-2.5 px-3 w-20">Birim</th>
                    <th className="py-2.5 px-3 w-28 text-right">B. Fiyat</th>
                    <th className="py-2.5 px-3 w-28 text-right">Tutar</th>
                    <th className="py-2.5 px-3 w-20 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.rowNumber}
                      className={!item.isValid ? 'bg-amber-50/40 dark:bg-amber-950/20' : undefined}
                    >
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {item.rowNumber}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {item.pozNo || '-'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {item.okasKodu || '-'}
                        {item.suggestedOkas && (
                          <span
                            className="block text-[10px] text-amber-600 dark:text-amber-400 truncate"
                            title={`Öneri: ${item.suggestedOkas.kod} - ${item.suggestedOkas.ad}`}
                          >
                            Öneri: {item.suggestedOkas.kod}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-100 font-medium">
                        <div className="truncate max-w-xs" title={item.kalemAdi}>
                          {item.kalemAdi}
                        </div>
                        {item.errors.length > 0 && (
                          <div className="text-[10px] text-rose-500 font-normal">
                            {item.errors.map((e) => e.message).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {item.miktar}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.birim}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.birimFiyat)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.satirTutari)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Uygun
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            Hatalı
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Alt Aksiyonları */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Vazgeç
          </button>

          {importResult && (
            <div className="flex items-center gap-2">
              {importResult.validRows > 0 && importResult.errorRows > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyImport(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck size={14} />
                  <span>Geçerli {importResult.validRows} Kalemi Aktar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleApplyImport(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Tümünü ({importResult.totalRows}) İçe Aktar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
