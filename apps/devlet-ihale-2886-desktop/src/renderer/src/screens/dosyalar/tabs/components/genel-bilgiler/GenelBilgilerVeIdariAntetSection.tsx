import React, { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { YeniDosyaTabProps } from '../../../types'
import { TeminNoAndButceFields } from './components/TeminNoAndButceFields'
import { KonuVeAciklamaFields } from './components/KonuVeAciklamaFields'
import { TarihlerVeBirimFields } from './components/TarihlerVeBirimFields'
import { AntetMakamVeIhtiyacYeriFields } from './components/AntetMakamVeIhtiyacYeriFields'

export function GenelBilgilerVeIdariAntetSection(props: YeniDosyaTabProps): React.JSX.Element {
  const { formData } = props

  const targetYear = useMemo(() => {
    return (
      formData.butce_yili ||
      (formData.dosya_acilis_tarihi
        ? new Date(formData.dosya_acilis_tarihi).getFullYear()
        : new Date().getFullYear())
    )
  }, [formData.butce_yili, formData.dosya_acilis_tarihi])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-500 w-5 h-5" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">
            Genel Bilgiler &amp; İdari Antet Yapısı
          </h2>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Temin Formatı: <strong>{targetYear}/[Sıra No]</strong> (Yıllık Benzersiz)
        </div>
      </div>

      {/* 1. Bütçe Yılı, Bütçe Tipi & Temin No Alanları */}
      <TeminNoAndButceFields {...props} />

      {/* 2. Konu, Açıklama, Tarihler, Birim ve Antet Makam Alanları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <KonuVeAciklamaFields {...props} />
        <TarihlerVeBirimFields {...props} />
        <AntetMakamVeIhtiyacYeriFields {...props} />
      </div>
    </div>
  )
}
