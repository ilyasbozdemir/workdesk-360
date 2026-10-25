import React, { useState } from 'react'
import { Clock, AlertCircle, Eye, Layers } from 'lucide-react'
import { Modal } from '../../../../components/ui/Modal'
import { BelgeKanbanItem, BelgeKanbanStatus, BELGE_KANBAN_COLUMNS } from './belgeKanbanTypes'

interface BelgeDetayDialogProps {
  item: BelgeKanbanItem | null
  isOpen: boolean
  onClose: () => void
  onSaveStatus: (
    itemId: string,
    newStatus: BelgeKanbanStatus,
    beklemeNedeni?: string | null
  ) => Promise<void>
  onPreview: (item: BelgeKanbanItem) => void
}

const HAZIR_BEKLEME_NEDENLERI = [
  'Harcama Yetkilisi Onayı Bekleniyor',
  'Gerçekleştirme Görevlisi İmzası Bekleniyor',
  'Komisyon Üyeleri İmzası Bekleniyor',
  'Yüklenici / Firma İmzası Bekleniyor',
  'Teknik Şartname / Bilgi Revizyonu',
  'Ödenek / Bütçe Kontrolü Yapılıyor'
]

function BelgeDetayDialogContent({
  item,
  onClose,
  onSaveStatus,
  onPreview
}: {
  item: BelgeKanbanItem
  onClose: () => void
  onSaveStatus: (
    itemId: string,
    newStatus: BelgeKanbanStatus,
    beklemeNedeni?: string | null
  ) => Promise<void>
  onPreview: (item: BelgeKanbanItem) => void
}): React.JSX.Element {
  const [selectedStatus, setSelectedStatus] = useState<BelgeKanbanStatus>(item.durum)
  const [beklemeNedeni, setBeklemeNedeni] = useState<string>(item.beklemeNedeni || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveStatus(
        item.id,
        selectedStatus,
        selectedStatus === 'beklemede' ? beklemeNedeni : null
      )
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-1 space-y-5">
      {/* EKSİK GEREKSİNİM UYARISI */}
      {item.missingMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <div>
            <div className="font-semibold">Önkoşul Eksikliği</div>
            <div className="text-[11px] opacity-90">{item.missingMsg}</div>
          </div>
        </div>
      )}

      {/* BİLGİ ÖZETİ */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 text-[11px] block">Dosya / Şablon Adı:</span>
          <span
            className="font-semibold text-slate-700 dark:text-slate-300 truncate block mt-0.5"
            title={item.dosyaAdi}
          >
            {item.dosyaAdi}
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] block">Son İşlem / Kayıt:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">
            {item.updatedAt ? String(item.updatedAt).slice(0, 16) : 'Henüz kaydedilmedi'}
          </span>
        </div>
      </div>

      {/* KANBAN DURUM SEÇİCİ */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          Belge Süreç Durumu
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BELGE_KANBAN_COLUMNS.map((col) => {
            const isSelected = selectedStatus === col.status
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setSelectedStatus(col.status)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${col.headerBg} ${col.borderColor} ring-2 ring-blue-500/40 shadow-xs font-bold`
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`text-xs ${isSelected ? col.accentColor : ''}`}>{col.title}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {col.subtitle}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* BEKLEMEDE NEDENİ ALANI */}
      {selectedStatus === 'beklemede' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            Bekleme Nedeni & Not
          </label>

          {/* Hızlı Seçim Butonları */}
          <div className="flex flex-wrap gap-1.5">
            {HAZIR_BEKLEME_NEDENLERI.map((neden) => (
              <button
                key={neden}
                type="button"
                onClick={() => setBeklemeNedeni(neden)}
                className={`text-[10px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  beklemeNedeni === neden
                    ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {neden}
              </button>
            ))}
          </div>

          <textarea
            value={beklemeNedeni}
            onChange={(e) => setBeklemeNedeni(e.target.value)}
            placeholder="Belgenin beklemede olma nedenini veya hatırlatma notunu yazınız..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      )}

      {/* AKSİYON BUTONLARI */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            onPreview(item)
            onClose()
          }}
          disabled={!!item.missingMsg}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Belge Önizleme & Düzenleme
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Kaydediliyor...' : 'Durumu Güncelle'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BelgeDetayDialog({
  item,
  isOpen,
  onClose,
  onSaveStatus,
  onPreview
}: BelgeDetayDialogProps): React.JSX.Element | null {
  if (!item || !isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.belgeAdi}
      description={`${item.kategori} • ${item.isProduced ? 'Kayıtlı Belge' : 'Taslak Şablon'}`}
      className="max-w-2xl"
    >
      <BelgeDetayDialogContent
        key={item.id}
        item={item}
        onClose={onClose}
        onSaveStatus={onSaveStatus}
        onPreview={onPreview}
      />
    </Modal>
  )
}
