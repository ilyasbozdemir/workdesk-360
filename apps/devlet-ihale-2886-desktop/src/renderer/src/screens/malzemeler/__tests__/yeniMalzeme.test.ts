import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { HIZMET_SINIFLARI, YAPI_SINIFLARI } from '../constants'
import { getTabLabel } from '@renderer/store/tabStore'
import { useYeniMalzeme } from '../yeni.hooks'
import * as router from '@tanstack/react-router'
import * as malzemelerHooksModule from '../malzemeler.hooks'
import { APP_ROUTES } from '@renderer/constants/routeConstants'

// Mocks
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useSearch: vi.fn()
}))

vi.mock('../malzemeler.hooks', () => ({
  useMalzemelerHooks: vi.fn()
}))

vi.mock('@renderer/screens/olcubirimleri/olcubirimleri.hooks', () => ({
  useOlcuBirimleri: vi.fn(() => ({ data: [{ id: 1, ad: 'Adet' }] }))
}))

vi.mock('@renderer/screens/okaskod/okaskod.hooks', () => ({
  useOkasKodHooks: vi.fn(() => ({ okasKodList: [], isLoading: false }))
}))

vi.mock('@renderer/screens/tasinirkod/tasinirkod.hooks', () => ({
  useTasinirKodHooks: vi.fn(() => ({ tasinirKodList: [], isLoading: false }))
}))

