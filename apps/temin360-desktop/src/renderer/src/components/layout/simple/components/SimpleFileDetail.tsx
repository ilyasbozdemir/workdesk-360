import React from 'react'
import { SimpleFile, ItemRecord, OfferRecord } from '../types'

export interface SimpleFileDetailProps {
  selectedFile: SimpleFile
  currentTab: string
  setCurrentTab: (tab: string) => void
  items: ItemRecord[]
  offers: OfferRecord[]
  onOpenNewItemModal: () => void
  onOpenNewOfferModal: () => void
  onOpenPreview: () => void
}

export const SimpleFileDetail: React.FC<SimpleFileDetailProps> = ({
  selectedFile,
  currentTab,
  setCurrentTab,
  items,
  offers,
  onOpenNewItemModal,
  onOpenNewOfferModal,
  onOpenPreview
}) => {
  const money = (n: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(n)

  return (
    <div className="workspace">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <b style={{ fontSize: 16 }}>{selectedFile.id} · {selectedFile.name}</b>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {selectedFile.unit} · {selectedFile.type} · {selectedFile.date}
          </div>
        </div>
        <button
          className="simple-btn primary"
          onClick={onOpenPreview}
        >
          📄 A4 Belge Önizleme Masası ↗
        </button>
      </div>

      <section className="simple-panel">
        <div className="simple-tabs">
          {[
            'Genel Bilgiler',
            'İhtiyaç Listesi',
            'Teklifler & Piyasa',
            'Onay & Karar',
            'Muayene & Kabul'
          ].map((tab) => (
            <button
              key={tab}
              className={`simple-tab-btn ${currentTab === tab ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 1. GENEL BİLGİLER SEKME */}
        {currentTab === 'Genel Bilgiler' && (
          <div className="detail-grid">
            <div className="detail-card">
              <label>Dosya No &amp; Kod</label>
              <strong>{selectedFile.id}</strong>
            </div>
            <div className="detail-card">
              <label>Alımın Konusu</label>
              <strong>{selectedFile.name}</strong>
            </div>
            <div className="detail-card">
              <label>Alım Usulü</label>
              <strong>{selectedFile.type}</strong>
            </div>
            <div className="detail-card">
              <label>Harcama Birimi</label>
              <strong>{selectedFile.unit}</strong>
            </div>
            <div className="detail-card">
              <label>Yaklaşık Maliyet</label>
              <strong>{money(selectedFile.amount)}</strong>
            </div>
            <div className="detail-card">
              <label>Süreç Durumu</label>
              <strong style={{ color: 'var(--primary)' }}>{selectedFile.status}</strong>
            </div>
          </div>
        )}

        {/* 2. İHTİYAÇ LİSTESİ */}
        {currentTab === 'İhtiyaç Listesi' && (
          <div>
            <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 700 }}>Alım Kalemleri Listesi</div>
              <button
                className="simple-btn"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={onOpenNewItemModal}
              >
                ＋ Kalem Ekle
              </button>
            </div>
            <div className="simple-table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Kalem Tanımı</th>
                    <th>Miktar</th>
                    <th>Birim</th>
                    <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                    <th style={{ textAlign: 'right' }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td>{it.qty}</td>
                      <td>{it.unit}</td>
                      <td style={{ textAlign: 'right' }}>{money(it.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(it.qty * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. TEKLİFLER & PİYASA */}
        {currentTab === 'Teklifler & Piyasa' && (
          <div>
            <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 700 }}>İstekli Firma Teklifleri</div>
              <button
                className="simple-btn"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={onOpenNewOfferModal}
              >
                ＋ Teklif Ekle
              </button>
            </div>
            <div className="simple-table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Firma Unvanı</th>
                    <th style={{ textAlign: 'right' }}>Teklif Tutarı</th>
                    <th>Durum / Geçerlilik</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{o.company}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(o.price)}</td>
                      <td>
                        <span className="status s-green">{o.valid}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ONAY & KARAR */}
        {currentTab === 'Onay & Karar' && (
          <div style={{ padding: 18, spaceY: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Doğrudan Temin Onay &amp; Karar Belgesi</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              4734 Sayılı Kamu İhale Kanununun 22/d maddesi gereğince harcama yetkilisinden alınan onay ve ihale kararı belgesidir.
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="pill">Onay Belgesi Hazır</span>
            </div>
          </div>
        )}

        {/* 5. MUAYENE & KABUL */}
        {currentTab === 'Muayene & Kabul' && (
          <div style={{ padding: 18, spaceY: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Muayene ve Kabul Komisyonu Tutanağı</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              Teslim edilen mal/hizmet kalemlerinin teknik şartnameye ve piyasa araştırmasına uygunluğunun komisyonca tutanağa bağlandığı belgedir.
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="pill">Muayene Aşaması Bekleniyor</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
