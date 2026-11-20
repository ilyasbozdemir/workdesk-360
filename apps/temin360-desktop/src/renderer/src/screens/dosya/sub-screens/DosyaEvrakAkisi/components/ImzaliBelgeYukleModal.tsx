import React, { useState, useEffect } from 'react'
import { X, Upload, FileCheck, ArrowUpDown, Check, FileText } from 'lucide-react'

export interface SelectedUploadFile {
  id: string
  filePath: string
  fileName: string
  targetTemplateCode: string
  order: number
}

interface ImzaliBelgeYukleModalProps {
  isOpen: boolean
  onClose: () => void
  files: string[]
  templateOptions: Array<{ code: string; title: string; stageName: string }>
  initialTargetCode?: string
  onSave: (items: SelectedUploadFile[]) => Promise<void>
}

export function ImzaliBelgeYukleModal({
  isOpen,
  onClose,
  files,
  templateOptions,
  initialTargetCode,
  onSave
}: ImzaliBelgeYukleModalProps): React.JSX.Element | null {
  const [items, setItems] = useState<SelectedUploadFile[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Otomatik Akıllı Eşleştirme Heuristiği
  const guessTemplateCode = (fileName: string): string => {
    if (initialTargetCode) return initialTargetCode
    const lower = fileName.toLowerCase()
    if (lower.includes('ihtiyaç') || lower.includes('ihtiyac') || lower.includes('lüzum') || lower.includes('talep')) {
      return 'ihtiyac_listesi'
    }
    if (lower.includes('onay')) {
      return 'dogrudan_temin_onay_belgesi'
    }
    if (lower.includes('harcama') && lower.includes('talimat')) {
      return 'harcama_talimati'
    }
    if (lower.includes('görev') || lower.includes('gorev') || lower.includes('atama')) {
      return 'piyasa_fiyat_arastirma_gorevlendirmesi'
    }
    if (lower.includes('teklif') && lower.includes('isteme')) {
      return 'fiyat_arastirma_mektubu'
    }
    if (lower.includes('birim') && lower.includes('fiyat')) {
      return 'birim_fiyat_teklif_mektubu'
    }
    if (lower.includes('piyasa') || lower.includes('tutanak') || lower.includes('arastirma')) {
      return 'piyasa_fiyat_arastirma_tutanagi'
    }
    if (lower.includes('maliyet')) {
      return 'yaklasik_maliyet_cetveli'
    }
    if (lower.includes('karar') || lower.includes('sonuç') || lower.includes('sonuc')) {
      return 'dogrudan_temin_sonuc_onay_belgesi'
    }
    if (lower.includes('sözleşme') || lower.includes('sozlesme')) {
      return 'sozlesme_taslagi'
    }
    if (lower.includes('sipariş') || lower.includes('siparis')) {
      return 'siparis_mektubu'
    }
    if (lower.includes('muayene') || lower.includes('kabul')) {
      return 'muayene_kabul_tutanagi'
    }
    if (lower.includes('teslim') || lower.includes('tesellüm') || lower.includes('tesellum')) {
      return 'teslim_tesellum_tutanagi'
    }
    if (lower.includes('hakediş') || lower.includes('hakedis')) {
      return 'hakedis_raporu'
    }
    if (lower.includes('ödeme') || lower.includes('odeme') || lower.includes('mif')) {
      return 'odeme_emri_belgesi'
    }
    return ''
  }

  useEffect(() => {
    if (isOpen && files.length > 0) {
      setItems(
        files.map((filePath, index) => {
          const fileName = filePath.split(/[/\\]/).pop() || 'Belge.pdf'
          return {
            id: `upload-${index}-${Date.now()}`,
            filePath,
            fileName,
            targetTemplateCode: guessTemplateCode(fileName),
            order: index + 1
          }
        })
      )
    }
  }, [isOpen, files, initialTargetCode])

  if (!isOpen || items.length === 0) return null

  const handleUpdateItem = (id: string, patch: Partial<SelectedUploadFile>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleSubmit = async () => {
    try {
      setIsSaving(true)
      await onSave(items)
      onClose()
    } catch (e) {
      console.error('[ImzaliBelgeYukleModal] Kayıt hatası:', e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                İmzalı Belgeleri Dosyaya Eşleştir & Yükle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seçilen {items.length} adet dosyayı doğrudan temin sürecindeki belgelerle eşleştirebilir veya bağımsız ek olarak ekleyebilirsiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dosya ve Eşleştirme Tablosu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
            <span>Dosya ve Eşleşen Belge Şablonu</span>
            <span>Sıra & Öncelik</span>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{item.fileName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {item.filePath}
                  </div>
                </div>
              </div>

              {/* Şablon Eşleştirme Seçimi */}
              <div className="w-full sm:w-72 flex items-center gap-2">
                <select
                  value={item.targetTemplateCode}
                  onChange={(e) => handleUpdateItem(item.id, { targetTemplateCode: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">(Eşleştirme Yok - Bağımsız İmzalı Ek)</option>
                  {templateOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.stageName}: {opt.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Listeden Kaldır"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Alt Butonlar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Toplam <strong>{items.length}</strong> adet imzalı evrak yüklenecek
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={isSaving || items.length === 0}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Yükleniyor...' : 'Dosyaya Eşle & Kaydet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
