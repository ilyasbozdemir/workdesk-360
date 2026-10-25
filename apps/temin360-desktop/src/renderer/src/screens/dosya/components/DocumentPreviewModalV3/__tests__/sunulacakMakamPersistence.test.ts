import { describe, it, expect, vi } from 'vitest'
import { resolveSnapshotOverlay } from '../hooks/helpers/previewData/resolveSnapshotOverlay'
import { resolveAntetAndBirim } from '../hooks/helpers/previewData/resolveAntetAndBirim'
import { useGlobalDocumentPreviewStore } from '../../../../../store/globalDocumentPreviewStore'
import { DocumentEngine } from '../document-engine/DocumentEngine'

describe('sunulacakMakamAdi persistence and reload tests', () => {
  it('1. resolveAntetAndBirim correctly resolves sunulacakMakamAdi from dosyaObj.sunulacak_makam', async () => {
    const baseData: any = {}
    const resolved: any = {}
    const payloadData: any = {}
    const dosyaRecord: any = {
      id: 101,
      sunulacak_makam: 'BAŞKANLIK MAKAMINA',
      dosya_acilis_tarihi: '2026-10-20'
    }
    const birimList: any[] = []
    const queryExecutor = vi.fn().mockResolvedValue([])

    await resolveAntetAndBirim(
      baseData,
      resolved,
      payloadData,
      dosyaRecord,
      birimList,
      queryExecutor
    )

    expect(baseData.sunulacakMakamAdi).toBe('BAŞKANLIK MAKAMINA')
    expect(baseData.sunulacakMakam).toBe('BAŞKANLIK MAKAMINA')
  })

  it('2. resolveAntetAndBirim falls back to ctx.sunulacakMakamAdi when dosyaObj has none', async () => {
    const baseData: any = {}
    const resolved: any = {}
    const payloadData: any = {
      resolvedContext: {
        sunulacakMakamAdi: 'İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA'
      }
    }
    const dosyaRecord: any = { id: 102 }
    const birimList: any[] = []
    const queryExecutor = vi.fn().mockResolvedValue([])

    await resolveAntetAndBirim(
      baseData,
      resolved,
      payloadData,
      dosyaRecord,
      birimList,
      queryExecutor
    )

    expect(baseData.sunulacakMakamAdi).toBe('İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA')
    expect(baseData.sunulacakMakam).toBe('İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA')
  })

  it('3. resolveSnapshotOverlay prioritizes user-saved snapshotData.sunulacakMakamAdi over activeTab.initialData defaults', async () => {
    // Kullanıcının daha önce DB'ye kaydettiği snapshot
    const savedSnapshotJson = JSON.stringify({
      sunulacakMakamAdi: 'ÖZEL KALEM MÜDÜRLÜĞÜ MAKAMINA',
      tarih: '2026-10-24'
    })

    const queryExecutor = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('DATA_DosyaSablonVeri')) {
        return Promise.resolve([{ veri_json: savedSnapshotJson }])
      }
      return Promise.resolve([])
    })

    // Sekme açıldığında gelen varsayılan initialData (eski context)
    useGlobalDocumentPreviewStore.setState({
      tabs: [
        {
          tabId: 'tab-1',
          documentId: 'luzum_muzekkeresi',
          documentTitle: 'Lüzum Müzekkeresi',
          initialData: {
            sunulacakMakamAdi: 'VARSAYILAN ESKİ MAKAMLIK'
          }
        }
      ],
      activeTabId: 'tab-1'
    })

    const baseData: any = {
      sunulacakMakamAdi: 'GENEL MAKAMLIK'
    }

    const result = await resolveSnapshotOverlay(
      baseData,
      {},
      { id: 105 },
      105,
      'luzum_muzekkeresi',
      'luzum_muzekkeresi',
      true,
      true,
      null,
      null,
      [],
      [],
      [],
      queryExecutor
    )

    // DB'deki kayıtlı kullanıcı düzenlemesi ('ÖZEL KALEM MÜDÜRLÜĞÜ MAKAMINA') korunmalı,
    // activeTab.initialData'daki varsayılan değer onu ezmemelidir!
    expect(result.finalData.sunulacakMakamAdi).toBe('ÖZEL KALEM MÜDÜRLÜĞÜ MAKAMINA')
    expect(result.finalData.sunulacakMakam).toBe('ÖZEL KALEM MÜDÜRLÜĞÜ MAKAMINA')
  })

  it('4. DocumentEngine.compileHtml renders sunulacakMakamAdi correctly in template output', () => {
    const htmlOutput = DocumentEngine.compileHtml({
      templateKey: 'luzum_muzekkeresi',
      data: {
        dosyaKonusu: 'Test Alımı',
        sunulacakMakamAdi: 'DESTEK HİZMETLERİ DAİRE BAŞKANLIĞINA',
        tarih: '24.10.2026'
      },
      orientation: 'portrait'
    })

    expect(htmlOutput).toContain('DESTEK HİZMETLERİ DAİRE BAŞKANLIĞINA')
  })

  it('5. resolveSnapshotOverlay preserves sunulacakMakamAdi for ihtiyac-listesi template', async () => {
    const savedSnapshotJson = JSON.stringify({
      sunulacakMakamAdi: 'GENEL SEKRETERLİK MAKAMINA',
      ihtiyacKalemleri: [{ siraNo: 1, malzemeAdi: 'A4 Kağıt', miktar: 10, birimi: 'Kutu' }]
    })

    const queryExecutor = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('DATA_DosyaSablonVeri')) {
        return Promise.resolve([{ veri_json: savedSnapshotJson }])
      }
      return Promise.resolve([])
    })

    useGlobalDocumentPreviewStore.setState({
      tabs: [
        {
          tabId: 'tab-ihtiyac',
          documentId: 'ihtiyac-listesi',
          documentTitle: 'İhtiyaç Listesi',
          initialData: {
            sunulacakMakamAdi: 'ESKİ SİLİNECEK MAKAMLIK'
          }
        }
      ],
      activeTabId: 'tab-ihtiyac'
    })

    const result = await resolveSnapshotOverlay(
      { sunulacakMakamAdi: 'ESKİ BASE MAKAMLIK' },
      {},
      { id: 200 },
      200,
      'ihtiyac-listesi',
      'ihtiyac-listesi',
      true,
      true,
      null,
      null,
      [],
      [],
      [],
      queryExecutor
    )

    expect(result.finalData.sunulacakMakamAdi).toBe('GENEL SEKRETERLİK MAKAMINA')
    expect(result.finalData.sunulacakMakam).toBe('GENEL SEKRETERLİK MAKAMINA')
  })

  it('6. DocumentEngine.compileHtml renders sunulacakMakamAdi for ihtiyac_listesi', () => {
    const htmlOutput = DocumentEngine.compileHtml({
      templateKey: 'ihtiyac_listesi',
      data: {
        dosyaKonusu: 'Kırtasiye İhtiyaç Listesi',
        sunulacakMakamAdi: 'İLÇE MİLLİ EĞİTİM MÜDÜRLÜĞÜ MAKAMINA',
        tarih: '24.10.2026',
        ihtiyacKalemleri: [{ siraNo: 1, malzemeAdi: 'Kalem', miktar: 5, birimi: 'Paket' }]
      },
      orientation: 'portrait'
    })

    expect(htmlOutput).toContain('İLÇE MİLLİ EĞİTİM MÜDÜRLÜĞÜ MAKAMINA')
  })
})
