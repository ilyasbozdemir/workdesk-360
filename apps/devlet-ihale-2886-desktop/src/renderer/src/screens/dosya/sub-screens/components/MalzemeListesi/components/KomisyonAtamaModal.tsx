import React from 'react'
import { Modal } from '../../../../../../components/ui/Modal'
import {
  KomisyonAtamaFooter,
  KomisyonAtamaTable,
  KomisyonAtamaTabs,
  KomisyonSyncToggle,
  KurumInfoBar,
  useKomisyonAtama
} from './komisyon-atama'
import type { KomisyonAtamaModalProps, KomisyonType } from './komisyon-atama/types'

export type { KomisyonAtamaModalProps, KomisyonType }

export const KomisyonAtamaModal: React.FC<KomisyonAtamaModalProps> = ({
  isOpen,
  onClose,
  initialType = 'yaklasik_maliyet',
  activeDosyaId,
  onOpenDocument
}) => {
  const {
    activeTab,
    setActiveTab,
    personeller,
    gorevler,
    kurumInfo,
    currentRows,
    loading,
    saving,
    saveSuccess,
    syncToGlobalCommission,
    setSyncToGlobalCommission,
    sourceDossierInfo,
    handleCopyFromLastDossier,
    handlePersonelChange,
    handleGorevChange,
    handleToggleBelgedeGoster,
    handleRowFieldChange,
    handleAddRow,
    handleRemoveRow,
    handleSyncFromKomisyonYonetimi,
    handleSeedDefaultCommissions,
    handleSave,
    handleOpenDoc
  } = useKomisyonAtama({
    isOpen,
    onClose,
    initialType,
    activeDosyaId,
    onOpenDocument
  })

  const modalFooter = (
    <KomisyonAtamaFooter
      activeTab={activeTab}
      loading={loading}
      saving={saving}
      saveSuccess={saveSuccess}
      onOpenDoc={handleOpenDoc}
      onSyncFromKomisyonYonetimi={handleSyncFromKomisyonYonetimi}
      onSeedDefaultCommissions={handleSeedDefaultCommissions}
      onCopyFromLastDossier={handleCopyFromLastDossier}
      onSave={() => handleSave(activeTab)}
    />
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Komisyon ve Görevli Atama"
      description="Bu dosyaya ve belgelere ait komisyon üyelerini, görevlerini ve onay makamlarını belirleyin."
      className="max-w-5xl max-h-[90vh]"
      footer={modalFooter}
    >
      <div className="space-y-3.5">
        <KurumInfoBar kurumInfo={kurumInfo} />

        {sourceDossierInfo && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300 shadow-xs animate-in fade-in">
            <span className="font-semibold shrink-0">💡 Otomatik Kadro Aktarımı:</span>
            <span>
              Bu dosyada henüz komisyon tanımlanmadığı için bir önceki dosyanız olan{' '}
              <strong>{sourceDossierInfo.dosyaNo}</strong> komisyon kadrosu varsayılan olarak
              yüklendi. Düzenleme yapabilir veya doğrudan &quot;Kaydet&quot; butonuna
              basabilirsiniz.
            </span>
          </div>
        )}

        <KomisyonAtamaTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        <KomisyonSyncToggle checked={syncToGlobalCommission} onChange={setSyncToGlobalCommission} />

        <KomisyonAtamaTable
          rows={currentRows}
          personeller={personeller}
          gorevler={gorevler}
          onPersonelChange={handlePersonelChange}
          onGorevChange={handleGorevChange}
          onToggleBelgedeGoster={handleToggleBelgedeGoster}
          onRowFieldChange={handleRowFieldChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
        />
      </div>
    </Modal>
  )
}
