import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccessibilityToolbar } from '../AccessibilityToolbar'

describe('Issue #13: AccessibilityToolbar (WCAG & Dinamik Yazı Boyutu)', () => {
  const STORAGE_KEY = 'temin_accessibility_font_scale'

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.style.fontSize = ''
    delete document.documentElement.dataset.fontScale
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.style.fontSize = ''
    delete document.documentElement.dataset.fontScale
  })

  it('varsayılan %100 ölçekle başlatılır ve erişilebilir etiketler içerir', () => {
    render(<AccessibilityToolbar />)

    const section = screen.getByRole('region', { name: 'Erişilebilirlik araçları' })
    expect(section).toBeTruthy()

    const output = screen.getByText('100%')
    expect(output).toBeTruthy()

    // Küçült butonu ve sıfırla butonu %100'de devre dışı olmalı
    const minusBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu küçült'
    }) as HTMLButtonElement
    const resetBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu varsayılana döndür'
    }) as HTMLButtonElement
    const plusBtn = screen.getByRole('button', { name: 'Yazı boyutunu büyüt' }) as HTMLButtonElement

    expect(minusBtn.disabled).toBe(true)
    expect(resetBtn.disabled).toBe(true)
    expect(plusBtn.disabled).toBe(false)

    // Root element kontrolleri
    expect(document.documentElement.style.fontSize).toBe('16px')
    expect(document.documentElement.dataset.fontScale).toBe('100')
  })

  it('büyüt butonuna basıldığında yazı boyutu %10 artar ve belgeye yansıtılır', () => {
    render(<AccessibilityToolbar />)

    const plusBtn = screen.getByRole('button', { name: 'Yazı boyutunu büyüt' }) as HTMLButtonElement
    fireEvent.click(plusBtn)

    expect(screen.getByText('110%')).toBeTruthy()
    expect(document.documentElement.style.fontSize).toBe(`${16 * 1.1}px`)
    expect(document.documentElement.dataset.fontScale).toBe('110')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('110')

    const minusBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu küçült'
    }) as HTMLButtonElement
    const resetBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu varsayılana döndür'
    }) as HTMLButtonElement
    expect(minusBtn.disabled).toBe(false)
    expect(resetBtn.disabled).toBe(false)
  })

  it('maksimum sınır olan %150 aşılamaz ve büyüt butonu devre dışı kalır', () => {
    render(<AccessibilityToolbar />)
    const plusBtn = screen.getByRole('button', { name: 'Yazı boyutunu büyüt' }) as HTMLButtonElement

    // 100 -> 110 -> 120 -> 130 -> 140 -> 150
    for (let i = 0; i < 5; i++) {
      fireEvent.click(plusBtn)
    }

    expect(screen.getByText('150%')).toBeTruthy()
    expect(plusBtn.disabled).toBe(true)
    expect(document.documentElement.style.fontSize).toBe(`${16 * 1.5}px`)
    expect(document.documentElement.dataset.fontScale).toBe('150')
  })

  it('küçült butonuna basıldığında minimum %100 altına inilemez', () => {
    localStorage.setItem(STORAGE_KEY, '110')
    render(<AccessibilityToolbar />)

    expect(screen.getByText('110%')).toBeTruthy()
    const minusBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu küçült'
    }) as HTMLButtonElement
    fireEvent.click(minusBtn)

    expect(screen.getByText('100%')).toBeTruthy()
    expect(minusBtn.disabled).toBe(true)
    expect(document.documentElement.style.fontSize).toBe('16px')
  })

  it('sıfırla (RotateCcw) butonuna basıldığında doğrudan varsayılan %100 seviyesine döner', () => {
    localStorage.setItem(STORAGE_KEY, '140')
    render(<AccessibilityToolbar />)

    expect(screen.getByText('140%')).toBeTruthy()
    const resetBtn = screen.getByRole('button', {
      name: 'Yazı boyutunu varsayılana döndür'
    }) as HTMLButtonElement
    fireEvent.click(resetBtn)

    expect(screen.getByText('100%')).toBeTruthy()
    expect(document.documentElement.style.fontSize).toBe('16px')
    expect(document.documentElement.dataset.fontScale).toBe('100')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100')
    expect(resetBtn.disabled).toBe(true)
  })

  it('localStorage içindeki geçerli değer doğru okunur, geçersiz değerler yok sayılır', () => {
    // Geçersiz değer (aralık dışı)
    localStorage.setItem(STORAGE_KEY, '999')
    const { unmount: u1 } = render(<AccessibilityToolbar />)
    expect(screen.getByText('100%')).toBeTruthy()
    u1()

    // Geçersiz değer (adım dışı - 105)
    localStorage.setItem(STORAGE_KEY, '105')
    const { unmount: u2 } = render(<AccessibilityToolbar />)
    expect(screen.getByText('100%')).toBeTruthy()
    u2()

    // Geçerli değer (130)
    localStorage.setItem(STORAGE_KEY, '130')
    render(<AccessibilityToolbar />)
    expect(screen.getByText('130%')).toBeTruthy()
    expect(document.documentElement.style.fontSize).toBe(`${16 * 1.3}px`)
  })

  it('localStorage erişilemez olduğunda veya hata verdiğinde bileşen çökmeden çalışır', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })

    render(<AccessibilityToolbar />)
    const plusBtn = screen.getByRole('button', { name: 'Yazı boyutunu büyüt' }) as HTMLButtonElement

    expect(() => {
      fireEvent.click(plusBtn)
    }).not.toThrow()

    expect(screen.getByText('110%')).toBeTruthy()
    expect(document.documentElement.style.fontSize).toBe(`${16 * 1.1}px`)
  })
})
