import React from 'react'
import { Compass } from 'lucide-react'
import { SubScreen } from './SubScreen'
import { useIstekliFirmalarLogic } from './components/istekli-firmalar/useIstekliFirmalarLogic'
import { IstekliFirmalarInvitePanel } from './components/istekli-firmalar/IstekliFirmalarInvitePanel'
import { IstekliFirmalarListPanel } from './components/istekli-firmalar/IstekliFirmalarListPanel'
import { IstekliFirmalarYasaklilikModal } from './components/istekli-firmalar/IstekliFirmalarYasaklilikModal'

export function IstekliFirmalar(): React.JSX.Element {
  const {
    associatedFirms,
    loading,
    searchQuery,
    setSearchQuery,
    activeFirmaForQuery,
    setActiveFirmaForQuery,
    unassociatedFirms,
    handleAddFirm,
    handleRemoveFirm,
    handleCloseQueryModal,
    handleDeleteBelge,
    handleUploadBelge,
    handleUpdateYasaklilikDurumu
  } = useIstekliFirmalarLogic()

  return (
    <SubScreen
      title="İstekli Tedarikçi Firmalar"
      icon={Compass}
      description="Piyasa araştırması kapsamında davet mektubu gönderilecek veya teklif verecek firmaları ekleyin."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* INVITE NEW FIRM */}
        <IstekliFirmalarInvitePanel
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          unassociatedFirms={unassociatedFirms}
          onAddFirm={handleAddFirm}
        />

        {/* ASSOCIATED FIRMS */}
        <IstekliFirmalarListPanel
          loading={loading}
          associatedFirms={associatedFirms}
          onSelectFirmaForQuery={setActiveFirmaForQuery}
          onRemoveFirm={handleRemoveFirm}
        />
      </div>

      {/* YASAKLI SORGULAMA DETAY MODAL */}
      {activeFirmaForQuery && (
        <IstekliFirmalarYasaklilikModal
          activeFirma={activeFirmaForQuery}
          onClose={handleCloseQueryModal}
          onDeleteBelge={handleDeleteBelge}
          onUploadBelge={handleUploadBelge}
          onUpdateStatus={handleUpdateYasaklilikDurumu}
        />
      )}
    </SubScreen>
  )
}
