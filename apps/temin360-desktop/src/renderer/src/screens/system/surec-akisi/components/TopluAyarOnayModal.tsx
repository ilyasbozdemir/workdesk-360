import React from 'react'
import { Users, AlertTriangle, Check, X } from 'lucide-react'

interface TopluAyarOnayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  dosyaKonu?: string
  etkilenecekBelgeler: Array<{ id: string; ad: string }>
  hazirlayanAd?: string
  onaylayanAd?: string
}

export function TopluAyarOnayModal({
  isOpen,
  onClose,
  onConfirm,
  dosyaKonu,
  etkilenecekBelgeler,
  hazirlayanAd,
  onaylayanAd
}: TopluAyarOnayModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Toplu Ayarları Uygula
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {dosyaKonu || 'Aktif Doğrudan Temin Dosyası'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bilgilendirme Kutusu */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">Toplu Personel & İmza Yetkisi Senkronizasyonu</p>
            <p className="text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
              Dosyada kayıtlı Hazırlayan ({hazirlayanAd || 'Tanımlı Değil'}) ve Onay Yetkilisi (
              {onaylayanAd || 'Tanımlı Değil'}) bilgileri, aşağıdaki uygun belgelerin imza
              alanlarına otomatik olarak yansıtılacaktır.
            </p>
          </div>
        </div>

        {/* Etkilenecek Belgeler Listesi */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Etkilenecek Belgeler ({etkilenecekBelgeler.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/50">
            {etkilenecekBelgeler.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{b.ad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Tüm Belgelere Uygula
          </button>
        </div>
      </div>
    </div>
  )
}