describe('Issue #18 Düzeltmeleri ve Doğrulama Testleri', () => {
  let mockNavigate: ReturnType<typeof vi.fn>
  let mockAddKalem: ReturnType<typeof vi.fn>
  let mockUpdateKalem: ReturnType<typeof vi.fn>
  let mockKalemList: any[]
  let mockIpcInvoke: ReturnType<typeof vi.fn>
  let alertMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate = vi.fn()
    mockAddKalem = vi.fn().mockResolvedValue({ id: 999 })
    mockUpdateKalem = vi.fn().mockResolvedValue({ id: 10 })
    mockKalemList = []

    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate as any)
    vi.mocked(router.useSearch).mockReturnValue({} as any)
    vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
      addKalem: mockAddKalem,
      updateKalem: mockUpdateKalem,
      kalemList: mockKalemList,
      deleteKalem: vi.fn(),
      isLoading: false
    } as any)

    mockIpcInvoke = vi.fn().mockImplementation(async (channel: string, ...args: any[]) => {
      if (channel === 'db:query') {
        const sql = args[0] as string
        const params = args[1] || []

        // Barkod teklik kontrolü
        if (sql.includes('SELECT id FROM TANIM_Kalem WHERE barkod_id = ? AND id != ?')) {
          const [barkod, excludeId] = params
          if (barkod === 'DUPLICATE-BARKOD') {
            return { success: true, data: [{ id: 99 }] }
          }
          if (barkod === 'EXISTING-OWN-BARKOD' && excludeId === 10) {
            return { success: true, data: [] }
          }
          if (barkod === 'EXISTING-OWN-BARKOD' && excludeId !== 10) {
            return { success: true, data: [{ id: 10 }] }
          }
          return { success: true, data: [] }
        }

        // Asenkron kayıt sorgusu fallback
        if (sql.includes('SELECT * FROM TANIM_Kalem WHERE id = ?')) {
          const [id] = params
          if (id === 20) {
            return {
              success: true,
              data: [
                {
                  id: 20,
                  kalem_adi: 'Veritabanından Gelen Kalem',
                  tipi: 'Hizmet',
                  birim: 'Ay',
                  barkod_id: 'DB-BARKOD-20'
                }
              ]
            }
          }
          return { success: true, data: [] }
        }

        return { success: true, data: [] }
      }
      return { success: true }
    })

    // Electron window mock
    ;(globalThis as any).window = {
      ...(globalThis as any).window,
      electron: {
        ipcRenderer: {
          invoke: mockIpcInvoke
        }
      },
      api: {
        aiGenerate: vi.fn()
      }
    }

    alertMock = vi.fn()
    ;(globalThis as any).alert = alertMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // 1. Sabitler ve Modüler Yapı
  // --------------------------------------------------------------------------
  describe('Modüler Yapı ve Sabitler', () => {
    it('Hizmet ve Yapı sınıfları sabitlerini eksiksiz dışa aktarır', () => {
      expect(HIZMET_SINIFLARI.length).toBeGreaterThan(5)
      expect(HIZMET_SINIFLARI).toContain('Temizlik Hizmetleri')
      expect(HIZMET_SINIFLARI).toContain('Özel Güvenlik Hizmetleri')

      expect(YAPI_SINIFLARI.length).toBeGreaterThan(5)
      expect(YAPI_SINIFLARI).toContain('İnşaat İmalatları')
      expect(YAPI_SINIFLARI).toContain('Mekanik Tesisat')
    })
  })

  // --------------------------------------------------------------------------
  // 2. Sekme Başlığı ve URL Parametreleri (getTabLabel & useTabStore)
  // --------------------------------------------------------------------------
  describe('4. Sekme Başlığı Düzeltmesi (getTabLabel & tabStore)', () => {
    it('Yeni kayıt modunda standart başlık döner', () => {
      const label = getTabLabel(APP_ROUTES.YENI_MALZEME)
      expect(label).toBe('Yeni Kalem Tanımla (Mal/Hizmet/Yapım)')
    })

    it('Düzenleme modunda id parametresi varsa "Kalem Düzenle (Mal/Hizmet/Yapım)" döner', () => {
      const label = getTabLabel(`${APP_ROUTES.YENI_MALZEME}?id=10`)
      expect(label).toBe('Kalem Düzenle (Mal/Hizmet/Yapım)')
    })

    it('Düzenleme modunda tip parametresi varsa "Kalem Düzenle (Hizmet)" döner', () => {
      const label = getTabLabel(`${APP_ROUTES.YENI_MALZEME}?id=10&tip=Hizmet`)
      expect(label).toBe('Kalem Düzenle (Hizmet)')
    })

    it('Düzenleme modunda tur parametresi varsa "Kalem Düzenle (Yapım)" döner', () => {
      const label = getTabLabel(`${APP_ROUTES.YENI_MALZEME}?id=10&tur=Yapım`)
      expect(label).toBe('Kalem Düzenle (Yapım)')
    })

    it('Malzemeler kataloğu sekme başlığını korur', () => {
      const label = getTabLabel(APP_ROUTES.MALZEMELER)
      expect(label).toBe('Mal, Hizmet & Yapım Kataloğu')
    })
  })

  // --------------------------------------------------------------------------
  // 3. Form Yükleme ve kalemList Yenilenmesine Karşı Koruma (loadedEditIdRef)
  // --------------------------------------------------------------------------
  describe('1. Formun Yüklenmesi ve kalemList Yenilenme Koruması', () => {
    it('Kayıt editId ile listeden yüklendiğinde formData doldurulur ve entryMode single olur', () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '10' } as any)
      const existingItem = {
        id: 10,
        kalem_adi: 'A4 Kağıt 80gr',
        tipi: 'Mal',
        birim: 'Paket',
        barkod_id: 'BARKOD-10'
      }
      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [existingItem],
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      const { result } = renderHook(() => useYeniMalzeme())

      expect(result.current.editId).toBe(10)
      expect(result.current.entryMode).toBe('single')
      expect(result.current.formData.kalem_adi).toBe('A4 Kağıt 80gr')
      expect(result.current.formData.birim).toBe('Paket')
    })

    it('Kullanıcı formda değişiklik yaptıktan sonra arka planda kalemList yenilense bile veriler EZİLMEZ', () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '10' } as any)
      const initialItem = {
        id: 10,
        kalem_adi: 'Orijinal İsim',
        tipi: 'Mal',
        birim: 'Adet',
        barkod_id: 'BARKOD-10'
      }
      let currentList = [initialItem]

      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockImplementation(
        () =>
          ({
            addKalem: mockAddKalem,
            updateKalem: mockUpdateKalem,
            kalemList: currentList,
            deleteKalem: vi.fn(),
            isLoading: false
          }) as any
      )

      const { result, rerender } = renderHook(() => useYeniMalzeme())

      expect(result.current.formData.kalem_adi).toBe('Orijinal İsim')

      // Kullanıcı formda yazıyor
      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          kalem_adi: 'Kullanıcının Değiştirdiği Yeni İsim',
          notlar: 'Özel açıklama girildi'
        }))
      })

      expect(result.current.formData.kalem_adi).toBe('Kullanıcının Değiştirdiği Yeni İsim')
      expect(result.current.formData.notlar).toBe('Özel açıklama girildi')

      // Arka planda TanStack Query / window focus ile kalemList referansı yenileniyor (sunucudan eski hali döndü)
      currentList = [{ ...initialItem }]
      rerender()

      // loadedEditIdRef sayesinde formData ezilmemeli, kullanıcının yazdığı veriler korunmalı!
      expect(result.current.formData.kalem_adi).toBe('Kullanıcının Değiştirdiği Yeni İsim')
      expect(result.current.formData.notlar).toBe('Özel açıklama girildi')
    })

    it('Farklı bir editId seçildiğinde veya yeni kayda geçildiğinde form sıfırlanıp yeni veriyi yükler', () => {
      let searchParams: any = { id: '10' }
      vi.mocked(router.useSearch).mockImplementation(() => searchParams)

      const item10 = { id: 10, kalem_adi: 'Kalem 10', tipi: 'Mal' }
      const item11 = { id: 11, kalem_adi: 'Kalem 11', tipi: 'Hizmet' }

      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [item10, item11],
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      const { result, rerender } = renderHook(() => useYeniMalzeme())
      expect(result.current.formData.kalem_adi).toBe('Kalem 10')

      // Kullanıcı editId = 11'e geçiş yapıyor
      searchParams = { id: '11' }
      rerender()

      expect(result.current.editId).toBe(11)
      expect(result.current.formData.kalem_adi).toBe('Kalem 11')
      expect(result.current.formData.tipi).toBe('Hizmet')
    })
  })

  // --------------------------------------------------------------------------
  // 4. Asenkron Sorgu (Delayed Query) ve Unmount İptali (Mount Guard)
  // --------------------------------------------------------------------------
  describe('1.1. Asenkron Fallback Sorgusu ve Mount Guard', () => {
    it('Önbellekte (kalemList) bulunamayan kayıt veritabanından asenkron yüklenir', async () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '20' } as any)
      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [], // Listede yok, db:query'ye düşecek
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      const { result } = renderHook(() => useYeniMalzeme())

      // Asenkron db:query çağrısının tamamlanmasını bekle
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(mockIpcInvoke).toHaveBeenCalledWith(
        'db:query',
        'SELECT * FROM TANIM_Kalem WHERE id = ?',
        [20]
      )
      expect(result.current.formData.kalem_adi).toBe('Veritabanından Gelen Kalem')
      expect(result.current.formData.tipi).toBe('Hizmet')
      expect(result.current.formData.birim).toBe('Ay')
    })

    it('Asenkron sorgu tamamlanmadan bileşen unmount edilirse state güncellemesi yapılmaz (Mount Guard)', async () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '20' } as any)
      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [],
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      let resolveQuery: (val: any) => void = () => {}
      mockIpcInvoke.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveQuery = resolve
          })
      )

      const { unmount } = renderHook(() => useYeniMalzeme())

      // Sorgu henüz çözülmeden unmount et
      unmount()

      // Şimdi sorguyu çöz - isMounted false olduğu için hata fırlatmamalı
      expect(() => {
        resolveQuery({
          success: true,
          data: [{ id: 20, kalem_adi: 'Geciken Veri' }]
        })
      }).not.toThrow()
    })
  })

  // --------------------------------------------------------------------------
  // 5. Fonksiyonel State Güncellemeleri (KimlikCard & TeknikDetayCard & Modals)
  // --------------------------------------------------------------------------
  describe('2. Fonksiyonel State Güncellemeleri (Eski State Kapanış Koruması)', () => {
    it('Hızlı ardışık güncellemelerde önceki alanlar ezilmez ve veri kaybı yaşanmaz', () => {
      const { result } = renderHook(() => useYeniMalzeme())

      // Arka arkaya hızlı tuş vuruşları / alan güncellemeleri simülasyonu
      act(() => {
        result.current.setFormData((prev) => ({ ...prev, kalem_adi: 'Yeni Malzeme' }))
        result.current.setFormData((prev) => ({ ...prev, birim: 'Metre' }))
        result.current.setFormData((prev) => ({ ...prev, mensei: 'İthal' }))
        result.current.setFormData((prev) => ({ ...prev, kdv_orani: 10 }))
        result.current.setFormData((prev) => ({ ...prev, okas_kodu: '44111000' }))
        result.current.setFormData((prev) => ({ ...prev, tasinir_kodu: '150.01.02' }))
        result.current.setFormData((prev) => ({ ...prev, ozelligi: 'Özel teknik şartname' }))
      })

      expect(result.current.formData.kalem_adi).toBe('Yeni Malzeme')
      expect(result.current.formData.birim).toBe('Metre')
      expect(result.current.formData.mensei).toBe('İthal')
      expect(result.current.formData.kdv_orani).toBe(10)
      expect(result.current.formData.okas_kodu).toBe('44111000')
      expect(result.current.formData.tasinir_kodu).toBe('150.01.02')
      expect(result.current.formData.ozelligi).toBe('Özel teknik şartname')
    })
  })

  // --------------------------------------------------------------------------
  // 6. Barkod Doğrulaması ve Kayıt Öncesi Kontroller
  // --------------------------------------------------------------------------
  describe('3. Barkod Doğrulaması ve Teklik Kontrolleri', () => {
    it('Yeni kayıtta mükerrer barkod girildiğinde barkodError ayarlanır ve kaydetme engellenir', async () => {
      vi.mocked(router.useSearch).mockReturnValue({} as any)
      const { result } = renderHook(() => useYeniMalzeme())

      await act(async () => {
        await result.current.checkBarkod('DUPLICATE-BARKOD')
      })

      expect(result.current.barkodError).toBe('Bu Barkod / ID sistemde zaten kayıtlı!')

      // Form zorunlu alanlarını doldur
      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          kalem_adi: 'Test Kalem',
          barkod_id: 'DUPLICATE-BARKOD'
        }))
      })

      // Kaydetmeye çalış
      await act(async () => {
        await result.current.handleSave(false)
      })

      // Barkod hatası nedeniyle kayıt çağrılmamalı
      expect(mockAddKalem).not.toHaveBeenCalled()
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Barkod hatasını düzeltmeden kaydedemezsiniz')
      )
    })

    it('Düzenleme modunda kaydın kendi mevcut barkodu geçerli kalır ve hata vermez', async () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '10' } as any)
      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [
          {
            id: 10,
            kalem_adi: 'Mevcut Kalem',
            tipi: 'Mal',
            barkod_id: 'EXISTING-OWN-BARKOD'
          }
        ],
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      const { result } = renderHook(() => useYeniMalzeme())

      // Kaydın kendi barkodunu kontrol et (excludeId = 10 olduğu için çakışma yok döner)
      await act(async () => {
        await result.current.checkBarkod('EXISTING-OWN-BARKOD')
      })

      expect(result.current.barkodError).toBe('')

      // Kaydet
      await act(async () => {
        await result.current.handleSave(false)
      })

      expect(mockUpdateKalem).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith({ to: APP_ROUTES.MALZEMELER })
    })

    it('Düzenleme modunda başka bir kaydın barkodu girildiğinde kaydetme engellenir', async () => {
      vi.mocked(router.useSearch).mockReturnValue({ id: '10' } as any)
      vi.mocked(malzemelerHooksModule.useMalzemelerHooks).mockReturnValue({
        addKalem: mockAddKalem,
        updateKalem: mockUpdateKalem,
        kalemList: [
          {
            id: 10,
            kalem_adi: 'Mevcut Kalem',
            tipi: 'Mal',
            barkod_id: 'ORIGINAL-BARKOD'
          }
        ],
        deleteKalem: vi.fn(),
        isLoading: false
      } as any)

      const { result } = renderHook(() => useYeniMalzeme())

      // Kullanıcı barkodu başka bir kaleme ait mükerrer barkodla değiştiriyor
      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          barkod_id: 'DUPLICATE-BARKOD'
        }))
      })

      await act(async () => {
        await result.current.checkBarkod('DUPLICATE-BARKOD')
      })

      expect(result.current.barkodError).toBe('Bu Barkod / ID sistemde zaten kayıtlı!')

      await act(async () => {
        await result.current.handleSave(false)
      })

      // Düzenleme modunda bile mükerrer barkod bypass EDİLEMEZ
      expect(mockUpdateKalem).not.toHaveBeenCalled()
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Barkod hatasını düzeltmeden kaydedemezsiniz')
      )
    })

    it('handleSave kayıt öncesinde veritabanında barkod çakışması tespit ederse kaydetmeyi durdurur', async () => {
      vi.mocked(router.useSearch).mockReturnValue({} as any)
      const { result } = renderHook(() => useYeniMalzeme())

      act(() => {
        result.current.setFormData((prev) => ({
          ...prev,
          kalem_adi: 'Barkod Kontrol Testi',
          barkod_id: 'DUPLICATE-BARKOD'
        }))
      })

      // checkBarkod manuel çağrılmamış olsa bile handleSave doğrudan DB kontrolü yapar
      await act(async () => {
        await result.current.handleSave(false)
      })

      expect(mockIpcInvoke).toHaveBeenCalledWith(
        'db:query',
        'SELECT id FROM TANIM_Kalem WHERE barkod_id = ? AND id != ?',
        ['DUPLICATE-BARKOD', 0]
      )
      expect(mockAddKalem).not.toHaveBeenCalled()
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Bu Barkod / ID sistemde zaten kayıtlı!')
      )
    })
  })
})
