import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDatabaseBrowser } from '../useDatabaseBrowser'

describe('useDatabaseBrowser - Regression & Security Test Suite', () => {
  let mockIpcInvoke: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockIpcInvoke = vi.fn().mockImplementation((channel: string, sql?: string) => {
      if (channel === 'db:query') {
        // Table list query
        if (typeof sql === 'string' && sql.includes("sqlite_master WHERE type='table'")) {
          return Promise.resolve({
            success: true,
            data: [
              { name: 'DATA_TeminDosyasi' },
              { name: 'DATA_DosyaSablonVeri' },
              { name: 'NO_PK_TABLE' }
            ]
          })
        }
        // UNION ALL table counts
        if (typeof sql === 'string' && sql.includes('UNION ALL')) {
          return Promise.resolve({
            success: true,
            data: [
              { name: 'DATA_TeminDosyasi', row_count: 50 },
              { name: 'DATA_DosyaSablonVeri', row_count: 12 },
              { name: 'NO_PK_TABLE', row_count: 5 }
            ]
          })
        }
        // PRAGMA table_info
        if (typeof sql === 'string' && sql.includes('PRAGMA table_info("DATA_TeminDosyasi")')) {
          return Promise.resolve({
            success: true,
            data: [
              { cid: 0, name: 'id', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 1 },
              { cid: 1, name: 'temin_no', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
              { cid: 2, name: 'konu', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 }
            ]
          })
        }
        if (typeof sql === 'string' && sql.includes('PRAGMA table_info("DATA_DosyaSablonVeri")')) {
          return Promise.resolve({
            success: true,
            data: [
              {
                cid: 0,
                name: 'temin_dosya_id',
                type: 'INTEGER',
                notnull: 1,
                dflt_value: null,
                pk: 1
              },
              { cid: 1, name: 'sablon_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 2 },
              { cid: 2, name: 'veri_json', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 }
            ]
          })
        }
        if (typeof sql === 'string' && sql.includes('PRAGMA table_info("NO_PK_TABLE")')) {
          return Promise.resolve({
            success: true,
            data: [
              { cid: 0, name: 'tag', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
              { cid: 1, name: 'val', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 }
            ]
          })
        }
        // Table row count query
        if (typeof sql === 'string' && sql.includes('COUNT(*) as total')) {
          return Promise.resolve({
            success: true,
            data: [{ total: 3 }]
          })
        }
        // Paginated rows query
        if (typeof sql === 'string' && sql.includes('SELECT * FROM "DATA_TeminDosyasi"')) {
          return Promise.resolve({
            success: true,
            data: [
              { id: 10, temin_no: '2026/01', konu: 'Elma Alımı' },
              { id: 20, temin_no: '2026/02', konu: 'Armut Alımı' },
              { id: 30, temin_no: '2026/03', konu: 'Muz Alımı' }
            ]
          })
        }
        return Promise.resolve({ success: true, data: [] })
      }

      if (channel === 'db:run') {
        return Promise.resolve({ success: true, changes: 1 })
      }

      return Promise.resolve({ success: true })
    })

    window.electron = {
      ipcRenderer: {
        invoke: mockIpcInvoke,
        send: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  it('1. Filtrelenmiş görünümde arama yapıldığında ekrandaki satır güncellenir; ham indeks ile hedef satır asla karışmaz', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    // Tablo listesi ve detayları yüklensin
    await act(async () => {
      await result.current.loadTables()
    })

    expect(result.current.rows.length).toBe(3)
    expect(result.current.rows[0].id).toBe(10) // Ham satır 0: Elma Alımı
    expect(result.current.rows[2].id).toBe(30) // Ham satır 2: Muz Alımı

    // Gerçek arama akışı: Kullanıcı arama kutusuna 'Muz' yazar
    act(() => {
      result.current.setDataSearch('Muz')
    })

    // filteredRows anında 1 satıra iner ve ilk sırada (filteredIndex: 0) Muz Alımı bulunur
    expect(result.current.filteredRows.length).toBe(1)
    expect(result.current.filteredRows[0].id).toBe(30)
    expect(result.current.rows[0].id).toBe(10) // rows[0] hala Elma Alımı

    // Kullanıcı ekranda görünen 0. satıra tıklar (4. parametre olan satır nesnesi verilmeden çağrıldığında dahi filteredRows[0] kullanılmalıdır)
    act(() => {
      result.current.handleCellClick(0, 'konu', 'Muz Alımı')
      result.current.setEditValue('Organik Muz Alımı')
    })

    expect(result.current.editingCell).toBeDefined()
    expect((result.current.editingCell?.row as Record<string, unknown>)?.id).toBe(30)

    const countCallsBefore = mockIpcInvoke.mock.calls.filter(
      (call) =>
        call[0] === 'db:query' && typeof call[1] === 'string' && call[1].includes('COUNT(*)')
    ).length

    // Hücreyi kaydet
    await act(async () => {
      await result.current.handleSaveCell()
    })

    // db:run çağrısını doğrula:
    // UPDATE sorgusunda id = 10 (ham index 0) DEĞİL, id = 30 (hedef satır) güncellenmeli!
    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    expect(runCalls.length).toBe(1)

    const [channel, sql, params] = runCalls[0]
    expect(channel).toBe('db:run')
    expect(sql).toContain('UPDATE "DATA_TeminDosyasi" SET "konu" = ? WHERE "id" = ?')
    expect(params).toEqual(['Organik Muz Alımı', 30]) // id: 30 güncellendi, ASLA 10 değil!

    // Hücre kaydedildikten sonra gereksiz loadTables / COUNT(*) tetiklenmemeli (0 yeni count sorgusu)
    const countCallsAfter = mockIpcInvoke.mock.calls.filter(
      (call) =>
        call[0] === 'db:query' && typeof call[1] === 'string' && call[1].includes('COUNT(*)')
    ).length
    expect(countCallsAfter).toBe(countCallsBefore)
  })

  it('2. Composite Primary Key (Birleşik Birincil Anahtar) içeren tablolarda tüm PK kolonları WHERE koşulunda kullanılır', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    await act(async () => {
      result.current.setSelectedTable('DATA_DosyaSablonVeri')
      await result.current.loadTableDetails()
    })

    expect(result.current.pkColumns.length).toBe(2)
    expect(result.current.pkColumns.map((c) => c.name)).toEqual(['temin_dosya_id', 'sablon_id'])

    const compositeRow = {
      temin_dosya_id: 105,
      sablon_id: 3,
      veri_json: '{"onay":false}'
    }

    // Hücre düzenle
    act(() => {
      result.current.handleCellClick(0, 'veri_json', compositeRow.veri_json, compositeRow)
      result.current.setEditValue('{"onay":true}')
    })

    await act(async () => {
      await result.current.handleSaveCell()
    })

    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    const lastRun = runCalls[runCalls.length - 1]
    const [, sql, params] = lastRun

    // Hem temin_dosya_id hem de sablon_id WHERE koşulunda yer almalı!
    expect(sql).toContain(
      'UPDATE "DATA_DosyaSablonVeri" SET "veri_json" = ? WHERE "temin_dosya_id" = ? AND "sablon_id" = ?'
    )
    expect(params).toEqual(['{"onay":true}', 105, 3])
  })

  it('3. Composite Primary Key içeren tablolarda satır silme işlemi tekil satırı hedefler', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    await act(async () => {
      result.current.setSelectedTable('DATA_DosyaSablonVeri')
      await result.current.loadTableDetails()
    })

    const compositeRow = {
      temin_dosya_id: 105,
      sablon_id: 4,
      veri_json: '{"deleted":false}'
    }

    act(() => {
      result.current.setDeletingRow(compositeRow)
    })

    await act(async () => {
      await result.current.handleDeleteRowConfirm()
    })

    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    const lastRun = runCalls[runCalls.length - 1]
    const [, sql, params] = lastRun

    expect(sql).toContain(
      'DELETE FROM "DATA_DosyaSablonVeri" WHERE "temin_dosya_id" = ? AND "sablon_id" = ?'
    )
    expect(params).toEqual([105, 4])
  })

  it('4. Primary key bulunmayan tablolarda eşsiz kayıt varsa tüm kolonlar eşleştirilir ve güncellenir', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    await act(async () => {
      result.current.setSelectedTable('NO_PK_TABLE')
      await result.current.loadTableDetails()
    })

    expect(result.current.pkColumns.length).toBe(0)

    const noPkRow = {
      tag: 'KOD_1',
      val: null
    }

    // Uniqueness pre-check tek kayıt döndürsün (match_count: 1)
    mockIpcInvoke.mockImplementation((channel: string, sql?: string) => {
      if (channel === 'db:query' && typeof sql === 'string' && sql.includes('match_count')) {
        return Promise.resolve({ success: true, data: [{ match_count: 1 }] })
      }
      if (channel === 'db:run') {
        return Promise.resolve({ success: true, changes: 1 })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    act(() => {
      result.current.handleCellClick(0, 'val', '', noPkRow)
      result.current.setEditValue('Yeni Deger')
    })

    await act(async () => {
      await result.current.handleSaveCell()
    })

    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    const lastRun = runCalls[runCalls.length - 1]
    const [, sql, params] = lastRun

    expect(sql).toContain('UPDATE "NO_PK_TABLE" SET "val" = ? WHERE "tag" = ? AND "val" IS NULL')
    expect(params).toEqual(['Yeni Deger', 'KOD_1'])
  })

  it('4b. Primary key bulunmayan tablolarda birden fazla özdeş kayıt varsa güncelleme engellenir (Veri Güvenliği)', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    await act(async () => {
      result.current.setSelectedTable('NO_PK_TABLE')
      await result.current.loadTableDetails()
    })

    const noPkRow = {
      tag: 'DUPLICATE_TAG',
      val: 'AYNI_DEGER'
    }

    // Uniqueness pre-check 2 adet eşleşen kayıt döndürsün
    mockIpcInvoke.mockImplementation((channel: string, sql?: string) => {
      if (channel === 'db:query' && typeof sql === 'string' && sql.includes('match_count')) {
        return Promise.resolve({ success: true, data: [{ match_count: 2 }] })
      }
      if (channel === 'db:run') {
        return Promise.resolve({ success: true, changes: 2 })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    act(() => {
      result.current.handleCellClick(0, 'val', 'AYNI_DEGER', noPkRow)
      result.current.setEditValue('DegistirilmeyeCalisilan')
    })

    await act(async () => {
      await result.current.handleSaveCell()
    })

    // db:run ASLA çağrılmamalıdır!
    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    expect(runCalls.length).toBe(0)

    // Hata mesajı verilmiş olmalıdır
    expect(result.current.statusMessage?.type).toBe('error')
    expect(result.current.statusMessage?.text).toContain('özdeş kayıt')
  })

  it('4c. Primary key bulunmayan tablolarda ön kontrol sorgusu hata verdiğinde veya boş döndüğünde işlem kesinlikle durdurulur (Fail-Safe)', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    await act(async () => {
      result.current.setSelectedTable('NO_PK_TABLE')
      await result.current.loadTableDetails()
    })

    const noPkRow = {
      tag: 'ERROR_TAG',
      val: 'TEST_VAL'
    }

    // 1. Simülasyon: Ön kontrol sorgusu IPC hatası döndürsün
    mockIpcInvoke.mockImplementation((channel: string, sql?: string) => {
      if (channel === 'db:query' && typeof sql === 'string' && sql.includes('match_count')) {
        return Promise.resolve({ success: false, error: 'Database locked' })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    act(() => {
      result.current.handleCellClick(0, 'val', 'TEST_VAL', noPkRow)
      result.current.setEditValue('HataDurumundaDegismemeli')
    })

    await act(async () => {
      await result.current.handleSaveCell()
    })

    // db:run ASLA çağrılmamalıdır!
    let runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    expect(runCalls.length).toBe(0)
    expect(result.current.statusMessage?.type).toBe('error')
    expect(result.current.statusMessage?.text).toContain('Doğrulama sorgusu başarısız oldu')

    // 2. Simülasyon: Ön kontrol sorgusu 0 satır döndürsün (kayıt bulunamadı)
    mockIpcInvoke.mockImplementation((channel: string, sql?: string) => {
      if (channel === 'db:query' && typeof sql === 'string' && sql.includes('match_count')) {
        return Promise.resolve({ success: true, data: [{ match_count: 0 }] })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    act(() => {
      result.current.handleCellClick(0, 'val', 'TEST_VAL', noPkRow)
      result.current.setEditValue('BulunamayanKayit')
    })

    await act(async () => {
      await result.current.handleSaveCell()
    })

    // db:run yine ASLA çağrılmamalıdır!
    runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    expect(runCalls.length).toBe(0)
    expect(result.current.statusMessage?.type).toBe('error')
    expect(result.current.statusMessage?.text).toContain('bulunamadı')
  })

  it('5. SQL Konsolunda WITH (CTE) yazma sorguları (INSERT/UPDATE/DELETE) tespit edilir ve otomatik yenileme tetiklenir', async () => {
    const { result } = renderHook(() => useDatabaseBrowser())

    act(() => {
      result.current.setConsoleQuery(
        'WITH silinecek AS (SELECT id FROM DATA_TeminDosyasi WHERE is_deleted = 1) DELETE FROM DATA_TeminDosyasi WHERE id IN (SELECT id FROM silinecek)'
      )
    })

    // Mock response for db:run with 2 changes
    mockIpcInvoke.mockImplementationOnce((channel) => {
      if (channel === 'db:run') {
        return Promise.resolve({ success: true, changes: 2, lastInsertRowid: null })
      }
      return Promise.resolve({ success: true, data: [] })
    })

    await act(async () => {
      await result.current.handleRunQuery()
    })

    const runCalls = mockIpcInvoke.mock.calls.filter((call) => call[0] === 'db:run')
    expect(runCalls.length).toBeGreaterThan(0)
    expect(result.current.consoleResults.length).toBe(1)
    expect(result.current.consoleResults[0].etkilenen_satir).toBe(2)
  })
})
