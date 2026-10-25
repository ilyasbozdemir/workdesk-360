import React from 'react'
import { History, Check } from 'lucide-react'

export const AuditTrailInfoCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Sistem Denetim ve Güvenlik Altyapısı (Audit Inheritance)
          </h3>
        </div>
        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Tüm Tablolar İçin Aktif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            İşlem İzleme Alanları
          </span>
          <p className="text-slate-500 leading-relaxed">
            Tüm operasyonel ve tanım tabloları{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              created_by
            </code>
            ,{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              created_at
            </code>
            ,{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              updated_by
            </code>
            ,{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              updated_at
            </code>{' '}
            kolonları ile izlenir.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Güvenli Silme (Soft Delete)
          </span>
          <p className="text-slate-500 leading-relaxed">
            Kayıtlar doğrudan silinmek yerine{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
              is_deleted
            </code>{' '}
            bayrağı ile korunur ve Sayıştay denetim standartlarına uygun saklanır.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Çoklu Kurum İzolasyonu
          </span>
          <p className="text-slate-500 leading-relaxed">
            Aktif seçilen kurum profili, tüm yazdırma şablonlarına, onay belgelerine ve harcama
            talimatlarına anında yansır.
          </p>
        </div>
      </div>
    </div>
  )
}
