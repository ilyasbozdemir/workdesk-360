import React from 'react'

export interface SimpleStylesProps {
  isCollapsed: boolean
}

export const SimpleStyles: React.FC<SimpleStylesProps> = ({ isCollapsed }) => {
  return (
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
        --sidebar: ${isCollapsed ? '68px' : '258px'};
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
        transition: grid-template-columns 0.2s ease;
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
        color: var(--primary);
        border: 0;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .simple-top-spacer { flex: 1; }

      .simple-top-search {
        position: relative;
        width: 260px;
      }
      .simple-top-search input {
        width: 100%;
        background: var(--surface-2);
        border: 1px solid var(--line);
        color: var(--text);
        padding: 7px 11px 7px 31px;
        border-radius: 8px;
        font-size: 12px;
        outline: none;
      }
      .simple-top-search::before {
        content: "🔍";
        position: absolute;
        left: 10px;
        top: 8px;
        font-size: 11px;
        opacity: .6;
      }

      .simple-icon-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--text);
        display: grid;
        place-items: center;
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
        transition: width 0.2s ease, padding 0.2s ease;
      }
      .simple-sidebar.collapsed {
        padding: 16px 6px 20px;
      }
      .simple-sidebar.collapsed .simple-nav-label {
        display: none;
      }
      .simple-sidebar.collapsed .simple-nav-item {
        justify-content: center;
        padding: 10px 0;
        margin: 4px 0;
      }
      .simple-sidebar.collapsed .simple-nav-item span:not(.simple-nav-icon) {
        display: none;
      }
      .simple-sidebar.collapsed .simple-nav-count {
        display: none;
      }
      .simple-sidebar.collapsed .simple-sidebar-bottom {
        display: none;
      }

      .simple-tabs-bar {
        background: var(--surface);
        border-bottom: 1px solid var(--line);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 20px 0;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: thin;
      }
      .simple-tab-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 8px 8px 0 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
        border: 1px solid transparent;
        border-bottom: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        position: relative;
      }
      .simple-tab-pill:hover {
        color: var(--text);
        background: var(--surface-2);
      }
      .simple-tab-pill.active {
        color: var(--primary);
        background: var(--bg);
        border-color: var(--line);
        font-weight: 700;
      }
      .simple-tab-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        color: var(--muted);
        transition: 0.1s;
      }
      .simple-tab-close:hover {
        background: rgba(0,0,0,0.1);
        color: var(--danger);
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
        gap: 8px;
      }
      .simple-btn {
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--text);
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .simple-btn:hover { background: var(--surface-2); }
      .simple-btn.primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
      .simple-btn.primary:hover { background: var(--primary-2); }

      .simple-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 22px;
      }
      .simple-stat {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 16px;
      }
      .simple-stat-top {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 12px;
      }
      .simple-stat-icon {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        display: grid;
        place-items: center;
        background: var(--primary-soft);
        color: var(--primary);
        font-weight: 800;
      }
      .simple-stat-value {
        font-size: 26px;
        font-weight: 800;
        margin: 7px 0 2px;
      }
      .simple-stat-note {
        font-size: 11px;
        color: var(--muted);
      }
      .simple-positive { color: var(--success); font-weight: 700; }

      .simple-panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      }
      .simple-panel-head {
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .simple-panel-title {
        font-weight: 750;
        font-size: 14px;
      }
      .simple-panel-sub {
        font-size: 11px;
        color: var(--muted);
      }

      .simple-table-wrap {
        overflow-x: auto;
      }
      .simple-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .simple-table th {
        background: var(--surface-2);
        color: var(--muted);
        font-size: 11px;
        text-align: left;
        padding: 10px 18px;
        border-bottom: 1px solid var(--line);
      }
      .simple-table td {
        padding: 12px 18px;
        border-bottom: 1px solid var(--line);
      }
      .simple-table tr:last-child td { border-bottom: 0; }
      .simple-table tr.clickable { cursor: pointer; }
      .simple-table tr.clickable:hover td { background: var(--surface-2); }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
      }
      .s-orange { background: #fff5e8; color: #b7791f; }
      .s-blue { background: #ebf5fa; color: #1f77b4; }
      .s-green { background: #eaf7f0; color: #23865b; }
      .s-gray { background: #f0f2f5; color: #626f84; }

      .simple-notice {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 9px;
        background: #fdf6ea;
        border: 1px solid #f2dfbd;
        color: #7d5718;
        font-size: 12px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .simple-root.dark .simple-notice {
        background: #2b2518;
        border-color: #4a3e26;
        color: #f1cf8a;
      }

      .simple-tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--line);
        padding: 0 16px;
        background: var(--surface);
      }
      .simple-tab-btn {
        padding: 11px 14px;
        border: 0;
        background: transparent;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      .simple-tab-btn.active {
        color: var(--primary);
        border-color: var(--primary);
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        padding: 18px;
      }
      .detail-card {
        border: 1px solid var(--line);
        border-radius: 9px;
        padding: 12px;
        background: var(--surface-2);
      }
      .detail-card label {
        font-size: 10px;
        color: var(--muted);
        text-transform: uppercase;
        font-weight: 800;
        display: block;
        margin-bottom: 4px;
      }
      .detail-card strong {
        font-size: 13px;
        color: var(--text);
      }

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
  )
}
