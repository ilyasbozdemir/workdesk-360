import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KurulumSihirbaziScreen from '../index.screen'

const { mockAddTab, mockLoadSettings } = vi.hoisted(() => ({
  mockAddTab: vi.fn(),
  mockLoadSettings: vi.fn()
}))

// Mock Tab Store
vi.mock('@renderer/store/tabStore', () => ({
  useTabStore: () => ({ addTab: mockAddTab })
}))

// Mock Settings Store
vi.mock('@renderer/store/settingsStore', () => {
  const storeData = {
    institutionName: '',
    departmentName: '',
    letterhead: [''],
    loadSettings: mockLoadSettings
  }
  const fn: any = () => storeData
  fn.getState = () => storeData
  return { useSettingsStore: fn }
})

// Mock rotaDefaultsService
vi.mock('@renderer/services/rotaDefaultsService', () => ({
  GLOBAL_ROTA_KEY: '__global_rota__',
  saveGlobalRotaDefaults: vi.fn().mockResolvedValue(true),
  saveRotaConfigForTemplate: vi.fn().mockResolvedValue(true)
}))

describe('KurulumSihirbaziScreen — İlk Kurulum Sihirbazı Testleri', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    window.electron = {
      ipcRenderer: {
        invoke: vi.fn().mockImplementation((channel: string, ...args: any[]) => {
          if (channel === 'db:query') {
            const sql = args[0]
            if (sql.includes('SELECT * FROM TANIM_Kurum')) {
              return Promise.resolve({ success: true, data: [] })
            }
            if (sql.includes('SELECT * FROM TANIM_Birim') || sql.includes('SELECT id FROM TANIM_Birim')) {
              return Promise.resolve({ success: true, data: [] })
            }
            if (sql.includes('SELECT * FROM TANIM_Personel') || sql.includes('SELECT id FROM TANIM_Personel')) {
              return Promise.resolve({ success: true, data: [] })
            }
            return Promise.resolve({ success: true, data: [] })
          }
          if (channel === 'db:run' || channel === 'db:execute') {
            return Promise.resolve({ success: true, data: { changes: 1, lastInsertRowid: 1 } })
          }
          return Promise.resolve({ success: true })
        }),
        on: vi.fn(),
        removeListener: vi.fn()
      }
    } as any
  })

  it('İlk açılışta 1. Adım (Kurum & Resmî Antet) yüklenmeli', async () => {
    render(<KurulumSihirbaziScreen />)

    expect(screen.getByText('WorkDesk 360 Kurulum ve İlk Yapılandırma')).toBeTruthy()
    expect(screen.getByText('1. Adım: Kurum ve Antet Bilgileri')).toBeTruthy()
    expect(screen.getByText('Örnek Veri ile Doldur')).toBeTruthy()
  })

  it('Örnek belediye verisi doldurulduğunda kurum adı ve antet güncellenmeli', async () => {
    render(<KurulumSihirbaziScreen />)

    const ornekDoldurBtn = screen.getByText('Örnek Veri ile Doldur')
    fireEvent.click(ornekDoldurBtn)

    const kurumInput = screen.getByPlaceholderText('Örn: KADIKÖY BELEDİYE BAŞKANLIĞI') as HTMLInputElement
    expect(kurumInput.value).toBe('KADIKÖY BELEDİYE BAŞKANLIĞI')
  })

  it('Adımlar arasında ileri ve geri navigasyon sorunsuz çalışmalı', async () => {
    render(<KurulumSihirbaziScreen />)

    // 1. Adım -> Örnek veri doldur ve İleri bas
    fireEvent.click(screen.getByText('Örnek Veri ile Doldur'))
    const ileriBtn1 = screen.getByRole('button', { name: /İleri/i })
    fireEvent.click(ileriBtn1)

    // 2. Adıma geçmeli
    await waitFor(() => {
      expect(screen.getByText('2. Adım: Harcama Birimleri ve Müdürlükler')).toBeTruthy()
    })

    // Standart belediyecilik birimlerini yükle
    const birimYukleBtn = screen.getByText('Standart Birimleri Yükle')
    fireEvent.click(birimYukleBtn)

    // İleri: Personel
    const ileriBtn2 = screen.getByRole('button', { name: /İleri/i })
    fireEvent.click(ileriBtn2)

    // 3. Adıma geçmeli
    await waitFor(() => {
      expect(screen.getByText('3. Adım: Personel Kadrosu ve Rol Atamaları')).toBeTruthy()
    })

    // Geri Dön: Birimler
    const geriBtn = screen.getByRole('button', { name: /Geri/i })
    fireEvent.click(geriBtn)

    await waitFor(() => {
      expect(screen.getByText('2. Adım: Harcama Birimleri ve Müdürlükler')).toBeTruthy()
    })
  })

  it('Tüm adımlar tamamlanıp kurulum onaylandığında veritabanına kayıt işlemi yürütülmeli', async () => {
    render(<KurulumSihirbaziScreen />)

    // 1. Adım
    fireEvent.click(screen.getByText('Örnek Veri ile Doldur'))
    fireEvent.click(screen.getByRole('button', { name: /İleri/i }))

    // 2. Adım
    await waitFor(() => expect(screen.getByText('2. Adım: Harcama Birimleri ve Müdürlükler')).toBeTruthy())
    fireEvent.click(screen.getByText('Standart Birimleri Yükle'))
    fireEvent.click(screen.getByRole('button', { name: /İleri/i }))

    // 3. Adım
    await waitFor(() => expect(screen.getByText('3. Adım: Personel Kadrosu ve Rol Atamaları')).toBeTruthy())
    fireEvent.click(screen.getByText('Örnek Personel Kadrosu Yükle'))
    fireEvent.click(screen.getByRole('button', { name: /İleri/i }))

    // 4. Adım
    await waitFor(() => expect(screen.getByText('4. Adım: Belge Rota & Onay Yetkilileri Varsayılanları')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /İleri/i }))

    // 5. Adım: Özet
    await waitFor(() => {
      expect(screen.getByText('Kurulum Özeti ve Başlangıç Onayı')).toBeTruthy()
      expect(screen.getByText('Tüm Ayarları Kaydet ve Başlat')).toBeTruthy()
    })

    // Kurulumu Tamamla
    fireEvent.click(screen.getByText('Tüm Ayarları Kaydet ve Başlat'))

    await waitFor(() => {
      // IPC DB Run / Execute çağrılmış olmalı (TANIM_Kurum, TANIM_Birim, TANIM_Personel)
      expect(window.electron.ipcRenderer.invoke).toHaveBeenCalledWith(
        'db:run',
        expect.stringContaining('TANIM_Kurum'),
        expect.any(Array)
      )
    })
  })
})
