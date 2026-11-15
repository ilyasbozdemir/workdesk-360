import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { KurulumModal } from '../KurulumModal'

const { mockLoadSettings } = vi.hoisted(() => ({
  mockLoadSettings: vi.fn()
}))

vi.mock('@renderer/store/settingsStore', () => {
  const storeData = {
    institutionName: '',
    departmentName: '',
    letterhead: [''],
    loadSettings: mockLoadSettings,
    setInstitutionName: vi.fn()
  }
  const fn: any = () => storeData
  fn.getState = () => storeData
  return { useSettingsStore: fn }
})

vi.mock('@renderer/services/rotaDefaultsService', () => ({
  GLOBAL_ROTA_KEY: '__global_rota__',
  saveGlobalRotaDefaults: vi.fn().mockResolvedValue(true),
  saveRotaConfigForTemplate: vi.fn().mockResolvedValue(true)
}))

describe('KurulumModal — Hızlı Kurulum & Başlangıç Popup Modalı', () => {
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
            if (sql.includes('SELECT id FROM TANIM_Kurum')) {
              return Promise.resolve({ success: true, data: [] })
            }
            if (sql.includes('SELECT id FROM TANIM_Birim')) {
              return Promise.resolve({ success: true, data: [] })
            }
            if (sql.includes('SELECT id FROM TANIM_Personel')) {
              return Promise.resolve({ success: true, data: [] })
            }
            return Promise.resolve({ success: true, data: [] })
          }
          if (channel === 'db:run') {
            return Promise.resolve({ success: true, changes: 1 })
          }
          return Promise.resolve({ success: true })
        }),
        on: vi.fn(),
        removeListener: vi.fn()
      }
    } as any
  })

  it('isOpen=false olduğunda modal DOM üzerinde render edilmez', () => {
    const { container } = render(
      <KurulumModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('isOpen=true olduğunda modal, başlık ve 5 adımlı stepper görünür', () => {
    render(<KurulumModal isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText('WorkDesk 360 İlk Yapılandırma')).toBeTruthy()
    expect(screen.getByText('1. Adım: Kurum ve Antet Bilgileri')).toBeTruthy()
    expect(screen.getByText('Kurum & Antet')).toBeTruthy()
    expect(screen.getByText('Birimler')).toBeTruthy()
    expect(screen.getByText('Personel Kadrosu')).toBeTruthy()
    expect(screen.getByText('Onay Rotası')).toBeTruthy()
    expect(screen.getByText('Özet & Başlangıç')).toBeTruthy()
  })

  it('Kurum adı boşken İleri butonu disabled olur, doldurulunca aktifleşir', () => {
    render(<KurulumModal isOpen={true} onClose={vi.fn()} />)

    const nextBtn = screen.getByText('İleri').closest('button')!
    expect(nextBtn.hasAttribute('disabled')).toBe(true)

    // Örnek Kurum Doldur butonuna tıkla
    const fillSampleBtn = screen.getByText('Örnek Veri ile Doldur')
    fireEvent.click(fillSampleBtn)

    expect(nextBtn.hasAttribute('disabled')).toBe(false)
  })

  it('Adımlar arasında İleri ve Geri geçişleri sorunsuz çalışır', () => {
    render(<KurulumModal isOpen={true} onClose={vi.fn()} />)

    // 1. Adımı doldur
    fireEvent.click(screen.getByText('Örnek Veri ile Doldur'))

    // 2. Adıma geç
    fireEvent.click(screen.getByText('İleri'))
    expect(screen.getByText('2. Adım: Harcama Birimleri ve Müdürlükler')).toBeTruthy()

    // 3. Adıma geç
    fireEvent.click(screen.getByText('İleri'))
    expect(screen.getByText('3. Adım: Personel Kadrosu ve Rol Atamaları')).toBeTruthy()

    // Geri tıkla -> 2. Adıma dönmeli
    fireEvent.click(screen.getByText('Geri'))
    expect(screen.getByText('2. Adım: Harcama Birimleri ve Müdürlükler')).toBeTruthy()
  })

  it('Kapat butonuna basıldığında onClose çağrılır', () => {
    const onClose = vi.fn()
    render(<KurulumModal isOpen={true} onClose={onClose} />)

    const closeBtn = screen.getByTitle('Kapat (Daha sonra kur)')
    fireEvent.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
