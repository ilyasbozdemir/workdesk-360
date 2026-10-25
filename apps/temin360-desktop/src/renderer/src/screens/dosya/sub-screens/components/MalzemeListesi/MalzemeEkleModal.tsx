import React from 'react'
import { Modal } from '../../../../../components/ui/Modal'
import { useSettingsStore } from '../../../../../store/settingsStore'
import { HizliTopluKalemGrid } from './HizliTopluKalemGrid'
import { MalzemeEkleTabs } from './components/malzeme-ekle/MalzemeEkleTabs'
import { MalzemeKutuphaneTab } from './components/malzeme-ekle/MalzemeKutuphaneTab'
import { MalzemeTekilEkleForm } from './components/malzeme-ekle/MalzemeTekilEkleForm'

export function MalzemeEkleModal({
  state,
  activeDosya
}: {
  state: any
  activeDosya?: any
}): React.JSX.Element {
  const { isAiConfigured } = useSettingsStore()
  const isYapim =
    activeDosya?.tur === 'yapim_isi' ||
    activeDosya?.tur === 'yapim' ||
    activeDosya?.ihale_tipi === 'Hakediş'
  const isHizmet = activeDosya?.tur === 'hizmet'

  const {
    libraryItems,
    units,
    kalemAdi,
    setKalemAdi,
    tasinirKodu,
    setTasinirKodu,
    okasKodu,
    setOkasKodu,
    tipi,
    setTipi,
    birim,
    setBirim,
    miktar,
    setMiktar,
    kdvOrani,
    setKdvOrani,
    aciklama,
    setAciklama,
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    aiLoading,
    isAddModalOpen,
    setIsAddModalOpen,
    activeTab,
    setActiveTab,
    selectedItemIds,
    setSelectedItemIds,
    itemMiktarlar,
    setItemMiktarlar,
    libSearchQuery,
    setLibSearchQuery,
    handleAiAçiklama,
    handleSelectSuggestion,
    handleAddItem,
    handleAddSelected,
    handleBatchInsertItems,
    filteredSuggestions
  } = state

  const handleClose = () => {
    setIsAddModalOpen(false)
    setSelectedItemIds(new Set())
    setItemMiktarlar({})
    setLibSearchQuery('')
  }

  const switchToNewTab = (defaultName?: string) => {
    const name = defaultName || libSearchQuery.trim() || searchQuery.trim()
    if (name) {
      setKalemAdi(name)
      setSearchQuery(name)
    }
    setActiveTab('new')
  }

  return (
    <Modal
      isOpen={isAddModalOpen}
      onClose={handleClose}
      className="max-w-4xl sm:max-w-5xl w-full"
      title={
        isYapim
          ? 'Dosyaya İmalat / Poz Kalemi Ekle'
          : isHizmet
            ? 'Dosyaya Hizmet Kalemi Ekle'
            : 'Dosyaya İhtiyaç Kalemi Ekle'
      }
      description={
        isYapim
          ? 'Poz kütüphanesinden seçin, toplu Excel tablosu ile hızla ekleyin veya özel yeni poz tanımlayın.'
          : isHizmet
            ? 'Hizmet kütüphanesinden seçin, toplu Excel tablosu ile hızla ekleyin veya yeni hizmet kalemi tanımlayın.'
            : 'Kütüphaneden seçin, ortak OKAS/KDV ile toplu Excel tablosundan ekleyin veya tekil kalem oluşturun.'
      }
    >
      <MalzemeEkleTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isYapim={isYapim}
        isHizmet={isHizmet}
        libraryCount={libraryItems.length}
        onSwitchToNewTab={switchToNewTab}
      />

      {/* SEKME 1: KÜTÜPHANE LİSTESİ */}
      {activeTab === 'library' && (
        <MalzemeKutuphaneTab
          isYapim={isYapim}
          isHizmet={isHizmet}
          libraryItems={libraryItems}
          selectedItemIds={selectedItemIds}
          setSelectedItemIds={setSelectedItemIds}
          itemMiktarlar={itemMiktarlar}
          setItemMiktarlar={setItemMiktarlar}
          libSearchQuery={libSearchQuery}
          setLibSearchQuery={setLibSearchQuery}
          onClose={handleClose}
          onAddSelected={handleAddSelected}
          onSwitchToNewTab={switchToNewTab}
        />
      )}

      {/* SEKME 2: HIZLI / TOPLU EXCEL GRID FORMU */}
      {activeTab === 'batch' && (
        <HizliTopluKalemGrid
          activeDosya={activeDosya}
          activeDosyaId={activeDosya?.id || state.activeDosyaId}
          units={units}
          onSaveBatch={handleBatchInsertItems}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}

      {/* SEKME 3: TEKİL YENİ KALEM FORMU */}
      {activeTab === 'new' && (
        <MalzemeTekilEkleForm
          isYapim={isYapim}
          isHizmet={isHizmet}
          isAiConfigured={isAiConfigured}
          aiLoading={aiLoading}
          kalemAdi={kalemAdi}
          setKalemAdi={setKalemAdi}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          filteredSuggestions={filteredSuggestions}
          handleSelectSuggestion={handleSelectSuggestion}
          tipi={tipi}
          setTipi={setTipi}
          birim={birim}
          setBirim={setBirim}
          units={units}
          miktar={miktar}
          setMiktar={setMiktar}
          kdvOrani={kdvOrani}
          setKdvOrani={setKdvOrani}
          tasinirKodu={tasinirKodu}
          setTasinirKodu={setTasinirKodu}
          okasKodu={okasKodu}
          setOkasKodu={setOkasKodu}
          aciklama={aciklama}
          setAciklama={setAciklama}
          handleAiAçiklama={handleAiAçiklama}
          handleAddItem={handleAddItem}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
}
