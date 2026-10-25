import React, { useEffect, useState } from 'react'
import { Link2, Unlink, Search, FolderKanban, Check, Calendar, Info } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import {
  DosyaOption,
  IhtiyacRaporu,
  TransferKalemMode,
  ihtiyacRaporuService
} from '../../../services/ihtiyacRaporuService'
import { formatDate } from '../../../utils/formatters'

interface DosyaBaglamaModalProps {
  isOpen: boolean
  rapor: IhtiyacRaporu | null
  onClose: () => void
  onSuccess: () => void
}

export function DosyaBaglamaModal({
  isOpen,
  rapor,
  onClose,
  onSuccess
}: DosyaBaglamaModalProps): React.JSX.Element | null {
  const [dosyalar, setDosyalar] = useState<DosyaOption[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDosyaId, setSelectedDosyaId] = useState<number | null>(null)
  const [copyItems, setCopyItems] = useState(true)
  const [transferMode, setTransferMode] = useState<TransferKalemMode>('append_if_missing')

  useEffect(() => {
    if (!isOpen || !rapor) return

    setSelectedDosyaId(rapor.temin_dosya_id || null)
    setSearch('')
    setCopyItems(true)
    setTransferMode('append_if_missing')
    setLoading(true)

    ihtiyacRaporuService
      .getDosyalarForSelect()
      .then((list) => {
        setDosyalar(list)
      })
      .catch((err) => {
        console.error('Alım dosyaları listelenemedi:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, rapor])

  if (!isOpen || !rapor) return null

  const filteredDosyalar = dosyalar.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (d.temin_no && d.temin_no.toLowerCase().includes(q)) ||
      (d.dosya_no && d.dosya_no.toLowerCase().includes(q)) ||
      (d.konu && d.konu.toLowerCase().includes(q)) ||
      (d.tur && d.tur.toLowerCase().includes(q))
    )
  })

  const handleLink = async () => {
    if (!selectedDosyaId) {
      alert('Lütfen bağlanacak bir alım dosyası seçiniz.')
      return
    }

    try {
      setSubmitting(true)
      const res = await ihtiyacRaporuService.linkToDosya(rapor.id, selectedDosyaId, {
        copyItemsToDosya: copyItems,
        transferMode
      })

      if (copyItems && res.skippedCount > 0) {
        alert(
          `Dosya bağlantısı tamamlandı:\n- ${res.transferredCount} kalem aktarıldı.\n- ${res.skippedCount} mükerrer kalem tespit edildi ve atlandı.`
        )
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Dosya bağlanırken hata oluştu: ' + (err.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    if (
      !confirm('İhtiyaç raporunun alım dosyası bağlantısını kaldırmak istediğinize emin misiniz?')
    ) {
      return
    }

    try {
      setSubmitting(true)
      await ihtiyacRaporuService.unlinkFromDosya(rapor.id)
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Bağlantı kaldırılırken hata oluştu: ' + (err.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alım Dosyasına Bağla"
      description="İhtiyaç raporunu mevcut bir doğrudan temin veya ihale dosyası ile ilişkilendirin."
      className="max-w-2xl w-full"
    >
      <div className="space-y-4 pt-1">
        {/* Selected Report Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              İlişkilendirilecek Rapor
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {rapor.rapor_no}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                {rapor.baslik}
              </span>
            </div>
          </div>
          {rapor.temin_dosya_id && (
            <button
              onClick={handleUnlink}
              disabled={submitting}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Mevcut dosya bağlantısını kaldır"
            >
              <Unlink size={13} />
              Bağlantıyı Kaldır
            </button>
          )}
        </div>

        {/* Informative isolation notice */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/70 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Bu işlem raporu ilgili alım dosyasına bağlar. İsteğe bağlı olarak kalemler bağımsız
            birer kayıt olarak dosyanın İhtiyaç Listesi&apos;ne kopyalanır; rapordaki orijinal kayıt
            asla bozulmaz.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Alım Dosyası No veya Konu ara..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Dossiers List */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-450">Dosyalar yükleniyor...</div>
          ) : filteredDosyalar.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-450">
              {search
                ? 'Aramaya uygun alım dosyası bulunamadı.'
                : 'Kayıtlı alım dosyası bulunamadı.'}
            </div>
          ) : (
            filteredDosyalar.map((d) => {
              const isSelected = selectedDosyaId === d.id
              const displayNo = d.temin_no || d.dosya_no || `Dosya #${d.id}`
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDosyaId(d.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <FolderKanban size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {displayNo}
                        </span>
                        {d.tur && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                            {d.tur}
                          </span>
                        )}
                        {d.tarih && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(d.tarih)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                        {d.konu}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Copy Items Checkbox */}
        <div className="space-y-2">
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={copyItems}
              onChange={(e) => setCopyItems(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Raporun ihtiyaç kalemlerini dosyanın İhtiyaç Listesi&apos;ne (DATA_TeminKalem)
                kopyala
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Raporun kalemleri alım dosyasının ihtiyaç tablosuna bağımsız olarak aktarılır.
              </span>
            </div>
          </label>

          {copyItems && (
            <div className="ml-4 p-3 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Kalem Aktarım Tercihi:
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="transferMode"
                  value="append_if_missing"
                  checked={transferMode === 'append_if_missing'}
                  onChange={() => setTransferMode('append_if_missing')}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  <strong>Mükerrerliği Önle</strong> (Dosyada halihazırda var olan kalemler atlanır
                  — Önerilen)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="transferMode"
                  value="replace_all"
                  checked={transferMode === 'replace_all'}
                  onChange={() => setTransferMode('replace_all')}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  <strong>Dosyayı Baştan Yaz</strong> (Dosyadaki mevcut kalemleri sil ve rapor
                  kalemlerini aktar)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="transferMode"
                  value="append_all"
                  checked={transferMode === 'append_all'}
                  onChange={() => setTransferMode('append_all')}
                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  <strong>Tümünü Ekle</strong> (Mevcut kalemlerin sırasından devam ederek hepsini
                  ekle)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            İptal
          </button>
          <button
            onClick={handleLink}
            disabled={submitting || !selectedDosyaId}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Link2 size={14} />
            {submitting ? 'Bağlanıyor...' : 'Dosyaya Bağla'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
