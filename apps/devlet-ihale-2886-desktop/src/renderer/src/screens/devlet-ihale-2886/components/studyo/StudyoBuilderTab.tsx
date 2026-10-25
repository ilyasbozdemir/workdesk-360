import React from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import type { CustomField } from './studyoTypes'

interface StudyoBuilderTabProps {
  customFields: CustomField[]
  onDeleteCustomField: (id: string) => void
  showAddField: boolean
  onToggleShowAddField: () => void
  newFieldKey: string
  onSetNewFieldKey: (val: string) => void
  newFieldLabel: string
  onSetNewFieldLabel: (val: string) => void
  newFieldTip: 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli'
  onSetNewFieldTip: (tip: 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli') => void
  newFieldVal: string
  onSetNewFieldVal: (val: string) => void
  onAddCustomField: () => void
  onCopyVar: (key: string) => void
}

export function StudyoBuilderTab({
  customFields,
  onDeleteCustomField,
  showAddField,
  onToggleShowAddField,
  newFieldKey,
  onSetNewFieldKey,
  newFieldLabel,
  onSetNewFieldLabel,
  newFieldTip,
  onSetNewFieldTip,
  newFieldVal,
  onSetNewFieldVal,
  onAddCustomField,
  onCopyVar
}: StudyoBuilderTabProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Özel Form Alanları Tasarımı
          </h3>
          <p className="text-[11px] text-slate-500">
            İhale belgenize özel yeni dinamik alanlar ve yer tutucular tanımlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleShowAddField}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Alan Ekle</span>
        </button>
      </div>

      {/* Yeni Alan Ekleme Formu */}
      {showAddField && (
        <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl p-3.5 space-y-3">
          <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
            Yeni Form Alanı Oluştur
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Alan Başlığı (Label)
              </label>
              <input
                type="text"
                placeholder="Örn: İmar Durumu"
                value={newFieldLabel}
                onChange={(e) => onSetNewFieldLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Değişken Kodu (Key)
              </label>
              <input
                type="text"
                placeholder="Örn: imar_durumu"
                value={newFieldKey}
                onChange={(e) => onSetNewFieldKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Alan Tipi
              </label>
              <select
                value={newFieldTip}
                onChange={(e) =>
                  onSetNewFieldTip(
                    e.target.value as 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli'
                  )
                }
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              >
                <option value="metin">📝 Tek Satır Metin</option>
                <option value="cok_satirli">📄 Çok Satırlı Paragraf</option>
                <option value="sayi">🔢 Sayısal Değer</option>
                <option value="para">💰 Para (₺ Tutar)</option>
                <option value="tarih">📅 Tarih</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Varsayılan Değer
              </label>
              <input
                type="text"
                placeholder="Varsayılan değer..."
                value={newFieldVal}
                onChange={(e) => onSetNewFieldVal(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onToggleShowAddField}
              className="px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={onAddCustomField}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Alanı Ekle
            </button>
          </div>
        </div>
      )}

      {/* Tanımlı Özel Alanlar Listesi */}
      <div className="space-y-2">
        {customFields.map((cf) => (
          <div
            key={cf.id}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-xl"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cf.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-mono">
                  {`{{${cf.key}}}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-70 mt-0.5">
                Tip: {cf.tip} • Değer: {cf.deger || '(Boş)'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onCopyVar(cf.key)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                title="Yer tutucu kodunu kopyala"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteCustomField(cf.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Alanı Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {customFields.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">
            Henüz özel alan tanımlanmadı. &quot;Yeni Alan Ekle&quot; butonu ile ekleyebilirsiniz.
          </div>
        )}
      </div>
    </div>
  )
}
