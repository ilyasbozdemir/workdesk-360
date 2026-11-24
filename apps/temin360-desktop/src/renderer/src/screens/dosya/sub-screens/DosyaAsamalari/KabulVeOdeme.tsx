import React from 'react'
import { CreditCard, FileCheck, PackageCheck, Users } from 'lucide-react'
import { SubScreen } from '../../SubScreens.screen'
import { PrintDropdownButton } from '../../components/PrintDropdownButton'
import { TifOlusturModal } from '../../../../components/ui/TifOlusturModal'
import { Button } from '../../../../components/ui/Button'
import { KomisyonAtamaModal } from '../components/MalzemeListesi/components/KomisyonAtamaModal'
import {
  KabulAsamalariTimeline,
  KabulFaturaHakedisCard,
  KabulGuardWarning,
  KabulTutanaklariListCard,
  KabulTutanakModal,
  KabulYukleniciCard,
  useKabulVeOdemeData
} from './components/KabulVeOdeme'

export function KabulVeOdeme(): React.JSX.Element {
  const {
    activeDosyaId,
    dosyaContext,
    dosyaKalemler,
    disableDocumentGuidance,
    activeStarredDocs,
    sablons,
    stageSablons,
    ciktiLoading,
    previewModalOpen,
    setPreviewModalOpen,
    previewData,
    handleOpenPreviewForSablon,
    quickPrint,
    quickExport,
    quickOpenExternal,
    isSablonDisabled,
    kazananFirmaId,
    kazananFirmaUnvan,
    komisyonBaskani,
    komisyonUyeleri,
    teslimYeri,
    firmaStats,
    faturaNo,
    setFaturaNo,
    faturaTarihi,
    setFaturaTarihi,
    dosyaFaturalari,
    isTifModalOpen,
    setIsTifModalOpen,
    isKomisyonModalOpen,
    setIsKomisyonModalOpen,
    tutanaklar,
    isTutanakModalOpen,
    setIsTutanakModalOpen,
    editingTutanak,
    setEditingTutanak,
    isMal,
    alimTuru,
    handleOpenAddTutanak,
    handleOpenEditTutanak,
    handleSaveTutanak,
    handleDeleteTutanak,
    handleBulkDeleteTutanaklar,
    handleToggleApproveTutanak,
    handleBulkApproveTutanaklar,
    handleQuickPreview,
    handleReloadKomisyon,
    formatCurrency,
    formatDate
  } = useKabulVeOdemeData()

  const isYapim = alimTuru === 'yapim'
  const isHizmet = alimTuru === 'hizmet'

  return (
    <SubScreen
      title="Muayene & Kabul & Ödeme İşlemleri"
      icon={CreditCard}
      description="Muayene kabul tutanağı, hakediş raporu, taşınır işlem fişi (TİF) ve ödeme emri belgesi gibi evrakları düzenleyebilir, kabul ve ödeme süreçlerinizi tamamlayabilirsiniz."
      previewDocumentId={previewModalOpen && previewData?.dosyaAdi ? previewData.dosyaAdi : null}
      onClosePreview={() => setPreviewModalOpen(false)}
    >
      {kazananFirmaId === undefined && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Kontrol ediliyor...</span>
        </div>
      )}

      {kazananFirmaId === null && <KabulGuardWarning />}

      {kazananFirmaId && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Header Row - Üst Butonlar (Referans Tasarım: Kabul Komisyonu, İhale Komisyon Kararı, Çıktı Merkezi) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Kabul Komisyonu Butonu */}
              <Button
                onClick={() => setIsKomisyonModalOpen(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs font-bold py-2.5 px-4 rounded-xl shrink-0 cursor-pointer"
                title="Muayene ve Kabul Komisyonunu Düzenle / Üyeleri Gör"
              >
                <Users className="w-4 h-4" />
                Kabul Komisyonu
              </Button>

              {/* İhale Komisyon Kararı Butonu */}
              <Button
                onClick={() => handleQuickPreview('ihale-komisyon-karari')}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-bold py-2.5 px-4 rounded-xl shrink-0 cursor-pointer"
                title="İhale Komisyon Kararını Önizle ve Yazdır"
              >
                <FileCheck className="w-4 h-4" />
                İhale Komisyon Kararı
              </Button>

              {isMal && (
                <Button
                  onClick={() => setIsTifModalOpen(true)}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-bold py-2.5 px-4 rounded-xl shrink-0 cursor-pointer"
                  title="Taşınır İşlem Fişi (TİF) Oluştur ve Ambara Aktar"
                >
                  <PackageCheck className="w-4 h-4" />
                  TİF Oluştur &amp; Ambara Aktar
                </Button>
              )}
            </div>

            {stageSablons.length > 0 && (
              <div className="shrink-0 self-start md:self-center">
                <PrintDropdownButton
                  kategori="4-kabul-ve-odeme-islemleri"
                  sablons={sablons}
                  overrideSablons={stageSablons}
                  activeStarredDocs={activeStarredDocs}
                  ciktiLoading={ciktiLoading}
                  handleOpenPreviewForSablon={handleOpenPreviewForSablon}
                  quickPrint={quickPrint}
                  quickExport={quickExport}
                  quickOpenExternal={quickOpenExternal}
                  isSablonDisabled={isSablonDisabled}
                  buttonHeightClass="h-10"
                  variant={disableDocumentGuidance ? 'dark' : 'default'}
                  label={
                    disableDocumentGuidance ? 'Belge İşlemleri' : 'Belgeleri İncele ve Çıktı Al'
                  }
                />
              </div>
            )}
          </div>

          {/* 1. Bölüm: Bu İhaleye Ait Kazanan Firmalar */}
          <KabulYukleniciCard
            kazananFirmaUnvan={kazananFirmaUnvan}
            firmaStats={firmaStats}
            alimTuru={alimTuru}
            isMal={isMal}
            isHizmet={isHizmet}
            isYapim={isYapim}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onOpenAddTutanak={handleOpenAddTutanak}
            onOpenPreview={handleQuickPreview}
            onOpenKomisyonModal={() => setIsKomisyonModalOpen(true)}
          />

          {/* 2. Bölüm: Bu İhaleye Ait Kabul Tutanakları */}
          <KabulTutanaklariListCard
            kazananFirmaUnvan={kazananFirmaUnvan}
            firmaStats={firmaStats}
            faturaNo={faturaNo}
            faturaTarihi={faturaTarihi}
            komisyonBaskani={komisyonBaskani}
            komisyonUyeleri={komisyonUyeleri}
            teslimYeri={teslimYeri}
            dosyaNo={dosyaContext?.dosya_no}
            alimTuru={alimTuru}
            tutanaklar={tutanaklar}
            onOpenAddTutanak={handleOpenAddTutanak}
            onEditTutanak={handleOpenEditTutanak}
            onDeleteTutanak={handleDeleteTutanak}
            onBulkDeleteTutanaklar={handleBulkDeleteTutanaklar}
            onToggleApproveTutanak={handleToggleApproveTutanak}
            onBulkApproveTutanaklar={handleBulkApproveTutanaklar}
            onOpenPreview={handleQuickPreview}
            onOpenTifModal={() => setIsTifModalOpen(true)}
            onOpenKomisyonModal={() => setIsKomisyonModalOpen(true)}
            onSaveTutanak={handleSaveTutanak}
          />
        </div>
      )}

      {/* TİF & Ambar Aktarım Modalı */}
      <TifOlusturModal
        isOpen={isTifModalOpen}
        onClose={() => setIsTifModalOpen(false)}
        teminDosyaId={activeDosyaId || 0}
        dosyaNo={dosyaContext?.dosya_no}
        dosyaAdi={dosyaContext?.dosya_adi}
      />

      {/* Muayene ve Kabul Komisyonu Atama Modalı */}
      <KomisyonAtamaModal
        isOpen={isKomisyonModalOpen}
        onClose={async () => {
          setIsKomisyonModalOpen(false)
          await handleReloadKomisyon()
        }}
        initialType="muayene_kabul"
        activeDosyaId={activeDosyaId}
        onOpenDocument={(doc) => handleQuickPreview(doc)}
      />

      {/* Özel Muayene ve Kabul Tutanağı Ekle/Düzenle Modalı */}
      <KabulTutanakModal
        isOpen={isTutanakModalOpen}
        onClose={() => {
          setIsTutanakModalOpen(false)
          setEditingTutanak(null)
        }}
        onSave={handleSaveTutanak}
        initialTutanak={editingTutanak}
        existingTutanaklar={tutanaklar}
        existingFaturalar={dosyaFaturalari}
        defaultTutar={firmaStats.teklifToplami || undefined}
        defaultFaturaNo={faturaNo}
        defaultFaturaTarihi={faturaTarihi}
        defaultTeslimYeri={teslimYeri}
        defaultTeslimAlan={komisyonBaskani}
        alimTuru={alimTuru}
        dosyaKalemler={
          dosyaKalemler && dosyaKalemler.length > 0 ? dosyaKalemler : dosyaContext?.kalemler || []
        }
      />
    </SubScreen>
  )
}
