import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  TemplateRegistry,
  InvalidTemplateKeyError,
  InstitutionalHeaderProvider,
  LuzumMuzekkeresiResolver,
  IhtiyacListesiResolver,
  DocumentEngine
} from '@worksuite-360/document-engine'

describe('Mimari Refaktör - Modüler Belge Çözümleme ve Tip Güvenli Engine', () => {
  beforeEach(() => {
    InstitutionalHeaderProvider.clearCache()
    vi.restoreAllMocks()
  })

  describe('1. TemplateRegistry ve Tip Güvenliği', () => {
    it('kayıtlı şablonlar (luzum_muzekkeresi, ihtiyac_listesi) doğru tanımlara çözümlenmeli', () => {
      const luzumDef = TemplateRegistry.get('luzum_muzekkeresi')
      expect(luzumDef).toBeDefined()
      expect(luzumDef.templateKey).toBe('luzum_muzekkeresi')
      expect(luzumDef.resolver).toBeInstanceOf(LuzumMuzekkeresiResolver)
      expect(luzumDef.renderer).toBeDefined()

      const ihtiyacDef = TemplateRegistry.get('ihtiyac_listesi')
      expect(ihtiyacDef).toBeDefined()
      expect(ihtiyacDef.templateKey).toBe('ihtiyac_listesi')
      expect(ihtiyacDef.resolver).toBeInstanceOf(IhtiyacListesiResolver)
    })

    it('kebab-case ve uzantılı şablon adları kanonik anahtara çözümlenmeli', () => {
      const def1 = TemplateRegistry.get('luzum-muzekkeresi')
      expect(def1.templateKey).toBe('luzum_muzekkeresi')

      const def2 = TemplateRegistry.get('luzum_muzekkeresi.html')
      expect(def2.templateKey).toBe('luzum_muzekkeresi')
    })

    it('bilinmeyen templateKey açıkça InvalidTemplateKeyError fırlatmalı, sessiz yönlendirme yapmamalı', () => {
      expect(() => TemplateRegistry.get('gecersiz_olmayan_sablon')).toThrow(
        InvalidTemplateKeyError
      )
      expect(() => TemplateRegistry.get('')).toThrow(InvalidTemplateKeyError)
    })
  })

  describe('2. InstitutionalHeaderProvider - Ortak Üst Veri ve Önbellek İzolasyonu', () => {
    it('kurum ve dosya üst verilerini tek elden çözümler ve oturum içinde önbelleğe alır', async () => {
      const executedQueries: string[] = []
      const mockQueryExecutor = async (sql: string, params: any[]) => {
        void params
        executedQueries.push(sql)
        if (sql.includes('DATA_TeminDosyasi')) {
          return [
            {
              id: 501,
              temin_no: '2026/TEMIN-501',
              konu: 'Tıbbi Malzeme Alımı',
              butce_yili: 2026,
              tarih: '2026-10-24',
              sunulacak_makam: 'BAŞHEKİMLİK MAKAMINA',
              birim_id: 10,
              birim_adi: 'Satın Alma Şube Müdürlüğü',
              antet_ek_satir: 'Medikal Satın Alma',
              harcama_yetkilisi_id: 2,
              harcama_yetkilisi_unvan: 'Başhekim'
            }
          ]
        }
        if (sql.includes('TANIM_Personel')) {
          return [{ ad_soyad: 'Prof. Dr. Ahmet Yılmaz', unvan: 'Başhekim' }]
        }
        if (sql.includes('TANIM_Kurum')) {
          return [
            {
              id: 1,
              kurum_adi: 'Devlet Hastanesi',
              ust_kurum_adi: 'İl Sağlık Müdürlüğü',
              kurum_anteti: '["T.C.","SAĞLIK BAKANLIĞI","İl Sağlık Müdürlüğü"]'
            }
          ]
        }
        return []
      }

      // İlk çağrı: veritabanına gider
      const header1 = await InstitutionalHeaderProvider.resolve(501, mockQueryExecutor)
      expect(header1).toBeDefined()
      expect(header1.kurumUst).toBe('İl Sağlık Müdürlüğü')
      expect(header1.mudurluk).toBe('Satın Alma Şube Müdürlüğü')
      expect(header1.harcamaYetkilisiAdi).toBe('Prof. Dr. Ahmet Yılmaz')
      const initialQueryCount = executedQueries.length
      expect(initialQueryCount).toBeGreaterThan(0)

      // İkinci çağrı: aynı dosyaId için cache'den döner, yeni sorgu çalıştırmaz!
      const header2 = await InstitutionalHeaderProvider.resolve(501, mockQueryExecutor)
      expect(header2).toEqual(header1)
      expect(executedQueries.length).toBe(initialQueryCount) // Sorgu sayısı artmamalı!
    })
  })

  describe('3. Pilot Belge: LuzumMuzekkeresiResolver - Veri İzolasyonu ve Gereksiz Sorgu Engelleme', () => {
    it('yalnızca dosya ve kalem sorguları çalışır; firma, teklif ve komisyon sorguları ÇALIŞMAZ', async () => {
      const executedQueries: string[] = []
      const mockQueryExecutor = async (sql: string, params: any[]) => {
        void params
        executedQueries.push(sql)
        if (sql.includes('DATA_TeminDosyasi')) {
          return [
            {
              id: 201,
              temin_no: '2026/01',
              konu: 'Kırtasiye İhtiyacı',
              tarih: '2026-10-24',
              sunulacak_makam: 'DESTEK HİZMETLERİ DAİRE BAŞKANLIĞINA'
            }
          ]
        }
        if (sql.includes('DATA_TeminKalem')) {
          return [
            {
              id: 1,
              sira_no: 1,
              kalem_adi: 'A4 Kağıt',
              aciklama: '80 gr/m2 beyaz fotokopi kağıdı',
              birim: 'Koli',
              miktar: 50,
              tasinir_kodu: '150.01.01',
              kdv_orani: 20
            }
          ]
        }
        if (sql.includes('TANIM_Personel')) {
          return [
            {
              ad_soyad: 'Mehmet Demir',
              unvan: 'Şef',
              telefon: '555-1234',
              eposta: 'mehmet@kurum.gov.tr'
            }
          ]
        }
        return []
      }

      const resolver = new LuzumMuzekkeresiResolver()
      const headerData = {
        antetSatirlari: ['T.C.', 'BELEDİYE BAŞKANLIĞI'],
        kurumUst: 'BELEDİYE BAŞKANLIĞI',
        kurumAdi: 'Büyükşehir Belediyesi',
        mudurluk: 'Yazı İşleri Müdürlüğü',
        solLogo: null,
        sagLogo: null,
        harcamaYetkilisiAdi: 'Ali Vural',
        harcamaYetkilisiUnvan: 'Genel Sekreter'
      }

      const result = await resolver.resolve({
        dosyaId: 201,
        templateKey: 'luzum_muzekkeresi',
        headerData,
        queryExecutor: mockQueryExecutor
      })

      // Veri doğrulaması
      expect(result).toBeDefined()
      expect(result.dosyaKonusu).toBe('Kırtasiye İhtiyacı')
      expect(result.mudurluk).toBe('Yazı İşleri Müdürlüğü')
      expect(result.ihtiyacKalemleri).toHaveLength(1)
      expect(result.ihtiyacKalemleri[0].malzemeAdi).toBe('A4 Kağıt')
      expect(result.ihtiyacKalemleri[0].miktar).toBe(50)
      expect(result.onaylayanPersonelAdi).toBe('Ali Vural')

      // İzolasyon doğrulaması: Firma, Teklif veya Komisyon sorguları ASLA çağrılmamalı!
      const badQueries = executedQueries.filter(
        (q) =>
          q.includes('DATA_TeminFirma') ||
          q.includes('TANIM_Firma') ||
          q.includes('DATA_TeminKalemTeklif') ||
          q.includes('DATA_TeminKomisyon') ||
          q.includes('TANIM_Komisyon')
      )
      expect(badQueries).toEqual([])
    })
  })

  describe('4. DocumentEngine Uçtan Uca Belge Akışı', () => {
    it('DocumentEngine.resolveDocumentData doğru şablonu çözümler ve bilinmeyen anahtarda hata üretir', async () => {
      // Mock window.electron
      ;(global as any).window = (global as any).window || {}
      ;(global as any).window.electron = {
        ipcRenderer: {
          invoke: vi.fn(async (channel: string) => {
            if (channel === 'db:query') {
              return {
                success: true,
                data: [
                  {
                    id: 301,
                    temin_no: '2026/99',
                    konu: 'Genel Onarım',
                    tarih: '2026-10-24'
                  }
                ]
              }
            }
            return { success: true }
          })
        }
      }

      const res = await DocumentEngine.resolveDocumentData({
        dosyaId: 301,
        templateKey: 'luzum_muzekkeresi'
      })

      expect(res).toBeDefined()
      expect(res.definition.templateKey).toBe('luzum_muzekkeresi')
      expect(res.data).toBeDefined()

      await expect(
        DocumentEngine.resolveDocumentData({
          dosyaId: 301,
          templateKey: 'tanimsiz_belge_anahtari'
        })
      ).rejects.toThrow(InvalidTemplateKeyError)
    })
  })
})

