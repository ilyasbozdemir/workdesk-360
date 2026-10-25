import React from 'react'
import { BookOpen, Building2, Loader2, Search, Sparkles } from 'lucide-react'
import { getDinamikFiyatDonemleri } from './pozKitaplari.data'
import { HIZMET_SINIFLARI, YAPI_SINIFLARI } from '../constants'
import type { Kalem } from '../malzemeler.hooks'

interface TurOzelAlanlarCardProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  selectedType: 'Mal' | 'Hizmet' | 'Yapım'
  setIsOkasModalOpen: (val: boolean) => void
  setIsTasinirModalOpen: (val: boolean) => void
  setIsPozModalOpen: (val: boolean) => void
  isAiGeneratingOkas: boolean
  handleAiOkasSuggest: () => void
}

export const TurOzelAlanlarCard: React.FC<TurOzelAlanlarCardProps> = ({
  formData,
  setFormData,
  selectedType,
  setIsOkasModalOpen,
  setIsTasinirModalOpen,
  setIsPozModalOpen,
  isAiGeneratingOkas,
  handleAiOkasSuggest
}) => {
  return (
    <div className="space-y-4">
      {selectedType === 'Mal' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Taşınır Kodu (MKYS 150.xx...)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.tasinir_kodu || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    tasinir_kodu: val
                  }))
                }}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                placeholder="Örn: 150.01.01.01"
              />
              <button
                type="button"
                onClick={() => setIsTasinirModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <Search size={14} />
                Listeden Seç
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              OKAS Kodu (CPV)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.okas_kodu || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    okas_kodu: val
                  }))
                }}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                placeholder="Örn: 30192700"
              />
              <button
                type="button"
                onClick={() => setIsOkasModalOpen(true)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <Search size={14} />
                Listeden
              </button>
              <button
                type="button"
                onClick={handleAiOkasSuggest}
                disabled={isAiGeneratingOkas}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-1.5 shrink-0 border border-purple-200 dark:border-purple-800 text-xs font-semibold disabled:opacity-50"
              >
                {isAiGeneratingOkas ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI Öneri
              </button>
            </div>
          </div>
        </>
      )}

      {selectedType === 'Yapım' && (
        <>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/50 dark:border-amber-900/30">
              <span className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" /> Poz ve İmalat Sınıflandırması
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPozModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <BookOpen size={13} /> Resmî Poz Kitapları
                </button>
                <button
                  type="button"
                  onClick={() => setIsPozModalOpen(true)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Sparkles size={13} /> Özel Poz Tanımla
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Poz Numarası */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Poz Numarası <span className="text-amber-600">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formData.poz_no || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        poz_no: val
                      }))
                    }}
                    placeholder="Örn: 15.150.1002 veya ÖZEL.01"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPozModalOpen(true)}
                    className="px-2.5 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 rounded-xl text-xs font-bold shrink-0 transition-colors"
                    title="Poz Kütüphanesinden Seç"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              {/* Fiyat Araştırma Dönemi */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fiyat Araştırma Dönemi
                </label>
                <input
                  type="text"
                  list="yeni-fiyat-donem-list"
                  value={
                    formData.fiyat_donemi || `${formData.poz_yili || new Date().getFullYear()}/1`
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      fiyat_donemi: val
                    }))
                  }}
                  placeholder={`Örn: ${formData.poz_yili || new Date().getFullYear()}/1`}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                />
                <datalist id="yeni-fiyat-donem-list">
                  {getDinamikFiyatDonemleri(formData.poz_yili || new Date().getFullYear()).map(
                    (d) => (
                      <option key={d.kod} value={d.kod}>
                        {d.etiket}
                      </option>
                    )
                  )}
                </datalist>
              </div>

              {/* Poz Kitabı Yılı */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Poz / Bülten Yılı
                </label>
                <input
                  type="number"
                  value={formData.poz_yili || new Date().getFullYear()}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setFormData((prev) => ({
                      ...prev,
                      poz_yili: val
                    }))
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* OKAS Kodu for Yapım İşi */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              OKAS Kodu (İnşaat / İmalat CPV)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.okas_kodu || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    okas_kodu: val
                  }))
                }}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                placeholder="Örn: 45000000 veya 45261210"
              />
              <button
                type="button"
                onClick={() => setIsOkasModalOpen(true)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <Search size={14} />
                Listeden
              </button>
              <button
                type="button"
                onClick={handleAiOkasSuggest}
                disabled={isAiGeneratingOkas}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-1.5 shrink-0 border border-purple-200 dark:border-purple-800 text-xs font-semibold disabled:opacity-50"
              >
                {isAiGeneratingOkas ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI Öneri
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Yapı Sınıfı / İmalat Grubu
            </label>
            <select
              value={formData.yapi_sinifi || ''}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  yapi_sinifi: val
                }))
              }}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">(Seçiniz veya Genel Yapım)</option>
              {YAPI_SINIFLARI.map((ys) => (
                <option key={ys} value={ys}>
                  {ys}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Poz Grubu Kalıcı Referans ID
            </label>
            <input
              type="text"
              value={formData.poz_grubu_ref_id || ''}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  poz_grubu_ref_id: val
                }))
              }}
              placeholder="Örn: YPM-IZOLASYON-CATI (Yıllar arası fiyat/kod takibi için)"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
            />
          </div>
        </>
      )}

      {selectedType === 'Hizmet' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Hizmet Sınıflandırması
            </label>
            <select
              value={formData.hizmet_sinifi || ''}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  hizmet_sinifi: val
                }))
              }}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">(Hizmet Sınıfı Seçiniz)</option>
              {HIZMET_SINIFLARI.map((hs) => (
                <option key={hs} value={hs}>
                  {hs}
                </option>
              ))}
            </select>
          </div>

          {/* OKAS Kodu for Hizmet */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              OKAS Kodu (Hizmet CPV)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.okas_kodu || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    okas_kodu: val
                  }))
                }}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                placeholder="Örn: 90910000 veya 79713000"
              />
              <button
                type="button"
                onClick={() => setIsOkasModalOpen(true)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <Search size={14} />
                Listeden
              </button>
              <button
                type="button"
                onClick={handleAiOkasSuggest}
                disabled={isAiGeneratingOkas}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-1.5 shrink-0 border border-purple-200 dark:border-purple-800 text-xs font-semibold disabled:opacity-50"
              >
                {isAiGeneratingOkas ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI Öneri
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Hizmet Süresi
              </label>
              <input
                type="text"
                value={formData.sure || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, sure: val }))
                }}
                placeholder="Örn: 12 Ay, 30 Gün"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Personel Sayısı (varsa)
              </label>
              <input
                type="number"
                min="0"
                value={formData.personel_sayisi || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null
                  setFormData((prev) => ({
                    ...prev,
                    personel_sayisi: val
                  }))
                }}
                placeholder="Örn: 3"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Personel Çalıştırılacaksa Ücretlendirme Box */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="is_personel_check"
                className="flex items-center gap-2.5 text-xs font-bold text-indigo-950 dark:text-indigo-200 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="is_personel_check"
                  checked={!!formData.is_personel}
                  onChange={(e) => {
                    const checked = e.target.checked ? 1 : 0
                    setFormData((prev) => ({
                      ...prev,
                      is_personel: checked
                    }))
                  }}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Personel çalıştırılacaksa ücretlendirme</span>
              </label>

              {formData.is_personel === 1 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200 pl-6 sm:pl-0">
                  <span>Asgari Ücret / Brüt Asgari Ücretin %</span>
                  <input
                    type="number"
                    value={formData.personel_asgari_fark_oran ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      setFormData((prev) => ({
                        ...prev,
                        personel_asgari_fark_oran: val
                      }))
                    }}
                    className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-bold font-mono text-center text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span>fazlası</span>
                </div>
              )}
            </div>

            {formData.is_personel === 1 && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                    İŞKUR / Meslek Kodu
                  </label>
                  <input
                    type="text"
                    value={formData.meslek_kodu || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        meslek_kodu: val
                      }))
                    }}
                    placeholder="Örn: 9112.01 (Temizlik Görevlisi)"
                    className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 pt-4">
                  KİK Fiyat Farkı ve Asgari Ücret Tespit Komisyonu katsayıları ile otomatik
                  hesaplanır.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
