import React, { useState, useEffect, useMemo } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useTheme } from '../../providers/ThemeProvider'

interface SimpleFile {
  id: string
  name: string
  type: string
  date: string
  status: string
  amount: number
  unit: string
}

interface ItemRecord {
  name: string
  qty: number
  unit: string
  price: number
}

interface OfferRecord {
  company: string
  price: number
  valid: string
}

const INITIAL_FILES: SimpleFile[] = [
  {
    id: 'DT-2026-0042',
    name: 'Belediye hizmet binası bakım işi',
    type: 'Doğrudan Temin',
    date: '12.11.2026',
    status: 'Onay bekliyor',
    amount: 185000,
    unit: 'Fen İşleri Müdürlüğü'
  },
  {
    id: 'DT-2026-0041',
    name: 'Muhtelif kırtasiye malzemesi alımı',
    type: 'Doğrudan Temin',
    date: '10.11.2026',
    status: 'Hazırlanıyor',
    amount: 42750,
    unit: 'Yazı İşleri Müdürlüğü'
  },
  {
    id: 'DT-2026-0039',
    name: 'Araç bakım ve yedek parça alımı',
    type: 'Doğrudan Temin',
    date: '08.11.2026',
    status: 'Tamamlandı',
    amount: 96400,
    unit: 'Destek Hizmetleri'
  },
  {
    id: 'İH-2026-0012',
    name: 'Park ve çevre düzenleme malzemeleri',
    type: 'Açık İhale',
    date: '06.11.2026',
    status: 'Onay bekliyor',
    amount: 640000,
    unit: 'Park ve Bahçeler'
  },
  {
    id: 'DT-2026-0037',
    name: 'İş güvenliği ekipmanları',
    type: 'Doğrudan Temin',
    date: '04.11.2026',
    status: 'Arşivlendi',
    amount: 28500,
    unit: 'İnsan Kaynakları'
  }
]

