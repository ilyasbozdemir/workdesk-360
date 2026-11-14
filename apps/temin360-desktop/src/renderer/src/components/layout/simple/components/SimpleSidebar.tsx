import React from 'react'
import { APP_ROUTES } from '../../../../constants/routeConstants'

export interface SimpleSidebarProps {
  isCollapsed: boolean
  sidebarOpen: boolean
  currentPage: string
  setCurrentPage: (p: string) => void
  viewMode: 'simple-dashboard' | 'tab-view'
  setViewMode: (m: 'simple-dashboard' | 'tab-view') => void
  filesCount: number
  onNavigateTab: (path: string, pageName?: string) => void
}

export const SimpleSidebar: React.FC<SimpleSidebarProps> = ({
  isCollapsed,
  sidebarOpen,
  currentPage,
  setCurrentPage,
  viewMode,
  setViewMode,
  filesCount,
  onNavigateTab
}) => {
  return (
    <aside className={`simple-sidebar ${isCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
      <div className="simple-nav-label">ÇALIŞMA ALANI</div>
      <div
        className={`simple-nav-item ${viewMode === 'simple-dashboard' && currentPage === 'Genel Bakış' ? 'active' : ''}`}
        onClick={() => {
          setViewMode('simple-dashboard')
          setCurrentPage('Genel Bakış')
        }}
        title="Genel Bakış (Sade Masası)"
      >
        <span className="simple-nav-icon">⌂</span>
        <span>Genel Bakış</span>
      </div>
      <div
        className={`simple-nav-item ${currentPage === 'İhale Dosyaları' ? 'active' : ''}`}
        onClick={() => onNavigateTab(APP_ROUTES.DOSYALAR, 'İhale Dosyaları')}
        title="Doğrudan Temin & İhale Dosyaları"
      >
        <span className="simple-nav-icon">▤</span>
        <span>İhale Dosyaları</span>
        <span className="simple-nav-count">{filesCount}</span>
      </div>

      <div className="simple-nav-label">SATIN ALMA SÜREÇLERİ</div>
      {[
        { name: 'İhtiyaç ve Talepler', icon: '＋', path: '/dosya/hazirlik-ve-ihtiyac' },
        { name: 'Piyasa Araştırması', icon: '⌕', path: '/dosya/piyasa-fiyat-arastirmasi' },
        { name: 'Teklif Yönetimi', icon: '▧', path: '/firmalar' },
        { name: 'Sipariş İşlemleri', icon: '▣', path: '/dosya/siparis-ve-sozlesme' },
        { name: 'Muayene ve Kabul', icon: '✓', path: '/dosya/kabul-ve-odeme' },
        { name: 'Ödeme & Maliye', icon: '₺', path: APP_ROUTES.BKMYBS_MALI_YONETIM }
      ].map((item) => (
        <div
          key={item.name}
          className={`simple-nav-item ${currentPage === item.name ? 'active' : ''}`}
          onClick={() => onNavigateTab(item.path, item.name)}
          title={item.name}
        >
          <span className="simple-nav-icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}

      <div className="simple-nav-label">BELGE VE RAPORLAMA</div>
      {[
        { name: 'Belgeler & Şablonlar', icon: '📄', page: 'Belgeler & Şablonlar' },
        { name: 'İhtiyaç Raporları', icon: '▱', path: APP_ROUTES.IHTIYAC_RAPORLARI },
        { name: 'Raporlar', icon: '▥', path: '/raporlar' },
        { name: 'Taşınır & Ambar', icon: '◫', path: '/ambar' }
      ].map((item) => (
        <div
          key={item.name}
          className={`simple-nav-item ${currentPage === item.name ? 'active' : ''}`}
          onClick={() => {
            if (item.path) {
              onNavigateTab(item.path, item.name)
            } else {
              setViewMode('simple-dashboard')
              setCurrentPage(item.name)
            }
          }}
          title={item.name}
        >
          <span className="simple-nav-icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}

      <div className="simple-nav-label">YÖNETİM</div>
      <div
        className={`simple-nav-item ${currentPage === 'Tedarikçi Yönetimi' ? 'active' : ''}`}
        onClick={() => onNavigateTab('/firmalar', 'Tedarikçi Yönetimi')}
        title="Tedarikçi Firmalar"
      >
        <span className="simple-nav-icon">♙</span>
        <span>Tedarikçi Yönetimi</span>
      </div>
      <div
        className={`simple-nav-item ${currentPage === 'Tanımlar ve Ayarlar' ? 'active' : ''}`}
        onClick={() => onNavigateTab(APP_ROUTES.AYARLAR, 'Tanımlar ve Ayarlar')}
        title="Sistem ve Parametre Ayarları"
      >
        <span className="simple-nav-icon">⚙</span>
        <span>Tanımlar ve Ayarlar</span>
      </div>

      <div className="simple-sidebar-bottom">
        TEMİN 360 <span style={{ float: 'right' }}>v1.0.0-rc.18</span>
        <br />
        <br />© 2026 · Kurumsal Yönetim Platformu
      </div>
    </aside>
  )
}
