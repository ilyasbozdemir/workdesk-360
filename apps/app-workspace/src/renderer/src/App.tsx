import React, { useState, useMemo, useEffect } from 'react'
import {
  DEFAULT_ECOSYSTEM_MANIFESTS,
  AppCategory,
  AppInstallState,
  AppManifest,
  filterCatalog
} from '@worksuite-360/contracts'
import { Header } from './components/Header.js'
import { EcosystemBanner } from './components/EcosystemBanner.js'
import { CategoryNav } from './components/CategoryNav.js'
import { KamuSidebar } from './components/KamuSidebar.js'
import { AppCard } from './components/AppCard.js'
import { ManifestModal } from './components/ManifestModal.js'
import { SearchX, CheckCircle, AlertCircle } from 'lucide-react'
import { RealAppStatus, canLaunch } from './detection.js'
import { KAMU_360_MODULES, KamuModuleKey } from './kamuModules.js'

export const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModuleKey, setActiveModuleKey] = useState<KamuModuleKey>('all')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')
  const [selectedState, setSelectedState] = useState<AppInstallState | 'all'>('all')
  const [inspectedManifest, setInspectedManifest] = useState<AppManifest | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [launchNotification, setLaunchNotification] = useState<{
    message: string
    isError: boolean
  } | null>(null)
  const [realDetections, setRealDetections] = useState<Record<string, RealAppStatus>>({})

  useEffect(() => {
    if (window.workspaceAPI?.checkAppInstalled) {
      Promise.all(
        DEFAULT_ECOSYSTEM_MANIFESTS.map(async (m) => {
          try {
            const res = await window.workspaceAPI!.checkAppInstalled(m.appId)
            return [m.appId, res] as const
          } catch {
            return [m.appId, { installed: false }] as const
          }
        })
      ).then((results) => {
        const map: Record<string, RealAppStatus> = {}
        for (const [id, res] of results) {
          map[id] = res
        }
        setRealDetections(map)
      })
    }
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }

  // Real detection'lar ile dinamik olarak güncellenmiş efektif manifest listesi
  const effectiveManifests = useMemo(() => {
    return DEFAULT_ECOSYSTEM_MANIFESTS.map((manifest) => {
      const real = realDetections[manifest.appId]
      if (real) {
        let state: AppInstallState = manifest.installState
        if (canLaunch(real)) {
          state = 'installed'
        } else if (manifest.installState === 'installed') {
          // Statik manifestte 'installed' olsa dahi sistemde bulunamadıysa veya başlatılamazsa 'not_installed'
          state = 'not_installed'
        }
        return {
          ...manifest,
          installState: state
        }
      }
      return manifest
    })
  }, [realDetections])

  // Aktif KAMU 360 modülüne göre ön filtreleme
  const moduleFilteredManifests = useMemo(() => {
    if (activeModuleKey === 'all') return effectiveManifests
    const targetModule = KAMU_360_MODULES[activeModuleKey]
    if (!targetModule || targetModule.matchingAppIds.length === 0) return effectiveManifests
    return effectiveManifests.filter((m) => targetModule.matchingAppIds.includes(m.appId))
  }, [effectiveManifests, activeModuleKey])

  // Filter apps
  const filteredApps = useMemo(() => {
    return filterCatalog(moduleFilteredManifests, {
      category: selectedCategory,
      installState: selectedState,
      search: searchQuery
    })
  }, [moduleFilteredManifests, selectedCategory, selectedState, searchQuery])

  // Counts
  const totalCount = effectiveManifests.length
  const installedCount = useMemo(
    () => effectiveManifests.filter((a) => a.installState === 'installed').length,
    [effectiveManifests]
  )
  const plannedCount = useMemo(
    () => effectiveManifests.filter((a) => a.installState === 'planned').length,
    [effectiveManifests]
  )

  const handleLaunchApp = async (manifest: AppManifest) => {
    if (window.workspaceAPI?.launchApp) {
      try {
        const res = await window.workspaceAPI.launchApp(manifest.appId)
        setLaunchNotification({
          message:
            res.message ||
            (res.success ? `${manifest.name} başlatıldı.` : `${manifest.name} başlatılamadı.`),
          isError: !res.success
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setLaunchNotification({
          message: `${manifest.name} başlatılamadı: ${msg}`,
          isError: true
        })
      }
    } else {
      setLaunchNotification({
        message: `${manifest.name} başlatılıyor (${manifest.executableName})...`,
        isError: false
      })
    }
    setTimeout(() => {
      setLaunchNotification(null)
    }, 4000)
  }

  const activeModuleDef = KAMU_360_MODULES[activeModuleKey]

  return (
    <div
      style={{
        backgroundColor: 'var(--theme-bg-100)',
        color: 'var(--theme-text-100)'
      }}
      className="h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden"
    >
      {/* KAMU 360 & Workspace Ortak Navbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeModuleKey={activeModuleKey}
        onSelectModule={setActiveModuleKey}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* KAMU 360 Modüler Sidebar (Sayfa ile kaymayan sabit yan menü) */}
        <KamuSidebar
          activeModuleKey={activeModuleKey}
          onSelectModule={setActiveModuleKey}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedState={selectedState}
          onSelectState={setSelectedState}
          totalCount={totalCount}
          installedCount={installedCount}
          plannedCount={plannedCount}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Ana İçerik Alanı (Bağımsız Kayan Alan) */}
        <main className="flex-1 h-full overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar min-h-0">
          {/* Bildirim / Toast */}
          {launchNotification && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
                launchNotification.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {launchNotification.isError ? (
                  <AlertCircle size={20} className="shrink-0 text-rose-500" />
                ) : (
                  <CheckCircle size={20} className="shrink-0 text-emerald-500" />
                )}
                <span className="text-xs font-medium">{launchNotification.message}</span>
              </div>
              <button
                onClick={() => setLaunchNotification(null)}
                className="text-xs font-semibold px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              >
                Kapat
              </button>
            </div>
          )}

          {/* Aktif Modül Banner'ı */}
          {activeModuleKey !== 'all' ? (
            <div
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: activeModuleDef.color
              }}
              className="p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5">
                <div
                  style={{ backgroundColor: activeModuleDef.bgLight, color: activeModuleDef.color }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                >
                  {React.createElement(activeModuleDef.icon, { size: 24 })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold" style={{ color: 'var(--theme-text-100)' }}>
                      {activeModuleDef.name}
                    </h2>
                    <span
                      style={{ borderColor: activeModuleDef.color, color: activeModuleDef.color }}
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border"
                    >
                      {activeModuleDef.badge}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-200)' }}>
                    {activeModuleDef.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModuleKey('all')}
                style={{
                  backgroundColor: 'var(--theme-bg-200)',
                  borderColor: 'var(--theme-border-100)',
                  color: 'var(--theme-text-100)'
                }}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium self-start sm:self-auto hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Tüm Modülleri Göster
              </button>
            </div>
          ) : (
            <EcosystemBanner />
          )}

          {/* Hızlı Filtre Barı */}
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedState={selectedState}
            onSelectState={setSelectedState}
            totalCount={moduleFilteredManifests.length}
            installedCount={moduleFilteredManifests.filter((a) => a.installState === 'installed').length}
            plannedCount={moduleFilteredManifests.filter((a) => a.installState === 'planned').length}
          />

          {/* Uygulama Kartları Grid */}
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((manifest) => (
                <AppCard
                  key={manifest.id}
                  manifest={manifest}
                  realStatus={realDetections[manifest.appId]}
                  onInspect={setInspectedManifest}
                  onLaunch={handleLaunchApp}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-border-100)'
              }}
              className="py-16 px-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3"
            >
              <div
                style={{ backgroundColor: 'var(--theme-bg-200)' }}
                className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400"
              >
                <SearchX size={24} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-100)' }}>
                Aradığınız kriterde kamu uygulaması bulunamadı
              </h3>
              <p className="text-xs max-w-sm" style={{ color: 'var(--theme-text-200)' }}>
                Arama terimini değiştirebilir veya modül filtrelerini sıfırlayabilirsiniz.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedState('all')
                  setActiveModuleKey('all')
                }}
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: '#ffffff'
                }}
                className="mt-2 px-3.5 py-1.5 rounded-lg text-xs font-medium"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Manifesto Ayrıntı Modalı */}
      {inspectedManifest && (
        <ManifestModal
          manifest={inspectedManifest}
          onClose={() => setInspectedManifest(null)}
        />
      )}
    </div>
  )
}

export default App
