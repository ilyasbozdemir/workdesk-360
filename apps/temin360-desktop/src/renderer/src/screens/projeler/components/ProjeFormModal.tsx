import React from 'react'
import { Info, Check } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Proje } from '../../../hooks/useProjeHooks'
import { COLOR_PRESETS } from '../constants'

interface ProjeFormModalProps {
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  editingProje: Proje | null
  formCode: string
  setFormCode: (v: string) => void
  formName: string
  setFormName: (v: string) => void
  formDesc: string
  setFormDesc: (v: string) => void
  formBudget: string
  setFormBudget: (v: string) => void
  formStartDate: string
  setFormStartDate: (v: string) => void
  formEndDate: string
  setFormEndDate: (v: string) => void
  formLocation: string
  setFormLocation: (v: string) => void
  formDurum: 'planlama' | 'devam' | 'tamamlandi'
  setFormDurum: (v: 'planlama' | 'devam' | 'tamamlandi') => void
  formColor: string
  setFormColor: (v: string) => void
  handleSubmit: (e: React.FormEvent) => void
}

export function ProjeFormModal({
  isCreateModalOpen,
  setIsCreateModalOpen,
  editingProje,
  formCode,
  setFormCode,
  formName,
  setFormName,
  formDesc,
  setFormDesc,
  formBudget,
  setFormBudget,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formLocation,
  setFormLocation,
  formDurum,
  setFormDurum,
  formColor,
  setFormColor,
  handleSubmit
}: ProjeFormModalProps): React.JSX.Element | null {
  if (!isCreateModalOpen) return null

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      title={editingProje ? 'Projeyi Düzenle' : 'Yeni Üst Proje Tanımla'}
      className="max-w-4xl w-11/12 max-h-[88vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Auto Budget Explanation */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 dark:text-blue-200">
            <strong>Harcama Takibi Otomatiktir:</strong> Proje oluştururken harcanan tutar girişi
            yapılmaz. Bağlanan doğrudan temin ve ihale dosyalarının maliyetleri proje harcamasına
            otomatik eklenir.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proje Kodu *
            </label>
            <Input
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="PRJ-2026-001"
              required
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tahsis Edilen Ödenek Bütçesi (₺) - İsteğe Bağlı
            </label>
            <Input
              type="number"
              value={formBudget}
              onChange={(e) => setFormBudget(e.target.value)}
              placeholder="Örn: 1500000 (Boş bırakılabilir)"
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Proje / Yatırım Adı *
          </label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Örn: 2026 Yılı Hizmet Binaları Bakım Onarım Projesi"
            required
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lokasyon / İlgili Birim
            </label>
            <Input
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Örn: Merkez Kampüs & Ek Binalar"
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proje Durumu
            </label>
            <select
              value={formDurum}
              onChange={(e) => setFormDurum(e.target.value as any)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            >
              <option value="devam">Devam Ediyor</option>
              <option value="planlama">Planlama Aşamasında</option>
              <option value="tamamlandi">Tamamlandı</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Başlangıç Tarihi
            </label>
            <Input
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bitiş / Hedef Tarihi
            </label>
            <Input
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Açıklama / Kapsam
          </label>
          <textarea
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Projenin amacı, hedefleri ve kapsamı..."
            rows={3}
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Proje Renk Etiketi
          </label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormColor(c)}
                className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                  formColor === c
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              >
                {formColor === c && <Check size={14} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
            className="text-xs"
          >
            Vazgeç
          </Button>
          <Button
            type="submit"
            className="text-xs bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            {editingProje ? 'Değişiklikleri Kaydet' : 'Projeyi Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
