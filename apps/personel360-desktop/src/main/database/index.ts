import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import {
  PersonelRecord,
  IzinTalebi,
  IzinBakiyesi,
  Gorevlendirme,
  PersonelIslemGecmisi,
  calculateIzinGunu,
  validateIzinTalebiKurallari
} from '@worksuite-360/contracts'

export class PersonelDatabase {
  private db: Database.Database

  constructor(dbPath?: string) {
    let resolvedPath = dbPath
    if (!resolvedPath) {
      const userDataDir = app ? app.getPath('userData') : process.cwd()
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      resolvedPath = path.join(userDataDir, 'personel360.db')
    }
    this.db = new Database(resolvedPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initSchema()
    this.seedDefaultsIfEmpty()
  }

  public getRawDb(): Database.Database {
    return this.db
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS TANIM_Birim (
        id TEXT PRIMARY KEY,
        ad TEXT NOT NULL,
        kod TEXT,
        aktif INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS TANIM_Personel (
        id TEXT PRIMARY KEY,
        tcKimlikNo TEXT NOT NULL UNIQUE,
        sicilNo TEXT NOT NULL UNIQUE,
        ad TEXT NOT NULL,
        soyad TEXT NOT NULL,
        unvan TEXT NOT NULL,
        kadro TEXT NOT NULL,
        birimId TEXT,
        birimAdi TEXT NOT NULL,
        iseBaslamaTarihi TEXT NOT NULL,
        calismaDurumu TEXT DEFAULT 'aktif',
        telefon TEXT,
        eposta TEXT,
        kanGrubu TEXT,
        adres TEXT,
        olusturulduguTarih TEXT NOT NULL,
        guncellendigiTarih TEXT NOT NULL,
        FOREIGN KEY(birimId) REFERENCES TANIM_Birim(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS DATA_IzinBakiyesi (
        id TEXT PRIMARY KEY,
        personelId TEXT NOT NULL,
        yil INTEGER NOT NULL,
        hakEdilenGun INTEGER NOT NULL DEFAULT 14,
        devredenGun INTEGER NOT NULL DEFAULT 0,
        kullanilanGun INTEGER NOT NULL DEFAULT 0,
        kalanGun INTEGER NOT NULL DEFAULT 14,
        UNIQUE(personelId, yil),
        FOREIGN KEY(personelId) REFERENCES TANIM_Personel(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS DATA_IzinTalebi (
        id TEXT PRIMARY KEY,
        personelId TEXT NOT NULL,
        personelAdSoyad TEXT NOT NULL,
        sicilNo TEXT NOT NULL,
        izinTuru TEXT NOT NULL,
        baslangicTarihi TEXT NOT NULL,
        bitisTarihi TEXT NOT NULL,
        gunSayisi INTEGER NOT NULL,
        aciklama TEXT,
        durum TEXT DEFAULT 'taslak',
        onayAdimlari TEXT,
        redGerekcesi TEXT,
        belgeArtifactPath TEXT,
        olusturulduguTarih TEXT NOT NULL,
        guncellendigiTarih TEXT NOT NULL,
        FOREIGN KEY(personelId) REFERENCES TANIM_Personel(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS DATA_Gorevlendirme (
        id TEXT PRIMARY KEY,
        personelId TEXT NOT NULL,
        gorevTuru TEXT NOT NULL,
        gorevlendirilenBirimId TEXT,
        gorevlendirilenBirimAdi TEXT,
        gorevTanimi TEXT NOT NULL,
        baslangicTarihi TEXT NOT NULL,
        bitisTarihi TEXT,
        olurNo TEXT,
        olurTarihi TEXT,
        durum TEXT DEFAULT 'aktif',
        FOREIGN KEY(personelId) REFERENCES TANIM_Personel(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS LOG_PersonelIslem (
        id TEXT PRIMARY KEY,
        personelId TEXT NOT NULL,
        islemTuru TEXT NOT NULL,
        aciklama TEXT NOT NULL,
        yapanKullaniciId TEXT NOT NULL,
        yapanKullaniciAdi TEXT NOT NULL,
        tarih TEXT NOT NULL,
        detayJson TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_personel_sicil ON TANIM_Personel(sicilNo);
      CREATE INDEX IF NOT EXISTS idx_izin_personel ON DATA_IzinTalebi(personelId);
      CREATE INDEX IF NOT EXISTS idx_izin_tarih ON DATA_IzinTalebi(baslangicTarihi, bitisTarihi);
      CREATE INDEX IF NOT EXISTS idx_bakiye_personel_yil ON DATA_IzinBakiyesi(personelId, yil);
    `)
  }

  private seedDefaultsIfEmpty(): void {
    const birimCount = (this.db.prepare('SELECT count(*) as count FROM TANIM_Birim').get() as { count: number }).count
    if (birimCount === 0) {
      const insertBirim = this.db.prepare('INSERT INTO TANIM_Birim (id, ad, kod) VALUES (?, ?, ?)')
      insertBirim.run('b-1', 'İnsan Kaynakları ve Eğitim Müdürlüğü', 'İK-01')
      insertBirim.run('b-2', 'Yazı İşleri Müdürlüğü', 'YAZI-02')
      insertBirim.run('b-3', 'Mali Hizmetler Müdürlüğü', 'MALİ-03')
      insertBirim.run('b-4', 'Fen İşleri Müdürlüğü', 'FEN-04')
      insertBirim.run('b-5', 'Destek Hizmetleri Müdürlüğü', 'DEST-05')
    }

    const personelCount = (this.db.prepare('SELECT count(*) as count FROM TANIM_Personel').get() as { count: number }).count
    if (personelCount === 0) {
      const now = new Date().toISOString()
      this.createPersonel({
        id: 'p-101',
        tcKimlikNo: '12345678901',
        sicilNo: 'SICIL-1001',
        ad: 'Ahmet',
        soyad: 'Yılmaz',
        unvan: 'Şube Müdürü',
        kadro: 'Memur (657)',
        birimId: 'b-1',
        birimAdi: 'İnsan Kaynakları ve Eğitim Müdürlüğü',
        iseBaslamaTarihi: '2020-03-15',
        calismaDurumu: 'aktif',
        telefon: '0555 111 22 33',
        eposta: 'ahmet.yilmaz@kurum.gov.tr',
        olusturulduguTarih: now,
        guncellendigiTarih: now
      }, 'Sistem Başlangıç Kurulumu')

      this.createPersonel({
        id: 'p-102',
        tcKimlikNo: '98765432109',
        sicilNo: 'SICIL-1002',
        ad: 'Ayşe',
        soyad: 'Demir',
        unvan: 'Mühendis',
        kadro: 'Sözleşmeli (4/B)',
        birimId: 'b-4',
        birimAdi: 'Fen İşleri Müdürlüğü',
        iseBaslamaTarihi: '2022-07-01',
        calismaDurumu: 'aktif',
        telefon: '0555 444 55 66',
        eposta: 'ayse.demir@kurum.gov.tr',
        olusturulduguTarih: now,
        guncellendigiTarih: now
      }, 'Sistem Başlangıç Kurulumu')
    }
  }

  // --- Personel CRUD ---
  public getPersonelList(): PersonelRecord[] {
    return this.db.prepare('SELECT * FROM TANIM_Personel ORDER BY ad ASC, soyad ASC').all() as PersonelRecord[]
  }

  public getPersonelById(id: string): PersonelRecord | undefined {
    return this.db.prepare('SELECT * FROM TANIM_Personel WHERE id = ?').get(id) as PersonelRecord | undefined
  }

  public createPersonel(record: PersonelRecord, actorName = 'Yetkili'): void {
    const currentYear = new Date().getFullYear()
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO TANIM_Personel (
          id, tcKimlikNo, sicilNo, ad, soyad, unvan, kadro, birimId, birimAdi,
          iseBaslamaTarihi, calismaDurumu, telefon, eposta, kanGrubu, adres,
          olusturulduguTarih, guncellendigiTarih
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?
        )
      `).run(
        record.id, record.tcKimlikNo, record.sicilNo, record.ad, record.soyad,
        record.unvan, record.kadro, record.birimId || null, record.birimAdi,
        record.iseBaslamaTarihi, record.calismaDurumu || 'aktif',
        record.telefon || null, record.eposta || null, record.kanGrubu || null, record.adres || null,
        record.olusturulduguTarih, record.guncellendigiTarih
      )

      // Initialize leave balance for current year
      this.db.prepare(`
        INSERT OR IGNORE INTO DATA_IzinBakiyesi (id, personelId, yil, hakEdilenGun, devredenGun, kullanilanGun, kalanGun)
        VALUES (?, ?, ?, 14, 0, 0, 14)
      `).run(`bakiye-${record.id}-${currentYear}`, record.id, currentYear)

      // Audit log
      this.db.prepare(`
        INSERT INTO LOG_PersonelIslem (id, personelId, islemTuru, aciklama, yapanKullaniciId, yapanKullaniciAdi, tarih, detayJson)
        VALUES (?, ?, 'kayit_olusturma', ?, 'sys-admin', ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        record.id,
        `Personel kaydı oluşturuldu: ${record.ad} ${record.soyad} (${record.sicilNo})`,
        actorName,
        new Date().toISOString(),
        JSON.stringify(record)
      )
    })()
  }

  public updatePersonel(record: Partial<PersonelRecord> & { id: string }, actorName = 'Yetkili'): void {
    const existing = this.getPersonelById(record.id)
    if (!existing) throw new Error(`Personel bulunamadı: ${record.id}`)

    const updated: PersonelRecord = {
      ...existing,
      ...record,
      guncellendigiTarih: new Date().toISOString()
    }

    this.db.transaction(() => {
      this.db.prepare(`
        UPDATE TANIM_Personel SET
          ad = ?, soyad = ?, unvan = ?, kadro = ?, birimId = ?, birimAdi = ?,
          calismaDurumu = ?, telefon = ?, eposta = ?, kanGrubu = ?, adres = ?,
          guncellendigiTarih = ?
        WHERE id = ?
      `).run(
        updated.ad, updated.soyad, updated.unvan, updated.kadro, updated.birimId || null,
        updated.birimAdi, updated.calismaDurumu, updated.telefon || null, updated.eposta || null,
        updated.kanGrubu || null, updated.adres || null, updated.guncellendigiTarih, updated.id
      )

      this.db.prepare(`
        INSERT INTO LOG_PersonelIslem (id, personelId, islemTuru, aciklama, yapanKullaniciId, yapanKullaniciAdi, tarih, detayJson)
        VALUES (?, ?, 'bakiye_duzeltme', ?, 'sys-admin', ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        updated.id,
        `Personel bilgileri güncellendi (${updated.ad} ${updated.soyad})`,
        actorName,
        new Date().toISOString(),
        JSON.stringify({ old: existing, new: updated })
      )
    })()
  }

  // --- İzin Yönetimi ---
  public getIzinBakiyesi(personelId: string, yil: number = new Date().getFullYear()): IzinBakiyesi | undefined {
    let row = this.db.prepare('SELECT * FROM DATA_IzinBakiyesi WHERE personelId = ? AND yil = ?').get(personelId, yil) as IzinBakiyesi | undefined
    if (!row) {
      // Lazy init balance if missing
      const newId = `bakiye-${personelId}-${yil}`
      this.db.prepare(`
        INSERT INTO DATA_IzinBakiyesi (id, personelId, yil, hakEdilenGun, devredenGun, kullanilanGun, kalanGun)
        VALUES (?, ?, ?, 14, 0, 0, 14)
      `).run(newId, personelId, yil)
      row = this.db.prepare('SELECT * FROM DATA_IzinBakiyesi WHERE id = ?').get(newId) as IzinBakiyesi
    }
    return row
  }

  public getIzinTalepleri(personelId?: string): IzinTalebi[] {
    const sql = personelId
      ? 'SELECT * FROM DATA_IzinTalebi WHERE personelId = ? ORDER BY olusturulduguTarih DESC'
      : 'SELECT * FROM DATA_IzinTalebi ORDER BY olusturulduguTarih DESC'
    const rows = (personelId ? this.db.prepare(sql).all(personelId) : this.db.prepare(sql).all()) as any[]
    return rows.map((r) => ({
      ...r,
      onayAdimlari: r.onayAdimlari ? JSON.parse(r.onayAdimlari) : []
    }))
  }

  public createIzinTalebi(params: {
    personelId: string
    izinTuru: any
    baslangicTarihi: string
    bitisTarihi: string
    aciklama: string
    actorName?: string
  }): { success: boolean; id?: string; hata?: string } {
    const personel = this.getPersonelById(params.personelId)
    if (!personel) return { success: false, hata: 'Personel kaydı bulunamadı.' }

    const gunSayisi = calculateIzinGunu(params.baslangicTarihi, params.bitisTarihi)
    const bakiye = this.getIzinBakiyesi(params.personelId, new Date(params.baslangicTarihi).getFullYear())
    const mevcutTalepler = this.getIzinTalepleri(params.personelId)

    const validation = validateIzinTalebiKurallari({
      talep: {
        personelId: params.personelId,
        personelAdSoyad: `${personel.ad} ${personel.soyad}`,
        sicilNo: personel.sicilNo,
        izinTuru: params.izinTuru,
        baslangicTarihi: params.baslangicTarihi,
        bitisTarihi: params.bitisTarihi,
        gunSayisi,
        aciklama: params.aciklama
      },
      bakiye,
      mevcutTalepler
    })

    if (!validation.gecerli) {
      return { success: false, hata: validation.hata }
    }

    const id = `izin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const now = new Date().toISOString()
    const defaultApprovalSteps = [
      { unvan: 'Birim Amiri', karar: 'bekliyor' },
      { unvan: 'İnsan Kaynakları Müdürü', karar: 'bekliyor' }
    ]

    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO DATA_IzinTalebi (
          id, personelId, personelAdSoyad, sicilNo, izinTuru, baslangicTarihi,
          bitisTarihi, gunSayisi, aciklama, durum, onayAdimlari, olusturulduguTarih, guncellendigiTarih
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 'onayda', ?, ?, ?
        )
      `).run(
        id, params.personelId, `${personel.ad} ${personel.soyad}`, personel.sicilNo,
        params.izinTuru, params.baslangicTarihi, params.bitisTarihi, gunSayisi,
        params.aciklama, JSON.stringify(defaultApprovalSteps), now, now
      )

      this.db.prepare(`
        INSERT INTO LOG_PersonelIslem (id, personelId, islemTuru, aciklama, yapanKullaniciId, yapanKullaniciAdi, tarih, detayJson)
        VALUES (?, ?, 'izin_talebi', ?, 'sys-admin', ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        params.personelId,
        `Yeni izin talebi açıldı (${gunSayisi} gün, ${params.izinTuru})`,
        params.actorName || `${personel.ad} ${personel.soyad}`,
        now,
        JSON.stringify({ izinId: id, baslangic: params.baslangicTarihi, bitis: params.bitisTarihi, gunSayisi })
      )
    })()

    return { success: true, id }
  }

  public approveIzinTalebi(izinId: string, onaylayanAdi = 'Birim Amiri'): void {
    const talep = this.db.prepare('SELECT * FROM DATA_IzinTalebi WHERE id = ?').get(izinId) as any
    if (!talep) throw new Error(`İzin talebi bulunamadı: ${izinId}`)
    if (talep.durum === 'onaylandi') return

    const now = new Date().toISOString()
    const steps = talep.onayAdimlari ? JSON.parse(talep.onayAdimlari) : []
    const updatedSteps = steps.map((s: any) => ({
      ...s,
      karar: 'onaylandi',
      onaylayanAdi,
      onayTarihi: now
    }))

    this.db.transaction(() => {
      this.db.prepare(`
        UPDATE DATA_IzinTalebi SET
          durum = 'onaylandi',
          onayAdimlari = ?,
          guncellendigiTarih = ?
        WHERE id = ?
      `).run(JSON.stringify(updatedSteps), now, izinId)

      // Deduct from balance if annual leave
      if (talep.izinTuru === 'yillik') {
        const yil = new Date(talep.baslangicTarihi).getFullYear()
        const bakiye = this.getIzinBakiyesi(talep.personelId, yil)
        if (bakiye) {
          const yeniKullanilan = bakiye.kullanilanGun + talep.gunSayisi
          const yeniKalan = Math.max(0, bakiye.kalanGun - talep.gunSayisi)
          this.db.prepare(`
            UPDATE DATA_IzinBakiyesi SET
              kullanilanGun = ?,
              kalanGun = ?
            WHERE id = ?
          `).run(yeniKullanilan, yeniKalan, bakiye.id)
        }
      }

      // Update personel working status
      this.db.prepare("UPDATE TANIM_Personel SET calismaDurumu = 'izinli', guncellendigiTarih = ? WHERE id = ?")
        .run(now, talep.personelId)

      // Audit log
      this.db.prepare(`
        INSERT INTO LOG_PersonelIslem (id, personelId, islemTuru, aciklama, yapanKullaniciId, yapanKullaniciAdi, tarih, detayJson)
        VALUES (?, ?, 'izin_onayi', ?, 'sys-admin', ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        talep.personelId,
        `İzin talebi onaylandı (${talep.gunSayisi} gün, ${talep.izinTuru})`,
        onaylayanAdi,
        now,
        JSON.stringify({ izinId, gunSayisi: talep.gunSayisi })
      )
    })()
  }

  // --- Görevlendirmeler ---
  public getGorevlendirmeler(personelId?: string): Gorevlendirme[] {
    const sql = personelId
      ? 'SELECT * FROM DATA_Gorevlendirme WHERE personelId = ? ORDER BY baslangicTarihi DESC'
      : 'SELECT * FROM DATA_Gorevlendirme ORDER BY baslangicTarihi DESC'
    return (personelId ? this.db.prepare(sql).all(personelId) : this.db.prepare(sql).all()) as Gorevlendirme[]
  }

  public createGorevlendirme(data: Gorevlendirme, actorName = 'Yetkili'): void {
    this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO DATA_Gorevlendirme (
          id, personelId, gorevTuru, gorevlendirilenBirimId, gorevlendirilenBirimAdi,
          gorevTanimi, baslangicTarihi, bitisTarihi, olurNo, olurTarihi, durum
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `).run(
        data.id, data.personelId, data.gorevTuru, data.gorevlendirilenBirimId || null,
        data.gorevlendirilenBirimAdi || null, data.gorevTanimi, data.baslangicTarihi,
        data.bitisTarihi || null, data.olurNo || null, data.olurTarihi || null, data.durum || 'aktif'
      )

      this.db.prepare("UPDATE TANIM_Personel SET calismaDurumu = 'gorevlendirmede', guncellendigiTarih = ? WHERE id = ?")
        .run(new Date().toISOString(), data.personelId)

      this.db.prepare(`
        INSERT INTO LOG_PersonelIslem (id, personelId, islemTuru, aciklama, yapanKullaniciId, yapanKullaniciAdi, tarih, detayJson)
        VALUES (?, ?, 'gorevlendirme', ?, 'sys-admin', ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        data.personelId,
        `Görevlendirme kaydı yapıldı: ${data.gorevTanimi}`,
        actorName,
        new Date().toISOString(),
        JSON.stringify(data)
      )
    })()
  }

  // --- Audit Log ---
  public getAuditHistory(personelId?: string): PersonelIslemGecmisi[] {
    const sql = personelId
      ? 'SELECT * FROM LOG_PersonelIslem WHERE personelId = ? ORDER BY tarih DESC LIMIT 100'
      : 'SELECT * FROM LOG_PersonelIslem ORDER BY tarih DESC LIMIT 100'
    const rows = (personelId ? this.db.prepare(sql).all(personelId) : this.db.prepare(sql).all()) as any[]
    return rows.map((r) => ({
      ...r,
      detay: r.detayJson ? JSON.parse(r.detayJson) : {}
    }))
  }

  // --- Birimler ---
  public getBirimler(): Array<{ id: string; ad: string; kod: string }> {
    return this.db.prepare('SELECT * FROM TANIM_Birim WHERE aktif = 1 ORDER BY ad ASC').all() as any[]
  }
}
