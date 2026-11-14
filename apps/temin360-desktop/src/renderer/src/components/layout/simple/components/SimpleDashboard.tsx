import React from 'react'
import { SimpleFile } from '../types'

export interface SimpleDashboardProps {
  files: SimpleFile[]
  filteredFiles: SimpleFile[]
  fileSearch: string
  setFileSearch: (q: string) => void
  statusFilter: string
  setStatusFilter: (s: string) => void
  onSelectFile: (file: SimpleFile) => void
  onOpenNewFileModal: () => void
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
  files,
  filteredFiles,
  fileSearch,
  setFileSearch,
  statusFilter,
  setStatusFilter,
  onSelectFile,
  onOpenNewFileModal
}) => {
  const money = (n: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(n)

  const statusClass = (s: string) =>
    s === 'Tamamlandı' ? 's-green' : s === 'Onay bekliyor' ? 's-orange' : s === 'Hazırlanıyor' ? 's-blue' : 's-gray'

  return (
    <div>
      {/* 4 ÖZET KART */}
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
          <div className="simple-stat-note">Bu mali yıl içinde</div>
        </div>
        <div className="simple-stat">
          <div className="simple-stat-top">
            Toplam hacim <span className="simple-stat-icon">₺</span>
          </div>
          <div className="simple-stat-value" style={{ fontSize: 20 }}>
            {money(files.reduce((acc, f) => acc + (f.amount || 0), 0))}
          </div>
          <div className="simple-stat-note">Aktif bütçe takibi</div>
        </div>
      </section>

      {/* SÜREÇ AŞAMALARI */}
      <section className="simple-panel">
        <div className="simple-panel-head">
          <div>
            <div className="simple-panel-title">Satın Alma ve Doğrudan Temin Süreçleri</div>
            <div className="simple-panel-sub">Standart 4734 sayılı kanun süreç kılavuzu</div>
          </div>
          <span className="pill">4 aşamalı iş akışı</span>
        </div>
        <div style={{ padding: 18 }}>
          <div className="step-row">
            <div className="step done" style={{ flex: 1 }}>
              <b>1. Hazırlık &amp; İhtiyaç</b>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Talep formu, lüzum müzekkeresi ve yaklaşık maliyet cetveli
              </div>
            </div>
            <div className="step done" style={{ flex: 1 }}>
              <b>2. Teklifler &amp; Piyasa</b>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Fiyat araştırma mektubu, teklif zarfları ve mukayese tutanağı
              </div>
            </div>
            <div className="step current" style={{ flex: 1 }}>
              <b>3. Onay &amp; Sipariş</b>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Harcama yetkilisi onayı, sözleşme ve sipariş mektubu
              </div>
            </div>
            <div className="step" style={{ flex: 1 }}>
              <b>4. Muayene &amp; Kabul</b>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Kabul komisyonu tutanağı, fatura dökümü ve ödeme emri
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SON DOSYALAR TABLOSU */}
      <section className="simple-panel">
        <div className="simple-panel-head">
          <div>
            <div className="simple-panel-title">Son Satın Alma ve Temin Dosyaları</div>
            <div className="simple-panel-sub">
              Sistemde kayıtlı toplam {files.length} dosyadan son işlemler
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Dosyalarda ara..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)'
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)'
              }}
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
                <th>Dosya No &amp; İhale Adı</th>
                <th>Alım Türü</th>
                <th>Birim</th>
                <th>Tarih</th>
                <th>Yaklaşık Tutar</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((f) => (
                <tr
                  key={f.id}
                  className="clickable"
                  onClick={() => onSelectFile(f)}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {f.id}
                    </div>
                  </td>
                  <td>
                    <span className="pill">{f.type}</span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{f.unit}</td>
                  <td>{f.date}</td>
                  <td style={{ fontWeight: 700 }}>{money(f.amount)}</td>
                  <td>
                    <span className={`status ${statusClass(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="simple-btn"
                      style={{ padding: '4px 9px', fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectFile(f)
                      }}
                    >
                      Aç ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
