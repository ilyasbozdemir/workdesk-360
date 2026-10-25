import React from 'react'
import { AITextGeneratorModal } from '../../components/ui/AITextGeneratorModal'
import { persist2886ActiveDosya } from '../../components/layout/temin-selector/teminSelector.storage'

// Modular Subcomponents & Helpers
import { ActiveDosyaCard } from './components/ActiveDosyaCard'
import { DashboardHeroV3 } from './components/DashboardHeroV3'
import { TeminPillarsMatrix } from './components/TeminPillarsMatrix'
import { ProcurementMethodsSummary } from './components/ProcurementMethodsSummary'
import { DashboardKpiCardsV2 } from './components/DashboardKpiCardsV2'
import { CostDistributionSection } from './components/CostDistributionSection'
import { LivePipelineSection } from './components/LivePipelineSection'
import { InstitutionCardV2 } from './components/InstitutionCardV2'
import { AiAdvisorCard } from './components/AiAdvisorCard'
import { AnnouncementsCardV2 } from './components/AnnouncementsCardV2'
import { AiMissingModal } from './components/AiMissingModal'
import { KikLimitVeBirimAnalizSection } from './components/KikLimitVeBirimAnalizSection'
import { formatCurrency, getDtFileColor, getDtFileText } from './components/dashboardV2.helpers'
import { useDashboardV2Logic } from './components/useDashboardV2Logic'
import { APP_ROUTES } from '../../constants/routeConstants'

