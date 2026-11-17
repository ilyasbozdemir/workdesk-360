import { describe, it, expect, beforeEach } from 'vitest'
import { getTabLabel, normalizePath, useTabStore } from '../tabStore'
import { APP_ROUTES } from '../../constants/routeConstants'

describe('tabStore - Sekme Yönetimi ve Başlık Çözümleme', () => {
  beforeEach(() => {
    useTabStore.setState({
      tabs: [],
      activeTabPath: '/'
    })
  })

  it('normalizePath URL hash ve leading slash kurallarını uygular', () => {
    expect(normalizePath('')).toBe('/')
    expect(normalizePath('dosyalar')).toBe('/dosyalar')
    expect(normalizePath('/#/dosyalar')).toBe('/dosyalar')
    expect(normalizePath('#/dosyalar')).toBe('/dosyalar')
  })

  it('Tüm ana ve yeni eklenen ekran rotaları için doğru Türkçe sekme başlığı döner', () => {
    expect(getTabLabel(APP_ROUTES.ROTA_YONETIMI)).toBe('Belge Rota & Onay Akışı')
    expect(getTabLabel(APP_ROUTES.ISLAK_IMZA)).toBe('Islak İmzalı Belge Yönetimi')
    expect(getTabLabel(APP_ROUTES.DEVLET_IHALE_2886)).toBe('2886 Satış & Kiralama Masası')
    expect(getTabLabel(APP_ROUTES.HESAPLAMA_ARACLARI)).toBe('Hesaplama Araçları')
    expect(getTabLabel(APP_ROUTES.BUTCE_KOD)).toBe('Bütçe Kodları')
    expect(getTabLabel(APP_ROUTES.TEST_EKRANLARI)).toBe('Test Ekranları & Laboratuvar')
    expect(getTabLabel(APP_ROUTES.PLAYGROUND)).toBe('Şablon Deneme Alanı (Playground)')
    expect(getTabLabel(APP_ROUTES.DOSYALAR)).toBe('Doğrudan Temin')
    expect(getTabLabel(APP_ROUTES.AYARLAR)).toBe('Ayarlar')
    expect(getTabLabel(APP_ROUTES.MEVZUAT)).toBe('Mevzuat & Sistem Parametreleri')
    expect(getTabLabel(`${APP_ROUTES.MEVZUAT}?tab=limitler`)).toBe('KİK 22/d Limitleri')
    expect(getTabLabel(`${APP_ROUTES.MEVZUAT}?tab=oranlar`)).toBe('Vergi & Kesinti Oranları')
    expect(getTabLabel(`${APP_ROUTES.MEVZUAT}?tab=butcekodlari`)).toBe('ABS Bütçe Kodları')
    expect(getTabLabel(`${APP_ROUTES.MEVZUAT}?tab=yi-ufe`)).toBe('TÜİK Yİ-ÜFE Endeksleri')
  })

  it('Bilinmeyen bir yol verildiğinde "Yeni Sekme" döner', () => {
    expect(getTabLabel('/bilinmeyen-ve-tanimsiz-bir-rota')).toBe('Yeni Sekme')
  })

  it('addTab fonksiyonu tanımlı rotaları sekme olarak ekler ve aktif eder', () => {
    const store = useTabStore.getState()
    store.addTab(APP_ROUTES.ROTA_YONETIMI)

    const updated = useTabStore.getState()
    expect(updated.tabs.length).toBe(1)
    expect(updated.tabs[0].label).toBe('Belge Rota & Onay Akışı')
    expect(updated.tabs[0].path).toBe('/rota-yonetimi')
    expect(updated.activeTabPath).toBe('/rota-yonetimi')
  })
})
