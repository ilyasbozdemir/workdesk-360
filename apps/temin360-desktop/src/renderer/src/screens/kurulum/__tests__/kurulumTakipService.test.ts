import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  syncAndFetchKurulumTakip,
  dismissKurulumInDatabase,
  completeKurulumInDatabase
} from '../kurulumTakipService'

describe('kurulumTakipService — Veritabanı Tablo Takip ve Kurulum Durumu', () => {
  let mockSettings: Record<string, string> = {}
  let mockDbRun: any
  let mockDbQuery: any

  beforeEach(() => {
    mockSettings = {}
    mockDbRun = vi.fn().mockResolvedValue({ success: true })
    mockDbQuery = vi.fn().mockImplementation((channel: string, sql: string) => {
      if (sql.includes('FROM settings WHERE key IN')) {
        const rows = Object.entries(mockSettings).map(([key, value]) => ({ key, value }))
        return Promise.resolve({ success: true, data: rows })
      }
      if (sql.includes('FROM TANIM_Kurum')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 1,
              kurum_adi: 'Ankara Valiliği',
              il: 'Ankara',
              ilce: 'Çankaya',
              makam_adi: 'VALİLİK MAKAMINA',
              detsis_kodu: '12345'
            }
          ]
        })
      }
      if (sql.includes('FROM TANIM_Birim')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 1, birim_adi: 'Destek Hizmetleri' },
            { id: 2, birim_adi: 'Fen İşleri' }
          ]
        })
      }
      if (sql.includes('FROM TANIM_Personel')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 1, ad_soyad: 'Ahmet Yılmaz', unvan: 'Müdür' },
            { id: 2, ad_soyad: 'Mehmet Demir', unvan: 'Şef' }
          ]
        })
      }
      if (sql.includes("key LIKE 'rota_config_%'")) {
        return Promise.resolve({
          success: true,
          data: [{ value: '{"slots":{}}' }]
        })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    window.electron = {
      ipcRenderer: {
        invoke: vi.fn().mockImplementation((channel: string, ...args: any[]) => {
          if (channel === 'db:run') {
            return mockDbRun(channel, ...args)
          }
          if (channel === 'db:query') {
            return mockDbQuery(channel, ...args)
          }
          if (channel === 'db:save-settings') {
            Object.assign(mockSettings, args[0])
            return Promise.resolve({ success: true })
          }
          return Promise.resolve({ success: true })
        })
      }
    } as any
  })

  it('1. syncAndFetchKurulumTakip tabloları sorgulayıp SYS_KurulumTakip kayıtlarını derlemeli', async () => {
    mockSettings['is_new_workspace'] = 'true'
    mockSettings['is_initial_setup_completed'] = 'false'

    const result = await syncAndFetchKurulumTakip()

    expect(result.isNewWorkspace).toBe(true)
    expect(result.isSetupCompleted).toBe(false)
    expect(result.items.length).toBe(5)

    // Kurum adımı
    const kurumItem = result.items.find((i) => i.adim_kodu === 'kurum')
    expect(kurumItem).toBeDefined()
    expect(kurumItem?.tablo_adi).toBe('TANIM_Kurum')
    expect(kurumItem?.durum).toBe('tamamlandi')
    expect(kurumItem?.ozet_bilgi).toContain('Ankara Valiliği')

    // Birimler adımı
    const birimItem = result.items.find((i) => i.adim_kodu === 'birimler')
    expect(birimItem).toBeDefined()
    expect(birimItem?.tablo_adi).toBe('TANIM_Birim')
    expect(birimItem?.kayit_sayisi).toBe(2)
    expect(birimItem?.durum).toBe('tamamlandi')

    // Personel adımı
    const personelItem = result.items.find((i) => i.adim_kodu === 'personeller')
    expect(personelItem).toBeDefined()
    expect(personelItem?.tablo_adi).toBe('TANIM_Personel')
    expect(personelItem?.kayit_sayisi).toBe(2)

    // SYS_KurulumTakip tablosuna yazılmış olmalı
    expect(mockDbRun).toHaveBeenCalledWith(
      'db:run',
      expect.stringContaining('CREATE TABLE IF NOT EXISTS SYS_KurulumTakip')
    )
    expect(mockDbRun).toHaveBeenCalledWith(
      'db:run',
      expect.stringContaining('INSERT INTO SYS_KurulumTakip'),
      expect.any(Array)
    )
  })

  it('2. dismissKurulumInDatabase veritabanına setup_dismissed=true kaydetmeli', async () => {
    const success = await dismissKurulumInDatabase()
    expect(success).toBe(true)
    expect(mockSettings['setup_dismissed']).toBe('true')
    expect(mockDbRun).toHaveBeenCalledWith(
      'db:run',
      expect.stringContaining("UPDATE SYS_KurulumTakip \n       SET durum = 'atlandi'")
    )
  })

  it('3. completeKurulumInDatabase veritabanında is_initial_setup_completed=true ve setup_dismissed=true mühürlemeli', async () => {
    const success = await completeKurulumInDatabase()
    expect(success).toBe(true)
    expect(mockSettings['is_initial_setup_completed']).toBe('true')
    expect(mockSettings['setup_dismissed']).toBe('true')
    expect(mockSettings['is_new_workspace']).toBe('false')
    expect(mockDbRun).toHaveBeenCalledWith(
      'db:run',
      expect.stringContaining("UPDATE SYS_KurulumTakip \n       SET durum = 'tamamlandi'")
    )
  })
})
