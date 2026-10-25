import React from 'react'
import { Hash } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { ButceKod } from '../butcekod.hooks'
import { ButceDuzeyOnizleme } from './ButceKodBadges'

interface ButceKodModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: ButceKod | null
  formKod: string
  setFormKod: (val: string) => void
  formHesapKodu: string
  setFormHesapKodu: (val: string) => void
  formHesapAdi: string
  setFormHesapAdi: (val: string) => void
  formButceTuru: string
  setFormButceTuru: (val: string) => void
  formAciklama: string
  setFormAciklama: (val: string) => void
  formAktifMi: number
  setFormAktifMi: (val: number) => void
  onSave: (e: React.FormEvent) => Promise<void>
}

export const ButceKodModal: React.FC<ButceKodModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  formKod,
  setFormKod,
  formHesapKodu,
  setFormHesapKodu,
  formHesapAdi,
  setFormHesapAdi,
  formButceTuru,
  setFormButceTuru,
  formAciklama,
  setFormAciklama,
  formAktifMi,
  setFormAktifMi,
  onSave
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Bütçe Kodu Düzenle' : 'Yeni Bütçe Kodu Tanımla'}
      className="max-w-2xl"
    >
      <form onSubmit={onSave} className="space-y-4 text-xs">
        {/* Kod Input & Live Breakdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-amber-500" />
            Bütçe Tertip / Ekonomik Kod *
          </label>
          <input
            type="text"
            value={formKod}
            onChange={(e) => setFormKod(e.target.value)}
            placeholder="Örn: 03.2.1.01 veya 03.5.2.02"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            required
          />
          {/* Live Visual Level Breakdown */}
          <div className="pt-1">
            <ButceDuzeyOnizleme kod={formKod} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Hesap Adı */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Hesap / Kalem Adı *
            </label>
            <input
              type="text"
              value={formHesapAdi}
              onChange={(e) => setFormHesapAdi(e.target.value)}
              placeholder="Örn: Kırtasiye ve Büro Malzemesi Alımları"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              required
            />
          </div>

          {/* Muhasebe Hesap Kodu */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Muhasebe / Analitik Hesap Kodu
            </label>
            <input
              type="text"
              value={formHesapKodu}
              onChange={(e) => setFormHesapKodu(e.target.value)}
              placeholder="Örn: 630.03.02.01.01 (Boşsa bütçe kodu alınır)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Bütçe Türü */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Alım / Bütçe Türü
            </label>
            <select
              value={formButceTuru}
              onChange={(e) => setFormButceTuru(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs cursor-pointer"
            >
              <option value="Mal Alımı">📦 Mal Alımı</option>
              <option value="Hizmet Alımı">🛠️ Hizmet Alımı</option>
              <option value="Yapım İşi">🏗️ Yapım İşi</option>
              <option value="Danışmanlık">📑 Danışmanlık</option>
              <option value="Genel">🌐 Genel Bütçe Kalemi</option>
            </select>
          </div>

          {/* Durum */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Aktiflik Durumu
            </label>
            <select
              value={formAktifMi}
              onChange={(e) => setFormAktifMi(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs cursor-pointer"
            >
              <option value={1}>✅ Aktif</option>
              <option value={0}>❌ Pasif</option>
            </select>
          </div>
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Açıklama ve Kullanım Kapsamı
          </label>
          <textarea
            rows={3}
            value={formAciklama}
            onChange={(e) => setFormAciklama(e.target.value)}
            placeholder="Bu tertip kapsamında yapılacak alımların içeriği ve mevzuat açıklaması..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs resize-none"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl cursor-pointer"
          >
            İptal
          </Button>
          <Button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
          >
            {editingItem ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
