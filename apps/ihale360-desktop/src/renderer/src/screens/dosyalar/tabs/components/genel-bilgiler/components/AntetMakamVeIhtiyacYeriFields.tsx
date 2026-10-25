import React from 'react'
import { YeniDosyaTabProps } from '../../../../types'

export const AntetMakamVeIhtiyacYeriFields: React.FC<YeniDosyaTabProps> = (props) => {
  const { formData, setFormData, birimler, kurum } = props

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          İdari Antet Ek Satır
        </label>
        <input
          type="text"
          value={formData.antet_ek_satir || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              antet_ek_satir: e.target.value
            })
          }
          placeholder="Örn: Fen İşleri Dairesi Başkanlığı"
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          Evrakın Sunulacağı Makam
        </label>
        {(() => {
          const makamOptions = Array.from(
            new Set(
              [kurum?.makam_adi, ...(birimler ? birimler.map((b) => b.sunum_makami) : [])].filter(
                Boolean
              )
            )
          )
          const isCustom =
            formData.sunulacak_makam && !makamOptions.includes(formData.sunulacak_makam)

          return (
            <div className="space-y-2">
              <select
                value={isCustom ? 'custom' : formData.sunulacak_makam || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setFormData({ ...formData, sunulacak_makam: '' })
                  } else {
                    setFormData({ ...formData, sunulacak_makam: val })
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="">Seçiniz veya elle yazın...</option>
                {makamOptions.map((makam) => (
                  <option key={makam} value={makam}>
                    {makam}
                  </option>
                ))}
                <option value="custom">✍️ Elle Özel Yaz...</option>
              </select>

              {(isCustom || formData.sunulacak_makam === '' || !formData.sunulacak_makam) && (
                <input
                  type="text"
                  value={formData.sunulacak_makam || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sunulacak_makam: e.target.value
                    })
                  }
                  placeholder="Evrakın sunulacağı makamı yazın..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 animate-in slide-in-from-top-1 duration-200"
                />
              )}
            </div>
          )
        })()}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          İhtiyaç Yeri
        </label>
        {(() => {
          const seciliBirim = birimler?.find((b) => b.id === formData.birim_id)
          const kurumAdi = kurum?.kurum_adi || ''

          let seciliBirimYerleri: string[] = []
          if (seciliBirim?.ihtiyac_yeri_eki) {
            try {
              if (seciliBirim.ihtiyac_yeri_eki.startsWith('[')) {
                seciliBirimYerleri = JSON.parse(seciliBirim.ihtiyac_yeri_eki)
              } else {
                seciliBirimYerleri = seciliBirim.ihtiyac_yeri_eki.split(',').map((s) => s.trim())
              }
            } catch {
              seciliBirimYerleri = [seciliBirim.ihtiyac_yeri_eki]
            }
          }

          const tumBirimYerleri: string[] = []
          if (birimler) {
            birimler.forEach((b) => {
              if (b.ihtiyac_yeri_eki) {
                try {
                  if (b.ihtiyac_yeri_eki.startsWith('[')) {
                    const parsed = JSON.parse(b.ihtiyac_yeri_eki)
                    if (Array.isArray(parsed)) {
                      tumBirimYerleri.push(...parsed)
                    }
                  } else {
                    tumBirimYerleri.push(...b.ihtiyac_yeri_eki.split(',').map((s) => s.trim()))
                  }
                } catch {
                  tumBirimYerleri.push(b.ihtiyac_yeri_eki)
                }
              }
            })
          }

          const dinamikSecenekler = [
            ...seciliBirimYerleri,
            seciliBirim?.birim_adi ? `${seciliBirim.birim_adi} Hizmet Binası` : null,
            seciliBirim?.birim_adi ? `${seciliBirim.birim_adi} Şantiyesi` : null,
            seciliBirim?.birim_adi,
            kurumAdi ? `${kurumAdi} Hizmet Binası` : null
          ].filter(Boolean) as string[]

          const ihtiyacOptions = Array.from(
            new Set(
              [
                ...dinamikSecenekler,
                ...tumBirimYerleri,
                ...(birimler
                  ? birimler.map((b) => (b.birim_adi ? `${b.birim_adi} Hizmet Binası` : null))
                  : [])
              ].filter(Boolean) as string[]
            )
          )
          const isCustom = formData.ihtiyac_yeri && !ihtiyacOptions.includes(formData.ihtiyac_yeri)

          return (
            <div className="space-y-2">
              <select
                value={isCustom ? 'custom' : formData.ihtiyac_yeri || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setFormData({ ...formData, ihtiyac_yeri: '' })
                  } else {
                    setFormData({ ...formData, ihtiyac_yeri: val })
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="">Seçiniz veya elle yazın...</option>
                {ihtiyacOptions.map((yer) => (
                  <option key={yer} value={yer}>
                    {yer}
                  </option>
                ))}
                <option value="custom">✍️ Elle Özel Yaz...</option>
              </select>

              {(isCustom || formData.ihtiyac_yeri === '' || !formData.ihtiyac_yeri) && (
                <input
                  type="text"
                  value={formData.ihtiyac_yeri || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ihtiyac_yeri: e.target.value
                    })
                  }
                  placeholder="İhtiyaç yerini yazın..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 animate-in slide-in-from-top-1 duration-200"
                />
              )}
            </div>
          )
        })()}
      </div>
    </>
  )
}
