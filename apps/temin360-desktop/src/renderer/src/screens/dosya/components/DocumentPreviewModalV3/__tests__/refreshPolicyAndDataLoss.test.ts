import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DocumentEngine } from '@worksuite-360/document-engine'
import {
  applyRefreshPolicy,
  getFieldRefreshPolicy
} from '../hooks/helpers/previewData/refreshPolicy'
import { buildComparableSnapshot } from '../hooks/useDocumentPreviewData'
import { saveDocumentToDb, refreshDocumentFromDb } from '../hooks/helpers/previewExportUtils'
import { ihtiyacRaporuResolver } from '../hooks/helpers/sourceResolvers'
import { documentPreloadService } from '../../../../../services/documentPreloadService'
import { ihtiyacRaporuRepository } from '../../../../../services/ihtiyac-raporu/repository'
import { resetTablesChecked } from '../../../../../services/ihtiyac-raporu/schema'
import { resolveTemplateRouteForDocument } from '../../../../../services/rotaDefaultsService'

describe('TEMİN 360 — Belge Veri Kaybı Düzeltme ve Regresyon Testleri', () => {
  let mockSnapshots: Map<string, any>
  let mockRaporTable: Map<number, any>
  let mockRaporKalemTable: Map<number, any[]>

  beforeEach(() => {
    resetTablesChecked()
    documentPreloadService.invalidateCache()
    mockSnapshots = new Map()
    mockRaporTable = new Map()
    mockRaporKalemTable = new Map()

    // Başlangıç örnek ihtiyaç raporu (ID: 10 - bağımsız, ID: 20 - dosyaya bağlı)
    mockRaporTable.set(10, {
      id: 10,
      rapor_no: 'IR-2026/010',
      baslik: 'İlk Rapor Başlığı',
      gerekce: 'İlk Gerekçe',
      birim_id: 1,
      birim_adi: 'Bilgi İşlem Müdürlüğü',
      talep_eden_personel_id: 5,
      talep_eden_personel: 'Ali Veli',
      talep_eden_unvan: 'Bilgisayar Mühendisi',
      durum: 'taslak',
      temin_dosya_id: null,
      tarih: '2026-11-06',
      onay_tarihi: null,
      tahmini_butce: 5000,
      notlar: 'İlk not',
      evrak_sayisi: 'E-100',
      belge_snapshot_json: null
    })

    mockRaporKalemTable.set(10, [
      {
        id: 1,
        rapor_id: 10,
        sira_no: 1,
        kalem_adi: 'Dizüstü Bilgisayar',
        tipi: 'Mal',
        birim: 'Adet',
        miktar: 2,
        kdv_orani: 20,
        tahmini_birim_fiyat: 2500
      }
    ])

    mockRaporTable.set(20, {
      id: 20,
      rapor_no: 'IR-2026/020',
      baslik: 'Dosyaya Bağlı Rapor',
      gerekce: 'Bağlı Rapor Gerekçesi',
      birim_id: 2,
      birim_adi: 'Destek Hizmetleri Müdürlüğü',
      talep_eden_personel_id: 6,
      talep_eden_personel: 'Ayşe Yılmaz',
      talep_eden_unvan: 'Şef',
      durum: 'dosyaya_aktarildi',
      temin_dosya_id: 777,
      tarih: '2026-11-06',
      onay_tarihi: null,
      tahmini_butce: 10000,
      notlar: '',
      evrak_sayisi: 'E-200',
      belge_snapshot_json: null
    })

    mockRaporKalemTable.set(20, [
      {
        id: 2,
        rapor_id: 20,
        sira_no: 1,
        kalem_adi: 'Lazer Yazıcı',
        tipi: 'Mal',
        birim: 'Adet',
        miktar: 1,
        kdv_orani: 20,
        tahmini_birim_fiyat: 10000
      }
    ])

    ;(global as any).window = (global as any).window || {}
    ;(global as any).window.electron = {
      ipcRenderer: {
        invoke: vi.fn(async (channel: string, sqlOrPayload: any, params?: any[]) => {
          if (channel === 'belge:get-document') {
            const key = `${sqlOrPayload.dosyaId}_${sqlOrPayload.templateKey}`
            if (mockSnapshots.has(key)) {
              return {
                success: true,
                exists: true,
                record: mockSnapshots.get(key)
              }
            }
            return { success: true, exists: false, record: null }
          }

          if (channel === 'belge:save-document') {
            const key = `${sqlOrPayload.dosyaId}_${sqlOrPayload.templateKey}`
            const record = {
              id: 1,
              dosyaId: sqlOrPayload.dosyaId,
              templateKey: sqlOrPayload.templateKey,
              data: sqlOrPayload.data,
              sablonVersiyon: sqlOrPayload.sablonVersiyon || 1,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }
            mockSnapshots.set(key, record)
            return { success: true, id: 1, updatedAt: record.updatedAt }
          }

          if (channel === 'db:query' || channel === 'db:queryFirst' || channel === 'db:run') {
            const sql = String(sqlOrPayload || '')
            if (sql.includes('FROM DATA_IhtiyacRaporu r') && sql.includes('WHERE r.id = ?')) {
              const id = Number(params?.[0])
              const row = mockRaporTable.get(id) || null
              if (channel === 'db:queryFirst') return { success: true, data: row }
              return { success: true, data: row ? [row] : [] }
            }
            if (sql.includes('FROM DATA_IhtiyacRaporuKalem') && sql.includes('WHERE rapor_id = ?')) {
              const id = Number(params?.[0])
              return { success: true, data: mockRaporKalemTable.get(id) || [] }
            }
            if (sql.startsWith('UPDATE DATA_IhtiyacRaporu SET')) {
              const id = Number(params?.[params.length - 1])
              const existing = mockRaporTable.get(id)
              if (existing) {
                const setPart = sql
                  .replace(/^UPDATE DATA_IhtiyacRaporu SET\s+/i, '')
                  .replace(/\s+WHERE id = \?$/i, '')
                const assignments = setPart.split(',').map((s) => s.trim())
                let paramIdx = 0
                for (const assign of assignments) {
                  if (assign.includes('CURRENT_TIMESTAMP')) continue
                  const col = assign.split('=')[0].trim()
                  existing[col] = params?.[paramIdx++]
                }
                mockRaporTable.set(id, { ...existing })
              }
              return { success: true, data: { changes: 1, lastInsertRowid: id } }
            }
            if (sql.startsWith('DELETE FROM DATA_IhtiyacRaporuKalem')) {
              const id = Number(params?.[0])
              mockRaporKalemTable.set(id, [])
              return { success: true, data: { changes: 1 } }
            }
            if (sql.includes('INSERT INTO DATA_IhtiyacRaporuKalem')) {
              const raporId = Number(params?.[0])
              const list = mockRaporKalemTable.get(raporId) || []
              list.push({
                id: list.length + 1,
                rapor_id: raporId,
                sira_no: params?.[1],
                kalem_adi: params?.[2],
                tipi: params?.[3],
                birim: params?.[4],
                miktar: params?.[5],
                kdv_orani: params?.[6],
                tasinir_kodu: params?.[7],
                okas_kodu: params?.[8],
                poz_no: params?.[9],
                aciklama: params?.[10],
                tahmini_birim_fiyat: params?.[11]
              })
              mockRaporKalemTable.set(raporId, list)
              return { success: true, data: { changes: 1, lastInsertRowid: list.length } }
            }
            return { success: true, data: [] }
          }

          return { success: true, data: [] }
        })
      }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Senaryo 1 (Dosya belgesi): Bir alanı değiştir -> kaydet -> kapat -> yeniden aç -> değer korunur', async () => {
    const dosyaId = 505
    const resolvedId = 'ihtiyac_listesi'

    const editedFormData = {
      dosyaKonusu: 'Özel Düzenlenmiş Dosya Konusu',
      evrakSayisi: 'E-999888',
      hazirlayanPersonelAdi: 'Murat Kaya',
      hazirlayanPersonelUnvan: 'Birim Sorumlusu',
      onaylayanPersonelAdi: 'Kemal Demir',
      onaylayanPersonelUnvan: 'Müdür',
      ihtiyacKalemleri: [{ siraNo: 1, malzemeAdi: 'Sunucu Kabini', miktar: 3, birimi: 'Adet' }]
    }

    await saveDocumentToDb({
      activeDosyaId: dosyaId,
      resolvedId,
      selectedDocId: 'ihtiyac-listesi',
      activeTemplateConf: { id: 'ihtiyac-listesi', name: 'IhtiyacListesi' },
      formData: editedFormData,
      localShowLogoLeft: true,
      localShowLogoRight: false,
      logoLeft: 'logo-left.png',
      logoRight: null,
      institutionLogo: null,
      orientation: 'portrait'
    })

    // Yeniden açıldığında
    const reloaded = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey: resolvedId
    })

    expect(reloaded.isExisting).toBe(true)
    expect(reloaded.data.dosyaKonusu).toBe('Özel Düzenlenmiş Dosya Konusu')
    expect(reloaded.data.evrakSayisi).toBe('E-999888')
    expect(reloaded.data.hazirlayanPersonelAdi).toBe('Murat Kaya')
    expect(reloaded.data.onaylayanPersonelAdi).toBe('Kemal Demir')
  })

  it('Senaryo 2 (PRESERVE alanı): evrakSayisi, antetSatirlari ve harcamaYetkilisiAdi düzenlemesi senkronizasyonda korunur', () => {
    const sourceData = {
      evrakSayisi: 'ESKI-EVRAK-01',
      antetSatirlari: ['T.C.', 'ESKİ MÜDÜRLÜK'],
      harcamaYetkilisiAdi: 'Eski Yetkili',
      harcamaYetkilisiUnvan: 'Eski Müdür',
      onaylayanPersonelAdi: 'Eski Onaylayan',
      ihtiyacKalemleri: [
        { siraNo: 1, malzemeAdi: 'Güncel Kalem 1' },
        { siraNo: 2, malzemeAdi: 'Güncel Kalem 2' }
      ]
    }

    const userSavedSnapshot = {
      evrakSayisi: 'YENI-MANUEL-EVRAK-99',
      antetSatirlari: ['T.C.', 'YENİ ÖZEL ANTET SATIRI'],
      harcamaYetkilisiAdi: 'Yeni Harcama Yetkilisi',
      harcamaYetkilisiUnvan: 'Yeni Daire Başkanı',
      onaylayanPersonelAdi: 'Yeni Onaylayan',
      gerekce: 'Kullanıcının yazdığı özel gerekçe'
    }

    const merged = applyRefreshPolicy(sourceData, userSavedSnapshot)

    expect(getFieldRefreshPolicy('evrakSayisi')).toBe('preserve')
    expect(getFieldRefreshPolicy('antetSatirlari')).toBe('preserve')
    expect(getFieldRefreshPolicy('harcamaYetkilisiAdi')).toBe('preserve')

    // PRESERVE alanlarında kullanıcının dolu düzenlemesi korunmalı
    expect(merged.evrakSayisi).toBe('YENI-MANUEL-EVRAK-99')
    expect(merged.antetSatirlari).toEqual(['T.C.', 'YENİ ÖZEL ANTET SATIRI'])
    expect(merged.harcamaYetkilisiAdi).toBe('Yeni Harcama Yetkilisi')
    expect(merged.onaylayanPersonelAdi).toBe('Yeni Onaylayan')
    // MANUAL alanı korunmalı
    expect(merged.gerekce).toBe('Kullanıcının yazdığı özel gerekçe')
    // SOURCE alanı kaynaktan güncellenmeli
    expect(merged.ihtiyacKalemleri).toHaveLength(2)
  })

  it('Senaryo 2b (null, undefined, boş string ve boş dizi regresyon testleri): Boş değerler kaynak veriyi ezmez', () => {
    const sourceData = {
      evrakSayisi: 'DOSYA-EVRAK-123',
      antetSatirlari: ['T.C.', 'KURUM ADI'],
      harcamaYetkilisiAdi: 'Kaynak Yetkili',
      isinAciklamasi: 'Kaynaktan gelen açıklama',
      ihtiyacKalemleri: [{ siraNo: 1, malzemeAdi: 'Kaynak Kalem' }]
    }

    const snapshotWithEmpties = {
      evrakSayisi: '   ', // boş string -> kaynak korunmalı
      antetSatirlari: [], // boş dizi -> kaynak korunmalı
      harcamaYetkilisiAdi: null, // null -> kaynak korunmalı
      isinAciklamasi: '', // boş string -> kaynakta dolu değer varken ezmemeli
      ihtiyacKalemleri: [] // boş dizi -> kaynak kalemleri korunmalı
    }

    const merged = applyRefreshPolicy(sourceData, snapshotWithEmpties)

    expect(merged.evrakSayisi).toBe('DOSYA-EVRAK-123')
    expect(merged.antetSatirlari).toEqual(['T.C.', 'KURUM ADI'])
    expect(merged.harcamaYetkilisiAdi).toBe('Kaynak Yetkili')
    expect(merged.isinAciklamasi).toBe('Kaynaktan gelen açıklama')
    expect(merged.ihtiyacKalemleri).toEqual([{ siraNo: 1, malzemeAdi: 'Kaynak Kalem' }])
  })

  it('Senaryo 3 (SOURCE alanı): Kaynak kalem/teklif değiştiğinde Yenile (refreshDocumentFromDb) ile güncel veri gelir, manuel/preserve alanlar korunur', async () => {
    const dosyaId = 606
    const resolvedId = 'luzum_muzekkeresi'

    vi.spyOn(DocumentEngine, 'resolveDocumentData').mockResolvedValueOnce({
      data: {
        evrakSayisi: 'KAYNAK-EVRAK-1',
        ihtiyacKalemleri: [
          { siraNo: 1, malzemeAdi: 'Yeni Eklenen Kalem A', miktar: 5 },
          { siraNo: 2, malzemeAdi: 'Yeni Eklenen Kalem B', miktar: 10 }
        ],
        yaklasikMaliyet: 75000
      }
    } as any)

    const currentFormData = {
      evrakSayisi: 'KULLANICI-EVRAK-OZEL',
      isinAciklamasi: 'Kullanıcının özel açıklaması silinmemeli',
      ihtiyacKalemleri: [{ siraNo: 1, malzemeAdi: 'Eski Kalem', miktar: 1 }],
      yaklasikMaliyet: 10000
    }

    const refreshed = await refreshDocumentFromDb({
      activeDosyaId: dosyaId,
      resolvedId,
      currentFormData
    })

    expect(refreshed).toBeDefined()
    // SOURCE alanları taze kaynaktan güncellendi
    expect(refreshed?.ihtiyacKalemleri).toHaveLength(2)
    expect(refreshed?.ihtiyacKalemleri[0].malzemeAdi).toBe('Yeni Eklenen Kalem A')
    expect(refreshed?.yaklasikMaliyet).toBe(75000)
    // PRESERVE ve MANUAL alanlar korundu
    expect(refreshed?.evrakSayisi).toBe('KULLANICI-EVRAK-OZEL')
    expect(refreshed?.isinAciklamasi).toBe('Kullanıcının özel açıklaması silinmemeli')
  })

  it('Senaryo 4 (İhtiyaç Raporu - Bağımsız ve Dosyaya Bağlı): Belgede değişiklik yap -> kaydet -> kapat -> yeniden aç -> veritabanından geri yüklenir', async () => {
    // 4A: Bağımsız İhtiyaç Raporu (ID: 10, temin_dosya_id: null)
    const editedDataIndependent = {
      dosyaKonusu: 'Bağımsız Rapor Güncel Başlık',
      gerekce: 'Bağımsız Rapor Güncel Gerekçe',
      evrakSayisi: 'E-555-BAGIMSIZ',
      sunulacakMakamAdi: 'STRATEJİ GELİŞTİRME BAŞKANLIĞINA',
      hazirlayanPersonelAdi: 'Zeynep Aksoy',
      hazirlayanPersonelUnvan: 'Uzman',
      onaylayanPersonelAdi: 'Hakan Çelik',
      onaylayanPersonelUnvan: 'Daire Başkanı',
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          malzemeAdi: 'Yüksek Performanslı İş İstasyonu',
          birimi: 'Adet',
          miktar: 4,
          kdvOrani: 20,
          tahminiBirimFiyat: 30000
        }
      ]
    }

    const saveRes1 = await ihtiyacRaporuRepository.saveBelgeSnapshot(
      10,
      'luzum_muzekkeresi',
      editedDataIndependent
    )
    expect(saveRes1.linkedDosyaId).toBeNull()
    expect(saveRes1.rapor.baslik).toBe('Bağımsız Rapor Güncel Başlık')
    expect(saveRes1.rapor.evrak_sayisi).toBe('E-555-BAGIMSIZ')

    // Yeniden açıldığında ihtiyacRaporuResolver ile doğrula
    const resolved1 = await ihtiyacRaporuResolver.resolve(
      { kind: 'ihtiyacRaporu', raporId: 10 },
      'luzum_muzekkeresi'
    )
    expect(resolved1.formData?.dosyaKonusu).toBe('Bağımsız Rapor Güncel Başlık')
    expect(resolved1.formData?.sunulacakMakamAdi).toBe('STRATEJİ GELİŞTİRME BAŞKANLIĞINA')
    expect(resolved1.formData?.onaylayanPersonelAdi).toBe('Hakan Çelik')
    expect((resolved1.formData?.ihtiyacKalemleri as any[])[0].malzemeAdi).toBe(
      'Yüksek Performanslı İş İstasyonu'
    )

    // 4B: Dosyaya Bağlı İhtiyaç Raporu (ID: 20, temin_dosya_id: 777)
    const editedDataLinked = {
      dosyaKonusu: 'Bağlı Rapor Güncel Başlık',
      evrakSayisi: 'E-777-BAGLI',
      onaylayanPersonelAdi: 'Selim Aydın'
    }
    const saveRes2 = await ihtiyacRaporuRepository.saveBelgeSnapshot(
      20,
      'luzum_muzekkeresi',
      editedDataLinked
    )
    expect(saveRes2.linkedDosyaId).toBe(777)
    await DocumentEngine.saveDocument({
      dosyaId: 777,
      templateKey: 'luzum_muzekkeresi',
      data: editedDataLinked,
      validateBeforeSave: false
    })
    expect(mockSnapshots.has('777_luzum_muzekkeresi')).toBe(true)
  })

  it('Senaryo 5 (Salt Önizleme): Yeni dosya oluştur -> belgeyi yalnızca aç -> kaydetmeden kapat -> yeni snapshot oluşmamalı', async () => {
    const newDosyaId = 888
    const templateKey = 'piyasa_fiyat_arastirma_tutanagi'

    const doc = await DocumentEngine.loadOrCreateDocument({
      dosyaId: newDosyaId,
      templateKey
    })

    expect(doc.isExisting).toBe(false)
    expect(mockSnapshots.has(`${newDosyaId}_${templateKey}`)).toBe(false)
  })

  it('Senaryo 6 (Önbellek): Belgeyi kaydet -> modalı kapat -> aynı belgeyi tekrar aç -> önbellek güncel veriyi döner', async () => {
    const dosyaId = 909
    const resolvedId = 'ihtiyac_listesi'

    // Önce önbelleğe eski veri koyalım
    documentPreloadService.updateCachedResolvedData(resolvedId, dosyaId, {
      dosyaKonusu: 'Eski Önbellek Başlığı'
    })

    expect(
      documentPreloadService.getCachedDocument(resolvedId, dosyaId)?.resolvedData?.dosyaKonusu
    ).toBe('Eski Önbellek Başlığı')

    // Belgeyi yeni veriyle kaydet
    await saveDocumentToDb({
      activeDosyaId: dosyaId,
      resolvedId,
      selectedDocId: 'ihtiyac-listesi',
      activeTemplateConf: { id: 'ihtiyac-listesi', name: 'IhtiyacListesi' },
      formData: { dosyaKonusu: 'Yeni Kaydedilmiş Başlık' },
      localShowLogoLeft: true,
      localShowLogoRight: false,
      logoLeft: null,
      logoRight: null,
      institutionLogo: null,
      orientation: 'portrait'
    })

    // Tekrar açılışta önbellek eski veriyi değil yeni kaydedilen veriyi dönmeli
    const cachedAfterSave = documentPreloadService.getCachedDocument(resolvedId, dosyaId)
    expect(cachedAfterSave?.resolvedData?.dosyaKonusu).toBe('Yeni Kaydedilmiş Başlık')
    expect(cachedAfterSave?.payloadData?.savedSnapshot?.dosyaKonusu).toBe('Yeni Kaydedilmiş Başlık')
  })

  it('Senaryo 7 (Rota): Rota / imza / görevli alanlarını değiştir -> kaydet -> yeniden aç -> değerler korunur', async () => {
    const dosyaId = 303
    const templateId = 'piyasa_fiyat_arastirma_tutanagi'

    const dataWithCustomRoute = {
      dosyaKonusu: 'Piyasa Araştırma Konusu',
      fiyatArastirmaGorevlileri: [
        { ad_soyad: 'Mustafa Koç', unvan: 'Tekniker' },
        { ad_soyad: 'Elif Şahin', unvan: 'Mühendis' }
      ],
      onaylayanPersonelAdi: 'Prof. Dr. Ahmet Arslan',
      onaylayanPersonelUnvan: 'Başhekim'
    }

    const { enrichedData, resolvedRoute } = resolveTemplateRouteForDocument(
      templateId,
      dataWithCustomRoute,
      dosyaId
    )

    const gorevlilerStep = resolvedRoute.steps.find(
      (s) => s.id === 'komisyon' || s.fieldKey === 'fiyatArastirmaGorevlileri'
    )
    const onaylayanStep = resolvedRoute.steps.find((s) => s.id === 'onaylayan')

    expect(Array.isArray(gorevlilerStep?.value)).toBe(true)
    expect((gorevlilerStep?.value as any[]).length).toBe(2)
    expect((onaylayanStep?.value as any)?.name).toBe('Prof. Dr. Ahmet Arslan')

    await saveDocumentToDb({
      activeDosyaId: dosyaId,
      resolvedId: templateId,
      selectedDocId: templateId,
      activeTemplateConf: { id: templateId, name: 'PiyasaFiyatArastirmaTutanagi' },
      formData: enrichedData,
      localShowLogoLeft: true,
      localShowLogoRight: false,
      logoLeft: null,
      logoRight: null,
      institutionLogo: null,
      orientation: 'landscape'
    })

    const loaded = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey: templateId
    })

    expect(loaded.data.fiyatArastirmaGorevlileri).toHaveLength(2)
    expect((loaded.data.fiyatArastirmaGorevlileri as any[])[0].ad_soyad).toBe('Mustafa Koç')
    expect(loaded.data.onaylayanPersonelAdi).toBe('Prof. Dr. Ahmet Arslan')
  })

  it('Senaryo 8 (isDirty ve Şablon Değişimi): initialSnapshot ve currentSnapshot aynı alan kümesiyle karşılaştırılır', () => {
    const baseData = {
      dosyaKonusu: 'Test Konusu',
      hazirlayanPersonelAdi: 'Ali',
      resolvedRoute: { templateKey: 'ihtiyac_listesi', slots: {} }
    }

    const snap1 = buildComparableSnapshot(baseData, true, false, 'portrait')
    const snap2 = buildComparableSnapshot(
      { ...baseData, resolvedRoute: { templateKey: 'changed_transient', slots: {} } },
      true,
      false,
      'portrait'
    )

    // Geçici resolvedRoute objesi farkı yüzünden sahte isDirty oluşmamalı
    expect(snap1).toBe(snap2)

    // Gerçek bir alan veya görünüm ayarı değiştiğinde snapshot farklılaşmalı (isDirty = true)
    const snapLogoChanged = buildComparableSnapshot(baseData, true, true, 'portrait')
    expect(snapLogoChanged).not.toBe(snap1)

    const snapOrientationChanged = buildComparableSnapshot(baseData, true, false, 'landscape')
    expect(snapOrientationChanged).not.toBe(snap1)

    const snapFieldChanged = buildComparableSnapshot(
      { ...baseData, dosyaKonusu: 'Değiştirildi' },
      true,
      false,
      'portrait'
    )
    expect(snapFieldChanged).not.toBe(snap1)
  })

  it('Senaryo 9 (Komisyon İmza Türü & Snapshot İzolasyonu): Komisyon üyesinin imza türü değiştirildiğinde diğer belgelerdeki kayıtlı snapshot verileri otomatik değiştirilmez', () => {
    // Kaynak komisyon verisinde (DATA_TeminKomisyon) bir üyenin imza türü Paraf veya Koordinasyon olarak değiştirildiğinde
    const updatedSourceData = {
      fiyatArastirmaGorevlileri: [
        {
          id: 1,
          adSoyad: 'Ahmet Yılmaz',
          unvan: 'Şube Müdürü',
          gorevi: 'Komisyon Başkanı',
          imzaTuru: 'Paraf'
        }
      ],
      muayeneKomisyonu: [
        {
          id: 2,
          adSoyad: 'Mehmet Demir',
          unvan: 'Mühendis',
          gorevi: 'Üye',
          imzaTuru: 'Koordinasyon'
        }
      ],
      rota: [
        {
          sira: 1,
          islem: 'Paraf',
          personel: 'Ahmet Yılmaz',
          unvan: 'Şube Müdürü',
          komisyonGorevi: 'Komisyon Başkanı'
        }
      ]
    }

    // Daha önce kaydedilmiş başka bir belgenin (veya mevcut belgenin) snapshot verisi
    const savedSnapshotData = {
      fiyatArastirmaGorevlileri: [
        {
          id: 1,
          adSoyad: 'Ahmet Yılmaz',
          unvan: 'Şube Müdürü',
          gorevi: 'Komisyon Başkanı',
          imzaTuru: 'İmza'
        },
        {
          id: 3,
          adSoyad: 'Zeynep Kaya',
          unvan: 'Tekniker',
          gorevi: 'Fiyat Araştırma Görevlisi',
          imzaTuru: 'İmza'
        }
      ],
      muayeneKomisyonu: [
        {
          id: 2,
          adSoyad: 'Mehmet Demir',
          unvan: 'Mühendis',
          gorevi: 'Üye',
          imzaTuru: 'İmza'
        }
      ],
      rota: [
        {
          sira: 1,
          islem: 'Hazırlayan',
          personel: 'Ali Veli',
          unvan: 'Memur'
        }
      ]
    }

    expect(getFieldRefreshPolicy('fiyatArastirmaGorevlileri')).toBe('preserve')
    expect(getFieldRefreshPolicy('muayeneKomisyonu')).toBe('preserve')
    expect(getFieldRefreshPolicy('komisyonUyeleri')).toBe('preserve')
    expect(getFieldRefreshPolicy('komisyon')).toBe('preserve')
    expect(getFieldRefreshPolicy('rota')).toBe('preserve')
    expect(getFieldRefreshPolicy('routeOverrides')).toBe('preserve')

    const merged = applyRefreshPolicy(updatedSourceData, savedSnapshotData)

    // Kayıtlı snapshot verisindeki imza türü ve üyeler ezilmemeli, aynen korunmalı
    expect(merged.fiyatArastirmaGorevlileri).toHaveLength(2)
    expect((merged.fiyatArastirmaGorevlileri as any[])[0].imzaTuru).toBe('İmza')
    expect((merged.muayeneKomisyonu as any[])[0].imzaTuru).toBe('İmza')
    expect((merged.rota as any[])[0].personel).toBe('Ali Veli')
  })
})
