import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkspaceSetupCheck } from '../useWorkspaceSetupCheck'

const mockWorkspaceStore = vi.hoisted(() => ({
  activeFilePath: 'D:/Test/kurum.temin'
}))

vi.mock('../../../store/workspaceStore', () => ({
  useWorkspaceStore: () => mockWorkspaceStore
}))

vi.mock('@renderer/store/workspaceStore', () => ({
  useWorkspaceStore: () => mockWorkspaceStore
}))

describe('useWorkspaceSetupCheck — Farklı PC ve Sıfır Kurulum İzolasyon Testleri', () => {
  let mockSettings: Record<string, string> = {}
  let mockData: any = {}

  beforeEach(() => {
    mockSettings = {}
    mockData = {
      dosyaCount: 0,
      birimCount: 0,
      personelCount: 0,
      kurumAdi: 'Yeni Kurum'
    }
    sessionStorage.clear()

    window.electron = {
      ipcRenderer: {
        invoke: vi.fn().mockImplementation((channel: string, ...args: any[]) => {
          if (channel === 'db:query') {
            const sql = args[0]
            if (sql.includes('FROM settings WHERE key IN')) {
              const rows = Object.entries(mockSettings).map(([key, value]) => ({ key, value }))
              return Promise.resolve({ success: true, data: rows })
            }
            if (sql.includes('FROM DATA_TeminDosyasi')) {
              return Promise.resolve({ success: true, data: [mockData] })
            }
            return Promise.resolve({ success: true, data: [] })
          }
          if (channel === 'db:save-settings') {
            Object.assign(mockSettings, args[0])
            return Promise.resolve({ success: true })
          }
          if (channel === 'db:run') {
            return Promise.resolve({ success: true })
          }
          return Promise.resolve({ success: true })
        })
      }
    } as any
  })

  it('1. Farklı PC senaryosu: Dosyada is_initial_setup_completed=true ise asla modal açılmamalı', async () => {
    mockSettings['is_initial_setup_completed'] = 'true'

    const { result } = renderHook(() => useWorkspaceSetupCheck())
    await act(async () => {
      await result.current.recheckSetup()
    })

    expect(result.current.needsSetup).toBe(false)
    expect(result.current.isModalOpen).toBe(false)
  })

  it('2. Farklı PC senaryosu: Kullanıcı daha önce setup_dismissed=true yapmışsa başka PCde popup açılmamalı', async () => {
    mockSettings['setup_dismissed'] = 'true'

    const { result } = renderHook(() => useWorkspaceSetupCheck())
    await act(async () => {
      await result.current.recheckSetup()
    })

    expect(result.current.needsSetup).toBe(false)
    expect(result.current.isModalOpen).toBe(false)
  })

  it('3. Mevcut aktif dosya senaryosu: Dosya içinde temin dosyası veya birim varsa sıfır kurulum sayılmamalı ve otomatik mühürlenmeli', async () => {
    // is_new_workspace tanımlı değil (eski/taşınmış dosya)
    mockData.dosyaCount = 3
    mockData.birimCount = 2
    mockData.kurumAdi = 'Eskişehir İl Sağlık Müdürlüğü'

    const { result } = renderHook(() => useWorkspaceSetupCheck())
    await act(async () => {
      await result.current.recheckSetup()
    })

    expect(result.current.needsSetup).toBe(false)
    expect(result.current.isModalOpen).toBe(false)
    // Veritabanına mühürlenmiş olmalı
    expect(mockSettings['is_initial_setup_completed']).toBe('true')
  })

  it('4. Gerçek sıfırdan oluşturulan dosya: is_new_workspace=true ve henüz kurulmamışsa modal açılmalı', async () => {
    mockSettings['is_new_workspace'] = 'true'
    mockSettings['is_initial_setup_completed'] = 'false'
    mockSettings['setup_dismissed'] = 'false'
    mockData.birimCount = 0
    mockData.personelCount = 0
    mockData.kurumAdi = 'Yeni Kurum'

    const { result } = renderHook(() => useWorkspaceSetupCheck())
    await act(async () => {
      await result.current.recheckSetup()
    })

    expect(result.current.needsSetup).toBe(true)
    expect(result.current.isModalOpen).toBe(true)
  })

  it('5. closeSetupModal çağrıldığında veritabanına setup_dismissed kaydedilmeli ve modal kapanmalı', async () => {
    mockSettings['is_new_workspace'] = 'true'
    const { result } = renderHook(() => useWorkspaceSetupCheck())

    act(() => {
      result.current.closeSetupModal()
    })

    expect(result.current.isModalOpen).toBe(false)
    expect(mockSettings['setup_dismissed']).toBe('true')
  })
})