export function SimpleLayout(): React.JSX.Element {
  const {
    institutionName,
    adminName,
    adminTitle,
    setLayoutMode
  } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const { setActiveDosyaId } = useWorkspaceStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('Genel Bakış')
  const [currentTab, setCurrentTab] = useState('Genel Bilgiler')
  const [files, setFiles] = useState<SimpleFile[]>(INITIAL_FILES)
  const [selectedFileId, setSelectedFileId] = useState<string>(INITIAL_FILES[0].id)
  const [globalSearch, setGlobalSearch] = useState('')
  const [fileSearch, setFileSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // Örnek İhtiyaç ve Teklif verileri
  const [items, setItems] = useState<ItemRecord[]>([
    { name: 'Bakım malzemesi', qty: 12, unit: 'Adet', price: 850 },
    { name: 'Elektrik tesisatı malzemesi', qty: 8, unit: 'Takım', price: 2350 }
  ])
  const [offers, setOffers] = useState<OfferRecord[]>([
    { company: 'Örnek Teknik Ltd.', price: 162000, valid: 'Uygun' },
    { company: 'Demo Yapı A.Ş.', price: 174500, valid: 'Uygun' },
    { company: 'Örnek Tedarik', price: 181000, valid: 'İncelemede' }
  ])

  // Veritabanındaki gerçek dosyaları yüklemeyi dene (varsa listeye ekle/güncelle)
  useEffect(() => {
    let isMounted = true
    const loadRealFiles = async () => {
      try {
        if (window.electron?.ipcRenderer) {
          const res = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT id, temin_no, konu, tur, yaklasik_maliyet, created_at, status
             FROM DATA_TeminDosyasi
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             ORDER BY id DESC LIMIT 50`
          )
          if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: SimpleFile[] = res.data.map((d: any) => ({
              id: d.temin_no || `DT-${d.id}`,
              name: d.konu || 'Doğrudan Temin Dosyası',
              type: d.tur === 'hizmet' ? 'Hizmet Alımı' : d.tur === 'yapim' ? 'Yapım İşi' : 'Doğrudan Temin',
              date: d.created_at ? String(d.created_at).slice(0, 10) : '2026-11-14',
              status: d.status || 'Hazırlanıyor',
              amount: Number(d.yaklasik_maliyet) || 0,
              unit: 'Satın Alma Birimi'
            }))
            setFiles(mapped)
            if (mapped[0]) setSelectedFileId(mapped[0].id)
          }
        }
      } catch (e) {
        console.warn('[SimpleLayout] Veritabanından dosyalar okunamadı, hazır şablon kullanılıyor:', e)
      }
    }
    loadRealFiles()
    return () => {
      isMounted = false
    }
  }, [])

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || files[0]
  }, [files, selectedFileId])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }

  const money = (n: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(n)

  const statusClass = (s: string) =>
    s === 'Tamamlandı' ? 's-green' : s === 'Onay bekliyor' ? 's-orange' : s === 'Hazırlanıyor' ? 's-blue' : 's-gray'

  // Filtrelenmiş dosyalar
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const q = (fileSearch || globalSearch).trim().toLocaleLowerCase('tr')
      const matchesQuery = !q || (f.name + ' ' + f.id).toLocaleLowerCase('tr').includes(q)
      const matchesStatus = !statusFilter || f.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [files, fileSearch, globalSearch, statusFilter])

  return (
    <div className={`simple-root ${theme === 'dark' ? 'dark' : ''}`}>
      <style>{`
        .simple-root {
          --bg: #f4f6f9;
          --surface: #fff;
          --surface-2: #f8fafc;
          --text: #202938;
          --muted: #748094;
          --line: #e5e9f0;
          --primary: #1769aa;
          --primary-2: #0f568f;
          --primary-soft: #eaf3fb;
          --accent: #d95d59;
          --success: #23865b;
          --warning: #b7791f;
          --danger: #c64747;
          --shadow: 0 8px 24px rgba(26,43,68,.07);
          --sidebar: 258px;
          --radius: 12px;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.45;
          display: grid;
          grid-template-columns: var(--sidebar) minmax(0, 1fr);
          grid-template-rows: 64px 1fr;
        }

        .simple-root.dark {
          --bg: #141a23;
          --surface: #1c2531;
          --surface-2: #222e3c;
          --text: #e8edf4;
          --muted: #9aa8b9;
          --line: #303d4c;
          --primary: #65a9e2;
          --primary-2: #4e91cc;
          --primary-soft: #253b50;
          --shadow: 0 8px 24px #0003;
        }

        .simple-topbar {
          grid-column: 1 / -1;
          background: var(--surface);
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .simple-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: calc(var(--sidebar) - 20px);
        }

        .simple-logo {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(145deg, #1976bd, #0d4f83);
          display: grid;
          place-items: center;
          color: white;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 4px 10px #1769aa33;
        }

        .simple-brand-name {
          font-weight: 800;
          letter-spacing: .4px;
          font-size: 16px;
        }
        .simple-brand-name span { color: var(--primary); }

        .simple-org {
          font-size: 12px;
          color: var(--muted);
          border-left: 1px solid var(--line);
          padding-left: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        .simple-active-file-picker {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          border: 1px solid var(--line);
          background: var(--surface-2);
          padding: 5px 7px 5px 11px;
          border-radius: 9px;
        }
        .simple-active-file-picker label {
          font-size: 9px;
          letter-spacing: .6px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
        }
        .simple-active-file-picker select {
          max-width: 260px;
          min-width: 110px;
          background: transparent;
          color: var(--text);
          border: 0;
          outline: none;
          font-size: 12px;
          font-weight: 700;
        }
        .simple-active-file-picker button {
          background: var(--primary-soft);
          border: 0;
          border-radius: 6px;
          padding: 5px 9px;
          color: var(--primary);
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }

        .simple-top-spacer { flex: 1; }

        .simple-top-search {
          width: min(280px, 22vw);
          position: relative;
        }
        .simple-top-search input {
          width: 100%;
          border: 1px solid var(--line);
          background: var(--surface-2);
          border-radius: 9px;
          padding: 8px 12px 8px 32px;
          outline: none;
          color: var(--text);
          font-size: 12px;
        }
        .simple-top-search:before {
          content: "⌕";
          position: absolute;
          left: 11px;
          top: 3px;
          color: var(--muted);
          font-size: 20px;
        }

        .simple-icon-btn {
          width: 36px;
          height: 36px;
          border: 1px solid var(--line);
          background: var(--surface);
          border-radius: 9px;
          color: #657187;
          display: grid;
          place-items: center;
          font-size: 16px;
          cursor: pointer;
          position: relative;
        }
        .simple-icon-btn:hover { background: var(--surface-2); }
        .simple-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e35d59;
          right: 7px;
          top: 7px;
          border: 1px solid white;
        }

        .simple-mode-btn {
          border: 1px solid var(--primary);
          background: var(--primary-soft);
          color: var(--primary);
          border-radius: 8px;
          padding: 6px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.15s;
        }
        .simple-mode-btn:hover {
          background: var(--primary);
          color: white;
        }

        .simple-user {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .simple-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e8eff8;
          color: #245b8a;
          display: grid;
          place-items: center;
          font-weight: 700;
        }
        .simple-user strong { display: block; font-size: 12px; }
        .simple-user small { color: var(--muted); font-size: 11px; }

        .simple-sidebar {
          background: var(--surface);
          border-right: 1px solid var(--line);
          padding: 16px 12px 20px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        .simple-nav-label {
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 800;
          color: #9aa4b3;
          padding: 12px 11px 7px;
        }
        .simple-nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 11px;
          margin: 2px 0;
          border-radius: 8px;
          color: #586477;
          text-decoration: none;
          font-size: 13px;
          transition: .15s;
          cursor: pointer;
        }
        .simple-root.dark .simple-nav-item { color: #b4c0cf; }
        .simple-nav-item:hover {
          background: var(--surface-2);
          color: var(--primary);
        }
        .simple-nav-item.active {
          background: var(--primary-soft);
          color: var(--primary);
          font-weight: 700;
        }
        .simple-nav-icon {
          width: 18px;
          text-align: center;
          font-size: 15px;
          color: #8491a3;
        }
        .simple-nav-item.active .simple-nav-icon { color: var(--primary); }
        .simple-nav-count {
          margin-left: auto;
          font-size: 10px;
          background: #edf1f6;
          color: #68758a;
          padding: 2px 7px;
          border-radius: 20px;
        }

        .simple-sidebar-bottom {
          border-top: 1px solid var(--line);
          margin-top: 22px;
          padding: 14px 10px 0;
          color: var(--muted);
          font-size: 11px;
        }

        .simple-main {
          overflow-y: auto;
          height: calc(100vh - 64px);
          padding: 24px 28px 40px;
        }

        .simple-breadcrumb {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 12px;
        }
        .simple-breadcrumb b { color: #4b586b; font-weight: 600; }
        .simple-root.dark .simple-breadcrumb b { color: #d0d8e2; }

        .simple-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }
        .simple-eyebrow {
          color: var(--primary);
          font-size: 10px;
          letter-spacing: 1.15px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .simple-page-head h1 {
          font-size: 24px;
          letter-spacing: -.5px;
          margin: 0 0 5px;
          font-weight: 750;
        }
        .simple-subtitle {
          color: var(--muted);
          font-size: 13px;
          margin: 0;
        }

        .simple-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }
        .simple-btn {
          border: 1px solid var(--line);
          background: var(--surface);
          color: #526075;
          padding: 8px 13px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }
        .simple-root.dark .simple-btn { color: #d0d9e4; }
        .simple-btn.primary {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 4px 10px #1769aa25;
        }
        .simple-btn:hover { filter: brightness(.97); }

        .simple-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .simple-stat {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 16px 17px;
          box-shadow: 0 2px 6px rgba(20,40,70,.02);
        }
        .simple-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--muted);
          font-size: 12px;
        }
        .simple-stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--primary-soft);
          display: grid;
          place-items: center;
          color: var(--primary);
          font-size: 16px;
        }
        .simple-stat-value {
          font-size: 24px;
          font-weight: 750;
          letter-spacing: -.6px;
          margin: 9px 0 3px;
        }
        .simple-stat-note {
          font-size: 11px;
          color: var(--muted);
        }
        .simple-positive {
          color: var(--success);
          font-weight: 700;
        }

        .simple-content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(280px, .85fr);
          gap: 17px;
          align-items: start;
        }
        .simple-panel {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: 0 2px 6px rgba(20,40,70,.025);
          min-width: 0;
        }
        .simple-panel-head {
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .simple-panel-title {
          font-weight: 750;
          font-size: 14px;
        }
        .simple-panel-sub {
          font-size: 11px;
          color: var(--muted);
          margin-top: 3px;
        }
        .simple-link {
          color: var(--primary);
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
          cursor: pointer;
        }

        .simple-filters {
          padding: 13px 17px;
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--line);
        }
        .simple-field {
          position: relative;
          flex: 1;
          min-width: 140px;
        }
        .simple-field input, .simple-field select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          padding: 8px 11px;
          color: #526075;
          outline: none;
          font-size: 12px;
        }
        .simple-root.dark .simple-field input, .simple-root.dark .simple-field select { color: #d0d9e4; }
        .simple-field input:focus, .simple-field select:focus {
          border-color: #80add2;
          box-shadow: 0 0 0 3px #1769aa12;
        }

        .simple-table-wrap { overflow-x: auto; }
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .simple-table th {
          text-align: left;
          background: #fafbfd;
          color: #8993a3;
          font-size: 10px;
          letter-spacing: .55px;
          text-transform: uppercase;
          font-weight: 750;
          padding: 11px 16px;
          border-bottom: 1px solid var(--line);
        }
        .simple-root.dark .simple-table th {
          background: #202b38;
          color: #aab6c5;
        }
        .simple-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #edf0f4;
          font-size: 12px;
          color: #536075;
        }
        .simple-root.dark .simple-table td {
          color: #b7c3d1;
          border-color: #2b3745;
        }
        .simple-table tbody tr:hover {
          background: #fbfcfe;
        }
        .simple-root.dark .simple-table tbody tr:hover {
          background: #202b38;
        }
        .simple-table tbody tr:last-child td { border-bottom: 0; }

        .file-title { font-weight: 700; color: #303b4c; }
        .simple-root.dark .file-title { color: #e5ebf3; }
        .file-id { font-size: 10px; color: #9aa3b0; margin-top: 3px; }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 20px;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 700;
        }
        .status:before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }
        .s-blue { background: #edf5fc; color: #2872ae; }
        .s-orange { background: #fff5e8; color: #b7791f; }
        .s-green { background: #eaf7f0; color: #23865b; }
        .s-gray { background: #f0f2f5; color: #748094; }

        .amount { font-weight: 700; color: #344154; }
        .simple-root.dark .amount { color: #d0d8e2; }
        .clickable { cursor: pointer; }

        .simple-panel-foot {
          padding: 12px 17px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          color: var(--muted);
          font-size: 11px;
        }

        .simple-right-stack {
          display: grid;
          gap: 17px;
        }
        .simple-quick-list { padding: 7px 16px 12px; }
        .simple-quick {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 0;
          border-bottom: 1px solid #eef1f5;
          cursor: pointer;
        }
        .simple-quick:last-child { border: 0; }
        .simple-quick-ico {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: var(--surface-2);
          display: grid;
          place-items: center;
          color: var(--primary);
          font-size: 16px;
        }
        .simple-quick strong { font-size: 12px; display: block; }
        .simple-quick small { font-size: 10px; color: var(--muted); }
        .simple-quick .arrow { margin-left: auto; color: #a2acba; }

        .simple-activity { padding: 8px 17px 14px; }
        .simple-activity-item {
          display: flex;
          gap: 11px;
          padding: 10px 0;
          position: relative;
        }
        .simple-activity-item:not(:last-child):after {
          content: "";
          position: absolute;
          left: 5px;
          top: 23px;
          bottom: -7px;
          width: 1px;
          background: #e6ebf1;
        }
        .simple-activity-dot {
          width: 11px;
          height: 11px;
          border: 3px solid #d9eafa;
          background: var(--primary);
          border-radius: 50%;
          margin-top: 3px;
          z-index: 1;
          flex: none;
        }
        .simple-activity-text { font-size: 11px; color: #566276; }
        .simple-root.dark .simple-activity-text { color: #a0acba; }
        .simple-activity-text b { color: #303b4c; }
        .simple-root.dark .simple-activity-text b { color: #e5ebf3; }
        .simple-activity-text small {
          display: block;
          color: #9aa3b0;
          margin-top: 3px;
          font-size: 10px;
        }

        .simple-notice {
          margin-top: 20px;
          border: 1px solid #dceaf6;
          background: #f3f8fc;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          color: #52718b;
          font-size: 11px;
        }
        .simple-root.dark .simple-notice {
          background: #203448;
          border-color: #304b63;
          color: #a8c5dd;
        }
        .simple-notice b { color: #315d7e; }
        .simple-root.dark .simple-notice b { color: #d1e6f8; }

        /* Workspace & A4 Preview */
        .workspace { display: grid; gap: 17px; }
        .toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .tabs { display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding: 10px 14px; }
        .tab {
          border: 0;
          background: transparent;
          padding: 8px 13px;
          color: var(--muted);
          border-radius: 7px;
          font-size: 12px;
          cursor: pointer;
        }
        .tab.active {
          background: var(--primary-soft);
          color: var(--primary);
          font-weight: 700;
        }
        .panel-body { padding: 18px; }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }
        .form-group { display: grid; gap: 5px; }
        .form-group label { font-size: 11px; color: var(--muted); font-weight: 700; }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 9px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 12px;
        }
        .step-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .step {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--surface);
          font-size: 12px;
          color: var(--muted);
        }
        .step.done { color: var(--success); border-color: #a4d6bb; }
        .step.current { color: var(--primary); border-color: var(--primary); }

        .a4-paper {
          width: min(100%, 620px);
          min-height: 720px;
          margin: 18px auto;
          background: white;
          color: #222;
          border: 1px solid #d6dce5;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          padding: 48px 45px;
          font-family: Georgia, serif;
          font-size: 13px;
          line-height: 1.7;
        }
        .a4-paper h2 { text-align: center; font-size: 16px; margin: 18px 0; }
        .a4-paper .letterhead {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 12px;
        }
        .pill {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 7px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: 11px;
          font-weight: 700;
        }

        .simple-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(11, 21, 37, 0.55);
          display: grid;
          place-items: center;
          z-index: 50;
          padding: 18px;
        }
        .simple-modal {
          background: var(--surface);
          color: var(--text);
          width: min(560px, 100%);
          border-radius: 14px;
          box-shadow: var(--shadow);
          max-height: 90vh;
          overflow: auto;
        }
        .simple-toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          background: #233a52;
          color: #fff;
          padding: 12px 18px;
          border-radius: 9px;
          z-index: 60;
          box-shadow: var(--shadow);
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>

      {/* TOPBAR */}
      <header className="simple-topbar">
        <button
          className="simple-icon-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Menüyü aç/kapat"
        >
          ☰
        </button>

        <div className="simple-brand">
          <div className="simple-logo">T</div>
          <div className="simple-brand-name">
            TEMİN <span>360</span>
          </div>
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
                // Eğer id DT-123 gibi ise id'yi çıkarıp workspace'e bildir
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
          <button
            onClick={() => {
              setCurrentTab('Genel Bilgiler')
              setCurrentPage('Dosya Detayı')
            }}
          >
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
          onClick={() => {
            setLayoutMode('advanced')
            showToast('Gelişmiş çalışma alanı ekranına geçildi')
          }}
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
      </header>

      {/* SIDEBAR */}
      <aside className={`simple-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="simple-nav-label">ÇALIŞMA ALANI</div>
        <div
          className={`simple-nav-item ${currentPage === 'Genel Bakış' ? 'active' : ''}`}
          onClick={() => setCurrentPage('Genel Bakış')}
        >
          <span className="simple-nav-icon">⌂</span>
          <span>Genel Bakış</span>
        </div>
        <div
          className={`simple-nav-item ${currentPage === 'İhale Dosyaları' ? 'active' : ''}`}
          onClick={() => setCurrentPage('İhale Dosyaları')}
        >
          <span className="simple-nav-icon">▤</span>
          <span>İhale Dosyaları</span>
          <span className="simple-nav-count">{files.length}</span>
        </div>

        <div className="simple-nav-label">SATIN ALMA SÜREÇLERİ</div>
        {[
          { name: 'İhtiyaç ve Talepler', icon: '＋' },
          { name: 'Piyasa Araştırması', icon: '⌕' },
          { name: 'Teklif Yönetimi', icon: '▧' },
          { name: 'Sipariş İşlemleri', icon: '▣' },
          { name: 'Sözleşmeler', icon: '▤' },
          { name: 'Muayene ve Kabul', icon: '✓' },
          { name: 'Ödeme İşlemleri', icon: '₺' }
        ].map((item) => (
          <div
            key={item.name}
            className={`simple-nav-item ${currentPage === item.name ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.name)}
          >
            <span className="simple-nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </div>
        ))}

        <div className="simple-nav-label">BELGE VE RAPORLAMA</div>
        {[
          { name: 'Doküman Havuzu', icon: '▱' },
          { name: 'Raporlar', icon: '▥' },
          { name: 'Ödenek Takibi', icon: '◫' }
        ].map((item) => (
          <div
            key={item.name}
            className={`simple-nav-item ${currentPage === item.name ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.name)}
          >
            <span className="simple-nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </div>
        ))}

        <div className="simple-nav-label">YÖNETİM</div>
        <div
          className={`simple-nav-item ${currentPage === 'Tedarikçi Yönetimi' ? 'active' : ''}`}
          onClick={() => setCurrentPage('Tedarikçi Yönetimi')}
        >
          <span className="simple-nav-icon">♙</span>
          <span>Tedarikçi Yönetimi</span>
        </div>
        <div
          className={`simple-nav-item ${currentPage === 'Tanımlar ve Ayarlar' ? 'active' : ''}`}
          onClick={() => setCurrentPage('Tanımlar ve Ayarlar')}
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

      {/* MAIN VIEW */}
      <main className="simple-main">
        <div className="simple-breadcrumb">
          TEMİN 360 <span style={{ padding: '0 7px', color: '#b4bdc9' }}>/</span>
          <b>{currentPage}</b>
        </div>

        <div className="simple-page-head">
          <div>
            <div className="simple-eyebrow">SATIN ALMA VE İHALE YÖNETİMİ</div>
            <h1>{currentPage}</h1>
            <p className="simple-subtitle">
              {currentPage === 'Genel Bakış'
                ? 'Satın alma süreçlerinizi ve bekleyen işlemlerinizi tek noktadan takip edin.'
                : `${currentPage} çalışma alanı ve yönetim görünümü.`}
            </p>
          </div>
          <div className="simple-actions">
            <button className="simple-btn" onClick={() => window.print()}>
              ⇩ &nbsp; Raporu dışa aktar
            </button>
            <button
              className="simple-btn primary"
              onClick={() => setActiveModal('newFile')}
            >
              ＋ &nbsp; Yeni dosya oluştur
            </button>
          </div>
        </div>

        {/* 1. GENEL BAKIŞ */}
        {currentPage === 'Genel Bakış' && (
          <div>
            <section className="simple-stats">
              <div className="simple-stat">
                <div className="simple-stat-top">
                  Aktif dosyalar <span className="simple-stat-icon">▤</span>
                </div>
                <div className="simple-stat-value">{files.length}</div>
                <div className="simple-stat-note">
                  <span className="simple-positive">↑ 3</span> geçen aya göre
                </div>
              </div>
              <div className="simple-stat">
                <div className="simple-stat-top">
                  Onay bekleyen{' '}
                  <span
                    className="simple-stat-icon"
                    style={{ background: '#fff5e8', color: '#b7791f' }}
                  >
                    ◷
                  </span>
                </div>
                <div className="simple-stat-value">
                  {files.filter((f) => f.status === 'Onay bekliyor').length || '08'}
                </div>
                <div className="simple-stat-note">İşlem yapılması gerekiyor</div>
              </div>
              <div className="simple-stat">
                <div className="simple-stat-top">
                  Tamamlanan{' '}
                  <span
                    className="simple-stat-icon"
                    style={{ background: '#eaf7f0', color: '#23865b' }}
                  >
                    ✓
                  </span>
                </div>
                <div className="simple-stat-value">
                  {files.filter((f) => f.status === 'Tamamlandı').length || '17'}
                </div>
                <div className="simple-stat-note">
                  <span className="simple-positive">↑ 12%</span> tamamlanma oranı
                </div>
              </div>
              <div className="simple-stat">
                <div className="simple-stat-top">
                  Toplam dosya tutarı{' '}
                  <span
                    className="simple-stat-icon"
                    style={{ background: '#f2effb', color: '#7860b4' }}
                  >
                    ₺
                  </span>
                </div>
                <div className="simple-stat-value" style={{ fontSize: '20px' }}>
                  {money(files.reduce((acc, f) => acc + (f.amount || 0), 0))}
                </div>
                <div className="simple-stat-note">2026 mali yılı</div>
              </div>
            </section>

            <div className="simple-content-grid">
              <section className="simple-panel">
                <div className="simple-panel-head">
                  <div>
                    <div className="simple-panel-title">Son işlem gören dosyalar</div>
                    <div className="simple-panel-sub">Güncel satın alma ve ihale dosyaları</div>
                  </div>
                  <a
                    className="simple-link"
                    onClick={() => setCurrentPage('İhale Dosyaları')}
                  >
                    Tüm dosyaları gör →
                  </a>
                </div>
                <div className="simple-filters">
                  <div className="simple-field">
                    <input
                      placeholder="Dosya adı veya numarası ara..."
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                    />
                  </div>
                  <div className="simple-field">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tüm durumlar</option>
                      <option value="Hazırlanıyor">Hazırlanıyor</option>
                      <option value="Onay bekliyor">Onay bekliyor</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                      <option value="Arşivlendi">Arşivlendi</option>
                    </select>
                  </div>
                </div>
                <div className="simple-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Dosya bilgisi</th>
                        <th>İşlem türü</th>
                        <th>Oluşturma</th>
                        <th>Durum</th>
                        <th>Tutar</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.slice(0, 6).map((f) => (
                        <tr
                          key={f.id}
                          className="clickable"
                          onClick={() => {
                            setSelectedFileId(f.id)
                            setCurrentTab('Genel Bilgiler')
                            setCurrentPage('Dosya Detayı')
                          }}
                        >
                          <td>
                            <div className="file-title">{f.name}</div>
                            <div className="file-id">{f.id}</div>
                          </td>
                          <td>{f.type}</td>
                          <td>{f.date}</td>
                          <td>
                            <span className={`status ${statusClass(f.status)}`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="amount">{money(f.amount)}</td>
                          <td style={{ color: '#8491a3' }}>›</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="simple-panel-foot">
                  <span>{filteredFiles.length} kayıt gösteriliyor</span>
                  <span>1 / 1</span>
                </div>
              </section>

              <div className="simple-right-stack">
                <section className="simple-panel">
                  <div className="simple-panel-head">
                    <div>
                      <div className="simple-panel-title">Hızlı işlemler</div>
                      <div className="simple-panel-sub">Sık kullanılan işlemler</div>
                    </div>
                  </div>
                  <div className="simple-quick-list">
                    <div
                      className="simple-quick"
                      onClick={() => setActiveModal('newFile')}
                    >
                      <div className="simple-quick-ico">＋</div>
                      <div>
                        <strong>Yeni dosya tanımla</strong>
                        <small>Satın alma dosyası oluştur</small>
                      </div>
                      <span className="arrow">›</span>
                    </div>
                    <div
                      className="simple-quick"
                      onClick={() => {
                        setCurrentTab('İhtiyaç Kalemleri')
                        setCurrentPage('Dosya Detayı')
                      }}
                    >
                      <div className="simple-quick-ico">☷</div>
                      <div>
                        <strong>İhtiyaç listesi oluştur</strong>
                        <small>Mal ve hizmet kalemlerini ekle</small>
                      </div>
                      <span className="arrow">›</span>
                    </div>
                    <div
                      className="simple-quick"
                      onClick={() => {
                        setCurrentTab('Teklifler')
                        setCurrentPage('Dosya Detayı')
                      }}
                    >
                      <div className="simple-quick-ico">▧</div>
                      <div>
                        <strong>Teklifleri değerlendir</strong>
                        <small>Gelen teklifleri karşılaştır</small>
                      </div>
                      <span className="arrow">›</span>
                    </div>
                    <div
                      className="simple-quick"
                      onClick={() => {
                        setCurrentTab('Belgeler')
                        setCurrentPage('Dosya Detayı')
                      }}
                    >
                      <div className="simple-quick-ico">▤</div>
                      <div>
                        <strong>Belge oluştur</strong>
                        <small>İşlem belgelerini hazırla</small>
                      </div>
                      <span className="arrow">›</span>
                    </div>
                  </div>
                </section>

                <section className="simple-panel">
                  <div className="simple-panel-head">
                    <div>
                      <div className="simple-panel-title">Son aktiviteler</div>
                      <div className="simple-panel-sub">Sistemdeki son hareketler</div>
                    </div>
                  </div>
                  <div className="simple-activity">
                    <div className="simple-activity-item">
                      <div className="simple-activity-dot" />
                      <div className="simple-activity-text">
                        <b>{selectedFile.id}</b> dosyası güncellendi.
                        <small>{adminName || 'İlyas Bozdemir'} · Az önce</small>
                      </div>
                    </div>
                    <div className="simple-activity-item">
                      <div
                        className="simple-activity-dot"
                        style={{ background: '#23865b', borderColor: '#d9f0e3' }}
                      />
                      <div className="simple-activity-text">
                        <b>DT-2026-0039</b> dosyası onaylandı.
                        <small>Satın Alma Birimi · 2 saat önce</small>
                      </div>
                    </div>
                    <div className="simple-activity-item">
                      <div
                        className="simple-activity-dot"
                        style={{ background: '#b7791f', borderColor: '#fff0d8' }}
                      />
                      <div className="simple-activity-text">
                        <b>Fiyat araştırması</b> sisteme kaydedildi.
                        <small>Sistem · Dün</small>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* 2. İHALE DOSYALARI */}
        {currentPage === 'İhale Dosyaları' && (
          <div className="workspace">
            <section className="simple-panel">
              <div className="simple-panel-head">
                <div>
                  <div className="simple-panel-title">Satın alma ve ihale dosyaları</div>
                  <div className="simple-panel-sub">Dosyayı açmak için satıra tıklayın</div>
                </div>
              </div>
              <div className="simple-filters">
                <div className="simple-field">
                  <input
                    placeholder="Dosya adı veya numarası ara..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                  />
                </div>
                <div className="simple-field">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tüm durumlar</option>
                    <option value="Hazırlanıyor">Hazırlanıyor</option>
                    <option value="Onay bekliyor">Onay bekliyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Arşivlendi">Arşivlendi</option>
                  </select>
                </div>
                <button
                  className="simple-btn primary"
                  onClick={() => setActiveModal('newFile')}
                >
                  ＋ Yeni dosya
                </button>
              </div>
              <div className="simple-table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Dosya</th>
                      <th>Tür</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                      <th>Tutar</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((f) => (
                      <tr
                        key={f.id}
                        className="clickable"
                        onClick={() => {
                          setSelectedFileId(f.id)
                          setCurrentTab('Genel Bilgiler')
                          setCurrentPage('Dosya Detayı')
                        }}
                      >
                        <td>
                          <div className="file-title">{f.name}</div>
                          <div className="file-id">
                            {f.id}
                            {f.id === selectedFileId && (
                              <span style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: '6px' }}>
                                ● AKTİF
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{f.type}</td>
                        <td>{f.date}</td>
                        <td>
                          <span className={`status ${statusClass(f.status)}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="amount">{money(f.amount)}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 700 }}>Aç ›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 3. DOSYA DETAYI */}
        {currentPage === 'Dosya Detayı' && (
          <div className="workspace">
            <div className="toolbar">
              <button
                className="simple-btn"
                onClick={() => setCurrentPage('İhale Dosyaları')}
              >
                ← Dosyalara dön
              </button>
              <button
                className="simple-btn primary"
                onClick={() => setCurrentPage('Belge Önizleme')}
              >
                A4 belge önizle
              </button>
              <span className="pill">{selectedFile.id}</span>
              <span className={`status ${statusClass(selectedFile.status)}`}>
                {selectedFile.status}
              </span>
            </div>

            <section className="simple-panel">
              <div className="tabs">
                {[
                  'Genel Bilgiler',
                  'İhtiyaç Kalemleri',
                  'Teklifler',
                  'Belgeler',
                  'İmza Rotası',
                  'İşlem Geçmişi'
                ].map((t) => (
                  <button
                    key={t}
                    className={`tab ${currentTab === t ? 'active' : ''}`}
                    onClick={() => setCurrentTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="panel-body">
                {currentTab === 'Genel Bilgiler' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Dosya numarası</label>
                      <input value={selectedFile.id} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Dosya adı / Konusu</label>
                      <input value={selectedFile.name} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Alım usulü</label>
                      <input value={selectedFile.type} readOnly />
                    </div>
                    <div className="form-group">
                      <label>İlgili birim</label>
                      <input value={selectedFile.unit} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Açılış tarihi</label>
                      <input value={selectedFile.date} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Tahmini tutar</label>
                      <input value={money(selectedFile.amount)} readOnly />
                    </div>
                  </div>
                )}

                {currentTab === 'İhtiyaç Kalemleri' && (
                  <div className="workspace">
                    <div className="toolbar">
                      <button
                        className="simple-btn primary"
                        onClick={() => setActiveModal('addItem')}
                      >
                        ＋ Kalem ekle
                      </button>
                    </div>
                    <div className="simple-table-wrap">
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>Kalem</th>
                            <th>Miktar</th>
                            <th>Birim</th>
                            <th>Birim fiyat</th>
                            <th>Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((x, i) => (
                            <tr key={i}>
                              <td>{x.name}</td>
                              <td>{x.qty}</td>
                              <td>{x.unit}</td>
                              <td>{money(x.price)}</td>
                              <td className="amount">{money(x.qty * x.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <strong>
                        Toplam:{' '}
                        {money(
                          items.reduce((acc, x) => acc + x.qty * x.price, 0)
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                {currentTab === 'Teklifler' && (
                  <div className="workspace">
                    <div className="toolbar">
                      <button
                        className="simple-btn primary"
                        onClick={() => setActiveModal('addOffer')}
                      >
                        ＋ Teklif ekle
                      </button>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        En düşük uygun teklif karşılaştırması
                      </span>
                    </div>
                    <div className="simple-table-wrap">
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>Firma</th>
                            <th>Teklif tutarı</th>
                            <th>Değerlendirme</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offers.map((o, idx) => (
                            <tr key={idx}>
                              <td>{o.company}</td>
                              <td className="amount">{money(o.price)}</td>
                              <td>
                                <span
                                  className={`status ${
                                    o.valid === 'Uygun' ? 's-green' : 's-orange'
                                  }`}
                                >
                                  {o.valid}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {currentTab === 'Belgeler' && (
                  <div className="workspace">
                    <div className="toolbar">
                      <button
                        className="simple-btn primary"
                        onClick={() => setCurrentPage('Belge Önizleme')}
                      >
                        A4 Önizle
                      </button>
                    </div>
                    <div className="simple-table-wrap">
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>Belge adı</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            'İhtiyaç talep formu',
                            'Piyasa fiyat araştırma tutanağı',
                            'Yaklaşık maliyet cetveli',
                            'Onay belgesi',
                            'Muayene ve kabul tutanağı'
                          ].map((x, idx) => (
                            <tr key={idx}>
                              <td>{x}</td>
                              <td>
                                <span className={`status ${idx < 2 ? 's-green' : 's-blue'}`}>
                                  {idx < 2 ? 'Hazır' : 'Taslak'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="simple-btn"
                                  onClick={() => setCurrentPage('Belge Önizleme')}
                                >
                                  Önizle
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {currentTab === 'İmza Rotası' && (
                  <div className="workspace">
                    <div className="step-row">
                      <div className="step done">
                        1 · Hazırlayan
                        <br />
                        <b>{adminName || 'Satın Alma Personeli'}</b>
                      </div>
                      <div className="step current">
                        2 · Kontrol Eden
                        <br />
                        <b>Birim Yetkilisi</b>
                      </div>
                      <div className="step">
                        3 · Onaylayan
                        <br />
                        <b>Harcama Yetkilisi</b>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      İmza rotası şablon ve mevzuat bazında dinamik olarak yapılandırılabilir.
                    </p>
                  </div>
                )}

                {currentTab === 'İşlem Geçmişi' && (
                  <div>
                    <div className="step-row">
                      <span className="step done">✓ Dosya açıldı</span>
                      <span className="step done">✓ İhtiyaçlar kaydedildi</span>
                      <span className="step current">◷ Onay bekliyor</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 4. BELGE ÖNİZLEME (A4) */}
        {currentPage === 'Belge Önizleme' && (
          <div className="workspace">
            <div className="toolbar">
              <button
                className="simple-btn"
                onClick={() => setCurrentPage('Dosya Detayı')}
              >
                ← Dosya detayına dön
              </button>
              <button
                className="simple-btn primary"
                onClick={() => window.print()}
              >
                Yazdır / PDF
              </button>
              <span className="pill">A4 belge önizleme</span>
            </div>

            <section className="simple-panel">
              <div className="a4-paper">
                <div className="letterhead">
                  <b>
                    T.C.
                    <br />
                    {institutionName ? institutionName.toUpperCase() : 'GÜNEYYURT BELEDİYE BAŞKANLIĞI'}
                  </b>
                  <br />
                  Satın Alma Birimi
                </div>
                <h2>PİYASA FİYAT ARAŞTIRMA TUTANAĞI</h2>
                <p>
                  <b>Dosya No:</b> {selectedFile.id}
                </p>
                <p>
                  <b>Alımın konusu:</b> {selectedFile.name}
                </p>
                <p>
                  <b>Alım usulü:</b> {selectedFile.type}
                </p>
                <p>İlgili alıma ilişkin piyasa fiyat araştırması teklif bilgileri aşağıda listelenmiştir:</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Firma</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Teklif Tutarı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '6px' }}>{o.company}</td>
                        <td style={{ textAlign: 'right', padding: '6px' }}>{money(o.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '65px',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    Hazırlayan
                    <br />
                    <br />
                    {adminName || 'Satın Alma Personeli'}
                  </div>
                  <div>
                    Onaylayan
                    <br />
                    <br />
                    Harcama Yetkilisi
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 5. DİĞER MODÜL GÖRÜNÜMLERİ (İhtiyaç, Teklif, Ödeme, vb.) */}
        {![
          'Genel Bakış',
          'İhale Dosyaları',
          'Dosya Detayı',
          'Belge Önizleme'
        ].includes(currentPage) && (
          <div className="workspace">
            <section className="simple-panel">
              <div className="simple-panel-head">
                <div>
                  <div className="simple-panel-title">{currentPage} Yönetimi</div>
                  <div className="simple-panel-sub">
                    {currentPage} kayıt ve işlem listesi
                  </div>
                </div>
              </div>

              {currentPage === 'Tanımlar ve Ayarlar' ? (
                <div className="panel-body space-y-6">
                  {/* ARAYÜZ DÜZENİ SEÇİM KARTI */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Arayüz Düzeni (Çalışma Ekranı Modu)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Şu anda <b>Basit Ekran (Sade Yönetim Paneli)</b> görünümündesiniz.
                        Dilediğiniz zaman sekmeli gelişmiş ekrana dönebilirsiniz.
                      </div>
                    </div>
                    <button
                      className="simple-btn primary"
                      onClick={() => {
                        setLayoutMode('advanced')
                        showToast('Gelişmiş Ekran düzenine geçildi')
                      }}
                    >
                      Gelişmiş Ekrana Geç ↗
                    </button>
                  </div>

                  <div className="simple-table-wrap">
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Tanım Adı</th>
                          <th>Açıklama</th>
                          <th>Kapsam</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          'Kurum bilgileri',
                          'Birimler',
                          'Personeller',
                          'Alım usulleri',
                          'Belge şablonları',
                          'İmza rotaları'
                        ].map((n, idx) => (
                          <tr key={idx}>
                            <td>{n}</td>
                            <td>Merkezi yapılandırma kaydı</td>
                            <td>Kurum</td>
                            <td>
                              <span className="status s-blue">Tanımlı</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="simple-table-wrap">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Kayıt / Konu</th>
                        <th>İlişkili Dosya</th>
                        <th>Tutar / Bilgi</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.slice(0, 5).map((f, i) => (
                        <tr
                          key={f.id}
                          className="clickable"
                          onClick={() => {
                            setSelectedFileId(f.id)
                            setCurrentTab('Genel Bilgiler')
                            setCurrentPage('Dosya Detayı')
                          }}
                        >
                          <td>
                            <div className="file-title">
                              {currentPage} Kaydı #{i + 1}
                            </div>
                            <div className="file-id">{f.name}</div>
                          </td>
                          <td>{f.id}</td>
                          <td className="amount">{money(f.amount)}</td>
                          <td>
                            <span className={`status ${statusClass(f.status)}`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="simple-notice">
          <span>ⓘ</span>
          <div>
            <b>Bilgilendirme:</b> Basit Ekran arayüzü entegre edilmiştir. Ayarlar üzerinden
            dilediğiniz zaman Gelişmiş Ekran ve Basit Ekran arasında geçiş yapabilirsiniz.
          </div>
        </div>
      </main>

      {/* MODAL ROOT */}
      {activeModal === 'newFile' && (
        <div className="simple-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simple-panel-head">
              <b>Yeni Satın Alma Dosyası</b>
              <button
                className="simple-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <form
              className="panel-body workspace"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const name = String(fd.get('name') || '')
                const type = String(fd.get('type') || 'Doğrudan Temin')
                const amount = Number(fd.get('amount')) || 0
                const unit = String(fd.get('unit') || 'Satın Alma Birimi')
                const newF: SimpleFile = {
                  id: `DT-2026-${String(43 + files.length).padStart(4, '0')}`,
                  name,
                  type,
                  date: new Date().toLocaleDateString('tr-TR'),
                  status: 'Hazırlanıyor',
                  amount,
                  unit
                }
                setFiles([newF, ...files])
                setSelectedFileId(newF.id)
                setActiveModal(null)
                setCurrentTab('Genel Bilgiler')
                setCurrentPage('Dosya Detayı')
                showToast('Dosya başarıyla oluşturuldu: ' + newF.id)
              }}
            >
              <div className="form-group">
                <label>Dosya konusu / Alım Adı</label>
                <input
                  name="name"
                  required
                  placeholder="Örn: Hizmet binası bakım ve onarım işi"
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Alım usulü</label>
                  <select name="type">
                    <option value="Doğrudan Temin">Doğrudan Temin</option>
                    <option value="Açık İhale">Açık İhale</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tahmini tutar (₺)</label>
                  <input name="amount" type="number" defaultValue="0" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>İlgili birim</label>
                <input name="unit" defaultValue="Satın Alma Birimi" />
              </div>
              <button className="simple-btn primary" type="submit">
                Dosyayı Oluştur
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'addItem' && (
        <div className="simple-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simple-panel-head">
              <b>İhtiyaç Kalemi Ekle</b>
              <button
                className="simple-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <form
              className="panel-body workspace"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const name = String(fd.get('name') || '')
                const qty = Number(fd.get('qty')) || 1
                const unit = String(fd.get('unit') || 'Adet')
                const price = Number(fd.get('price')) || 0
                setItems([...items, { name, qty, unit, price }])
                setActiveModal(null)
                showToast('Kalem eklendi: ' + name)
              }}
            >
              <div className="form-group">
                <label>Kalem adı</label>
                <input name="name" required placeholder="Malzeme veya hizmet adı" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Miktar</label>
                  <input name="qty" type="number" min="1" defaultValue="1" required />
                </div>
                <div className="form-group">
                  <label>Ölçü Birimi</label>
                  <input name="unit" defaultValue="Adet" required />
                </div>
              </div>
              <div className="form-group">
                <label>Birim fiyat (₺)</label>
                <input name="price" type="number" defaultValue="0" min="0" />
              </div>
              <button className="simple-btn primary" type="submit">
                Kalemi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'addOffer' && (
        <div className="simple-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simple-panel-head">
              <b>Teklif Ekle</b>
              <button
                className="simple-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <form
              className="panel-body workspace"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const company = String(fd.get('company') || '')
                const price = Number(fd.get('price')) || 0
                setOffers([...offers, { company, price, valid: 'Uygun' }])
                setActiveModal(null)
                showToast('Teklif eklendi: ' + company)
              }}
            >
              <div className="form-group">
                <label>Firma Ünvanı</label>
                <input name="company" required placeholder="Firma adını yazın" />
              </div>
              <div className="form-group">
                <label>Teklif Tutarı (₺)</label>
                <input name="price" type="number" defaultValue="0" min="0" required />
              </div>
              <button className="simple-btn primary" type="submit">
                Teklifi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST ROOT */}
      {toastMsg && <div className="simple-toast">{toastMsg}</div>}
    </div>
  )
}
