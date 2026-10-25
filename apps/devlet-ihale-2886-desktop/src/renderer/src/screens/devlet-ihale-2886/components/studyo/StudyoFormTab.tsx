import React from 'react'
import { Building2, DollarSign, MapPin, Sliders } from 'lucide-react'
import type { FormDataType, CustomField } from './studyoTypes'

interface StudyoFormTabProps {
  formData: FormDataType
  onSetFormData: (data: FormDataType) => void
  customFields: CustomField[]
  onCustomFieldChange: (id: string, value: string) => void
}

export function StudyoFormTab({
  formData,
  onSetFormData,
  customFields,
  onCustomFieldChange
}: StudyoFormTabProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* 1. Genel İhale Tanımı */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <Building2 className="w-4 h-4 text-purple-500" />
          <span>İhale & Dosya Bilgileri</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kayıt No</label>
            <input
              type="text"
              value={formData.ihaleKayitNo}
              onChange={(e) => onSetFormData({ ...formData, ihaleKayitNo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İşlem Türü
            </label>
            <select
              value={formData.islemTuru}
              onChange={(e) => onSetFormData({ ...formData, islemTuru: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
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
            İhale Konusu / Taşınmaz Adı
          </label>
          <input
            type="text"
            value={formData.ihaleAdi}
            onChange={(e) => onSetFormData({ ...formData, ihaleAdi: e.target.value })}
            placeholder="Örn: 104 Ada 12 Parsel Taşınmaz Satışı"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Usulü
            </label>
            <select
              value={formData.usul}
              onChange={(e) => onSetFormData({ ...formData, usul: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            >
              <option value="acik_teklif_45">Madde 45 (Açık Teklif)</option>
              <option value="kapali_teklif_36">Madde 36 (Kapalı Teklif)</option>
              <option value="pazarlik_51">Madde 51 (Pazarlık)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Yeri
            </label>
            <input
              type="text"
              value={formData.ihaleYeri}
              onChange={(e) => onSetFormData({ ...formData, ihaleYeri: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              İhale Tarihi
            </label>
            <input
              type="date"
              value={formData.ihaleTarihi}
              onChange={(e) => onSetFormData({ ...formData, ihaleTarihi: e.target.value })}
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
              onChange={(e) => onSetFormData({ ...formData, ihaleSaati: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Tapu ve Taşınmaz Detayları */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span>Tapu & Taşınmaz Bilgileri</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">İl / İlçe</label>
            <input
              type="text"
              value={`${formData.il} / ${formData.ilce}`}
              onChange={(e) => {
                const parts = e.target.value.split('/')
                onSetFormData({
                  ...formData,
                  il: parts[0]?.trim() || '',
                  ilce: parts[1]?.trim() || ''
                })
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Ada / Parsel
            </label>
            <input
              type="text"
              value={`${formData.ada} / ${formData.parsel}`}
              onChange={(e) => {
                const parts = e.target.value.split('/')
                onSetFormData({
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
              value={formData.yuzolcumuM2 || ''}
              onChange={(e) =>
                onSetFormData({ ...formData, yuzolcumuM2: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Taşınmaz Cinsi / Vasfı
          </label>
          <input
            type="text"
            value={formData.cinsi}
            onChange={(e) => onSetFormData({ ...formData, cinsi: e.target.value })}
            placeholder="Örn: Arsa, Kargir Bina, Dükkan"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* 3. Muhammen Bedel ve Teminat */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <DollarSign className="w-4 h-4 text-amber-500" />
          <span>Muhammen Bedel & Teminat</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Muhammen Bedel (₺)
            </label>
            <input
              type="number"
              value={formData.muhammenBedel}
              onChange={(e) =>
                onSetFormData({
                  ...formData,
                  muhammenBedel: parseFloat(e.target.value) || 0
                })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              %3 Geçici Teminat (₺)
            </label>
            <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-955/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
              ₺{Math.round((Number(formData.muhammenBedel) || 0) * 0.03).toLocaleString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Kullanıcının Eklediği Özel Alanlar Girişi */}
      {customFields.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 border-b border-purple-100 dark:border-purple-950 pb-1.5">
            <Sliders className="w-4 h-4" />
            <span>Özel Form Alanları (Builder)</span>
          </div>

          {customFields.map((cf) => (
            <div key={cf.id} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {cf.label}
                </label>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                  {`{{${cf.key}}}`}
                </span>
              </div>
              {cf.tip === 'cok_satirli' ? (
                <textarea
                  rows={2}
                  value={cf.deger}
                  onChange={(e) => onCustomFieldChange(cf.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              ) : (
                <input
                  type={cf.tip === 'sayi' || cf.tip === 'para' ? 'number' : 'text'}
                  value={cf.deger}
                  onChange={(e) => onCustomFieldChange(cf.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
