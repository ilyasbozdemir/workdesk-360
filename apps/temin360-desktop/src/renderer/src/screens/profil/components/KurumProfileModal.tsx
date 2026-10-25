import React, { useState, useEffect } from 'react'
import { Building2, X, Save } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { KurumVerisi } from '../../kurum/kurum.hooks'

interface KurumProfileModalProps {
  isOpen: boolean
  onClose: () => void
  editingKurum: KurumVerisi | null
  onSave: (formData: Partial<KurumVerisi>, switchImmediately: boolean) => Promise<void>
}

export const KurumProfileModal: React.FC<KurumProfileModalProps> = ({
  isOpen,
  onClose,
  editingKurum,
  onSave
}) => {
  const [modalFormData, setModalFormData] = useState<Partial<KurumVerisi>>({
    kurum_adi: '',
    makam_adi: '',
    ust_kurum_adi: '',
    detsis_kodu: '',
    ebutce_kodu: '',
    say2000i_kodu: '',
    limit_tipi: 'diger',
    alt_kurum_tipi: 'belediye',
    eposta: '',
    telefon: '',
    adres: ''
  })
  const [modalSwitchImmediately, setModalSwitchImmediately] = useState(true)
  const [modalSaving, setModalSaving] = useState(false)

  useEffect(() => {
    if (editingKurum) {
      setModalFormData({ ...editingKurum })
    } else {
      setModalFormData({
        kurum_adi: '',
        makam_adi: '',
        ust_kurum_adi: '',
        detsis_kodu: '',
        ebutce_kodu: '',
        say2000i_kodu: '',
        limit_tipi: 'diger',
        alt_kurum_tipi: 'belediye',
        eposta: '',
        telefon: '',
        adres: ''
      })
      setModalSwitchImmediately(true)
    }
  }, [editingKurum, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalFormData.kurum_adi?.trim()) {
      alert('Lütfen Kurum Adı alanını doldurun.')
      return
    }

    setModalSaving(true)
    try {
      await onSave(modalFormData, modalSwitchImmediately)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Profil işlemi sırasında bir hata oluştu.')
    } finally {
      setModalSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">
                {editingKurum ? 'Kurum Profilini Düzenle' : 'Yeni Kurum Profili Ekle'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingKurum
                  ? 'Kurum ve idari bilgilerini güncelleyin.'
                  : 'Yeni bir idare veya birim için bağımsız profil tanımlayın.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kurum Adı <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={modalFormData.kurum_adi || ''}
              onChange={(e) => setModalFormData({ ...modalFormData, kurum_adi: e.target.value })}
              placeholder="Örn: İzmir Büyükşehir Belediyesi / Fen İşleri Dairesi"
              className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sunulacak Makam Adı
              </label>
              <Input
                value={modalFormData.makam_adi || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, makam_adi: e.target.value })}
                placeholder="Örn: BAŞKANLIK MAKAMINA"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bağlı Olduğu Üst Kurum
              </label>
              <Input
                value={modalFormData.ust_kurum_adi || ''}
                onChange={(e) =>
                  setModalFormData({ ...modalFormData, ust_kurum_adi: e.target.value })
                }
                placeholder="Örn: Çevre, Şehircilik ve İklim Değişikliği Bakanlığı"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                DETSİS Kodu
              </label>
              <Input
                value={modalFormData.detsis_kodu || ''}
                onChange={(e) =>
                  setModalFormData({ ...modalFormData, detsis_kodu: e.target.value })
                }
                placeholder="Örn: 12345678"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-Bütçe Kodu
              </label>
              <Input
                value={modalFormData.ebutce_kodu || ''}
                onChange={(e) =>
                  setModalFormData({ ...modalFormData, ebutce_kodu: e.target.value })
                }
                placeholder="Örn: 38.01.00.00"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Limit Tipi
              </label>
              <select
                value={modalFormData.limit_tipi || 'diger'}
                onChange={(e) => setModalFormData({ ...modalFormData, limit_tipi: e.target.value })}
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="diger">Diğer İdareler (Standart Limit)</option>
                <option value="buyuksehir">Büyükşehir Belediyesi Limitleri</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-Posta
              </label>
              <Input
                value={modalFormData.eposta || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, eposta: e.target.value })}
                placeholder="destek@kurum.gov.tr"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefon
              </label>
              <Input
                value={modalFormData.telefon || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, telefon: e.target.value })}
                placeholder="0 (232) 000 00 00"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          {!editingKurum && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={modalSwitchImmediately}
                  onChange={(e) => setModalSwitchImmediately(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Profil oluşturulduğunda hemen aktif profile geçiş yap
              </label>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4 text-xs font-semibold"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={modalSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 text-xs font-semibold shadow-md shadow-blue-500/15"
            >
              {modalSaving ? (
                'Kaydediliyor...'
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {editingKurum ? 'Değişiklikleri Kaydet' : 'Profili Oluştur'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
