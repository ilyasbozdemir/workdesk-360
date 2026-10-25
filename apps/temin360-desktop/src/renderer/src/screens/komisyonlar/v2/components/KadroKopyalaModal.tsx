import React from 'react'
import { Copy } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import type { DosyaKomisyonItem } from '../types'

interface KadroKopyalaModalProps {
  targetDosya: DosyaKomisyonItem | null
  availableSourceDosyalar: DosyaKomisyonItem[]
  selectedSourceDosyaId: number | null
  selectedSourceItem?: DosyaKomisyonItem
  isCopying: boolean
  copyFeedback: string | null
  onSelectSourceId: (id: number | null) => void
  onExecuteCopy: () => void
  onClose: () => void
}

export const KadroKopyalaModal: React.FC<KadroKopyalaModalProps> = ({
  targetDosya,
  availableSourceDosyalar,
  selectedSourceDosyaId,
  selectedSourceItem,
  isCopying,
  copyFeedback,
  onSelectSourceId,
  onExecuteCopy,
  onClose
}) => {
  if (!targetDosya) return null

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Kadro Kopyala: ${targetDosya.dosya_no}`}
      description="Başka bir doğrudan temin dosyasının komisyon üyelerini bu dosyaya bağımsız olarak aktarın."
      className="max-w-2xl"
    >
      <div className="space-y-4 py-1">
        <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <p className="font-bold">
            🎯 Hedef Dosya: {targetDosya.dosya_no} - {targetDosya.is_tanimi}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Aşağıdan seçeceğiniz dosyanın Piyasa Fiyat ve Muayene Kabul komisyon görevlileri bu
            dosyaya kopyalanır ve yeni bir revizyon kaydı oluşturulur.
          </p>
        </div>

        {/* Kaynak Dosya Seçimi */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Kadrosu Alınacak Kaynak Dosyayı Seçin:
          </label>
          <select
            value={selectedSourceDosyaId || ''}
            onChange={(e) => onSelectSourceId(Number(e.target.value) || null)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
          >
            <option value="">-- Kaynak Dosya Seçin --</option>
            {availableSourceDosyalar.map((src) => (
              <option key={src.id} value={src.id}>
                {src.dosya_no} - {src.is_tanimi} ({src.totalMembersCount} Üye)
              </option>
            ))}
          </select>
        </div>

        {/* Seçili Kaynak Dosyanın Üye Önizlemesi */}
        {selectedSourceItem && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              📋 Kopyalanacak Kadro Önizlemesi ({selectedSourceItem.dosya_no}):
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-blue-600 text-[11px]">Piyasa Fiyat:</span>
                {selectedSourceItem.piyasaMembers.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold"
                  >
                    {m.ad_soyad} ({m.gorev_adi})
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-emerald-600 text-[11px]">Muayene Kabul:</span>
                {selectedSourceItem.muayeneMembers.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold"
                  >
                    {m.ad_soyad} ({m.gorev_adi})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Geri Bildirim Mesajı */}
        {copyFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              copyFeedback.startsWith('Hata')
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {copyFeedback}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs rounded-xl">
            İptal
          </Button>

          <Button
            size="sm"
            disabled={!selectedSourceDosyaId || isCopying}
            onClick={onExecuteCopy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{isCopying ? 'Kopyalanıyor...' : 'Kopyala ve Dosyaya Aktar'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
