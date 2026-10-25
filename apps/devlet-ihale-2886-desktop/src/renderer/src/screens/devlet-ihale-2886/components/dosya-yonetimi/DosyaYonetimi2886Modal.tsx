import React from 'react'
import { FolderPlus, Sparkles } from 'lucide-react'
import { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'

export interface Dosya2886FormData {
  ihaleKayitNo: string
  ihaleAdi: string
  islemTuru: string
  usul: string
  muhammenBedel: number
  ihaleTarihi: string
  ihaleSaati: string
  ihaleYeri: string
  il: string
  ilce: string
  mahalleKoy: string
  ada: string
  parsel: string
  yuzolcumuM2: number
  cinsi: string
  adres: string
}

interface DosyaYonetimi2886ModalProps {
  isOpen: boolean
  onClose: () => void
  editingDosya: Dosya2886Item | null
  formData: Dosya2886FormData
  setFormData: React.Dispatch<React.SetStateAction<Dosya2886FormData>>
  onSave: (e: React.FormEvent, openInStudio?: boolean) => void
}

export const DosyaYonetimi2886Modal: React.FC<DosyaYonetimi2886ModalProps> = ({
  isOpen,
  onClose,
  editingDosya,
  formData,
  setFormData,
  onSave
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={(e) => onSave(e, false)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-indigo-500" />
            {editingDosya
              ? '2886 İhale Dosyasını Düzenle'
              : 'Yeni 2886 İhale Dosyası Aç (Hızlı Tanım)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Kayıt No
            </label>
            <input
              type="text"
              required
              value={formData.ihaleKayitNo}
              onChange={(e) => setFormData({ ...formData, ihaleKayitNo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İşlem Türü
            </label>
            <select
              value={formData.islemTuru}
              onChange={(e) => setFormData({ ...formData, islemTuru: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
            >
              <option value="satis">🏷️ Mülkiyet Satışı</option>
              <option value="kiralama">🏢 Taşınmaz Kiralama</option>
              <option value="irtifak_hakki">📜 Sınırlı Ayni Hak / İrtifak</option>
              <option value="trampa">🔄 Trampa (Takas)</option>
            </select>
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            İhale Konusu & Taşınmaz Adı
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Merkez Mah. 104 Ada 12 Parsel Arsa Satışı"
            value={formData.ihaleAdi}
            onChange={(e) => setFormData({ ...formData, ihaleAdi: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Usulü
            </label>
            <select
              value={formData.usul}
              onChange={(e) => setFormData({ ...formData, usul: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            >
              <option value="acik_teklif_45">Madde 45 (Açık Teklif)</option>
              <option value="kapali_teklif_36">Madde 36 (Kapalı Teklif)</option>
              <option value="pazarlik_51">Madde 51 (Pazarlık)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Muhammen Bedel (₺)
            </label>
            <input
              type="number"
              required
              value={formData.muhammenBedel}
              onChange={(e) =>
                setFormData({ ...formData, muhammenBedel: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Tarihi
            </label>
            <input
              type="date"
              value={formData.ihaleTarihi}
              onChange={(e) => setFormData({ ...formData, ihaleTarihi: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Saati
            </label>
            <input
              type="time"
              value={formData.ihaleSaati}
              onChange={(e) => setFormData({ ...formData, ihaleSaati: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Ada / Parsel
            </label>
            <input
              type="text"
              placeholder="104 / 12"
              value={
                formData.ada && formData.parsel
                  ? `${formData.ada} / ${formData.parsel}`
                  : formData.ada
              }
              onChange={(e) => {
                const parts = e.target.value.split('/')
                setFormData({
                  ...formData,
                  ada: parts[0]?.trim() || '',
                  parsel: parts[1]?.trim() || ''
                })
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Yüzölçümü (m²)
            </label>
            <input
              type="number"
              placeholder="1450"
              value={formData.yuzolcumuM2 || ''}
              onChange={(e) =>
                setFormData({ ...formData, yuzolcumuM2: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={(e) => onSave(e, true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kaydet & Stüdyoda Aç</span>
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {editingDosya ? 'Güncelle' : 'Dosyayı Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
