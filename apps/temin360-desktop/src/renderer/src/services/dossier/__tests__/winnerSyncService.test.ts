import { describe, it, expect, vi } from 'vitest'
import {
  executeSetWinnerTransaction,
  inspectWinnerIntegrity,
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
})
