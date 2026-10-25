import React from 'react'
import { Barcode, Calendar, Edit2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { generateBarcode } from '../../../utils/barcodeUtils'
import type { Kalem } from '../malzemeler.hooks'

interface KimlikCardProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  selectedType: 'Mal' | 'Hizmet' | 'Yapım'
  isEditingBarkod: boolean
  setIsEditingBarkod: (val: boolean) => void
  barkodError: string
  setBarkodError: (val: string) => void
  checkBarkod: (val: string) => void
}

export const KimlikCard: React.FC<KimlikCardProps> = ({
  formData,
  setFormData,
  selectedType,
  isEditingBarkod,
  setIsEditingBarkod,
  barkodError,
  setBarkodError,
  checkBarkod
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Barkod / Benzersiz ID <span className="text-red-500">*</span>
        </label>
        {!isEditingBarkod ? (
          <div
            onClick={() => setIsEditingBarkod(true)}
            className="cursor-pointer group flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 transition-colors"
            title="Değiştirmek için tıklayın"
          >
            <span
              className={`font-mono text-base tracking-wider ${
                barkodError
                  ? 'text-red-600 font-bold'
                  : 'text-slate-800 dark:text-slate-200 font-bold'
              }`}
            >
              {formData.barkod_id}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Edit2 size={12} /> Düzenle
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFormData((prev) => ({
                    ...prev,
                    barkod_id: generateBarcode()
                  }))
                  setBarkodError('')
                }}
                className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Yeni Üret
              </button>
            </div>
          </div>
        ) : (
          <input
            type="text"
            autoFocus
            value={formData.barkod_id || ''}
            onChange={(e) => {
              const val = e.target.value
              setFormData((prev) => ({
                ...prev,
                barkod_id: val
              }))
              setBarkodError('')
            }}
            onBlur={(e) => {
              setIsEditingBarkod(false)
              checkBarkod(e.target.value)
            }}
            className={`w-full px-3.5 py-2 bg-white dark:bg-slate-950 border ${
              barkodError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
            } rounded-xl text-slate-900 dark:text-white font-mono text-base tracking-wider font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
          />
        )}
        {barkodError ? (
          <p className="text-xs text-red-500 mt-1 font-medium">{barkodError}</p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-1">
            Doğrudan temin ve teklif fişlerinde bu tekil numarayla takip edilir.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {selectedType === 'Mal'
            ? 'Mal / Malzeme Adı'
            : selectedType === 'Hizmet'
              ? 'Hizmet İşinin Adı / Tanımı'
              : 'Yapım İşi / İmalat Adı'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.kalem_adi || ''}
          onChange={(e) => {
            const val = e.target.value
            setFormData((prev) => ({ ...prev, kalem_adi: val }))
          }}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={
            selectedType === 'Mal'
              ? 'Örn: A4 Fotokopi Kağıdı 80gr 500lü Paket'
              : selectedType === 'Hizmet'
                ? 'Örn: Hizmet Binası 12 Aylık Genel Temizlik Hizmeti'
                : 'Örn: Hizmet Binası Çatı İzolasyon ve Çinko Dere Onarımı'
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fiyat Araştırma Dönemi
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Birim Fiyat / KİK</span>
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={formData.fiyat_donemi || ''}
              onChange={(e) => {
                const val = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  fiyat_donemi: val
                }))
              }}
              placeholder={selectedType === 'Yapım' ? 'Örn: 2026/1' : 'Örn: 2026-08'}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
          {/* Hızlı Dönem Seçimi */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400">Hızlı:</span>
            {selectedType === 'Yapım' ? (
              <>
                {[
                  `${new Date().getFullYear()}/1`,
                  `${new Date().getFullYear()}/2`,
                  `${new Date().getFullYear()}`,
                  `${new Date().getFullYear() - 1}`
                ].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        fiyat_donemi: p,
                        poz_yili: parseInt(p, 10) || new Date().getFullYear()
                      }))
                    }
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </>
            ) : (
              <>
                {[
                  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
                    2,
                    '0'
                  )}`,
                  `${new Date().getFullYear()} Yılı`
                ].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, fiyat_donemi: p }))}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            KDV Oranı (%)
          </label>
          <div className="flex gap-1.5">
            {[0, 1, 10, 20].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, kdv_orani: rate }))}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                  formData.kdv_orani === rate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                )}
              >
                %{rate}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
