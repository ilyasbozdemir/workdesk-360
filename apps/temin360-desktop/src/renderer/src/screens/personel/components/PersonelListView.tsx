import React from 'react'
import { Edit, Plus, Shield, Trash2, Users } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { DataViewMode, ViewToggle } from '../../../components/ui/ViewToggle'
import { ExcelActions } from '../../../components/ui/ExcelActions'
import { Personel, Rol } from '../personel.hooks'

interface PersonelListViewProps {
  personelList: Personel[]
  rollerList: Rol[]
  isPersonelLoading: boolean
  isSubComponent?: boolean
  dataViewMode: DataViewMode
  setDataViewMode: (mode: DataViewMode) => void
  openForm: (e?: React.MouseEvent, p?: Personel) => void
  handleViewClick: (p: Personel) => void
  handleDelete: (e: React.MouseEvent, id: number) => Promise<void>
}

export function PersonelListView({
  personelList,
  rollerList,
  isPersonelLoading,
  isSubComponent = false,
  dataViewMode,
  setDataViewMode,
  openForm,
  handleViewClick,
  handleDelete
}: PersonelListViewProps): React.JSX.Element {
  return (
    <div
      className={
        isSubComponent
          ? 'flex flex-col gap-6 w-full animate-in fade-in duration-200'
          : 'p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full'
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-855 dark:text-slate-100">
            <Users className="w-8 h-8 text-blue-600" />
            Personel Yönetimi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Kurum personelini buradan ekleyebilir, kadro unvanı ve kurum görevlerini
            belirleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelActions tableName="TANIM_Personel" title="Personeller" uniqueCol="id" />
          <ViewToggle viewMode={dataViewMode} onChange={setDataViewMode} />
          <Button
            onClick={(e) => openForm(e)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md flex items-center px-4 py-2 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Yeni Personel Ekle
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
        <div className="flex-1 overflow-auto p-4">
          {isPersonelLoading ? (
            <div className="p-8 text-center text-slate-450 dark:text-slate-500 animate-pulse italic">
              Yükleniyor...
            </div>
          ) : personelList.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-450 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <Users className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Henüz Personel Eklenmemiş
              </h3>
              <p className="text-xs mt-1 text-slate-500">
                Süreçlerde görev alacak personeli hemen eklemeye başlayın.
              </p>
            </div>
          ) : dataViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {personelList.map((p) => {
                const assignedRoles = rollerList.filter((r) => r.varsayilan_personel_id === p.id)

                return (
                  <div
                    key={p.id}
                    onClick={() => handleViewClick(p)}
                    className="flex flex-col p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-blue-300 dark:hover:border-blue-800 transition-colors group relative cursor-pointer"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        title="Düzenle"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openForm(e, p)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        title="Sil"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, p.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mb-3 pr-12">
                      <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.ad_soyad}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm uppercase">
                            {p.ad_soyad.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                          {p.ad_soyad}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.unvan || 'Unvan Belirtilmedi'}
                        </p>
                        {p.gorev && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                            Görev: {p.gorev}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                      {p.birim && <div className="truncate">🏢 {p.birim}</div>}
                      {p.sicil_no && <div className="truncate">📋 Sicil No: {p.sicil_no}</div>}
                      {p.telefon && <div>📞 {p.telefon}</div>}
                      {p.eposta && <div className="truncate">✉️ {p.eposta}</div>}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-auto border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                      {assignedRoles.length > 0 ? (
                        assignedRoles.map((role) => (
                          <span
                            key={role.rol_kodu}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                          >
                            <Shield className="w-3 h-3" /> {role.rol_adi}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Özel yetki yok</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Ad Soyad</th>
                    <th className="px-4 py-3">Kadro Unvanı</th>
                    <th className="px-4 py-3">Görevi</th>
                    <th className="px-4 py-3">Birim</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {personelList.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleViewClick(p)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.ad_soyad}
                      </td>
                      <td className="px-4 py-3">{p.unvan || '-'}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {p.gorev || '-'}
                      </td>
                      <td className="px-4 py-3">{p.birim || '-'}</td>
                      <td className="px-4 py-3">{p.telefon || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openForm(e, p)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, p.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
