import React from 'react'
import { EBYS_RESOURCES, MEVZUAT_KURALLARI } from '../data/ebysMevzuat.data'
import { ExternalLink, ShieldCheck, BookOpen, CheckCircle, Scale } from 'lucide-react'

export const EbysMevzuatGuide: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-100/80 dark:bg-slate-950 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-800 dark:text-slate-100">
      {/* Başlık Kartı */}
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/30 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Türkiye EBYS Resmî Yazışma Mevzuatı &amp; Kaynaklar
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik ve e-Yazışma Paketi
              (EYP 2.0)
            </p>
          </div>
        </div>
      </div>

      {/* Yönetmelik Maddeleri Özeti */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Resmî Yazışma Yönetmeliği Esasları (2646 Sayılı Karar)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MEVZUAT_KURALLARI.map((kural, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {kural.madde}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {kural.icerik}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Doğrulanmış Kaynaklar Tablosu */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Doğrulanmış Resmî Kaynaklar ve Standartlar
        </h3>
        <div className="space-y-3">
          {EBYS_RESOURCES.map((res, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {res.name}
                  </span>
                  {res.isOfficial && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                      Resmî Kaynak
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {res.format}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {res.description}
                </p>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  <strong>Tür:</strong> {res.type} | <strong>Lisans:</strong> {res.license}
                </div>
              </div>

              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium shrink-0 transition"
              >
                <span>Kaynağı İncele</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
