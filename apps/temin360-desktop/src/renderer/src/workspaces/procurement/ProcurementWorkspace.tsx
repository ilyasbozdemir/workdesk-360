import React, { useMemo } from 'react'
import { ActiveFileShortcuts } from '@renderer/components/layout/ActiveFileShortcuts'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { routeComponents } from '@renderer/components/layout/routeComponents'
import { normalizePath, useTabStore } from '@renderer/store/tabStore'
import { APP_ROUTES } from '@renderer/constants/routeConstants'

interface ProcurementWorkspaceProps {
  expiredPaths: Record<string, boolean>
}

export const ProcurementWorkspace: React.FC<ProcurementWorkspaceProps> = ({ expiredPaths }) => {
  const { activeDosyaId, fileName } = useWorkspaceStore()
  const { alwaysShowQuickMenu } = useSettingsStore()
  const { tabs, activeTabPath, addTab } = useTabStore()

  // 4734 İhale / Doğrudan Temin Modu
  const modeLabel = useMemo(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('temin_procurement_mode') : null
    if (saved === 'devlet_ihale_2886') return '2886 Devlet İhale (Gelir)'
    if (saved === 'ihale') return '4734 Açık İhale & İstisna'
    return 'Doğrudan Temin (4734)'
  }, [])

  // Aktif sekmenin başlığı
  const currentTabLabel = useMemo(() => {
    const activeTab = tabs.find((t) => t.path === activeTabPath)
    const cleanPath = normalizePath(activeTabPath).split('?')[0]

    if (activeTab?.label && !activeTab.label.startsWith('/')) {
      return activeTab.label
    }

    if (cleanPath === '/' || cleanPath === APP_ROUTES.DASHBOARD) return 'Gösterge Paneli'
    if (cleanPath === APP_ROUTES.DOSYALAR) return 'Doğrudan Temin Dosyaları'
    if (cleanPath === '/dosya' || cleanPath.startsWith('/dosya/')) {
      if (cleanPath === APP_ROUTES.BELGE_ONIZLEME) return 'A4 Belge Önizleme & Düzenleme'
      if (cleanPath === APP_ROUTES.HAZIRLIK_VE_IHTIYAC) return '1. İhtiyaç & Onay Aşaması'
      if (cleanPath === APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI) return '2. Piyasa Fiyat Araştırması'
      if (cleanPath === APP_ROUTES.SIPARIS_VE_SOZLESME) return '3. Sipariş & Sözleşme'
      if (cleanPath === APP_ROUTES.KABUL_VE_ODEME) return '4. Muayene, Kabul & Ödeme'
      if (cleanPath === APP_ROUTES.DOSYA_CIKTI_MERKEZI) return 'Çıktı & Belge Merkezi'
      return 'Süreç Akışı & İşlemler'
    }
    if (cleanPath.startsWith('/malzemeler')) return 'Malzeme & Kalemler'
    if (cleanPath.startsWith('/firmalar')) return 'İstekli Firmalar & Teklifler'
    if (cleanPath.startsWith('/ihtiyac-raporlari')) return 'İhtiyaç Raporları'
    if (cleanPath.startsWith('/komisyonlar')) return 'Komisyon Yönetimi'
    if (cleanPath.startsWith('/rota-yonetimi')) return 'Belge Rota & Onay Akışı'
    if (cleanPath.startsWith('/ambar')) return 'Taşınır & Ambar Yönetimi'
    if (cleanPath.startsWith('/projeler')) return 'Proje Yönetimi'
    if (cleanPath.startsWith('/sablonlar')) return 'Şablon Yönetimi'
    if (cleanPath.startsWith('/ayarlar')) return 'Sistem Ayarları'
    if (cleanPath.startsWith('/profil')) return 'Kullanıcı Profili'
    if (cleanPath.startsWith('/yardim')) return 'Yardım & Kılavuzlar'
    if (cleanPath.startsWith('/birimler')) return 'Birim Yönetimi'
    if (cleanPath.startsWith('/personel')) return 'Personel Yönetimi'
    if (cleanPath.startsWith('/kurum')) return 'Kurum Bilgileri'
    if (cleanPath.startsWith('/devlet-ihale-2886')) return '2886 Satış & Kiralama Masası'
    if (cleanPath.startsWith('/ebys')) return 'EBYS Resmî Yazışma'
    if (cleanPath.startsWith('/degiskenler')) return 'Özel Belge & Yer Tutucular'
    return 'Satın Alma İşlemleri'
  }, [tabs, activeTabPath])

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      {/* Sol Hızlı Erişim Simgeleri */}
      {(activeDosyaId || alwaysShowQuickMenu) && <ActiveFileShortcuts />}

      {/* Ana Çalışma Alanı (Breadcrumb + Sekme İçeriği) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* İç Çalışma Masası Üst Bilgi Barı (Mali Masası ile Birebir Uyumlu Breadcrumb) */}
        <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => addTab('/')}
              className="font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Satın Alma Ana Sayfası"
            >
              Satın Alma Masası
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <button
              type="button"
              onClick={() => addTab(APP_ROUTES.DOSYALAR)}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              title={modeLabel}
            >
              {modeLabel}
            </button>
            {activeDosyaId && (
              <>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <button
                  type="button"
                  onClick={() => addTab('/dosya')}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Aktif Dosya Sürecine Git"
                >
                  Dosya #{activeDosyaId}
                </button>
              </>
            )}
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs md:max-w-md">
              {currentTabLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeDosyaId ? (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Aktif Dosya: #{activeDosyaId}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Satın Alma Oturumu: Aktif
              </span>
            )}
          </div>
        </div>

        {/* Ana Sayfa İçerik Alanı */}
        <main className="flex-1 min-h-0 relative overflow-hidden">
          {tabs.map((tab) => {
            const isActive = tab.path === activeTabPath
            const isExpired = expiredPaths[tab.path]

            if (isExpired) return null

            const cleanPath = normalizePath(tab.path).split('?')[0]
            const Component = routeComponents[cleanPath]
            if (!Component) return null

            return (
              <div
                key={tab.path}
                style={{ display: isActive ? 'block' : 'none' }}
                className={
                  cleanPath === APP_ROUTES.BELGE_ONIZLEME
                    ? 'h-full w-full absolute inset-0 p-0 overflow-hidden'
                    : 'h-full w-full absolute inset-0 p-6 overflow-auto custom-scrollbar'
                }
              >
                <Component />
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}