export default function DashboardScreenV2(): React.JSX.Element {
  const {
    navigate,
    institutionName,
    limitType,
    kurumsalKod,
    fonksiyonelKod,
    muhasebeBirimAdi,
    harcamaBirimAdi,
    adminName,
    adminTitle,
    adminUsername,
    setActiveDosyaId,
    procurementMode,
    isIhale,
    switchProcurementMode,
    stats,
    isLoading,
    announcements,
    isAiConfigured,
    showAIModal,
    setShowAIModal,
    showAiMissingModal,
    setShowAiMissingModal,
    selectedFileForAI,
    setSelectedFileForAI,
    activePillar,
    setActivePillar,
    searchTerm,
    setSearchTerm,
    greeting,
    currentDate,
    kurumTuruLabel,
    kikLimit,
    totalCat,
    malPct,
    hizmetPct,
    yapimPct,
    danismanlikPct,
    harcamaYetkilisi,
    smartAlerts,
    filteredDosyalar,
    activeDosya,
    teminPillars,
    currentPillar,
    resolveAsamaDetails
  } = useDashboardV2Logic()

  return (
    <div className="flex flex-col gap-6 w-full max-w-412.5 mx-auto pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500 text-slate-800 dark:text-slate-100">
      {/* 1. AKTİF ÇALIŞILAN DOĞRUDAN TEMİN / İHALE / 2886 DOSYASI ÖZEL ODAK KARTI */}
      {activeDosya && (
        <ActiveDosyaCard
          activeDosya={activeDosya}
          harcamaBirimAdi={harcamaBirimAdi}
          getAsamaDetails={resolveAsamaDetails}
          getDtFileColor={getDtFileColor}
          getDtFileText={getDtFileText}
          formatCurrency={formatCurrency}
          onOpenAi={(dosya) => {
            setSelectedFileForAI(dosya)
            if (isAiConfigured) {
              setShowAIModal(true)
            } else {
              setShowAiMissingModal(true)
            }
          }}
          onClose={() => {
            if ((activeDosya as any)?.ihaleKayitNo) {
              persist2886ActiveDosya(null)
            } else {
              setActiveDosyaId(null)
            }
          }}
        />
      )}

      {/* 2. TEMİN 360 HERO HEADER (V3 Dinamik Modül & Komuta Merkezi) */}
      <DashboardHeroV3
        procurementMode={procurementMode}
        onSwitchMode={switchProcurementMode}
        isIhale={isIhale || procurementMode === 'devlet_ihale_2886'}
        currentDate={currentDate}
        greeting={greeting}
        adminName={adminName}
        adminUsername={adminUsername}
        adminTitle={adminTitle}
        institutionName={institutionName}
        isAiConfigured={isAiConfigured}
        stats={stats}
        onOpenAi={() => {
          setSelectedFileForAI({
            temin_no:
              procurementMode === 'devlet_ihale_2886'
                ? '2886-ASISTAN'
                : isIhale
                  ? 'İHALE-ASISTAN'
                  : 'TEMIN-ASISTAN',
            konu:
              procurementMode === 'devlet_ihale_2886'
                ? '2886 Devlet İhale Kanunu (Satış, Kiralama, Takdir & Açık Artırma) Mevzuat Desteği'
                : isIhale
                  ? 'Kamu İhale Mevzuatı (KİK 19/21), Şartname ve Hakediş Karar Desteği'
                  : 'Doğrudan Temin (KİK 22/d), Piyasa Araştırması ve Harcama Karar Desteği',
            yaklasik_maliyet: stats.toplamYaklasikMaliyet
          })
          setShowAIModal(true)
        }}
        onShowAiMissing={() => setShowAiMissingModal(true)}
        smartAlerts={smartAlerts}
      />

      {/* 3. TEMİN 360 5 TEMEL SÜTUN (PILLARS) İNTERAKTİF NAVİGASYON MATRİSİ */}
      <TeminPillarsMatrix
        procurementMode={procurementMode}
        activePillar={activePillar}
        setActivePillar={setActivePillar}
        teminPillars={teminPillars}
        currentPillar={currentPillar}
      />

      {/* 4. USUL / TÜR BAZLI ÖZET BANT */}
      <ProcurementMethodsSummary
        procurementMode={procurementMode as any}
        switchProcurementMode={switchProcurementMode}
        stats={stats}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
      />

      {/* 5. ANA KPI & METRİK KARTLARI */}
      <DashboardKpiCardsV2
        stats={stats}
        isLoading={isLoading}
        kikLimit={kikLimit}
        formatCurrency={formatCurrency}
      />

      {/* 5.1 K.İ.K 22/d YILLIK LİMİT & BİRİM HARCAMA ANALİZİ */}
      <KikLimitVeBirimAnalizSection
        stats={stats}
        isLoading={isLoading}
        formatCurrency={formatCurrency}
      />

      {/* 6. İKİ SÜTUNLU ANALİTİK & OPERASYON PANELİ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL TARAF: SATIN ALMA TÜR DAĞILIMI & AKTİF DOSYALAR (8 Kolon) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <CostDistributionSection
            stats={stats}
            totalCat={totalCat}
            malPct={malPct}
            hizmetPct={hizmetPct}
            yapimPct={yapimPct}
            danismanlikPct={danismanlikPct}
            formatCurrency={formatCurrency}
          />

          <LivePipelineSection
            filteredDosyalar={filteredDosyalar}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            harcamaBirimAdi={harcamaBirimAdi}
            getAsamaDetails={resolveAsamaDetails}
            getDtFileColor={getDtFileColor}
            getDtFileText={getDtFileText}
            formatCurrency={formatCurrency}
            isAiConfigured={isAiConfigured}
            onOpenDosya={(id, dosya) => {
              if (dosya?.ihaleKayitNo || dosya?.islemTuru) {
                persist2886ActiveDosya(dosya)
                navigate({ to: APP_ROUTES.DEVLET_IHALE_2886 })
              } else {
                setActiveDosyaId(id as any)
                navigate({ to: APP_ROUTES.TAKIP })
              }
            }}
            onAiConsult={(dosya) => {
              if (!isAiConfigured) {
                setShowAiMissingModal(true)
                return
              }
              setSelectedFileForAI(dosya)
              setShowAIModal(true)
            }}
          />
        </div>

        {/* SAĞ TARAF: KURUM KİMLİK KARTI & DUYURULAR & SİSTEM KONTROLÜ (4 Kolon) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <InstitutionCardV2
            institutionName={institutionName}
            kurumTuruLabel={kurumTuruLabel}
            limitType={limitType}
            harcamaBirimAdi={harcamaBirimAdi}
            kurumsalKod={kurumsalKod}
            fonksiyonelKod={fonksiyonelKod}
            muhasebeBirimAdi={muhasebeBirimAdi}
            harcamaYetkilisi={harcamaYetkilisi}
          />

          <AiAdvisorCard
            isAiConfigured={isAiConfigured}
            kikLimit={kikLimit}
            toplamYaklasikMaliyet={stats.toplamYaklasikMaliyet}
            onOpenConsultation={(config) => {
              setSelectedFileForAI(config)
              setShowAIModal(true)
            }}
            onShowAiMissing={() => setShowAiMissingModal(true)}
          />

          <AnnouncementsCardV2 announcements={announcements} />
        </div>
      </div>

      {/* 7. TEMİN 360 AI ASİSTAN MODALI */}
      {showAIModal && selectedFileForAI && (
        <AITextGeneratorModal
          isOpen={true}
          isAdvisorMode={true}
          fieldName="TEMİN 360 AI Karar Desteği"
          title={`TEMİN 360 AI Asistanı - ${
            selectedFileForAI.temin_no || selectedFileForAI.ihaleKayitNo || 'Mevzuat Rehberi'
          }`}
          initialPrompt={`Aşağıdaki konu ve bütçe detaylarına sahip kamu satın alma süreci için çalışıyorum:\n- Dosya/Konu: ${
            selectedFileForAI.konu || selectedFileForAI.ihaleAdi
          }\n- Tutar/Bedel: ${formatCurrency(
            selectedFileForAI.yaklasik_maliyet || selectedFileForAI.muhammenBedel || 0
          )}\n\nLütfen mevzuata uygun dikkat edilmesi gereken hususlar ve adımlar hakkında uzman tavsiyesi sun.`}
          placeholderMappings={{
            '[DOSYA_NO]':
              selectedFileForAI.temin_no || selectedFileForAI.ihaleKayitNo || 'Belirtilmemiş',
            '[DOSYA_KONU]': selectedFileForAI.konu || selectedFileForAI.ihaleAdi || 'Belirtilmemiş',
            '[DOSYA_MALIYET]': formatCurrency(
              selectedFileForAI.yaklasik_maliyet || selectedFileForAI.muhammenBedel || 0
            )
          }}
          onClose={() => setShowAIModal(false)}
          onApply={(text) => {
            console.log('TEMİN 360 AI Yanıtı:', text)
            setShowAIModal(false)
          }}
          systemInstruction="Sen yetkin bir TEMİN 360 Kamu Satın Alma, Doğrudan Temin, 2886 Devlet İhale ve Hakediş mevzuat uzmanı ve karar destek asistanısın. Kullanıcıya net, Sayıştay denetim standartlarına uygun, pratik ve yasal tavsiyeler ver."
        />
      )}

      {/* 8. AI YAPILANDIRILMAMIŞ / API KEY EKSİK BİLGİLENDİRME MODALI */}
      <AiMissingModal
        isOpen={showAiMissingModal}
        onClose={() => setShowAiMissingModal(false)}
        onGoToSettings={() => {
          setShowAiMissingModal(false)
          navigate({ to: APP_ROUTES.AYARLAR, search: { tab: 'ai' } as any })
        }}
      />
    </div>
  )
}
