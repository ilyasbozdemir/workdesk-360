import React, { useState, useEffect } from 'react'
import { X, Upload, FileCheck, Check, ArrowUp, ArrowDown } from 'lucide-react'

export interface SelectedUploadFile {
  id: string
  filePath: string
  fileName: string
  targetTemplateCode: string
  sayfaAraligi?: string
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
      return 'ihtiyac-listesi'
    }
    if (lower.includes('onay')) {
      return 'dogrudan-temin-onay-belgesi'
    }
    if (lower.includes('harcama') && lower.includes('talimat')) {
      return 'harcama-talimati'
    }
    if (lower.includes('görev') || lower.includes('gorev') || lower.includes('atama')) {
      return 'piyasa-fiyat-arastirma-gorevlendirmesi'
    }
    if (lower.includes('teklif') && lower.includes('isteme')) {
      return 'fiyat-arastirma-mektubu'
    }
    if (lower.includes('birim') && lower.includes('fiyat')) {
      return 'birim-fiyat-teklif-mektubu'
    }
    if (lower.includes('piyasa') || lower.includes('tutanak') || lower.includes('arastirma')) {
      return 'piyasa-fiyat-arastirma-tutanagi'
    }
    if (lower.includes('maliyet')) {
      return 'yaklasik-maliyet-cetveli'
    }
    if (lower.includes('kabul') && lower.includes('teklif')) {
      return 'kabul-edilen-teklif'
    }
    if (lower.includes('karar') || lower.includes('sonuç') || lower.includes('sonuc')) {
      return 'dogrudan-temin-onay-belgesi'
    }
    if (lower.includes('sözleşme') || lower.includes('sozlesme')) {
      return 'dogrudan-temin-sozlesmesi'
    }
    if (lower.includes('sipariş') || lower.includes('siparis')) {
      return 'fiyat-arastirma-mektubu'
    }
    if (lower.includes('muayene') || lower.includes('kabul')) {
      return 'muayene-kabul-tutanagi'
    }
    if (lower.includes('teslim') || lower.includes('tesellüm') || lower.includes('tesellum')) {
      return 'luzum-muzekkeresi-teslim-tesellum'
    }
    if (lower.includes('ödeme') || lower.includes('odeme') || lower.includes('mif') || lower.includes('tahakkuk')) {
      return 'odeme-yazisi'
    }
    if (lower.includes('harcama') || lower.includes('pusula') || lower.includes('makbuz')) {
      return 'harcama-pusulasi'
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
            sayfaAraligi: '',
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
    setItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id)
      return filtered.map((it, idx) => ({ ...it, order: idx + 1 }))
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setItems((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next.map((it, idx) => ({ ...it, order: idx + 1 }))
    })
  }

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return
    setItems((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next.map((it, idx) => ({ ...it, order: idx + 1 }))
    })
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                İmzalı Belgeleri Dosyaya Eşleştir & Yükle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seçilen {items.length} adet dosyayı doğrudan temin sürecindeki belgelerle eşleştirebilir, sayfa aralığı belirtebilir veya sırasını ayarlayabilirsiniz.
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
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between px-1">
            <span>Dosya ve Sıra</span>
            <div className="flex items-center gap-12 sm:gap-24">
              <span>Eşleşen Süreç Şablonu</span>
              <span>Sayfa / Ek Notu</span>
            </div>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all hover:border-blue-300 dark:hover:border-blue-700"
            >
              {/* Sıra & Dosya Bilgisi */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Sıralama Butonları */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    title="Yukarı Taşı"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    title="Aşağı Taşı"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

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

              {/* Şablon Eşleştirme ve Sayfa Aralığı */}
              <div className="w-full md:w-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={item.targetTemplateCode}
                  onChange={(e) => handleUpdateItem(item.id, { targetTemplateCode: e.target.value })}
                  className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">(Eşleştirme Yok - Bağımsız Ek)</option>
                  {templateOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.stageName}: {opt.title}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={item.sayfaAraligi || ''}
                  onChange={(e) => handleUpdateItem(item.id, { sayfaAraligi: e.target.value })}
                  placeholder="Sayfa örn: 1-3"
                  title="PDF içindeki ilgili sayfa numaraları veya not"
                  className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Listeden Kaldır"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
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
