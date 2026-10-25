import React from 'react'
import { LogType } from '../../../utils/logger'
import { DosyalarEmptyState } from './DosyalarEmptyState'
import { DosyalarBulkActions } from './DosyalarBulkActions'
import { DosyalarHeader } from './DosyalarHeader'
import { DosyalarGridView } from './DosyalarGridView'
import { DosyalarTableView } from './DosyalarTableView'

export function DosyalarList({
  isLoadingDosyalar,
  filteredDosyalar,
  dosyalar,
  viewMode,
  filterYil,
  filterTur,
  groupedDosyalar,
  expandedGroups,
  searchQuery,
  toggleGroup,
  activeDosyaId,
  setActiveDosyaId,
  getDosyaNoLabel,
  formatMoney,
  formatDate,
  handleDelete,
  handleHardDelete,
  handleBulkDelete,
  handleBulkHardDelete,
  handleUpdateStatus,
  handleEkapGonder,
  handleKilidiAc,
  handleOpenInNewWindow,
  handleOpenAI,
  handleOpenMaliyetAyarlari
}: {
  isLoadingDosyalar: boolean
  filteredDosyalar: any[]
  dosyalar: any[]
  viewMode: 'grid' | 'list' | 'table'
  filterYil: string
  filterTur: string
  groupedDosyalar: { baseKonu: string; files: any[] }[]
  expandedGroups: string[]
  searchQuery: string
  toggleGroup: (baseKonu: string) => void
  activeDosyaId: number | null
  setActiveDosyaId: (id: number | null) => void
  getDosyaNoLabel: (d: any) => string
  formatMoney: (val: number) => string
  formatDate: (val: string | null | undefined) => string
  handleDateChange?: (id: number, date: string) => Promise<void>
  handleDelete?: (id: number, skipConfirm?: boolean) => Promise<void>
  handleHardDelete?: (id: number) => Promise<void>
  handleBulkDelete?: (ids: number[]) => Promise<void>
  handleBulkHardDelete?: (ids: number[]) => Promise<void>
  handleUpdateStatus?: (id: number, status: string) => Promise<void>
  handleEkapGonder?: (id: number) => void
  handleKilidiAc?: (id: number) => Promise<void>
  logActivity?: (title: string, message: string, type?: LogType) => Promise<void>
  handleOpenInNewWindow?: (dosya: any) => void
  handleOpenAI?: (dosya: any) => void
  handleOpenMaliyetAyarlari?: (dosya: any) => void
}): React.JSX.Element {
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null)
  const [selectedDosyaIds, setSelectedDosyaIds] = React.useState<number[]>([])

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setSelectedDosyaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Dışarı tıklanınca menüyü kapat
  React.useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  if (isLoadingDosyalar) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-500 italic">
        Dosyalar yükleniyor...
      </div>
    )
  }

  if (filteredDosyalar.length === 0) {
    return <DosyalarEmptyState />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DosyalarBulkActions
        selectedDosyaIds={selectedDosyaIds}
        dosyalar={dosyalar}
        handleBulkHardDelete={handleBulkHardDelete}
        handleBulkDelete={handleBulkDelete}
        setSelectedDosyaIds={setSelectedDosyaIds}
      />

      <DosyalarHeader
        filterYil={filterYil}
        filteredDosyalar={filteredDosyalar}
        selectedDosyaIds={selectedDosyaIds}
        setSelectedDosyaIds={setSelectedDosyaIds}
        filterTur={filterTur}
      />

      {viewMode === 'grid' || viewMode === 'list' ? (
        <DosyalarGridView
          viewMode={viewMode}
          groupedDosyalar={groupedDosyalar}
          expandedGroups={expandedGroups}
          searchQuery={searchQuery}
          toggleGroup={toggleGroup}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={setActiveDosyaId}
          selectedDosyaIds={selectedDosyaIds}
          toggleSelection={toggleSelection}
          getDosyaNoLabel={getDosyaNoLabel}
          formatMoney={formatMoney}
          formatDate={formatDate}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          handleOpenInNewWindow={handleOpenInNewWindow}
          handleUpdateStatus={handleUpdateStatus}
          handleEkapGonder={handleEkapGonder}
          handleKilidiAc={handleKilidiAc}
          handleOpenAI={handleOpenAI}
          handleDelete={handleDelete}
          handleHardDelete={handleHardDelete}
          handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
        />
      ) : (
        <DosyalarTableView
          groupedDosyalar={groupedDosyalar}
          expandedGroups={expandedGroups}
          searchQuery={searchQuery}
          toggleGroup={toggleGroup}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={setActiveDosyaId}
          selectedDosyaIds={selectedDosyaIds}
          toggleSelection={toggleSelection}
          getDosyaNoLabel={getDosyaNoLabel}
          formatMoney={formatMoney}
          formatDate={formatDate}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          handleOpenInNewWindow={handleOpenInNewWindow}
          handleUpdateStatus={handleUpdateStatus}
          handleEkapGonder={handleEkapGonder}
          handleKilidiAc={handleKilidiAc}
          handleOpenAI={handleOpenAI}
          handleDelete={handleDelete}
          handleHardDelete={handleHardDelete}
          handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
        />
      )}
    </div>
  )
}
