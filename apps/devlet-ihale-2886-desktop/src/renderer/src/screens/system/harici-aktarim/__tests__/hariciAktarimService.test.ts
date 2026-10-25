import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeTur,
  parseDogrudanTeminJson,
  findMatchingDossier,
  executeDossierEzmeSync
} from '../hariciAktarimService'
import { DogrudanTeminDosyasi, ExistingDossierSummary } from '../types'
import { SAMPLE_HARICI_DT_JSON } from '../sampleData'

describe('hariciAktarimService', () => {
  describe('normalizeTur', () => {
    it('alım türlerini veri tabanı kodlarına doğru çevirir', () => {
      expect(normalizeTur('Mal Alımı')).toBe('mal')
      expect(normalizeTur('Hizmet Alımı')).toBe('hizmet')
      expect(normalizeTur('Yapım İşi')).toBe('yapim_isi')
      expect(normalizeTur('Danışmanlık')).toBe('danismanlik')
      expect(normalizeTur(undefined)).toBe('mal')
      expect(normalizeTur('')).toBe('mal')
    })
  })

  describe('parseDogrudanTeminJson (Zod Şema Doğrulaması)', () => {
    it('örnek doğrudan temin JSON verisini başarıyla ve şemaya uygun ayrıştırır', () => {
      const result = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('dt_2025_2_183260')
      expect(result.data?.dosyaBilgileri.dosyaNo).toBe('2025/2')
      expect(result.data?.dosyaBilgileri.isinAdi).toBe('Su Sayacı Alımı')
      expect(result.data?.malzemeler?.length).toBe(1)
      expect(result.data?.teklifler?.length).toBe(2)
      expect(result.data?.komisyonlar?.yaklasikMaliyet?.length).toBe(3)
    })

    it('boş metinde hata döner', () => {
      const result = parseDogrudanTeminJson('   ')
      expect(result.success).toBe(false)
      expect(result.error).toContain('boş olamaz')
    })

    it('geçersiz JSON sözdiziminde açıklayıcı hata döner', () => {
      const result = parseDogrudanTeminJson('{ invalid json: true ')
      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON ayrıştırma hatası')
    })

    it('dosyaBilgileri eksikse hata döner', () => {
      const result = parseDogrudanTeminJson(JSON.stringify({ id: 'test_123' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('dosyaBilgileri')
    })

    it('takvimde olmayan tarihleri reddeder, geçerli tarihleri kabul eder', () => {
      const build = (t: string): string =>
        JSON.stringify({ dosyaBilgileri: { dosyaNo: '1', isinAdi: 'x', ihaleTarihi: t } })
      expect(parseDogrudanTeminJson(build('2026-99-99')).success).toBe(false)
      expect(parseDogrudanTeminJson(build('2025-02-30')).success).toBe(false)
      expect(parseDogrudanTeminJson(build('2025-10-24T14:30')).success).toBe(true)
      expect(parseDogrudanTeminJson(build('2025-10-22T10:00:00.000Z')).success).toBe(true)
      expect(parseDogrudanTeminJson(build('2024-02-29')).success).toBe(true)
    })

    it('hem isinAdi hem de dosyaNo eksikse hata döner', () => {
      const result = parseDogrudanTeminJson(JSON.stringify({ dosyaBilgileri: {} }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('en az "isinAdi" veya "dosyaNo"')
    })

    it('malzeme miktarı negatif girilirse Zod şema hatası döner', () => {
      const invalidData = JSON.parse(SAMPLE_HARICI_DT_JSON)
      invalidData.malzemeler[0].miktar = -5
      const result = parseDogrudanTeminJson(JSON.stringify(invalidData))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Şema doğrulama hatası')
      expect(result.error).toContain('miktar')
    })
  })

  describe('findMatchingDossier', () => {
    const mockDossiers: ExistingDossierSummary[] = [
      {
        id: 10,
        temin_no: '2025/1',
        ekap_no: 'dt_2025_1_001',
        konu: 'Kırtasiye Alımı',
        butce_yili: 2025
      },
      {
        id: 20,
        temin_no: '2025/2',
        ekap_no: 'dt_2025_2_183260',
        konu: 'Su Sayacı Alımı',
        butce_yili: 2025
      },
      {
        id: 30,
        temin_no: 'DT-99',
        ekap_no: '99',
        konu: 'Boya İşi',
        butce_yili: 2025
      }
    ]

    it('asıl dosya numarasına (dosyaNo) göre birebir eşleştirir', () => {
      const data: DogrudanTeminDosyasi = {
        dosyaBilgileri: {
          dosyaNo: '2025/2',
          isinAdi: 'Su Sayacı'
        }
      }
      const match = findMatchingDossier(mockDossiers, data)
      expect(match).not.toBeNull()
      expect(match?.id).toBe(20)
      expect(match?.temin_no).toBe('2025/2')
    })

    it('harici id üzerinden eşleştirir (asıl dosyaNo farklı olsa bile)', () => {
      const data: DogrudanTeminDosyasi = {
        id: 'dt_2025_1_001',
        dosyaBilgileri: {
          dosyaNo: '9999/FARKLI',
          isinAdi: 'Farklı İsim'
        }
      }
      const customDossiers: ExistingDossierSummary[] = [
        { id: 45, temin_no: 'ESKI/1', ekap_no: 'dt_2025_1_001', konu: 'Test' }
      ]
      const match = findMatchingDossier(customDossiers, data)
      expect(match).not.toBeNull()
      expect(match?.id).toBe(45)
    })

    it('doğrudan temin numarasına (DT No) göre eşleştirir', () => {
      const data: DogrudanTeminDosyasi = {
        dosyaBilgileri: {
          dosyaNo: '',
          dogrudanTeminNumarasi: 'DT-99',
          isinAdi: 'Boya İşi'
        }
      }
      const match = findMatchingDossier(mockDossiers, data)
      expect(match).not.toBeNull()
      expect(match?.id).toBe(30)
    })

    it('hiçbir kriter tutmuyorsa null döner', () => {
      const data: DogrudanTeminDosyasi = {
        id: 'bulunamayan_id',
        dosyaBilgileri: {
          dosyaNo: '2029/999',
          dogrudanTeminNumarasi: '9999',
          isinAdi: 'Bilinmeyen İş'
        }
      }
      const match = findMatchingDossier(mockDossiers, data)
      expect(match).toBeNull()
    })
  })

  describe('executeDossierEzmeSync (Atomik Transaction & Kalem Fiyatları)', () => {
    let originalElectron: unknown
    const mockInvoke = vi.fn()

    beforeEach(() => {
      originalElectron = (window as unknown as { electron?: unknown }).electron
      ;(window as unknown as { electron: unknown }).electron = {
        ipcRenderer: {
          invoke: mockInvoke
        }
      }
    })

    afterEach(() => {
      ;(window as unknown as { electron: unknown }).electron = originalElectron
      vi.clearAllMocks()
    })

    it('mevcut dosya güncellenirken tüm işlemleri tek bir atomik db:transaction içinde yürütür', async () => {
      const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
      expect(parsed.success).toBe(true)
      const data = parsed.data!

      let capturedTxQueries: Array<{ sql: string; params?: unknown[] }> = []

      mockInvoke.mockImplementation(async (channel: string, arg1: unknown) => {
        if (channel === 'db:transaction') {
          capturedTxQueries = arg1 as Array<{ sql: string; params?: unknown[] }>
          return { success: true, changes: capturedTxQueries.length }
        }
        if (channel === 'db:run') {
          return { success: true, lastInsertRowid: 20, changes: 1 }
        }
        return { success: true }
      })

      const syncResult = await executeDossierEzmeSync(20, data, {
        overwriteGeneralInfo: true,
        overwriteMaterials: true,
        overwriteOffers: true,
        overwriteCommissions: true,
        createNewIfNotFound: false
      })

      expect(syncResult.success).toBe(true)
      expect(syncResult.isNew).toBe(false)
      expect(syncResult.dosyaId).toBe(20)
      expect(syncResult.materialsCount).toBe(1)
      expect(syncResult.offersCount).toBe(2)
      expect(syncResult.commissionsCount).toBe(6)

      // db:transaction çağrısının yapıldığını doğrula
      const txCall = mockInvoke.mock.calls.find(([channel]) => channel === 'db:transaction')
      expect(txCall).toBeDefined()

      // Header update, kalemler ve DATA_TeminKalemTeklif sorgularının transaction'a dahil edildiğini doğrula
      const hasDossierUpdate = capturedTxQueries.some((q) => q.sql.includes('UPDATE DATA_TeminDosyasi'))
      expect(hasDossierUpdate).toBe(true)

      const hasKalemTeklifInsert = capturedTxQueries.some((q) =>
        q.sql.includes('INSERT INTO DATA_TeminKalemTeklif')
      )
      expect(hasKalemTeklifInsert).toBe(true)
    })

    it('db:transaction başarısız olursa hata fırlatır ve işlemi durdurur', async () => {
      const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
      const data = parsed.data!

      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'db:transaction') {
          return { success: false, error: 'FOREIGN KEY constraint failed' }
        }
        return { success: true }
      })

      await expect(
        executeDossierEzmeSync(20, data, {
          overwriteGeneralInfo: true,
          overwriteMaterials: true,
          overwriteOffers: true,
          overwriteCommissions: true,
          createNewIfNotFound: false
        })
      ).rejects.toThrow('FOREIGN KEY constraint failed')
    })

    it('malzemeler alanı undefined ise mevcut kalemleri silmez (koruma politikası)', async () => {
      const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
      const data = { ...parsed.data! }
      delete (data as Partial<DogrudanTeminDosyasi>).malzemeler // gönderilmemiş alan

      let capturedTxQueries: Array<{ sql: string; params?: unknown[] }> = []
      mockInvoke.mockImplementation(async (channel: string, arg1: unknown) => {
        if (channel === 'db:transaction') {
          capturedTxQueries = arg1 as Array<{ sql: string; params?: unknown[] }>
          return { success: true }
        }
        return { success: true }
      })

      await executeDossierEzmeSync(20, data, {
        overwriteGeneralInfo: true,
        overwriteMaterials: true,
        overwriteOffers: false,
        overwriteCommissions: false,
        createNewIfNotFound: false
      })

      // data.malzemeler undefined olduğu için DATA_TeminKalem silme veya ekleme olmamalıdır
      const hasDeleteKalem = capturedTxQueries.some((q) =>
        q.sql.includes('DELETE FROM DATA_TeminKalem WHERE')
      )
      expect(hasDeleteKalem).toBe(false)
    })

    it('yeni dosya oluşturulduğunda header ekler ve child kayıtları transaction ile bağlar', async () => {
      const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
      const data = parsed.data!

      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'db:query') {
          return [{ next_id: 999 }]
        }
        if (channel === 'db:run') {
          return { success: true, lastInsertRowid: 999, changes: 1 }
        }
        if (channel === 'db:transaction') {
          return { success: true, rootInsertRowid: 999, lastInsertRowid: 999 }
        }
        return { success: true }
      })

      const syncResult = await executeDossierEzmeSync(null, data, {
        overwriteGeneralInfo: true,
        overwriteMaterials: true,
        overwriteOffers: true,
        overwriteCommissions: true,
        createNewIfNotFound: true
      })

      expect(syncResult.success).toBe(true)
      expect(syncResult.isNew).toBe(true)
      expect(syncResult.dosyaId).toBe(999)
    })
  })
})
