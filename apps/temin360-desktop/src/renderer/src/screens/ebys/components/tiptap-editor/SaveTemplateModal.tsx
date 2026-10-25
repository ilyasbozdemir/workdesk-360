import React, { useState } from 'react'
import { BookmarkCheck, X, Sparkles, Layers, Tag, Info } from 'lucide-react'
import type { EbysCategory } from '../../ebys.types'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    category: EbysCategory
    categoryLabel?: string
    description: string
    tags?: string[]
  }) => void
}

const CATEGORY_OPTIONS: { id: EbysCategory; label: string }[] = [
  { id: 'ust_yazi', label: 'Resmî Üst Yazı' },
  { id: 'ic_yazisma', label: 'Birim İçi / Kurum İçi Yazışma' },
  { id: 'olur_onay', label: 'Olur & Onay Belgesi' },
  { id: 'bilgi_gorus', label: 'Bilgi & Görüş İsteme' },
  { id: 'cevap', label: 'Cevap Yazısı' },
  { id: 'dagitimli', label: 'Dağıtımlı Genelge / Duyuru' },
  { id: 'gorevlendirme', label: 'Görevlendirme & Yetkilendirme' },
  { id: 'cok_sayfali', label: 'Çok Sayfalı Rapor / Metin' }
]

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<EbysCategory>('ust_yazi')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('Doğrudan Temin, Resmi Yazışma, Şablon')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return

    const categoryObj = CATEGORY_OPTIONS.find((c) => c.id === category)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    onSave({
      name: name.trim(),
      category,
      categoryLabel: categoryObj?.label || 'Özel Şablon',
      description: description.trim(),
      tags
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Yeni Resmî Yazı Şablonu Olarak Kaydet
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  TipTap
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu metin gelecekteki doğrudan temin ve ihale süreçlerinde tekrar kullanılabilir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Şablon Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: 22/d Doğrudan Temin Teklif İsteme Mektubu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EbysCategory)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition appearance-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Layers className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kısa Açıklama &amp; Kullanım Amacı
            </label>
            <textarea
              rows={2}
              placeholder="Hangi süreçlerde ve hangi amaçla kullanıldığını belirten rehber notu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              Etiketler (Virgülle ayırın)
            </label>
            <input
              type="text"
              placeholder="Teklif, Piyasa Fiyat, Komisyon, Olur"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-300">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bu şablonu kaydettiğinizde, sol taraftaki <strong>EBYS Şablon Kütüphanesi</strong>'nde
              yer alacak; istediğiniz zaman değişkenleri doldurularak farklı satın alma ve resmi
              dosya süreçlerinde canlı olarak kullanılabilecektir.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Şablon Olarak Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
