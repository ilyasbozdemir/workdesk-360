import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PersonelDatabase } from '../main/database/index'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Personel 360 — SQLite Database & Business Rules', () => {
  let tempDbPath: string
  let db: PersonelDatabase

  beforeEach(() => {
    tempDbPath = path.join(os.tmpdir(), `personel-test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.db`)
    db = new PersonelDatabase(tempDbPath)
  })

  afterEach(() => {
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath)
      } catch {
        /* ignore */
      }
    }
  })

  it('veritabanını başlatmalı ve varsayılan birimleri/personelleri seed etmelidir', () => {
    const personeller = db.getPersonelList()
    expect(personeller.length).toBeGreaterThanOrEqual(2)

    const birimler = db.getBirimler()
    expect(birimler.length).toBeGreaterThanOrEqual(3)

    const ahmet = personeller.find((p) => p.sicilNo === 'SICIL-1001')
    expect(ahmet).toBeDefined()
    expect(ahmet?.ad).toBe('Ahmet')
    expect(ahmet?.calismaDurumu).toBe('aktif')
  })

  it('yeni personel oluşturabilmeli ve denetim kaydını (audit log) yazmalıdır', () => {
    const now = new Date().toISOString()
    db.createPersonel({
      id: 'p-test-1',
      tcKimlikNo: '11122233344',
      sicilNo: 'SICIL-9999',
      ad: 'Kemal',
      soyad: 'Aydın',
      unvan: 'Avukat',
      kadro: 'Memur (657)',
      birimAdi: 'Hukuk İşleri Müdürlüğü',
      iseBaslamaTarihi: '2023-01-01',
      calismaDurumu: 'aktif',
      olusturulduguTarih: now,
      guncellendigiTarih: now
    }, 'Test Yetkili')

    const p = db.getPersonelById('p-test-1')
    expect(p).toBeDefined()
    expect(p?.ad).toBe('Kemal')

    const audit = db.getAuditHistory('p-test-1')
    expect(audit.length).toBeGreaterThan(0)
    expect(audit[0].islemTuru).toBe('kayit_olusturma')
  })

  it('izin talebi oluştururken gün sayısını ve bakiye kuralını doğrulamalıdır', () => {
    const p = db.getPersonelList()[0]

    // 1. Geçerli 5 günlük izin talebi
    const res = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-06-01',
      bitisTarihi: '2026-06-05',
      aciklama: 'Yıllık izin',
      actorName: 'Test'
    })
    expect(res.success).toBe(true)
    expect(res.id).toBeDefined()

    // 2. Çakışan tarihli izin talebi reddedilmelidir
    const cakisanRes = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-06-03',
      bitisTarihi: '2026-06-08',
      aciklama: 'Çakışan talep'
    })
    expect(cakisanRes.success).toBe(false)
    expect(cakisanRes.hata).toContain('başka bir izin talebi bulunmaktadır')

    // 3. Bakiye aşımı (kalan 14 günden fazla) reddedilmelidir
    const asimRes = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-08-01',
      bitisTarihi: '2026-08-30', // 30 gün
      aciklama: 'Aşırı izin talebi'
    })
    expect(asimRes.success).toBe(false)
    expect(asimRes.hata).toContain('kalan yıllık izin bakiyesinden')
  })

  it('izin onaylandığında bakiyeyi düşmeli ve personel durumunu izinli yapmalıdır', () => {
    const p = db.getPersonelList()[0]
    const initialBakiye = db.getIzinBakiyesi(p.id, 2026)
    expect(initialBakiye?.kalanGun).toBe(14)

    const res = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-09-01',
      bitisTarihi: '2026-09-04', // 4 gün
      aciklama: 'Sonbahar izni'
    })
    expect(res.success).toBe(true)

    // İzni onayla
    db.approveIzinTalebi(res.id!, 'Birim Amiri Mehmet Bey')

    // Bakiye kontrolü: 14 - 4 = 10 gün kalmalı
    const updatedBakiye = db.getIzinBakiyesi(p.id, 2026)
    expect(updatedBakiye?.kalanGun).toBe(10)
    expect(updatedBakiye?.kullanilanGun).toBe(4)

    // Personel durumu 'izinli' olmalı
    const updatedPersonel = db.getPersonelById(p.id)
    expect(updatedPersonel?.calismaDurumu).toBe('izinli')
  })

  it('görevlendirme oluşturabilmeli ve personelin çalışma durumunu güncelleyebilmelidir', () => {
    const p = db.getPersonelList()[0]
    db.createGorevlendirme({
      id: 'g-1',
      personelId: p.id,
      gorevTuru: 'gecici_gorev',
      gorevlendirilenBirimAdi: 'Saha Koordinasyon',
      gorevTanimi: 'Bölge incelemesi ve raporlama',
      baslangicTarihi: '2026-10-01',
      bitisTarihi: '2026-10-15',
      olurNo: '2026/145',
      durum: 'aktif'
    }, 'Makam Oluru')

    const gorevler = db.getGorevlendirmeler(p.id)
    expect(gorevler).toHaveLength(1)
    expect(gorevler[0].gorevTanimi).toBe('Bölge incelemesi ve raporlama')

    const updatedP = db.getPersonelById(p.id)
    expect(updatedP?.calismaDurumu).toBe('gorevlendirmede')
  })
})
