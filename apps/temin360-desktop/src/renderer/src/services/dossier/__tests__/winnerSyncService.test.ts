import { describe, it, expect, vi } from 'vitest'
import {
  executeSetWinnerTransaction,
  inspectWinnerIntegrity,
  resolveResenWinner,
  WinnerSyncDbExecutor
} from '../winnerSyncService'

describe('Faz 1.2: winnerSyncService (Kazanan Firma Senkronizasyonu & Güvenlik)', () => {
  it('1. Geçerli teminFirmaId verildiğinde transaction kapsamında dosyaya aidiyeti doğrulamalı, master firma ID ve çift bayrak senkronize edilmelidir', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 10, firma_id: 100, unvan: 'Test Firma A' }]
    })
    const mockTransaction = vi.fn().mockResolvedValue({
      success: true,
      changes: 2
    })

    const executor: WinnerSyncDbExecutor = {
      query: mockQuery,
      transaction: mockTransaction
    }

    const result = await executeSetWinnerTransaction(
      { activeDosyaId: 1, teminFirmaId: 10 },
      executor
    )

    expect(result.success).toBe(true)
    expect(result.masterFirmaId).toBe(100)
    expect(result.teminFirmaId).toBe(10)

    // Query doğrulama: satır PK ile aidiyet kontrolü yapıldı mı?
    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ? AND temin_dosya_id = ?'),
      [10, 1]
    )

    // Transaction kontrolü: tek bir atomik transaction'da DATA_TeminDosyasi ve DATA_TeminFirma güncellendi mi?
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    const queries = mockTransaction.mock.calls[0][0]
    expect(queries).toHaveLength(2)

    // 1. sorgu: DATA_TeminDosyasi.firma_id = masterFirmaId (100)
    expect(queries[0].sql).toContain('UPDATE DATA_TeminDosyasi SET firma_id = ?')
    expect(queries[0].params).toEqual([100, 1])

    // 2. sorgu: kazandi_mi VE kazanan_mi çift sütun senkronizasyonu
    expect(queries[1].sql).toContain('SET kazandi_mi = CASE WHEN id = ? THEN 1 ELSE 0 END')
    expect(queries[1].sql).toContain('kazanan_mi = CASE WHEN id = ? THEN 1 ELSE 0 END')
    expect(queries[1].params).toEqual([10, 10, 1])
  })

  it('2. masterFirmaId verildiğinde firma_id üzerinden eşleşip satır PK ve master ID doğru atanmalıdır', async () => {
    // 1. çağrı (id = 50) boş döner, 2. çağrı (firma_id = 50) satırı bulur
    const mockQuery = vi.fn()
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: [{ id: 12, firma_id: 50 }] })

    const mockTransaction = vi.fn().mockResolvedValue({ success: true, changes: 2 })

    const executor: WinnerSyncDbExecutor = {
      query: mockQuery,
      transaction: mockTransaction
    }

    const result = await executeSetWinnerTransaction(
      { activeDosyaId: 1, masterFirmaId: 50 },
      executor
    )

    expect(result.success).toBe(true)
    expect(result.masterFirmaId).toBe(50)
    expect(result.teminFirmaId).toBe(12)

    expect(mockQuery).toHaveBeenCalledTimes(2)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    const queries = mockTransaction.mock.calls[0][0]
    expect(queries[0].params).toEqual([50, 1])
    expect(queries[1].params).toEqual([12, 12, 1])
  })

  it('3. Seçim kaldırıldığında (teminFirmaId: null) tüm bayraklar 0 ve dosya firma_id NULL olmalıdır', async () => {
    const mockQuery = vi.fn()
    const mockTransaction = vi.fn().mockResolvedValue({
      success: true,
      changes: 3
    })

    const executor: WinnerSyncDbExecutor = {
      query: mockQuery,
      transaction: mockTransaction
    }

    const result = await executeSetWinnerTransaction(
      { activeDosyaId: 2, teminFirmaId: null },
      executor
    )

    expect(result.success).toBe(true)
    expect(result.masterFirmaId).toBeNull()
    expect(result.teminFirmaId).toBeNull()

    // Firma seçimi kaldırılırken aidiyet sorgusuna gerek yok
    expect(mockQuery).not.toHaveBeenCalled()

    // Transaction'da firma_id = NULL ve tüm bayraklar 0 olmalı
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    const queries = mockTransaction.mock.calls[0][0]
    expect(queries).toHaveLength(2)
    expect(queries[0].sql).toContain('UPDATE DATA_TeminDosyasi SET firma_id = NULL')
    expect(queries[1].sql).toContain('UPDATE DATA_TeminFirma SET kazandi_mi = 0, kazanan_mi = 0')
    expect(queries[1].params).toEqual([2])
  })

  it('4. Başka dosyaya ait veya geçersiz temin_firma_id verildiğinde işlem transaction çalıştırılmadan reddedilmelidir', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: [] // Bu dosyaya ait kayıt bulunamadı
    })
    const mockTransaction = vi.fn()

    const executor: WinnerSyncDbExecutor = {
      query: mockQuery,
      transaction: mockTransaction
    }

    const result = await executeSetWinnerTransaction(
      { activeDosyaId: 5, teminFirmaId: 999 },
      executor
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('ait değil')
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('5. Transaction başarısız olduğunda veya hata fırlattığında hata açıklaması döndürülmelidir (Rollback)', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 15, firma_id: 250 }]
    })
    const mockTransaction = vi.fn().mockResolvedValue({
      success: false,
      error: 'Simulated DB Lock / Constraint Violation'
    })

    const executor: WinnerSyncDbExecutor = {
      query: mockQuery,
      transaction: mockTransaction
    }

    const result = await executeSetWinnerTransaction(
      { activeDosyaId: 3, teminFirmaId: 15 },
      executor
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Simulated DB Lock / Constraint Violation')
  })

  describe('inspectWinnerIntegrity (Salt Okunur Bütünlük İncelemesi)', () => {
    it('Temiz tekil kazanan durumunu doğru tespit etmeli', () => {
      const firms = [
        { id: 1, temin_dosya_id: 1, kazandi_mi: 1, kazanan_mi: 1 },
        { id: 2, temin_dosya_id: 1, kazandi_mi: 0, kazanan_mi: 0 }
      ]
      const report = inspectWinnerIntegrity(firms)
      expect(report.isAmbiguous).toBe(false)
      expect(report.issueType).toBe('NONE')
      expect(report.kazandiCount).toBe(1)
      expect(report.kazananCount).toBe(1)
    })

    it('Aynı dosyada iki ayrı kazandi_mi=1 varsa DOUBLE_WINNER tespit etmeli', () => {
      const firms = [
        { id: 1, temin_dosya_id: 1, kazandi_mi: 1, kazanan_mi: 1 },
        { id: 2, temin_dosya_id: 1, kazandi_mi: 1, kazanan_mi: 0 }
      ]
      const report = inspectWinnerIntegrity(firms)
      expect(report.isAmbiguous).toBe(true)
      expect(report.issueType).toBe('DOUBLE_WINNER')
      expect(report.kazandiCount).toBe(2)
    })

    it('Farklı firmalarda kazandi_mi ve kazanan_mi çelişkisi varsa CONFLICTING_FLAGS tespit etmeli', () => {
      const firms = [
        { id: 1, temin_dosya_id: 1, kazandi_mi: 1, kazanan_mi: 0 },
        { id: 2, temin_dosya_id: 1, kazandi_mi: 0, kazanan_mi: 1 }
      ]
      const report = inspectWinnerIntegrity(firms)
      expect(report.isAmbiguous).toBe(true)
      expect(report.issueType).toBe('CONFLICTING_FLAGS')
      expect(report.kazandiCount).toBe(1)
      expect(report.kazananCount).toBe(1)
    })
  })

  describe('resolveResenWinner (Re\'sen Kazanan Firma Çözümleme ve Koruma)', () => {
    it('Açıkça seçilmiş kazanan firma varsa (EXPLICIT) doğrudan korumalı ve isResen=false dönmeli', async () => {
      const mockQuery = vi.fn()
        // dosya
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 1, firma_id: 100 }]
        })
        // firms
        .mockResolvedValueOnce({
          success: true,
          data: [
            { temin_firma_id: 10, master_firma_id: 100, unvan: 'Firma 100', kazandi_mi: 1, teklif_toplami: 5000 },
            { temin_firma_id: 20, master_firma_id: 200, unvan: 'Firma 200', kazandi_mi: 0, teklif_toplami: 4000 }
          ]
        })
        // bids
        .mockResolvedValueOnce({ success: true, data: [] })

      const executor: WinnerSyncDbExecutor = {
        query: mockQuery,
        transaction: vi.fn()
      }

      const res = await resolveResenWinner(1, executor, false)
      expect(res.winner?.unvan).toBe('Firma 100')
      expect(res.reason).toBe('EXPLICIT')
      expect(res.isResen).toBe(false)
    })

    it('Açık kazanan yoksa ama Islak/Snapshot belgede firma varsa (SNAPSHOT_PROTECTED) onu korumalı', async () => {
      const mockQuery = vi.fn()
        // dosya (kazanan yok)
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 2, firma_id: null }]
        })
        // firms (kazandi_mi=0)
        .mockResolvedValueOnce({
          success: true,
          data: [
            { temin_firma_id: 10, master_firma_id: 100, unvan: 'Örnek Firma A', kazandi_mi: 0, teklif_toplami: 6000 },
            { temin_firma_id: 20, master_firma_id: 200, unvan: 'Örnek Firma B', kazandi_mi: 0, teklif_toplami: 5000 }
          ]
        })
        // bids
        .mockResolvedValueOnce({ success: true, data: [] })
        // snapshot
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              sablon_kodu: 'piyasa-fiyat-arastirma-tutanagi',
              veri_json: JSON.stringify({ kazananFirmaUnvan: 'Örnek Firma A', kazananFirmaId: 100 })
            }
          ]
        })

      const mockTx = vi.fn().mockResolvedValue({ success: true })
      const executor: WinnerSyncDbExecutor = {
        query: mockQuery,
        transaction: mockTx
      }

      const res = await resolveResenWinner(2, executor, true)
      expect(res.winner?.unvan).toBe('Örnek Firma A')
      expect(res.reason).toBe('SNAPSHOT_PROTECTED')
      expect(res.isResen).toBe(true)
    })

    it('Açık kazanan ve snapshot yoksa en düşük teklif veren firmayı (LOWEST_BID) re\'sen belirlemeli', async () => {
      const mockQuery = vi.fn()
        // dosya
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 3, firma_id: null }]
        })
        // firms
        .mockResolvedValueOnce({
          success: true,
          data: [
            { temin_firma_id: 10, master_firma_id: 100, unvan: 'Pahalı Firma', kazandi_mi: 0, teklif_toplami: 10000 },
            { temin_firma_id: 20, master_firma_id: 200, unvan: 'En Ucuz Firma', kazandi_mi: 0, teklif_toplami: 3500 }
          ]
        })
        // bids
        .mockResolvedValueOnce({ success: true, data: [] })
        // snapshot (yok)
        .mockResolvedValueOnce({ success: true, data: [] })

      const mockTx = vi.fn().mockResolvedValue({ success: true })
      const executor: WinnerSyncDbExecutor = {
        query: mockQuery,
        transaction: mockTx
      }

      const res = await resolveResenWinner(3, executor, true)
      expect(res.winner?.unvan).toBe('En Ucuz Firma')
      expect(res.winner?.temin_firma_id).toBe(20)
      expect(res.reason).toBe('LOWEST_BID')
      expect(res.isResen).toBe(true)
    })

    it('Dosyada tek firma varsa (SINGLE_FIRM) teklifsiz de olsa re\'sen belirlemeli', async () => {
      const mockQuery = vi.fn()
        // dosya
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 4, firma_id: null }]
        })
        // firms (tek firma)
        .mockResolvedValueOnce({
          success: true,
          data: [
            { temin_firma_id: 15, master_firma_id: 150, unvan: 'Tek İstekli Ltd.', kazandi_mi: 0, teklif_toplami: 0 }
          ]
        })
        // bids
        .mockResolvedValueOnce({ success: true, data: [] })
        // snapshot (yok)
        .mockResolvedValueOnce({ success: true, data: [] })

      const mockTx = vi.fn().mockResolvedValue({ success: true })
      const executor: WinnerSyncDbExecutor = {
        query: mockQuery,
        transaction: mockTx
      }

      const res = await resolveResenWinner(4, executor, true)
      expect(res.winner?.unvan).toBe('Tek İstekli Ltd.')
      expect(res.reason).toBe('SINGLE_FIRM')
      expect(res.isResen).toBe(true)
    })
  })
})
