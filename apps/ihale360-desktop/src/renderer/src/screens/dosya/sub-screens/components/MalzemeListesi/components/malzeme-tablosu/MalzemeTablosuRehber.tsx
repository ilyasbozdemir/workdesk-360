import React from 'react'
import { FileCheck, FileText, Info, Users } from 'lucide-react'

interface MalzemeTablosuRehberProps {
  handleOpenSablonByDosyaAdi: (targetKey: string) => void
}

export function MalzemeTablosuRehber({
  handleOpenSablonByDosyaAdi
}: MalzemeTablosuRehberProps): React.JSX.Element {
  return (
    <div className="mb-4 p-3.5 bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-xs text-slate-700 dark:text-slate-300 shadow-xs">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight">
              1. Aşama: İhtiyaç Tespiti, Onay &amp; Ekler Rehberi
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
              Mevzuat &amp; Deneyim Notu
            </span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            • <strong>Lüzum Müzekkeresi Onay Eki (Ek-1):</strong> Talep edilen malzeme/ihtiyaç
            listesi ve onay tablosu <u>Ek-1</u> olarak düzenlenir, Lüzum Müzekkeresi ile harcama
            yetkilisine sunulur.
            <br />• <strong>Komisyon Görevlendirme Onayı Eki (Ek-2):</strong> Fiyat araştırması ve
            muayene-kabul işlemlerini yürütecek görevli personellerin unvan ve görev listesi{' '}
            <u>Ek-2</u> olarak görevlendirme onayına bağlanır.
            <br />• <strong>Harcama Talimatı / Onay Belgesi:</strong> İhtiyaçlar ve görevliler
            netleştikten sonra 4734 Sayılı Kanun (Md. 22) kapsamında doğrudan temin alım sürecini
            resmi olarak başlatan temel idari belgedir.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100/70 dark:border-blue-900/30">
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              Hızlı Belge Erişimi:
            </span>
            <button
              type="button"
              onClick={() => handleOpenSablonByDosyaAdi('luzum-muzekkeresi-onay-eki')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3 h-3 text-blue-500" />
              Lüzum Müzekkeresi Onay Eki (Ek-1)
            </button>
            <button
              type="button"
              onClick={() => handleOpenSablonByDosyaAdi('komisyon-gorevlendirme-onayi-eki')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Users className="w-3 h-3 text-blue-500" />
              Komisyon Görevlendirme Eki (Ek-2)
            </button>
            <button
              type="button"
              onClick={() => handleOpenSablonByDosyaAdi('harcama-talimati')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3 h-3 text-teal-500" />
              Harcama Talimatı
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
