import React from 'react'
import { Link } from '@tanstack/react-router'
import { FolderTree, HardHat, PackageSearch, Plus, Tag, Trash2 } from 'lucide-react'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { Button } from '../../../components/ui/Button'
import { ExcelActions } from '../../../components/ui/ExcelActions'

interface MalzemelerHeaderProps {
  totalCount: number
  selectedCount: number
  onDeleteSelected: () => void
}

export function MalzemelerHeader({
  totalCount,
  selectedCount,
  onDeleteSelected
}: MalzemelerHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 shrink-0">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
          <PackageSearch className="w-8 h-8 text-blue-605" />
          Mal, Hizmet & Yapım Kataloğu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-4xl">
          Doğrudan temin süreçlerinde, yaklaşık maliyet hesaplarında ve piyasa fiyat
          araştırmalarında kullanılan malzeme, hizmet ve yapım kalemlerini yönetin.
        </p>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <p className="mb-1">
              💡 <strong>İpucu:</strong> Mal alımlarında{' '}
              <Link
                to="/tasinirkod"
                className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200"
              >
                Taşınır Kodları
              </Link>
              , Hizmet alımlarında{' '}
              <Link
                to="/okaskod"
                className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200"
              >
                OKAS Kodları
              </Link>
              , Yapım işlerinde ise{' '}
              <Link
                to={APP_ROUTES.POZLAR}
                className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200"
              >
                Birim Fiyat Poz Kitapları
              </Link>{' '}
              üzerinden hızlıca seçim yapıp kalemlerinizi oluşturabilirsiniz.
            </p>
            <p>
              📣 Uygulama altyapımız bu kodları tamamen desteklemektedir. Hazır malzeme listesi ve
              kodlarının varsayılan olarak eklenmesi için{' '}
              <a
                href="https://github.com/ilyasbozdemir/workdesk-360"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200"
              >
                GitHub sayfamızdan Issue açarak
              </a>{' '}
              bize veritabanı taleplerinizi iletebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-4 sm:pb-0 pr-0 sm:pr-6 w-full sm:w-auto">
          <div>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {totalCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">
              Kayıtlı Kalem
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end w-full sm:w-auto">
          {selectedCount > 0 && (
            <Button
              variant="outline"
              onClick={onDeleteSelected}
              className="gap-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 flex items-center px-4 py-2 text-sm justify-center"
            >
              <Trash2 className="w-4 h-4 shrink-0 text-red-650" />
              <span className="whitespace-nowrap font-bold">Seçilenleri Sil ({selectedCount})</span>
            </Button>
          )}
          <ExcelActions
            tableName="TANIM_Kalem"
            title="Malzemeler / Kalemler"
            uniqueCol="barkod_id"
            onImportSuccess={() => window.location.reload()}
          />
          <Link
            to="/tasinirkod"
            className="shrink-0"
            title="Taşınır Kodları Rehberi (Mal Alımları)"
          >
            <Button
              variant="outline"
              className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 flex items-center px-3.5 py-2 text-sm justify-center transition-colors"
            >
              <FolderTree className="w-4 h-4 text-emerald-600 shrink-0" />{' '}
              <span className="whitespace-nowrap font-medium">Taşınır Kodları</span>
            </Button>
          </Link>
          <Link to="/okaskod" className="shrink-0" title="OKAS Kodları Rehberi (Hizmet Alımları)">
            <Button
              variant="outline"
              className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 flex items-center px-3.5 py-2 text-sm justify-center transition-colors"
            >
              <Tag className="w-4 h-4 text-indigo-600 shrink-0" />{' '}
              <span className="whitespace-nowrap font-medium">OKAS Kodları</span>
            </Button>
          </Link>
          <Link
            to={APP_ROUTES.POZLAR}
            className="shrink-0"
            title="Birim Fiyat Pozları Kitapları (Yapım İşleri)"
          >
            <Button
              variant="outline"
              className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800 flex items-center px-3.5 py-2 text-sm justify-center transition-colors"
            >
              <HardHat className="w-4 h-4 text-amber-600 shrink-0" />{' '}
              <span className="whitespace-nowrap font-medium">Birim Fiyat Pozları</span>
            </Button>
          </Link>
          <Link to="/malzemeler/yeni" className="shrink-0">
            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 shadow-md flex items-center px-5 py-2 text-sm justify-center text-white">
              <Plus className="w-4 h-4 shrink-0" />{' '}
              <span className="whitespace-nowrap font-semibold">Mal/Hizmet/Yapım İşi Ekle</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
