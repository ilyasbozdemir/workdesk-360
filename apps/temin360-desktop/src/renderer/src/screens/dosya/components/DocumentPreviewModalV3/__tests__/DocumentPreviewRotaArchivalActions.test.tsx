import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentPreviewRotaSection } from '../components/DocumentPreviewRotaSection'
import * as rotaDefaultsService from '@renderer/services/rotaDefaultsService'

describe('DocumentPreviewRotaSection — Dosya Bazlı Arşivleme ve Şablon Varsayılanı Ayrımı', () => {
  const saveSpy = vi.spyOn(rotaDefaultsService, 'saveRotaConfigForTemplate')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function TestWrapper({ dosyaId }: { dosyaId?: number | null }) {
    const [formData, setFormData] = useState<any>({
      birimId: 10,
      birimAdi: 'Destek Hizmetleri Müdürlüğü',
      kurumAdi: 'Örnek Belediyesi',
      antetSatirlari: ['T.C.', 'ÖRNEK BELEDİYESİ', 'Destek Hizmetleri Müdürlüğü'],
      hazirlayanPersonelAdi: 'Kemal Sunal',
      hazirlayanPersonelUnvan: 'Şef',
      onaylayanPersonelAdi: 'Halit Akçatepe',
      onaylayanPersonelUnvan: 'Müdür'
    })

    return (
      <DocumentPreviewRotaSection
        formData={formData}
        setFormData={setFormData}
        templateId="piyasa-fiyat-arastirma-gorevlendirmesi"
        dosyaId={dosyaId}
        birimListesi={[
          { id: 10, birim_adi: 'Destek Hizmetleri Müdürlüğü', aktif_mi: 1 },
          { id: 20, birim_adi: 'Fen İşleri Müdürlüğü', aktif_mi: 1 }
        ]}
        personelListesi={[
          { id: 1, ad_soyad: 'Kemal Sunal', unvan: 'Şef', birim_id: 10, aktif_mi: 1 },
          { id: 2, ad_soyad: 'Halit Akçatepe', unvan: 'Müdür', birim_id: 10, aktif_mi: 1 }
        ]}
      />
    )
  }

  it('1. Aktif dosya (dosyaId) varken 3 buton da görünür: Dosya Arşivle, Şablon Varsayılanı, Genel Varsayılan', () => {
    render(<TestWrapper dosyaId={101} />)

    const archiveBtn = screen.getByTestId('rota-save-file-archive-btn')
    const templateDefaultBtn = screen.getByTestId('rota-save-template-default-btn')
    const globalDefaultBtn = screen.getByTestId('rota-save-global-default-btn')

    expect(archiveBtn).toBeTruthy()
    expect(templateDefaultBtn).toBeTruthy()
    expect(globalDefaultBtn).toBeTruthy()
  })

  it('2. "📁 Bu Dosya İçin Kalıcı Kaydet (Arşivle)" tıklandığında ayarlar aktif dosya (dosyaId: 101) kapsamına yazılır', () => {
    render(<TestWrapper dosyaId={101} />)

    const archiveBtn = screen.getByTestId('rota-save-file-archive-btn')
    fireEvent.click(archiveBtn)

    expect(saveSpy).toHaveBeenCalledWith(
      'piyasa-fiyat-arastirma-gorevlendirmesi',
      expect.objectContaining({
        birimAdi: 'Destek Hizmetleri Müdürlüğü',
        kurumAdi: 'Örnek Belediyesi'
      }),
      101
    )
  })

  it('3. "📌 Şablon Varsayılanı Yap" tıklandığında ayarlar gelecek dosyalar için genel şablon anahtarına yazılır (dosyaId = null)', () => {
    render(<TestWrapper dosyaId={101} />)

    const templateDefaultBtn = screen.getByTestId('rota-save-template-default-btn')
    fireEvent.click(templateDefaultBtn)

    expect(saveSpy).toHaveBeenCalledWith(
      'piyasa-fiyat-arastirma-gorevlendirmesi',
      expect.objectContaining({
        birimAdi: 'Destek Hizmetleri Müdürlüğü'
      }),
      null
    )
  })

  it('4. "🌐 Genel Varsayılan Yap" tıklandığında ayarlar tüm şablonlar için __global__ anahtarına yazılır (dosyaId = null)', () => {
    render(<TestWrapper dosyaId={101} />)

    const globalDefaultBtn = screen.getByTestId('rota-save-global-default-btn')
    fireEvent.click(globalDefaultBtn)

    expect(saveSpy).toHaveBeenCalledWith(
      '__global__',
      expect.objectContaining({
        birimAdi: 'Destek Hizmetleri Müdürlüğü'
      }),
      null
    )
  })

  it('5. dosyaId yokken (ör. şablon rota yönetim ekranında) "Dosyaya Özel Arşivle" butonu gizlenir', () => {
    render(<TestWrapper dosyaId={null} />)

    expect(screen.queryByTestId('rota-save-file-archive-btn')).toBeNull()
    expect(screen.getByTestId('rota-save-template-default-btn')).toBeTruthy()
    expect(screen.getByTestId('rota-save-global-default-btn')).toBeTruthy()
  })
})
