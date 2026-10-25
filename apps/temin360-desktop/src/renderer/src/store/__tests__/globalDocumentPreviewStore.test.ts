import { describe, it, expect, beforeEach } from 'vitest'
import {
  useGlobalDocumentPreviewStore,
  generateTabId
} from '../globalDocumentPreviewStore'
import { useTabStore } from '../tabStore'
import { APP_ROUTES } from '../../constants/routeConstants'

describe('globalDocumentPreviewStore - Merkezi Belge Önizleme Yönetimi', () => {
  beforeEach(() => {
    useGlobalDocumentPreviewStore.setState({
      isOpen: false,
      isBalloon: false,
      activeTabId: null,
      tabs: [],
      documentId: null,
      dosyaId: null,
      source: undefined,
      raporId: null,
      invitedFirms: [],
      selectedFirma: null,
      initialData: null,
      onCloseCallback: null
    })
    useTabStore.setState({
      tabs: [],
      activeTabPath: '/'
    })
  })

  describe('generateTabId - Kimlik Üretimi ve Çakışma Önleme', () => {
    it('İhtiyaç raporu için raporId ve documentId içeren benzersiz kimlik üretir', () => {
      const tabId = generateTabId({
        documentId: 'luzum_muzekkeresi',
        source: { kind: 'ihtiyacRaporu', raporId: 42 }
      })
      expect(tabId).toBe('rapor::42::luzum_muzekkeresi')
    })

    it('Doğrudan temin dosyası için dosyaId, documentId ve firma içeren kimlik üretir', () => {
      const tabId = generateTabId({
        documentId: 'piyasa-fiyat-arastirma',
        dosyaId: 15,
        selectedFirma: { id: 7, unvan: 'Test A.Ş.' }
      })
      expect(tabId).toBe('dosya::15::piyasa-fiyat-arastirma::7')
    })

    it('Farklı dosyaId değerlerinde aynı şablon için farklı kimlikler üretir', () => {
      const id1 = generateTabId({ documentId: 'luzum-muzekkeresi', dosyaId: 101 })
      const id2 = generateTabId({ documentId: 'luzum-muzekkeresi', dosyaId: 102 })
      expect(id1).not.toBe(id2)
      expect(id1).toBe('dosya::101::luzum-muzekkeresi::all')
      expect(id2).toBe('dosya::102::luzum-muzekkeresi::all')
    })

    it('Farklı raporId değerlerinde aynı şablon için farklı kimlikler üretir', () => {
      const id1 = generateTabId({
        documentId: 'luzum_muzekkeresi',
        source: { kind: 'ihtiyacRaporu', raporId: 5 }
      })
      const id2 = generateTabId({
        documentId: 'luzum_muzekkeresi',
        source: { kind: 'ihtiyacRaporu', raporId: 8 }
      })
      expect(id1).not.toBe(id2)
      expect(id1).toBe('rapor::5::luzum_muzekkeresi')
      expect(id2).toBe('rapor::8::luzum_muzekkeresi')
    })
  })

  describe('Çalışma Alanı Sekmesi Modu', () => {
    it('startAsBalloon false iken belge açıldığında çalışma alanı sekmesi olarak açılır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({
        documentId: 'luzum-muzekkeresi',
        dosyaId: 12,
        documentTitle: 'Lüzum Müzekkeresi',
        startAsBalloon: false
      })

      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.isOpen).toBe(true)
      expect(state.isBalloon).toBe(false)
      expect(state.tabs.length).toBe(1)
      expect(state.activeTabId).toBe('dosya::12::luzum-muzekkeresi::all')

      // useTabStore'a BelgeOnizleme sekmesi eklenmiş olmalı
      const tabStoreState = useTabStore.getState()
      const previewTab = tabStoreState.tabs.find((t) =>
        t.path.startsWith(APP_ROUTES.BELGE_ONIZLEME)
      )
      expect(previewTab).toBeDefined()
      expect(previewTab?.path).toContain('doc=luzum-muzekkeresi')
      expect(previewTab?.path).toContain('id=12')
    })
  })

  describe('Global Yüzen Balon Modu', () => {
    it('startAsBalloon true iken belge açıldığında isBalloon true olur ve çalışma alanı sekmesi açılmaz', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({
        documentId: 'luzum-muzekkeresi',
        dosyaId: 12,
        documentTitle: 'Lüzum Müzekkeresi',
        startAsBalloon: true
      })

      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.isOpen).toBe(true)
      expect(state.isBalloon).toBe(true)
      expect(state.tabs.length).toBe(1)

      // useTabStore'a sekme eklenmemeli
      const tabStoreState = useTabStore.getState()
      const previewTab = tabStoreState.tabs.find((t) =>
        t.path.startsWith(APP_ROUTES.BELGE_ONIZLEME)
      )
      expect(previewTab).toBeUndefined()
    })

    it('Balon modundan tam boyuta genişletildiğinde çalışma alanı sekmesine geçer', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({
        documentId: 'onay-belgesi',
        dosyaId: 25,
        documentTitle: 'Harcama Onay Belgesi',
        startAsBalloon: true
      })

      expect(useGlobalDocumentPreviewStore.getState().isBalloon).toBe(true)

      // Balon modundan çıkış
      useGlobalDocumentPreviewStore.getState().setIsBalloon(false)

      expect(useGlobalDocumentPreviewStore.getState().isBalloon).toBe(false)
      const tabStoreState = useTabStore.getState()
      const previewTab = tabStoreState.tabs.find((t) =>
        t.path.startsWith(APP_ROUTES.BELGE_ONIZLEME)
      )
      expect(previewTab).toBeDefined()
    })
  })

  describe('Lüzum Müzekkeresi Sekmesinden Açılış ve source/raporId Koruması', () => {
    it('ihtiyacRaporu kaynağı ve raporId parametreleri eksiksiz saklanır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({
        documentId: 'luzum_muzekkeresi',
        source: { kind: 'ihtiyacRaporu', raporId: 88 },
        raporId: 88,
        dosyaId: 5,
        documentTitle: 'Lüzum Müzekkeresi'
      })

      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.tabs.length).toBe(1)
      const tab = state.tabs[0]
      expect(tab.tabId).toBe('rapor::88::luzum_muzekkeresi')
      expect(tab.source).toEqual({ kind: 'ihtiyacRaporu', raporId: 88 })
      expect(tab.raporId).toBe(88)
      expect(tab.dosyaId).toBe(5)
      expect(tab.initialTemplateId).toBe('luzum_muzekkeresi')
    })
  })

  describe('Aynı Belgenin Birden Fazla Kez Açılması (Deduplication)', () => {
    it('Aynı belge tekrar açıldığında ikinci sekme oluşturmaz, mevcut sekmeye odaklanır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({
        documentId: 'luzum-muzekkeresi',
        dosyaId: 10,
        documentTitle: 'Lüzum Müzekkeresi'
      })

      expect(useGlobalDocumentPreviewStore.getState().tabs.length).toBe(1)

      // Aynı belge tekrar çağrılıyor
      store.openDocument({
        documentId: 'luzum-muzekkeresi',
        dosyaId: 10,
        documentTitle: 'Lüzum Müzekkeresi'
      })

      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.tabs.length).toBe(1)
      expect(state.activeTabId).toBe('dosya::10::luzum-muzekkeresi::all')
    })
  })

  describe('Farklı dosyaId Değerlerinde Aynı Şablon', () => {
    it('Farklı dosyalardaki aynı şablon iki ayrı sekme olarak yan yana açılır', () => {
      const store = useGlobalDocumentPreviewStore.getState()

      store.openDocument({
        documentId: 'yaklasik-maliyet',
        dosyaId: 1,
        documentTitle: 'Dosya 1 Yaklaşık Maliyet'
      })

      store.openDocument({
        documentId: 'yaklasik-maliyet',
        dosyaId: 2,
        documentTitle: 'Dosya 2 Yaklaşık Maliyet'
      })

      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.tabs.length).toBe(2)
      expect(state.tabs[0].dosyaId).toBe(1)
      expect(state.tabs[1].dosyaId).toBe(2)
      expect(state.activeTabId).toBe('dosya::2::yaklasik-maliyet::all')
    })
  })

  describe('Sekme Değiştirme, Kapatma ve Yeniden Açma Akışı', () => {
    it('switchTab ile sekmeler arasında geçiş yapılır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({ documentId: 'doc1', dosyaId: 1 })
      store.openDocument({ documentId: 'doc2', dosyaId: 1 })

      expect(useGlobalDocumentPreviewStore.getState().tabs.length).toBe(2)
      expect(useGlobalDocumentPreviewStore.getState().activeTabId).toBe('dosya::1::doc2::all')

      store.switchTab('dosya::1::doc1::all')
      expect(useGlobalDocumentPreviewStore.getState().activeTabId).toBe('dosya::1::doc1::all')
    })

    it('closeTab aktif sekmeyi kapattığında diğer sekmeye odaklanır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({ documentId: 'doc1', dosyaId: 1 })
      store.openDocument({ documentId: 'doc2', dosyaId: 1 })

      store.closeTab('dosya::1::doc2::all')
      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.tabs.length).toBe(1)
      expect(state.activeTabId).toBe('dosya::1::doc1::all')
    })

    it('Son sekme kapatıldığında isOpen false ve sekmeler temizlenir', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({ documentId: 'doc1', dosyaId: 1 })

      store.closeTab('dosya::1::doc1::all')
      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.isOpen).toBe(false)
      expect(state.tabs.length).toBe(0)
      expect(state.activeTabId).toBeNull()
    })

    it('closeAllTabs veya closeDocument tüm sekmeleri kapatır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({ documentId: 'doc1', dosyaId: 1 })
      store.openDocument({ documentId: 'doc2', dosyaId: 1 })

      store.closeDocument()
      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.isOpen).toBe(false)
      expect(state.tabs.length).toBe(0)
    })

    it('Kapatıldıktan sonra yeni bir belge sorunsuz açılır', () => {
      const store = useGlobalDocumentPreviewStore.getState()
      store.openDocument({ documentId: 'doc1', dosyaId: 1 })
      store.closeDocument()

      store.openDocument({ documentId: 'doc3', dosyaId: 3, documentTitle: 'Yeni Belge' })
      const state = useGlobalDocumentPreviewStore.getState()
      expect(state.isOpen).toBe(true)
      expect(state.tabs.length).toBe(1)
      expect(state.tabs[0].documentId).toBe('doc3')
    })
  })
})
