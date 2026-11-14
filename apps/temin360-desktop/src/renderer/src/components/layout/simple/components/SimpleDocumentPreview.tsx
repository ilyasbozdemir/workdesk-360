import React from 'react'
import { SimpleFile, OfferRecord } from '../types'
import { SABLON_KATEGORILERI } from '../../../../constants/sablonKategorileri'
import { TEMPLATE_NAMES } from '../../../../../shared/constants/templateConstants'

export interface SimpleDocumentPreviewProps {
  selectedFile: SimpleFile
  selectedTemplateId: string
  setSelectedTemplateId: (id: string) => void
  institutionName?: string
  adminName?: string
  offers: OfferRecord[]
  onBackToDetail: () => void
  onOpenDocumentEngineModal: (templateId: string) => void
}

export const SimpleDocumentPreview: React.FC<SimpleDocumentPreviewProps> = ({
  selectedFile,
  selectedTemplateId,
  setSelectedTemplateId,
  institutionName,
  adminName,
  offers,
  onBackToDetail,
  onOpenDocumentEngineModal
}) => {
  const money = (n: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(n)

  return (
    <div className="workspace">
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <button
          className="simple-btn"
          onClick={onBackToDetail}
        >
          ← Dosya detayına dön
        </button>

        {/* GELİŞMİŞ ŞABLON SEÇİCİ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Şablon:</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--text)'
            }}
          >
            {SABLON_KATEGORILERI.flatMap((k) =>
              k.sablonlar.map((s) => (
                <option key={s} value={s}>
                  {k.kategori.slice(0, 18)} · {TEMPLATE_NAMES[s] || s}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          className="simple-btn"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
          onClick={() => onOpenDocumentEngineModal(selectedTemplateId)}
          title="Gelişmiş Belge Motoru & Snapshot Modalı ile Aç"
        >
          ⊞ Tam Sayfa Düzenle (Document Engine) ↗
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
          <h2>{TEMPLATE_NAMES[selectedTemplateId] || 'PİYASA FİYAT ARAŞTIRMA TUTANAĞI'}</h2>
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
  )
}
