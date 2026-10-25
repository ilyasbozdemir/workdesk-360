import { FileText } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import React from 'react'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function DosyalarEmptyState(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
        Temin Dosyası Bulunamadı
      </h3>
      <p className="text-xs text-slate-500 max-w-xs mt-1">
        Arama kriterlerinize uyan veya kayıtlı herhangi bir doğrudan temin dosyası bulunmamaktadır.
      </p>
      <button
        onClick={() => navigate({ to: APP_ROUTES.YENI_DOSYA })}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
      >
        Yeni Temin Dosyası Ekle
      </button>
    </div>
  )
}
