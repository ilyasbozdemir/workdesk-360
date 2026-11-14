import React from 'react'
import { SABLON_KATEGORILERI } from '../../../../constants/sablonKategorileri'
import { TEMPLATE_NAMES } from '../../../../../shared/constants/templateConstants'

export interface SimpleTemplateGalleryProps {
  onSelectTemplateForPreview: (templateId: string) => void
  onOpenDocumentEngineModal: (templateId: string, title?: string) => void
  onGoToPreview: () => void
}

export const SimpleTemplateGallery: React.FC<SimpleTemplateGalleryProps> = ({
  onSelectTemplateForPreview,
  onOpenDocumentEngineModal,
  onGoToPreview
}) => {
  return (
    <div className="workspace space-y-6">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <b style={{ fontSize: 16 }}>Resmî Belge ve Şablon Havuzu</b>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Gelişmiş ekranla %100 uyumlu, Document Engine destekli {SABLON_KATEGORILERI.reduce((acc, k) => acc + k.sablonlar.length, 0)} adet şablon
          </div>
        </div>
        <button
          className="simple-btn primary"
          onClick={onGoToPreview}
        >
          A4 Belge Önizleme Masasına Git ↗
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SABLON_KATEGORILERI.map((kat) => (
          <section key={kat.klasorAdi} className="simple-panel">
            <div className="simple-panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pill">{kat.sablonlar.length} Şablon</span>
                <div className="simple-panel-title">{kat.kategori}</div>
              </div>
            </div>
            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {kat.sablonlar.map((sablonId) => {
                const sablonBaslik = TEMPLATE_NAMES[sablonId] || sablonId.replace(/-/g, ' ').toUpperCase()
                return (
                  <div
                    key={sablonId}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      background: 'var(--surface-2)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                        {sablonBaslik}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>
                        kod: {sablonId}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="simple-btn"
                        style={{ flex: 1, padding: '6px 10px', fontSize: 11 }}
                        onClick={() => onSelectTemplateForPreview(sablonId)}
                      >
                        Sade Önizle
                      </button>
                      <button
                        className="simple-btn primary"
                        style={{ flex: 1, padding: '6px 10px', fontSize: 11 }}
                        onClick={() => onOpenDocumentEngineModal(sablonId, sablonBaslik)}
                      >
                        Aç &amp; Düzenle ↗
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
