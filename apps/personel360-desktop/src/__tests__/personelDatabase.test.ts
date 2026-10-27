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

  it('veritabanını başlatmalı ve mevzuata uygun varsayılan personelleri/bakiyeleri seed etmelidir', () => {
    const personeller = db.getPersonelList()
    expect(personeller.length).toBeGreaterThanOrEqual(2)

    const birimler = db.getBirimler()
    expect(birimler.length).toBeGreaterThanOrEqual(3)

    const ahmet = personeller.find((p) => p.sicilNo === 'SICIL-1001')
    expect(ahmet).toBeDefined()
    expect(ahmet?.ad).toBe('Ahmet')
    expect(ahmet?.calismaDurumu).toBe('aktif')

    // 2018 girişli memur (8 yıl hizmet) -> 657 md. 102 gereğince 20 gün hak ediş
    const bakiye = db.getIzinBakiyesi(ahmet!.id, 2026)
    expect(bakiye?.hakEdilenGun).toBe(20)
    expect(bakiye?.kalanGun).toBe(20)
  })

  it('hizmet yılına göre farklı hak ediş hesaplamalı ve KVKK uyumlu denetim kaydı oluşturmalıdır', () => {
    const now = new Date().toISOString()

    // 15 yıl kıdemli memur (30 gün izin hakkı)
    db.createPersonel({
      id: 'p-kidemli',
      tcKimlikNo: '55566677788',
      sicilNo: 'SICIL-5555',
      ad: 'Mehmet',
      soyad: 'Kaya',
      unvan: 'Uzman',
      kadro: 'Memur (657)',
      birimId: 'b-1',
      birimAdi: 'İnsan Kaynakları',
      iseBaslamaTarihi: '2010-01-01', // 16 yıl hizmet
      calismaDurumu: 'aktif',
      kanGrubu: 'A Rh+',
      adres: 'İstanbul Kadıköy',
      olusturulduguTarih: now,
      guncellendigiTarih: now
    }, 'İK Yetkilisi')

    const bakiye = db.getIzinBakiyesi('p-kidemli', 2026)
    expect(bakiye?.hakEdilenGun).toBe(30)
    expect(bakiye?.kalanGun).toBe(30)

    // KVKK Denetimi: Detay kaydında açık T.C. ve kan grubu bulunmamalı, maskeli olmalı
    const audit = db.getAuditHistory('p-kidemli')
    expect(audit.length).toBeGreaterThan(0)
    const auditDetay = (audit[0] as any).detay
    expect(auditDetay.tcKimlikMaskeli).toBe('555*****88')
    expect(auditDetay.kanGrubu).toBeUndefined()
    expect(auditDetay.adres).toBeUndefined()
  })

  it('izin talebi oluştururken gün sayısını ve bakiye kuralını doğrulamalıdır', () => {
    const p = db.getPersonelList()[0]
    const bakiye = db.getIzinBakiyesi(p.id, 2026)
    expect(bakiye).toBeDefined()

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

    // 3. Kalan bakiyeden fazla talep reddedilmelidir (Örn: 40 gün)
    const asimRes = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-08-01',
      bitisTarihi: '2026-09-10', // 41 gün
      aciklama: 'Aşırı izin talebi'
    })
    expect(asimRes.success).toBe(false)
    expect(asimRes.hata).toContain('kalan yıllık izin bakiyesinden')
  })

  it('sıralı çok adımlı onay akışını (Birim Amiri -> İK Müdürü) işletmeli ve sadece nihai onayda bakiye düşmelidir', () => {
    const p = db.getPersonelList()[0]
    const initialBakiye = db.getIzinBakiyesi(p.id, 2026)!
    const initialKalan = initialBakiye.kalanGun

    const res = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-11-01',
      bitisTarihi: '2026-11-04', // 4 gün
      aciklama: 'Kasım izni'
    })
    expect(res.success).toBe(true)
    const izinId = res.id!

    // 1. AŞAMA ONAYI: Birim Amiri Onayı
    const adim1Sonuc = db.approveIzinTalebi(izinId, 'amir-1', 'Birim Amiri Mehmet Bey', 'Uygundur')
    expect(adim1Sonuc.tamamlandiMi).toBe(false) // Süreç henüz bitmedi!
    expect(adim1Sonuc.durum).toBe('onayda') // İkinci onay bekleniyor

    // Ara onayda bakiye henüz düşmemelidir
    const araBakiye = db.getIzinBakiyesi(p.id, 2026)!
    expect(araBakiye.kalanGun).toBe(initialKalan)

    // 2. AŞAMA ONAYI: İK Müdürü Onayı (Nihai Onay)
    const adim2Sonuc = db.approveIzinTalebi(izinId, 'ik-1', 'İK Müdürü Fatma Hanım', 'Kadro ve izin hakkı uygundur')
    expect(adim2Sonuc.tamamlandiMi).toBe(true)
    expect(adim2Sonuc.durum).toBe('onaylandi')

    // Nihai onayda bakiye 4 gün düşmelidir
    const sonBakiye = db.getIzinBakiyesi(p.id, 2026)!
    expect(sonBakiye.kalanGun).toBe(initialKalan - 4)
    expect(sonBakiye.kullanilanGun).toBe(4)
  })

  it('izin reddi ve iade akışlarını gerekçesiyle kaydetmelidir', () => {
    const p = db.getPersonelList()[0]

    // Talep 1: Reddedilecek talep
    const res1 = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'mazeret',
      baslangicTarihi: '2026-12-01',
      bitisTarihi: '2026-12-02',
      aciklama: 'Mazeret izni talebi'
    })
    db.rejectIzinTalebi(res1.id!, 'amir-1', 'Birim Amiri', 'İş yoğunluğu nedeniyle ertelenmiştir')

    const talep1 = db.getIzinTalepleri(p.id).find((t) => t.id === res1.id)
    expect(talep1?.durum).toBe('reddedildi')
    expect(talep1?.redGerekcesi).toContain('İş yoğunluğu nedeniyle')

    // Talep 2: İade edilecek talep
    const res2 = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-12-10',
      bitisTarihi: '2026-12-12',
      aciklama: 'İade edilecek talep'
    })
    db.returnIzinTalebi(res2.id!, 'ik-1', 'İK Şefi', 'Mazeret belgesi eksik')

    const talep2 = db.getIzinTalepleri(p.id).find((t) => t.id === res2.id)
    expect(talep2?.durum).toBe('iade_edildi')
    expect(talep2?.redGerekcesi).toContain('Mazeret belgesi eksik')
  })

  it('personelin çalışma durumu izin onaylandığında hemen değil, izin tarihi geldiğinde izinli olmalıdır', () => {
    const p = db.getPersonelList()[0]

    // 1 ay sonra başlayacak bir izin (Örn: 2026-11-15 - 2026-11-20)
    const res = db.createIzinTalebi({
      personelId: p.id,
      izinTuru: 'yillik',
      baslangicTarihi: '2026-11-15',
      bitisTarihi: '2026-11-20',
      aciklama: 'Gelecek ay izni'
    })
    // 2 adımı da onayla
    db.approveIzinTalebi(res.id!, 'amir-1', 'Amir')
    db.approveIzinTalebi(res.id!, 'ik-1', 'İK')

    // Bugün tarihi (Örn: 2026-10-27) izin tarihinden önce olduğundan durum AKTİF kalmalıdır!
    const bugunkuDurum = db.syncPersonelFiiliCalismaDurumu(p.id, '2026-10-27')
    expect(bugunkuDurum).toBe('aktif')
    expect(db.getPersonelById(p.id)?.calismaDurumu).toBe('aktif')

    // İzin günü geldiğinde (2026-11-16) durum İZİNLİ olmalıdır!
    const izinGunuDurum = db.syncPersonelFiiliCalismaDurumu(p.id, '2026-11-16')
    expect(izinGunuDurum).toBe('izinli')
    expect(db.getPersonelById(p.id)?.calismaDurumu).toBe('izinli')

    // İzin bittiğinde (2026-11-25) durum tekrar AKTİF olmalıdır!
    const izinSonrasiDurum = db.syncPersonelFiiliCalismaDurumu(p.id, '2026-11-25')
    expect(izinSonrasiDurum).toBe('aktif')
    expect(db.getPersonelById(p.id)?.calismaDurumu).toBe('aktif')
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
      bitisTarihi: '2026-10-30',
      olurNo: '2026/145',
      durum: 'aktif'
    }, 'Makam Oluru')

    const gorevler = db.getGorevlendirmeler(p.id)
    expect(gorevler).toHaveLength(1)
    expect(gorevler[0].gorevTanimi).toBe('Bölge incelemesi ve raporlama')

    const updatedP = db.getPersonelById(p.id)
    expect(updatedP?.calismaDurumu).toBe('gorevlendirmede')
  })

  it('sendika izni açıldığında kurallara göre hafta sonunu düşmeli ve yıllık izin bakiyesinden DÜŞMEMELİDİR', () => {
    // p-101 Ahmet Yılmaz: sendikaUyesiMi = true (Bem-Bir-Sen Temsilcisi)
    const ahmet = db.getPersonelById('p-101')!
    expect(ahmet.sendikaUyesiMi).toBe(true)

    const initialBakiye = db.getIzinBakiyesi(ahmet.id, 2026)!
    const initialKalan = initialBakiye.kalanGun // 20 gün

    // Cuma'dan Pazartesi'ye sendika izni (2026-06-05 Cuma - 2026-06-08 Pazartesi)
    // Cuma (1), Cts (tatil), Paz (tatil), Pzt (1) -> haftaSonuHaric: true olduğundan toplam 2 gün sayılmalı!
    const res = db.createIzinTalebi({
      personelId: ahmet.id,
      izinTuru: 'sendika',
      baslangicTarihi: '2026-06-05',
      bitisTarihi: '2026-06-08',
      aciklama: 'Sendika Şube Yönetim Kurulu Toplantısı'
    })
    expect(res.success).toBe(true)

    const talep = db.getIzinTalepleri(ahmet.id).find((t) => t.id === res.id!)
    expect(talep?.gunSayisi).toBe(2) // Hafta sonu hariç 2 iş günü!

    // 2 onay adımını da tamamla
    db.approveIzinTalebi(res.id!, 'amir-1', 'Birim Amiri')
    db.approveIzinTalebi(res.id!, 'ik-1', 'İK Müdürü')

    // Kritik Kural: Sendika izni yıllık izin bakiyesinden DÜŞMEMELİDİR!
    const sonBakiye = db.getIzinBakiyesi(ahmet.id, 2026)!
    expect(sonBakiye.kalanGun).toBe(initialKalan)
    expect(sonBakiye.kullanilanGun).toBe(0)
  })

  it('sendika üyesi olmayan personel için sendika izni talebini reddetmelidir', () => {
    // p-102 Ayşe Demir: sendikaUyesiMi = false
    const ayse = db.getPersonelById('p-102')!
    expect(ayse.sendikaUyesiMi).toBe(false)

    const res = db.createIzinTalebi({
      personelId: ayse.id,
      izinTuru: 'sendika',
      baslangicTarihi: '2026-07-01',
      bitisTarihi: '2026-07-03',
      aciklama: 'Sendika izni talebi'
    })

    expect(res.success).toBe(false)
    expect(res.hata).toContain('yalnızca sendika üyesi veya sendika işyeri/şube temsilcisi')
  })
})

