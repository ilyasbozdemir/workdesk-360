import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useProjelerScreen } from './useProjelerScreen'
import { ProjeHeaderAndKPIs } from './components/ProjeHeaderAndKPIs'
import { ProjeCardGrid } from './components/ProjeCardGrid'
import { ProjeDetailModal } from './components/ProjeDetailModal'
import { ProjeFormModal } from './components/ProjeFormModal'
import { ProjeDeleteModal } from './components/ProjeDeleteModal'

export default function ProjelerScreen({
  isSubComponent = false
}: {
  isSubComponent?: boolean
} = {}): React.JSX.Element {
  const navigate = useNavigate()
  const {
    isLoadingProjeler,
    projeDosyalari,
    isLoadingDosyalar,
    searchTerm,
    setSearchTerm,
    durumFilter,
    setDurumFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingProje,
    detailProje,
    setDetailProje,
    detailTab,
    setDetailTab,
    deletingProje,
    setDeletingProje,
    formCode,
    setFormCode,
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    formBudget,
    setFormBudget,
    formStartDate,
    setFormStartDate,
    formEndDate,
    setFormEndDate,
    formLocation,
    setFormLocation,
    formDurum,
    setFormDurum,
    formColor,
    setFormColor,
    summary,
    filteredProjeler,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleSubmit,
    handleDeleteConfirm,
    handleNavigateToDosya
  } = useProjelerScreen()

  return (
    <div
      className={`space-y-6 animate-fadeIn pb-16 ${
        isSubComponent ? 'w-full' : 'p-6 max-w-[1600px] mx-auto'
      }`}
    >
      <ProjeHeaderAndKPIs
        totalProjects={summary.totalProjects}
        summary={summary}
        handleOpenCreate={handleOpenCreate}
      />

      <ProjeCardGrid
        isLoadingProjeler={isLoadingProjeler}
        filteredProjeler={filteredProjeler}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        durumFilter={durumFilter}
        setDurumFilter={setDurumFilter}
        handleOpenCreate={handleOpenCreate}
        handleOpenEdit={handleOpenEdit}
        handleOpenDetail={handleOpenDetail}
        setDeletingProje={setDeletingProje}
      />

      <ProjeDetailModal
        detailProje={detailProje}
        setDetailProje={setDetailProje}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        projeDosyalari={projeDosyalari}
        isLoadingDosyalar={isLoadingDosyalar}
        handleNavigateToDosya={handleNavigateToDosya}
        formCode={formCode}
        setFormCode={setFormCode}
        formName={formName}
        setFormName={setFormName}
        formDesc={formDesc}
        setFormDesc={setFormDesc}
        formBudget={formBudget}
        setFormBudget={setFormBudget}
        formStartDate={formStartDate}
        setFormStartDate={setFormStartDate}
        formEndDate={formEndDate}
        setFormEndDate={setFormEndDate}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formDurum={formDurum}
        setFormDurum={setFormDurum}
        formColor={formColor}
        setFormColor={setFormColor}
        handleSubmit={handleSubmit}
        navigate={navigate}
      />

      <ProjeFormModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        editingProje={editingProje}
        formCode={formCode}
        setFormCode={setFormCode}
        formName={formName}
        setFormName={setFormName}
        formDesc={formDesc}
        setFormDesc={setFormDesc}
        formBudget={formBudget}
        setFormBudget={setFormBudget}
        formStartDate={formStartDate}
        setFormStartDate={setFormStartDate}
        formEndDate={formEndDate}
        setFormEndDate={setFormEndDate}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formDurum={formDurum}
        setFormDurum={setFormDurum}
        formColor={formColor}
        setFormColor={setFormColor}
        handleSubmit={handleSubmit}
      />

      <ProjeDeleteModal
        deletingProje={deletingProje}
        setDeletingProje={setDeletingProje}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
