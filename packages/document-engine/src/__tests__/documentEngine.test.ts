import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import {
  TemplateRegistry,
  InvalidTemplateKeyError,
  DocumentEngine,
  smartMergeDocumentData,
  DocumentStorageAdapter
} from '../index'

describe('@worksuite-360/document-engine', () => {
  beforeEach(() => {
    TemplateRegistry.clear()
    DocumentEngine.setStorageAdapter(null)
    DocumentEngine.setHeaderResolver(async () => ({
      antetSatirlari: ['T.C.', 'TEST KURUMU'],
      kurumUst: 'TEST BAKANLIĞI',
      kurumAdi: 'TEST KURUMU',
      mudurluk: 'Satın Alma',
      solLogo: null,
      sagLogo: null
    }))
  })

  describe('1. TemplateRegistry', () => {
    it('şablon kaydeder, getirir ve kanonik eşleştirme yapar', () => {
      const mockResolver = { resolve: vi.fn(async () => ({ foo: 'bar' })) }
      const mockRenderer = () => React.createElement('div', null, 'Mock')

      TemplateRegistry.register({
        templateKey: 'ornek_belge',
        name: 'OrnekBelge',
        title: 'Örnek Belge Başlığı',
        category: 'test',
        categoryLabel: 'Test',
        orientation: 'portrait',
        resolver: mockResolver,
        renderer: mockRenderer
      })

      expect(TemplateRegistry.has('ornek_belge')).toBe(true)
      expect(TemplateRegistry.has('ornek-belge')).toBe(true)
      expect(TemplateRegistry.has('ornek_belge.html')).toBe(true)

      const def = TemplateRegistry.get('ornek-belge')
      expect(def.name).toBe('OrnekBelge')
      expect(def.resolver).toBe(mockResolver)
    })

    it('kayıtlı olmayan şablonda InvalidTemplateKeyError fırlatır', () => {
      expect(() => TemplateRegistry.get('tanimsiz_sablon')).toThrow(InvalidTemplateKeyError)
    })
  })

  describe('2. smartMergeDocumentData (Smart Rebase / Merge)', () => {
    it('yeni eklenen kalemleri listeye dahil eder ve kullanıcının özel açıklamalarını korur', () => {
      const existingSnapshot: Record<string, any> = {
        antetSatirlari: ['Eski Antet'],
        ihtiyacKalemleri: [
          {
            id: 1,
            siraNo: 1,
            malzemeAdi: 'A4 Kağıt',
            miktar: 10,
            ozelligi: 'Kullanıcının elle yazdığı özel şart'
          }
        ],
        kullaniciNotu: 'Önemli dosya notu'
      }

      const freshSource: Record<string, any> = {
        antetSatirlari: ['T.C.', 'YENİ ANTEТ'],
        ihtiyacKalemleri: [
          {
            id: 1,
            siraNo: 1,
            malzemeAdi: 'A4 Kağıt',
            miktar: 25, // Kaynakta miktar güncellenmiş!
            ozelligi: 'Varsayılan şart'
          },
          {
            id: 2,
            siraNo: 2,
            malzemeAdi: 'Tükenmez Kalem', // Yeni kalem eklenmiş!
            miktar: 50,
            ozelligi: 'Mavi renk'
          }
        ]
      }

      const merged = smartMergeDocumentData(existingSnapshot, freshSource)

      // Antet güncellenmeli
      expect(merged.antetSatirlari).toEqual(['T.C.', 'YENİ ANTEТ'])
      // Kullanıcının elle girdiği özel alan ezilmemeli
      expect(merged.kullaniciNotu).toBe('Önemli dosya notu')

      // Kalemler: 2 kalem olmalı
      const items = merged.ihtiyacKalemleri as any[]
      expect(items).toHaveLength(2)

      // 1. kalem: Miktarı kaynaktan 25'e güncellenmeli ama kullanıcının girdiği 'ozelligi' korunmalı!
      expect(items[0].id).toBe(1)
      expect(items[0].miktar).toBe(25)
      expect(items[0].ozelligi).toBe('Kullanıcının elle yazdığı özel şart')

      // 2. kalem: Yeni kalem doğrudan listeye eklenmeli!
      expect(items[1].id).toBe(2)
      expect(items[1].malzemeAdi).toBe('Tükenmez Kalem')
      expect(items[1].miktar).toBe(50)
    })
  })

  describe('3. DocumentEngine Yaşam Döngüsü (Aç, Kaydet, Sıfırla, Güncel Verileri Al)', () => {
    it('mock storage adaptörüyle tam uçtan uca akış çalışır', async () => {
      const storedDocs = new Map<string, any>()

      const mockStorage: DocumentStorageAdapter = {
        getDocument: vi.fn(async ({ dosyaId, templateKey }) => {
          const key = `${dosyaId}_${templateKey}`
          if (storedDocs.has(key)) {
            return { success: true, exists: true, record: storedDocs.get(key) }
          }
          return { success: true, exists: false }
        }),
        saveDocument: vi.fn(async ({ dosyaId, templateKey, data }) => {
          const key = `${dosyaId}_${templateKey}`
          const rec = { id: 101, data, sablonVersiyon: 1, updatedAt: '2026-10-31T12:00:00Z' }
          storedDocs.set(key, rec)
          return { success: true, id: 101, updatedAt: rec.updatedAt }
        }),
        resetDocument: vi.fn(async ({ dosyaId, templateKey }) => {
          const key = `${dosyaId}_${templateKey}`
          storedDocs.delete(key)
          return { success: true }
        }),
        deleteDocument: vi.fn(async ({ dosyaId, templateKey }) => {
          const key = `${dosyaId}_${templateKey}`
          storedDocs.delete(key)
          return { success: true }
        })
      }

      DocumentEngine.setStorageAdapter(mockStorage)

      // Şablonu kaydet
      let currentDbItems = [{ id: 1, siraNo: 1, malzemeAdi: 'Laptop', miktar: 2 }]
      TemplateRegistry.register({
        templateKey: 'test_doc',
        name: 'TestDoc',
        title: 'Test Belgesi',
        category: 'test',
        categoryLabel: 'Test',
        orientation: 'portrait',
        resolver: {
          resolve: async () => ({
            baslik: 'Orijinal Başlık',
            ihtiyacKalemleri: [...currentDbItems]
          })
        },
        renderer: (props: any) =>
          React.createElement('div', { className: 'test-doc' }, props.data.baslik)
      })

      // 1. İLK AÇILIŞ (Load): Snapshot yok, resolver çalışır ve otomatik kaydeder
      const doc1 = await DocumentEngine.loadOrCreateDocument({ dosyaId: 1, templateKey: 'test_doc' })
      expect(doc1.isExisting).toBe(false)
      expect(doc1.data.baslik).toBe('Orijinal Başlık')
      expect(mockStorage.saveDocument).toHaveBeenCalledTimes(1)

      // 2. KULLANICI DÜZENLEMESİ VE KAYDET (Save)
      const editedData = {
        ...doc1.data,
        baslik: 'Kullanıcının Değiştirdiği Başlık',
        ozelNot: 'Gizli dosya notu'
      }
      await DocumentEngine.saveDocument({
        dosyaId: 1,
        templateKey: 'test_doc',
        data: editedData
      })

      // 3. TEKRAR AÇILIŞ (Open): Kayıtlı snapshot yüklenmeli, kullanıcının düzenlemesi korunmalı
      const doc2 = await DocumentEngine.loadOrCreateDocument({ dosyaId: 1, templateKey: 'test_doc' })
      expect(doc2.isExisting).toBe(true)
      expect(doc2.data.baslik).toBe('Kullanıcının Değiştirdiği Başlık')
      expect(doc2.data.ozelNot).toBe('Gizli dosya notu')

      // 4. VERİTABANINA YENİ KALEM EKLENDİ!
      currentDbItems.push({ id: 2, siraNo: 2, malzemeAdi: 'Mouse', miktar: 5 })

      // 5. GÜNCEL VERİLERİ AL (SyncWithSource): Snapshot korunur, yeni kalem eklenir
      const synced = await DocumentEngine.syncWithSource({
        dosyaId: 1,
        templateKey: 'test_doc',
        existingData: doc2.data
      })
      expect(synced.data.baslik).toBe('Kullanıcının Değiştirdiği Başlık') // Kullanıcı başlığı korunur
      expect(synced.data.ozelNot).toBe('Gizli dosya notu') // Kullanıcı notu korunur
      expect((synced.data.ihtiyacKalemleri as any[])).toHaveLength(2) // Yeni kalem dahil edilmiş!
      expect((synced.data.ihtiyacKalemleri as any[])[1].malzemeAdi).toBe('Mouse')

      // 6. SIFIRLA (Reset): Kullanıcı düzenlemeleri silinir, sıfır kaynağa döner
      const resetDoc = await DocumentEngine.resetToDefault({ dosyaId: 1, templateKey: 'test_doc' })
      expect(resetDoc.data.baslik).toBe('Orijinal Başlık')
      expect((resetDoc.data as any).ozelNot).toBeUndefined()

      // 7. HTML DERLEME (compileHtml)
      const html = DocumentEngine.compileHtml({
        templateKey: 'test_doc',
        data: resetDoc.data
      })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Test Belgesi')
      expect(html).toContain('Orijinal Başlık')
    })
  })
})
