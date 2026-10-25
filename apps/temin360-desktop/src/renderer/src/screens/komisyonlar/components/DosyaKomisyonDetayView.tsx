import React, { useState } from 'react'
import { ArrowLeft, Clock, History, RefreshCw, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  KomisyonAtamaFooter,
  KomisyonAtamaTable,
  KomisyonAtamaTabs,
  KomisyonSyncToggle,
  KurumInfoBar,
  useKomisyonAtama
} from '../../dosya/sub-screens/components/MalzemeListesi/components/komisyon-atama'

interface DosyaKomisyonDetayViewProps {
  dosyaId: number
  dosyaNo: string
  isTanimi: string
  initialTab?: 'kadro' | 'revizyon'
  onBack: () => void
  onRefreshList?: () => void
}

export const DosyaKomisyonDetayView: React.FC<DosyaKomisyonDetayViewProps> = ({
  dosyaId,
  dosyaNo,
  isTanimi,
  initialTab = 'kadro',
  onBack,
  onRefreshList
}) => {
  const [activeScreenTab, setActiveScreenTab] = useState<'kadro' | 'revizyon'>(initialTab)

  // useKomisyonAtama hook'u doğrudan tam ekran içinde çalışıyor (Modal/Dialog yok)
  const {
    activeTab: komisyonType,
    setActiveTab: setKomisyonType,
    personeller,
    gorevler,
    kurumInfo,
    currentRows,
    loading: atamaLoading,
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
    isOpen: true,
    onClose: onBack,
    initialType: 'yaklasik_maliyet',
    activeDosyaId: dosyaId
  })

  // Atama Geçmiş / Snapshot Kayıtları
  const {
    data: historyLogs = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['dosya-komisyon-history', dosyaId],
    queryFn: async () => {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT * FROM DATA_TeminKomisyonHistory WHERE temin_dosya_id = ? ORDER BY id DESC`,
        [dosyaId]
      )
      return res.success ? res.data : []
    }
  })

  const onSaveWithRefresh = async (type: any): Promise<void> => {
    await handleSave(type)
    refetchHistory()
    if (onRefreshList) onRefreshList()
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-200">
      {/* Üst Navigasyon & Dosya Başlık Barı */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-all font-bold text-xs cursor-pointer shadow-2xs"
            title="Dosyalar Listesine Geri Dön"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Tüm Dosyalar</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                {dosyaNo}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight">
                {isTanimi}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bu temin dosyasına ait komisyon görevlilerini düzenleyebilir ve geçmiş atama
              revizyonlarını inceleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Sekme Değiştirici Butonları */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-2xl shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveScreenTab('kadro')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScreenTab === 'kadro'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Komisyon Kadrosu &amp; Ayarları</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreenTab('revizyon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScreenTab === 'revizyon'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Revizyon Çizelgesi</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold">
              {historyLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* SEKME 1: KOMİSYON KADROSU VE DÜZENLEME EKRANI */}
      {activeScreenTab === 'kadro' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          <KurumInfoBar kurumInfo={kurumInfo} />

          {sourceDossierInfo && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300 shadow-2xs">
              <span className="font-bold shrink-0">💡 Otomatik Kadro Aktarımı:</span>
              <span>
                Bu dosyada henüz komisyon tanımlanmadığı için bir önceki dosyanız olan{' '}
                <strong>{sourceDossierInfo.dosyaNo}</strong> komisyon kadrosu varsayılan olarak
                yüklendi. Düzenleme yapabilir veya doğrudan &quot;Kaydet&quot; butonuna
                basabilirsiniz.
              </span>
            </div>
          )}

          {/* Piyasa vs Muayene Sekmeleri */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <KomisyonAtamaTabs activeTab={komisyonType} onSelectTab={setKomisyonType} />
              <KomisyonSyncToggle
                checked={syncToGlobalCommission}
                onChange={setSyncToGlobalCommission}
              />
            </div>

            {/* Üye Listesi Tablosu */}
            <div className="space-y-2">
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

            {/* Alt İşlem Butonları (Kaydet, Şablon Önizle vb.) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <KomisyonAtamaFooter
                activeTab={komisyonType}
                loading={atamaLoading}
                saving={saving}
                saveSuccess={saveSuccess}
                onOpenDoc={handleOpenDoc}
                onSyncFromKomisyonYonetimi={handleSyncFromKomisyonYonetimi}
                onSeedDefaultCommissions={handleSeedDefaultCommissions}
                onCopyFromLastDossier={handleCopyFromLastDossier}
                onSave={() => onSaveWithRefresh(komisyonType)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEKME 2: REVİZYON VE ZAMAN ÇİZELGESİ EKRANI */}
      {activeScreenTab === 'revizyon' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Komisyon Revizyon &amp; Snapshot Tarihçesi
                </h3>
                <p className="text-xs text-slate-500">
                  Bu dosyada geçmişte yapılan tüm üye değişiklikleri anlık versiyon snapshot&apos;ı
                  olarak kaydedilmiştir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetchHistory()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Tarihçe yükleniyor...</div>
          ) : historyLogs.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold">Bu dosyaya ait henüz bir revizyon kaydı oluşmadı.</p>
              <p className="text-[11px] text-slate-400">
                Komisyon kadrosunda herhangi bir değişiklik yapıp kaydettiğinizde otomatik versiyon
                snapshot&apos;ı oluşturulur.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {historyLogs.map((log: any) => {
                let membersData: any[] = []
                try {
                  membersData = JSON.parse(log.snapshot_data || '[]')
                } catch (_) {
                  membersData = []
                }

                const isYaklasik = log.komisyon_turu === 'yaklasik_maliyet'

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-7.75 top-2.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover:scale-125 transition-transform ring-2 ring-indigo-100 dark:ring-indigo-950" />

                    <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${
                              isYaklasik
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isYaklasik
                              ? 'Piyasa Fiyat Araştırma Kadrosu'
                              : 'Muayene & Kabul Kadrosu'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {log.islem_turu || 'Güncelleme'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      {/* Snapshot Kadrosu */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          O Tarihteki Kadro ({membersData.length} Görevli)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {membersData.map((m: any, mIdx: number) => (
                            <div
                              key={mIdx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    m.asil_mi === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                />
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                  {m.personel_ad_soyad || 'Atanmamış'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold truncate ml-2">
                                {m.gorev_adi || 'Üye'} ({m.asil_mi === 1 ? 'Asil' : 'Yedek'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
