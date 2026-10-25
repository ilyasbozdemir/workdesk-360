import React from 'react'
import { AITextGeneratorModal } from '../../components/ui/AITextGeneratorModal'
import { logActivity } from '../../utils/logger'
import { formatDate } from '@renderer/utils/formatters'
import { DosyalarPageHeader } from './components/DosyalarPageHeader'
import { DosyalarStats } from './components/DosyalarStats'
import { DosyalarFilterBar } from './components/DosyalarFilterBar'
import { DosyalarList } from './components/DosyalarList'
import { EkapIknModal } from './components/EkapIknModal'
import { MaliyetAyarlariPopover } from './components/MaliyetAyarlariPopover'
import { useDosyalarScreenLogic } from './components/useDosyalarScreenLogic'

export default function DosyalarScreen(): React.ReactNode {
  const {
    dosyalar,
    isLoadingDosyalar,
    projeler,
    activeDosyaId,
    setActiveDosyaId,
    activeMeta,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filterTur,
    setFilterTur,
    filterYil,
    setFilterYil,
    filterStatus,
    setFilterStatus,
    filterProjeId,
    setFilterProjeId,
    filterTag,
    setFilterTag,
    expandedGroups,
    toggleGroup,
    selectedDosyaForMaliyet,
    setSelectedDosyaForMaliyet,
    showAIModal,
    setShowAIModal,
    selectedFileForAI,
    setSelectedFileForAI,
    ekapModalOpen,
    setEkapModalOpen,
    ekapInputVal,
    setEkapInputVal,
    handleSaveMaliyetAyarlari,
    handleOpenMaliyetAyarlari,
    handleOpenAI,
    handleOpenInNewWindow,
    handleDelete,
    handleHardDelete,
    handleBulkDelete,
    handleBulkHardDelete,
    handleUpdateStatus,
    handleEkapGonder,
    handleEkapGonderSubmit,
    handleKilidiAc,
    uniqueYillar,
    uniqueTags,
    filteredDosyalar,
    groupedDosyalar,
    toplamMaliyet,
    aktifCount,
    taslakCount,
    formatMoney,
    getDosyaNoLabel
  } = useDosyalarScreenLogic()

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 md:p-6 overflow-hidden gap-4 select-none">
      <DosyalarPageHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAI={() => {
          setSelectedFileForAI({
            konu: 'Genel Mevzuat Danışmanlığı',
            yaklasik_maliyet: 0,
            temin_no: 'Belirtilmemiş'
          })
          setShowAIModal(true)
        }}
      />

      <DosyalarStats
        totalCount={dosyalar.length}
        aktifCount={aktifCount}
        taslakCount={taslakCount}
        toplamMaliyet={toplamMaliyet}
        formatMoney={formatMoney}
      />

      <DosyalarFilterBar
        filterYil={filterYil}
        setFilterYil={setFilterYil}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        uniqueYillar={uniqueYillar}
        filterTur={filterTur}
        setFilterTur={setFilterTur}
        filterProjeId={filterProjeId}
        setFilterProjeId={setFilterProjeId}
        uniqueProjeler={projeler}
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        uniqueTags={uniqueTags}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredCount={filteredDosyalar.length}
        totalCount={dosyalar.length}
      />

      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        <div className="w-full flex flex-col h-full overflow-hidden">
          <DosyalarList
            isLoadingDosyalar={isLoadingDosyalar}
            filteredDosyalar={filteredDosyalar}
            dosyalar={dosyalar}
            viewMode={viewMode}
            filterYil={filterYil}
            filterTur={filterTur}
            groupedDosyalar={groupedDosyalar}
            expandedGroups={expandedGroups}
            searchQuery={searchQuery}
            toggleGroup={toggleGroup}
            activeDosyaId={activeDosyaId}
            setActiveDosyaId={setActiveDosyaId}
            getDosyaNoLabel={getDosyaNoLabel}
            formatMoney={formatMoney}
            formatDate={formatDate}
            handleDelete={handleDelete}
            handleHardDelete={handleHardDelete}
            handleBulkDelete={handleBulkDelete}
            handleBulkHardDelete={handleBulkHardDelete}
            handleUpdateStatus={handleUpdateStatus}
            handleEkapGonder={handleEkapGonder}
            handleKilidiAc={handleKilidiAc}
            logActivity={logActivity}
            handleOpenAI={handleOpenAI}
            handleOpenInNewWindow={handleOpenInNewWindow}
            handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
          />
        </div>
      </div>

      {showAIModal && selectedFileForAI && (
        <AITextGeneratorModal
          isOpen={true}
          isAdvisorMode={true}
          fieldName="Mevzuat Analizi"
          title="Yapay Zeka Asistanı"
          initialPrompt=""
          systemInstruction={
            selectedFileForAI.konu === 'Genel Mevzuat Danışmanlığı'
              ? 'Sen profesyonel bir kamu ihale ve doğrudan temin (4734 Sayılı Kanun) asistanısın. Kullanıcıya genel mevzuat veya idari işleyiş hakkında rehberlik edeceksin.\n\nÖNEMLİ GİZLİLİK KURALI: Gerçek kurum veya kişi isimlerini maskele.'
              : `Sen profesyonel bir kamu ihale ve doğrudan temin (4734 Sayılı Kanun) asistanısın. Kullanıcı sana sistemdeki bir dosyası hakkında danışacak.\n\nŞu anki Aktif Dosya Bilgileri:\n- Dosya No: [DOSYA_NO]\n- Konu: [DOSYA_KONU]\n- Maliyet: [DOSYA_MALIYET]\n- İhale Şekli (Madde): [DOSYA_IHALE_SEKLI]\n\nÖNEMLİ GİZLİLİK KURALI: Gerçek kurum, şahıs isimleri veya adresleri [Kurum Adı], [İlgili Kişi] şeklinde maskele. Eğer dosyayla ilgili analiz veya rehberlik yaparken dosya numarası, konu, maliyet veya ihale şeklinden bahsedeceksen kesinlikle [DOSYA_NO], [DOSYA_KONU], [DOSYA_MALIYET], [DOSYA_IHALE_SEKLI] şeklinde olan bu yer tutucuları aynen koru, gerçek veriyi asla kullanma.`
          }
          placeholderMappings={{
            '[DOSYA_NO]': selectedFileForAI.temin_no || 'Belirtilmemiş',
            '[DOSYA_KONU]': selectedFileForAI.konu || 'Belirtilmemiş',
            '[DOSYA_MALIYET]':
              (selectedFileForAI.yaklasik_maliyet || 0).toLocaleString('tr-TR') + ' TL',
            '[DOSYA_IHALE_SEKLI]': selectedFileForAI.ihale_sekli || 'Belirtilmemiş',
            '[KURUM_ADI]': activeMeta?.institution || 'Belirtilmemiş',
            '[BIRIM_ADI]': selectedFileForAI.birim_adi || 'Belirtilmemiş'
          }}
          onClose={() => {
            setShowAIModal(false)
            setSelectedFileForAI(null)
          }}
          onApply={(text) => {
            console.log('AI tavsiyesi:', text)
            setShowAIModal(false)
            setSelectedFileForAI(null)
          }}
        />
      )}

      <EkapIknModal
        isOpen={ekapModalOpen}
        inputVal={ekapInputVal}
        setInputVal={setEkapInputVal}
        onClose={() => setEkapModalOpen(false)}
        onSubmit={handleEkapGonderSubmit}
      />

      <MaliyetAyarlariPopover
        selectedDosya={selectedDosyaForMaliyet}
        setSelectedDosya={setSelectedDosyaForMaliyet}
        onSave={handleSaveMaliyetAyarlari}
      />
    </div>
  )
}
