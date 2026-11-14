import React from 'react'
import { Home, FileText, X } from 'lucide-react'
import { TabItem, getTabLabel } from '../../../../store/tabStore'

export interface SimpleTabsBarProps {
  viewMode: 'simple-dashboard' | 'tab-view'
  onSelectDashboard: () => void
  tabs: TabItem[]
  activeTabPath: string
  onSelectTab: (path: string) => void
  onCloseTab: (path: string) => void
}

export const SimpleTabsBar: React.FC<SimpleTabsBarProps> = ({
  viewMode,
  onSelectDashboard,
  tabs,
  activeTabPath,
  onSelectTab,
  onCloseTab
}) => {
  return (
    <div className="simple-tabs-bar">
      {/* Sabit Sekme: Sade Masaüstü (Genel Bakış) */}
      <button
        type="button"
        className={`simple-tab-pill ${viewMode === 'simple-dashboard' ? 'active' : ''}`}
        onClick={onSelectDashboard}
        title="Sade Yönetim & Belge Önizleme Masası"
      >
        <Home size={13} />
        <span>Sade Masaüstü</span>
      </button>

      {/* Açık Sekmeler */}
      {tabs.map((tab) => {
        const isTabActive = viewMode === 'tab-view' && activeTabPath === tab.path
        const label = tab.label && !tab.label.startsWith('/') ? tab.label : getTabLabel(tab.path)
        return (
          <div
            key={tab.path}
            className={`simple-tab-pill ${isTabActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.path)}
            title={tab.path}
          >
            <FileText size={13} />
            <span>{label}</span>
            <span
              className="simple-tab-close"
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.path)
              }}
              title="Sekmeyi Kapat"
            >
              <X size={11} />
            </span>
          </div>
        )
      })}
    </div>
  )
}
