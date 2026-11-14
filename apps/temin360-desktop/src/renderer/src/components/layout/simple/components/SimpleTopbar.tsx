import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WindowControls } from '../../header/WindowControls'
import { SimpleFile } from '../types'

export interface SimpleTopbarProps {
  isCollapsed: boolean
  setIsCollapsed: (val: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  institutionName?: string
  adminName?: string
  adminTitle?: string
  files: SimpleFile[]
  selectedFileId: string
  setSelectedFileId: (id: string) => void
  setActiveDosyaId: (id: number) => void
  onOpenSelectedFile: () => void
  globalSearch: string
  setGlobalSearch: (q: string) => void
  onSwitchToAdvanced: () => void
  theme: string
  setTheme: (t: 'light' | 'dark' | 'system') => void
  showToast: (msg: string) => void
}

export const SimpleTopbar: React.FC<SimpleTopbarProps> = ({
  isCollapsed,
  setIsCollapsed,
  sidebarOpen,
  setSidebarOpen,
  institutionName,
  adminName,
  adminTitle,
  files,
  selectedFileId,
  setSelectedFileId,
  setActiveDosyaId,
  onOpenSelectedFile,
  globalSearch,
  setGlobalSearch,
  onSwitchToAdvanced,
  theme,
  setTheme,
  showToast
}) => {
  return (
    <header className="simple-topbar">
      <button
        className="simple-icon-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Menüyü aç/kapat"
      >
        ☰
      </button>

      <div className="simple-brand" style={{ minWidth: isCollapsed ? 'auto' : undefined }}>
        <div className="simple-logo">T</div>
        {!isCollapsed && (
          <div className="simple-brand-name">
            TEMİN <span>360</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="simple-icon-btn"
          style={{ width: 28, height: 28, marginLeft: isCollapsed ? 4 : 'auto' }}
          title={isCollapsed ? "Sidebar'ı Genişlet" : "Sidebar'ı Daralt"}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <div className="simple-org">
        {institutionName || 'Güneyyurt Belediye Başkanlığı'} <span style={{ color: '#b2bac5' }}>/</span> Satın Alma Yönetimi
      </div>

      {/* AKTİF DOSYA SEÇİCİ */}
      <div className="simple-active-file-picker">
        <label htmlFor="simpleActiveSelect">AKTİF DOSYA</label>
        <select
          id="simpleActiveSelect"
          value={selectedFileId}
          onChange={(e) => {
            setSelectedFileId(e.target.value)
            const matched = files.find((f) => f.id === e.target.value)
            if (matched) {
              const num = parseInt(matched.id.replace(/\D/g, ''), 10)
              if (num) setActiveDosyaId(num)
            }
            showToast('Aktif dosya seçildi: ' + e.target.value)
          }}
        >
          {files.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} · {f.name}
            </option>
          ))}
        </select>
        <button onClick={onOpenSelectedFile}>
          Aç ↗
        </button>
      </div>

      <div className="simple-top-spacer" />

      <div className="simple-top-search">
        <input
          placeholder="Dosya, belge veya işlem ara..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
      </div>

      {/* GELİŞMİŞ EKRANA GEÇ BUTONU */}
      <button
        className="simple-mode-btn"
        onClick={onSwitchToAdvanced}
        title="Gelişmiş sekmeli ekrana geç"
      >
        <span>⊞</span>
        <span>Gelişmiş Ekran</span>
      </button>

      <button
        className="simple-icon-btn"
        title="Temayı Değiştir"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        ◐
      </button>

      <div className="simple-user">
        <div className="simple-avatar">
          {adminName ? adminName.slice(0, 2).toUpperCase() : 'İB'}
        </div>
        <div>
          <strong>{adminName || 'İlyas Bozdemir'}</strong>
          <small>{adminTitle || 'Satın Alma Birimi'}</small>
        </div>
      </div>

      {/* PENCERE & FORM KONTROLLERİ */}
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
      <WindowControls />
    </header>
  )
}
