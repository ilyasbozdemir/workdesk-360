import React from 'react'
import { ArrowLeft, Loader2, PackageSearch, PlusCircle, Save, Zap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'

interface YeniMalzemeHeaderProps {
  editId: number | null
  entryMode: 'batch' | 'single'
  setEntryMode: (mode: 'batch' | 'single') => void
  isSaving: boolean
  handleSave: (stayOpen?: boolean) => void
  onCancel: () => void
  selectedType?: 'Mal' | 'Hizmet' | 'Yapım'
}

export const YeniMalzemeHeader: React.FC<YeniMalzemeHeaderProps> = ({
  editId,
  entryMode,
  setEntryMode,
  isSaving,
  handleSave,
  onCancel,
  selectedType
}) => {
  return (
    <div className="flex-none p-4 md:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <Link
            to="/malzemeler"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-850 dark:text-white flex items-center gap-2.5">
              <PackageSearch className="text-blue-600 dark:text-blue-400" size={26} />
              {editId
                ? `Kalem Düzenle (${selectedType || 'Mal / Hizmet / Yapım İşi'})`
                : entryMode === 'batch'
                  ? 'Toplu / Hızlı Kalem Ekle (Mal / Hizmet / Yapım İşi)'
                  : 'Yeni Kayıt (Mal / Hizmet / Yapım İşi)'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {editId
                ? 'Mevcut kalem bilgilerini, teknik özelliklerini ve parametrelerini güncelleyin'
                : entryMode === 'batch'
                  ? 'Ortak kod ve KDV seçip Excel gridiyle saniyeler içinde birden çok malzeme ekleyin'
                  : 'Yaklaşık maliyet ve teklif süreçleri için doğrudan temin kalemi tanımlayın'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!editId && (
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 mr-2">
              <button
                type="button"
                onClick={() => setEntryMode('batch')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  entryMode === 'batch'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Zap
                  size={14}
                  className={entryMode === 'batch' ? 'fill-amber-200 text-amber-100' : ''}
                />
                ⚡ Hızlı / Excel Toplu Giriş
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  entryMode === 'single'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                📝 Tekil Detaylı Form
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            İptal
          </button>

          {entryMode === 'single' && !editId && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Kaydeder ve hemen ardından yeni bir kalem eklemek için formu açık tutar"
            >
              <PlusCircle size={15} />
              Kaydet & Yeni Ekle
            </button>
          )}

          {(entryMode === 'single' || !!editId) && (
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {editId ? 'Değişiklikleri Kaydet' : 'Kaydet ve Kapat'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
