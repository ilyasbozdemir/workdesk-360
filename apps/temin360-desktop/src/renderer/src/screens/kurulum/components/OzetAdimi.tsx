import React from 'react'
import { CheckCircle2, Building2, FolderTree, Users, GitFork, Sparkles, ArrowRight } from 'lucide-react'
import { KurulumFormState } from '../types'

interface OzetAdimiProps {
  state: KurulumFormState
  onComplete: () => Promise<void>
  isSaving: boolean
}

export const OzetAdimi: React.FC<OzetAdimiProps> = ({ state, onComplete, isSaving }) => {
  const { kurum, birimler, personeller, rota } = state

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center max-w-xl mx-auto py-4">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Kurulum Özeti ve Başlangıç Onayı
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Aşağıdaki yapılandırma veritabanınıza kaydedilecek ve doğrudan temin çalışma ortamınız kullanıma hazır hale gelecektir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kurum Kartı */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Kurum Bilgileri
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {kurum.kurumAdi || 'Kurum Adı Tanımlanmadı'}
          </div>
          {kurum.ustKurumAdi && (
            <div className="text-xs text-slate-500">Üst Kurum: {kurum.ustKurumAdi}</div>
          )}
          <div className="text-xs text-slate-500">
            {kurum.il ? `${kurum.il} / ${kurum.ilce}` : 'Konum belirtilmedi'}
          </div>
          {kurum.detsisNo && (
            <div className="text-xs text-slate-400 font-mono">DETSİS: {kurum.detsisNo}</div>
          )}
        </div>

        {/* Birimler Kartı */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <FolderTree className="w-4 h-4" /> Tanımlı Birimler ({birimler.length})
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
            {birimler.length > 0 ? (
              birimler.map((b, i) => (
                <span
                  key={`ozet_birim_${b.id ?? i}_${i}`}
                  className="px-2 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 font-medium"
                >
                  {b.birimAdi}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Birim eklenmedi</span>
            )}
          </div>
        </div>

        {/* Personel Kadrosu */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Users className="w-4 h-4" /> Personel Kadrosu ({personeller.length})
            </div>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto text-xs">
            {personeller.slice(0, 4).map((p, i) => (
              <div key={`ozet_personel_${p.id ?? i}_${i}`} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{p.adSoyad}</span>
                <span className="text-slate-400">{p.unvan}</span>
              </div>
            ))}
            {personeller.length > 4 && (
              <div className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                + {personeller.length - 4} personel daha
              </div>
            )}
          </div>
        </div>

        {/* Onay Rotası */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <GitFork className="w-4 h-4" /> Varsayılan Onay Rotası
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Harcama Yetkilisi:</span>{' '}
              {rota.varsayilanHarcamaYetkilisiId || 'Seçilmedi'}
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Gerçekleştirme Görevlisi:</span>{' '}
              {rota.varsayilanGerceklestirmeId || 'Seçilmedi'}
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Muhasebe Yetkilisi:</span>{' '}
              {rota.varsayilanMuhasebeId || 'Seçilmedi'}
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Varsayılan Birim:</span>{' '}
              {rota.varsayilanBirimAdi || 'Seçilmedi'}
            </div>
          </div>
        </div>
      </div>

      {/* Kaydet & Başlat Butonu */}
      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={onComplete}
          disabled={isSaving || !kurum.kurumAdi.trim()}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-base scale-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sistem Yapılandırılıyor...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Tüm Ayarları Kaydet ve Başlat
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
