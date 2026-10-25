import React, { useState } from 'react'
import { Trash2, X, Archive, Clock, ShieldCheck, AlertCircle } from 'lucide-react'
import type { ModulPaketi } from '../modulMagazasi.types'

interface ModulUninstallModalProps {
  modul: ModulPaketi | null
  isOpen: boolean
  onClose: () => void
  onConfirmTrash: (retentionDays: number) => void
  onConfirmPermanent?: () => void
}

export const ModulUninstallModal: React.FC<ModulUninstallModalProps> = ({
  modul,
  isOpen,
  onClose,
  onConfirmTrash,
  onConfirmPermanent
}) => {
  const [retentionDays, setRetentionDays] = useState<number>(30)
  const [showPermanentOption, setShowPermanentOption] = useState<boolean>(false)

  if (!isOpen || !modul) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Üst İkon & Kapatma */}
        <div className="flex items-start justify-between gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-xs">
            <Archive className="w-7 h-7" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Başlık ve Uyarı Metni */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
            Modülü Çöp Kutusuna Taşı
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-100 font-semibold">
              {modul.baslik}
            </strong>{' '}
            paketini kaldırmak üzeresiniz.
          </p>
        </div>

        {/* 30 Gün Koruma Açıklama Kutusu */}
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-2 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            Güvenli Silme (Soft Delete) Koruması
          </div>
          <div className="text-[11px] text-blue-800/90 dark:text-blue-300/90">
            Bu modül hemen yok edilmez;{' '}
            <span className="font-bold underline">{retentionDays} gün</span> boyunca çöp kutusunda
            güvenle bekletilir. Süre dolana kadar dilediğiniz an tek tıkla şablonlarınız ve
            yapılandırmanız kaybolmadan geri yükleyebilirsiniz.
          </div>
        </div>

        {/* Süre Seçimi */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Çöp Kutusunda Bekletme Süresi:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[7, 15, 30, 60].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRetentionDays(days)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  retentionDays === days
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {days} Gün{' '}
                {days === 30 && (
                  <span className="text-[9px] block font-normal opacity-80">(Önerilen)</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Kalıcı Silme Aç/Kapa Linki */}
        {onConfirmPermanent && (
          <div className="pt-1 text-right">
            <button
              type="button"
              onClick={() => setShowPermanentOption(!showPermanentOption)}
              className="text-[10px] text-slate-400 hover:text-red-600 dark:hover:text-red-400 underline cursor-pointer"
            >
              {showPermanentOption
                ? 'Gelişmiş seçenekleri gizle'
                : 'Doğrudan kalıcı olarak silmek mi istiyorsunuz?'}
            </button>
          </div>
        )}

        {showPermanentOption && onConfirmPermanent && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300 space-y-2">
            <div className="flex items-center gap-1 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              Kalıcı Silme Uyarısı
            </div>
            <p className="text-[11px] text-red-600/90 dark:text-red-400/90 leading-tight">
              Modül ve ilişkili tüm özel şablon yapılandırmaları anında silinir ve geri alınamaz.
            </p>
            <button
              type="button"
              onClick={onConfirmPermanent}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hemen Kalıcı Olarak Sil
            </button>
          </div>
        )}

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onConfirmTrash(retentionDays)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25 transition-all cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            Çöp Kutusuna Taşı ({retentionDays} Gün)
          </button>
        </div>
      </div>
    </div>
  )
}
