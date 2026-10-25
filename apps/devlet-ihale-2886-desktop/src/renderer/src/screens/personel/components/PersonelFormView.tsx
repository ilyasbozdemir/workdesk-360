import React from 'react'
import { ArrowLeft, Edit, HelpCircle, Plus, Save, Shield, Users, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Personel, PersonelWithRoles, Rol } from '../personel.hooks'

interface PersonelFormViewProps {
  editingPersonel: Personel | null
  formData: PersonelWithRoles
  setFormData: React.Dispatch<React.SetStateAction<PersonelWithRoles>>
  rollerList: Rol[]
  birimler: Array<{ id: number; birim_adi: string }>
  kurumData?: { kurum_adi?: string } | null
  closeForm: () => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  toggleRole: (rol_kodu: string, isChecked: boolean) => void
}

export function PersonelFormView({
  editingPersonel,
  formData,
  setFormData,
  rollerList,
  birimler,
  kurumData,
  closeForm,
  handleSubmit,
  toggleRole
}: PersonelFormViewProps): React.JSX.Element {
  return (
    <form
      onSubmit={handleSubmit}
      className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={closeForm}
            className="w-fit text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pl-0 mb-2 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Listeye Geri Dön
          </Button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {editingPersonel ? (
              <Edit className="w-6 h-6 text-blue-500" />
            ) : (
              <Plus className="w-6 h-6 text-blue-500" />
            )}
            {editingPersonel ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="px-6 py-2 h-10 text-sm"
            onClick={closeForm}
          >
            <X className="w-4 h-4 mr-2" /> İptal
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 shadow-md px-8 py-2 h-10 text-sm flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />{' '}
            {editingPersonel ? 'Değişiklikleri Kaydet' : 'Personeli Ekle'}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Avatar Yükleme */}
            <div className="flex flex-col items-center gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                Profil Resmi
              </label>
              <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-850 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer shadow-inner hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setFormData({
                          ...formData,
                          avatar: reader.result as string
                        })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[10px] text-white font-semibold">Resim Seç</span>
                </div>
              </div>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: null })}
                  className="text-[10px] text-rose-500 hover:text-rose-600 hover:underline cursor-pointer font-semibold"
                >
                  Resmi Kaldır
                </button>
              )}
            </div>

            {/* Ad Soyad Girişi */}
            <div className="flex-1 w-full space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ad Soyad *
              </label>
              <Input
                required
                autoFocus
                placeholder="Örn: Ahmet Yılmaz"
                value={formData.ad_soyad}
                onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Personelin adı ve soyadı resmi belgelerde bu şekilde görüntülenecektir.
              </p>
            </div>
          </div>

          {/* Kadro Unvanı ve Kurum İçi Görevi Ayrı Ayrı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kadro / Meslek Unvanı
              </label>
              <Input
                placeholder="Örn: İnşaat Mühendisi, Mimar, V.H.K.İ., Şube Müdürü"
                value={formData.unvan || ''}
                onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Personelin asaleten veya sözleşmeli kadro unvanı.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kurum İçi / İhale Görevi
              </label>
              <Input
                placeholder="Örn: Harcama Yetkilisi, Satın Alma Sorumlusu, Komisyon Üyesi"
                value={formData.gorev || ''}
                onChange={(e) => setFormData({ ...formData, gorev: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Personelin imza atarken ve süreçleri yürütürken üstlendiği görev.
              </p>
            </div>
          </div>

          {/* Birim ve Sicil No */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Birim / Müdürlük</span>
                <span className="text-[11px] text-slate-400 font-normal">(İsteğe Bağlı)</span>
              </label>
              <Input
                list="birimler-list"
                placeholder="-- Birim Seçin veya Arayın --"
                value={formData.birim || ''}
                onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
              <datalist id="birimler-list">
                {kurumData?.kurum_adi && <option value={kurumData.kurum_adi} />}
                {birimler.map((b) => (
                  <option key={b.id} value={b.birim_adi} />
                ))}
              </datalist>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Listeden seçebilir veya boş bırakabilirsiniz.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Kurum Sicil No
                  <span title="Personelin kurum içi sicil numarası">
                    <HelpCircle className="w-4 h-4 text-blue-500 cursor-help" />
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">(İsteğe Bağlı)</span>
              </label>
              <Input
                placeholder="Örn: 12345"
                value={formData.sicil_no || ''}
                onChange={(e) => setFormData({ ...formData, sicil_no: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Telefon
              </label>
              <Input
                placeholder="Örn: 0555..."
                value={formData.telefon || ''}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                E-Posta
              </label>
              <Input
                type="email"
                placeholder="Örn: ornek@kurum.gov.tr"
                value={formData.eposta || ''}
                onChange={(e) => setFormData({ ...formData, eposta: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm py-2 h-11"
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 mt-8">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" /> Şablonlarda Varsayılan Görev
              (Yetkilendirme)
            </h4>
            <p className="text-xs text-slate-500">
              Seçtiğiniz roller, yeni oluşturulan resmi belgelerde bu personelin adı ve unvanıyla
              otomatik doldurulacaktır. Personel birden çok görev üstlenebilir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {rollerList.map((rol) => (
                <label
                  key={rol.rol_kodu}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-800 transition-colors group"
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                    checked={formData.assignedRoles?.includes(rol.rol_kodu)}
                    onChange={(e) => toggleRole(rol.rol_kodu, e.target.checked)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rol.rol_adi}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      {rol.aciklama}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
