import React from 'react'
import { FolderOpen, PlusCircle } from 'lucide-react'
import { NetworkSyncModal } from '../../components/network/NetworkSyncModal'
import { useLauncherLogic } from './useLauncherLogic'
import { LauncherTitleBar } from './components/LauncherTitleBar'
import { LauncherRecentFiles } from './components/LauncherRecentFiles'
import { LauncherCreateModal } from './components/LauncherCreateModal'
import { LauncherMigrationModal } from './components/LauncherMigrationModal'

export default function LauncherScreen(): React.ReactNode {
  const {
    theme,
    setTheme,
    showCreateModal,
    setShowCreateModal,
    showNetworkModal,
    setShowNetworkModal,
    pendingFilePath,
    setPendingFilePath,
    showMigrationModal,
    setShowMigrationModal,
    migrationData,
    setMigrationData,
    institutionName,
    setInstitutionName,
    username,
    setUsername,
    password,
    setPassword,
    creating,
    showPassword,
    setShowPassword,
    recentFiles,
    handleCreateNewFile,
    handleChangeSaveLocation,
    handleModalSubmit,
    handleOpenFile,
    handleOpenRecent,
    handleRemoveRecent,
    handleConfirmMigration,
    handleMinimize,
    handleMaximize,
    handleClose
  } = useLauncherLogic()

  return (
    <div className="flex items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-950 p-6 relative transition-colors duration-300">
      {/* Draggable Header with Window Controls & Theme Switcher */}
      <LauncherTitleBar
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenNetworkModal={() => setShowNetworkModal(true)}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />

      <div
        className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-row"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex-1 flex flex-col">
          <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-pulse">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              DEVLET İHALE 2886&apos;ya Hoş Geldiniz
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Çalışmaya başlamak için yeni bir 2886 ihale/satış/kiralama dosyası (.ihale2886) oluşturun veya
              mevcut bir kurumu açın.
            </p>
          </div>

          <div className="p-8 space-y-4 flex-1 flex flex-col justify-center">
            <button
              onClick={handleCreateNewFile}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-600/20">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base">Yeni 2886 Dosyası Oluştur</h3>
                <p className="text-xs opacity-80 mt-0.5">2886 sayılı Kanun kapsamında yeni satış, kira veya trampa için sıfırdan başla</p>
              </div>
            </button>

            <button
              onClick={handleOpenFile}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base">Mevcut 2886 Dosyasını Aç</h3>
                <p className="text-xs opacity-80 mt-0.5">
                  Önceden oluşturulmuş .ihale2886 veya .dihale dosyasını yükle
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Son Açılan Dosyalar Yan Paneli */}
        <LauncherRecentFiles
          recentFiles={recentFiles}
          onOpenRecent={handleOpenRecent}
          onRemoveRecent={handleRemoveRecent}
        />
      </div>

      {/* CREATE WORKSPACE AUTH MODAL */}
      <LauncherCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setPendingFilePath(null)
        }}
        pendingFilePath={pendingFilePath}
        onChangeSaveLocation={handleChangeSaveLocation}
        institutionName={institutionName}
        onInstitutionNameChange={setInstitutionName}
        username={username}
        onUsernameChange={setUsername}
        password={password}
        onPasswordChange={setPassword}
        showPassword={showPassword}
        onToggleShowPassword={() => setShowPassword(!showPassword)}
        creating={creating}
        onSubmit={handleModalSubmit}
      />

      {/* MIGRATION MODAL */}
      <LauncherMigrationModal
        isOpen={showMigrationModal}
        migrationData={migrationData}
        creating={creating}
        onClose={() => {
          setShowMigrationModal(false)
          setMigrationData(null)
        }}
        onConfirm={handleConfirmMigration}
      />

      {showNetworkModal && <NetworkSyncModal onClose={() => setShowNetworkModal(false)} />}
    </div>
  )
}
