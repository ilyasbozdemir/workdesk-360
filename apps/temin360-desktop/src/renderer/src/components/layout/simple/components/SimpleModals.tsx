import React from 'react'
import { SimpleFile, ItemRecord, OfferRecord } from '../types'

export interface SimpleModalsProps {
  activeModal: string | null
  setActiveModal: (m: string | null) => void
  filesCount: number
  onAddFile: (f: SimpleFile) => void
  onAddItem: (it: ItemRecord) => void
  onAddOffer: (o: OfferRecord) => void
}

export const SimpleModals: React.FC<SimpleModalsProps> = ({
  activeModal,
  setActiveModal,
  filesCount,
  onAddFile,
  onAddItem,
  onAddOffer
}) => {
  if (!activeModal) return null

  return (
    <>
      {/* 1. YENİ DOSYA MODALI */}
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
              style={{ padding: 18 }}
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const name = String(fd.get('name') || '')
                const type = String(fd.get('type') || 'Doğrudan Temin')
                const amount = Number(fd.get('amount')) || 0
                const unit = String(fd.get('unit') || 'Satın Alma Birimi')
                const newF: SimpleFile = {
                  id: `DT-2026-${String(43 + filesCount).padStart(4, '0')}`,
                  name: name || 'Yeni Temin Dosyası',
                  type,
                  date: new Date().toLocaleDateString('tr-TR'),
                  status: 'Hazırlanıyor',
                  amount,
                  unit
                }
                onAddFile(newF)
                setActiveModal(null)
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Alımın Konusu / Başlık</label>
                  <input
                    name="name"
                    required
                    placeholder="Örn: Hizmet binası onarımı..."
                    style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Alım Usulü</label>
                    <select
                      name="type"
                      style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                    >
                      <option value="Doğrudan Temin">Doğrudan Temin (22/d)</option>
                      <option value="Açık İhale">Açık İhale (19)</option>
                      <option value="Pazarlık">Pazarlık Usulü (21/f)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Harcama Birimi</label>
                    <input
                      name="unit"
                      defaultValue="Fen İşleri Müdürlüğü"
                      style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Yaklaşık Maliyet (₺)</label>
                  <input
                    name="amount"
                    type="number"
                    defaultValue="50000"
                    style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="simple-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="simple-btn primary"
                  >
                    Dosyayı Oluştur
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. KALEM EKLEME MODALI */}
      {activeModal === 'addItem' && (
        <div className="simple-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simple-panel-head">
              <b>Yeni İhtiyaç Kalemi Ekle</b>
              <button
                className="simple-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <form
              style={{ padding: 18 }}
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                onAddItem({
                  name: String(fd.get('name') || 'Yeni Kalem'),
                  qty: Number(fd.get('qty')) || 1,
                  unit: String(fd.get('unit') || 'Adet'),
                  price: Number(fd.get('price')) || 0
                })
                setActiveModal(null)
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Kalem Tanımı</label>
                  <input
                    name="name"
                    required
                    placeholder="Örn: Toner, motor yağı..."
                    style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Miktar</label>
                    <input
                      name="qty"
                      type="number"
                      defaultValue="1"
                      style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Birim</label>
                    <input
                      name="unit"
                      defaultValue="Adet"
                      style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Birim Fiyat (₺)</label>
                    <input
                      name="price"
                      type="number"
                      defaultValue="100"
                      style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="simple-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="simple-btn primary"
                  >
                    Kalemi Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TEKLİF EKLEME MODALI */}
      {activeModal === 'addOffer' && (
        <div className="simple-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <div className="simple-panel-head">
              <b>Yeni İstekli Firma Teklifi</b>
              <button
                className="simple-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <form
              style={{ padding: 18 }}
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                onAddOffer({
                  company: String(fd.get('company') || 'İstekli Firma'),
                  price: Number(fd.get('price')) || 0,
                  valid: 'Uygun'
                })
                setActiveModal(null)
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Firma Unvanı</label>
                  <input
                    name="company"
                    required
                    placeholder="Örn: Anadolu Ticaret Ltd."
                    style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Teklif Edilen Toplam Tutar (₺)</label>
                  <input
                    name="price"
                    type="number"
                    defaultValue="50000"
                    style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="simple-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="simple-btn primary"
                  >
                    Teklifi Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
