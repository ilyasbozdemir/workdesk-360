import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { AmbarInput } from '../ambar.hooks'

export const emptyAmbar: AmbarInput = {
  ambar_adi: '',
  aciklama: '',
  adres: '',
  semt: '',
  posta_kodu: '',
  sehir: '',
  telefon: '',
  faks: '',
  web_adresi: '',
  email: '',
  tasinir_kodu: '',
  tasinir_adi: ''
}

const Field = ({
  label,
  field,
  form,
  handleChange,
  required,
  placeholder
}: {
  label: string
  field: keyof AmbarInput
  form: AmbarInput
  handleChange: (field: keyof AmbarInput, value: string) => void
  required?: boolean
  placeholder?: string
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Input
      value={(form[field] as string) || ''}
      onChange={(e) => handleChange(field, e.target.value)}
      placeholder={placeholder || label}
      required={required}
      className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs py-1.5 h-9"
    />
  </div>
)

interface AmbarFormModalProps {
  isOpen: boolean
  onClose: () => void
  editId: number | null
  initialForm: AmbarInput
  onSave: (form: AmbarInput, editId: number | null) => Promise<void>
}

export const AmbarFormModal: React.FC<AmbarFormModalProps> = ({
  isOpen,
  onClose,
  editId,
  initialForm,
  onSave
}) => {
  const [form, setForm] = useState<AmbarInput>({ ...initialForm })
  const [showExtraFields, setShowExtraFields] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({ ...initialForm })
      setShowExtraFields(Boolean(editId))
    }
  }, [isOpen, initialForm, editId])

  const handleChange = (key: keyof AmbarInput, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.ambar_adi.trim()) return
    await onSave(form, editId)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Ambar Kartı Güncelle' : 'Yeni Ambar Deposu Tanımla'}
      description={
        editId
          ? 'Ambar veya depo bilgilerini düzenleyin.'
          : 'Kurumunuza ait ana ambar veya depo ekleyin.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Ambar Adı"
          field="ambar_adi"
          form={form}
          handleChange={handleChange}
          required
          placeholder="Örn: Fen İşleri Yedek Parça Ambarı"
        />
        <Field
          label="Açıklama"
          field="aciklama"
          form={form}
          handleChange={handleChange}
          placeholder="Ambar hakkında kısa bilgi"
        />

        <button
          type="button"
          onClick={() => setShowExtraFields(!showExtraFields)}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold mt-2 cursor-pointer w-full justify-center bg-blue-50 dark:bg-blue-900/20 py-2 rounded-lg transition-colors"
        >
          {showExtraFields ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {showExtraFields ? 'Ek Bilgileri Gizle' : 'Adres, İletişim & Taşınır Bilgileri Göster'}
        </button>

        {showExtraFields && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <Field label="Adres" field="adres" form={form} handleChange={handleChange} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Semt" field="semt" form={form} handleChange={handleChange} />
              <Field
                label="Posta Kodu"
                field="posta_kodu"
                form={form}
                handleChange={handleChange}
              />
              <Field label="Şehir" field="sehir" form={form} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefon" field="telefon" form={form} handleChange={handleChange} />
              <Field label="Faks" field="faks" form={form} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Web Adresi"
                field="web_adresi"
                form={form}
                handleChange={handleChange}
              />
              <Field label="Email" field="email" form={form} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Taşınır Kodu"
                field="tasinir_kodu"
                form={form}
                handleChange={handleChange}
              />
              <Field
                label="Taşınır Adı"
                field="tasinir_adi"
                form={form}
                handleChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            {editId ? 'Değişiklikleri Kaydet' : 'Ambar Kaydını Ekle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
