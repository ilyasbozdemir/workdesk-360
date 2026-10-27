import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface SurecSablonu {
  id: string
  kod: string
  ad: string
  kategori: string
  aciklama?: string
  versiyon: number
  adimlar: Array<{
    adimKodu: string
    baslik: string
    adimTuru: 'form' | 'document' | 'task' | 'approval' | 'condition' | 'action'
    sira: number
    sorumluKisi?: string
    sorumluRol?: string
    sorumluBirim?: string
    zorunluMu?: boolean
    formSemasi?: Array<{
      id: string
      label: string
      type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'boolean'
      required: boolean
      options?: Array<{ label: string; value: string | number }>
    }>
  }>
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export interface SurecKaydi {
  id: string
  sablonId?: string
  baslik: string
  kategori: string
  aciklama?: string
  durum: 'taslak' | 'aktif' | 'beklemede' | 'tamamlandi' | 'iptal' | 'arsivlendi'
  baslatanKisi: string
  baslatanBirim?: string
  aktifAdimId?: string
  ilerlemeYuzdesi: number
  baslangicTarihi: string
  bitisTarihi?: string
  surecVerisi: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SurecAdimKaydi {
  id: string
  surecId: string
  adimKodu: string
  baslik: string
  adimTuru: 'form' | 'document' | 'task' | 'approval' | 'condition' | 'action'
  sira: number
  sorumluKisi?: string
  sorumluRol?: string
  sorumluBirim?: string
  durum: 'beklemede' | 'devam_ediyor' | 'tamamlandi' | 'reddedildi' | 'iade_edildi' | 'atlandi'
  formVerisi?: Record<string, unknown>
  belgeVerisi?: Record<string, unknown>
  tamamlayanKisi?: string
  tamamlanmaTarihi?: string
  notlar?: string
}

export interface SurecGorevKaydi {
  id: string
  surecId: string
  adimId?: string
  gorevTanimi: string
  atananKisi: string
  atananBirim?: string
  oncelik: 'dusuk' | 'normal' | 'yuksek' | 'acil'
  sonTarih?: string
  tamamlandi: boolean
  tamamlanmaTarihi?: string
  tamamlayanKisi?: string
  notlar?: string
  createdAt: string
}

export interface SurecBelgeKaydi {
  id: string
  surecId: string
  adimId?: string
  belgeAdi: string
  dosyaYolu: string
  mimeType?: string
  boyutBayt?: number
  aciklama?: string
  yukleyenKisi: string
  createdAt: string
}

export interface SurecTarihceKaydi {
  id: string
  surecId: string
  adimId?: string
  islem: string
  yapanKisi: string
  tarih: string
  detay?: Record<string, unknown>
}

export interface SurecDetay {
  surec: SurecKaydi
  adimlar: SurecAdimKaydi[]
  gorevler: SurecGorevKaydi[]
  belgeler: SurecBelgeKaydi[]
  tarihce: SurecTarihceKaydi[]
}

let idCounter = 0
export function generateUniqueId(prefix: string): string {
  idCounter = (idCounter + 1) % 10000000
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).substring(2, 7)}`
}

export class FlowdeskDatabase {
  private db: Database.Database

  constructor(dbPath?: string) {
    let resolvedPath = dbPath
    if (!resolvedPath) {
      const userDataDir = app ? app.getPath('userData') : process.cwd()
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      resolvedPath = path.join(userDataDir, 'flowdesk360.db')
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
      CREATE TABLE IF NOT EXISTS TANIM_SurecSablonu (
        id TEXT PRIMARY KEY,
        kod TEXT UNIQUE NOT NULL,
        ad TEXT NOT NULL,
        kategori TEXT NOT NULL,
        aciklama TEXT,
        versiyon INTEGER DEFAULT 1,
        adimlarJson TEXT NOT NULL,
        formSemasiJson TEXT,
        aktif INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS DATA_Surec (
        id TEXT PRIMARY KEY,
        sablonId TEXT,
        baslik TEXT NOT NULL,
        kategori TEXT NOT NULL,
        aciklama TEXT,
        durum TEXT NOT NULL DEFAULT 'aktif',
        baslatanKisi TEXT NOT NULL,
        baslatanBirim TEXT,
        aktifAdimId TEXT,
        ilerlemeYuzdesi INTEGER DEFAULT 0,
        baslangicTarihi TEXT NOT NULL,
        bitisTarihi TEXT,
        surecVerisiJson TEXT DEFAULT '{}',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS DATA_SurecAdim (
        id TEXT PRIMARY KEY,
        surecId TEXT NOT NULL REFERENCES DATA_Surec(id) ON DELETE CASCADE,
        adimKodu TEXT NOT NULL,
        baslik TEXT NOT NULL,
        adimTuru TEXT NOT NULL,
        sira INTEGER NOT NULL,
        sorumluKisi TEXT,
        sorumluRol TEXT,
        sorumluBirim TEXT,
        durum TEXT NOT NULL DEFAULT 'beklemede',
        formVerisiJson TEXT,
        belgeVerisiJson TEXT,
        tamamlayanKisi TEXT,
        tamamlanmaTarihi TEXT,
        notlar TEXT
      );

      CREATE TABLE IF NOT EXISTS DATA_Gorev (
        id TEXT PRIMARY KEY,
        surecId TEXT NOT NULL REFERENCES DATA_Surec(id) ON DELETE CASCADE,
        adimId TEXT REFERENCES DATA_SurecAdim(id) ON DELETE SET NULL,
        gorevTanimi TEXT NOT NULL,
        atananKisi TEXT NOT NULL,
        atananBirim TEXT,
        oncelik TEXT DEFAULT 'normal',
        sonTarih TEXT,
        tamamlandi INTEGER DEFAULT 0,
        tamamlanmaTarihi TEXT,
        tamamlayanKisi TEXT,
        notlar TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS DATA_SurecBelge (
        id TEXT PRIMARY KEY,
        surecId TEXT NOT NULL REFERENCES DATA_Surec(id) ON DELETE CASCADE,
        adimId TEXT REFERENCES DATA_SurecAdim(id) ON DELETE SET NULL,
        belgeAdi TEXT NOT NULL,
        dosyaYolu TEXT NOT NULL,
        mimeType TEXT,
        boyutBayt INTEGER,
        aciklama TEXT,
        yukleyenKisi TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS LOG_SurecTarihce (
        id TEXT PRIMARY KEY,
        surecId TEXT NOT NULL REFERENCES DATA_Surec(id) ON DELETE CASCADE,
        adimId TEXT,
        islem TEXT NOT NULL,
        yapanKisi TEXT NOT NULL,
        tarih TEXT NOT NULL,
        detayJson TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_surec_durum ON DATA_Surec(durum);
      CREATE INDEX IF NOT EXISTS idx_surec_kategori ON DATA_Surec(kategori);
      CREATE INDEX IF NOT EXISTS idx_adim_surec ON DATA_SurecAdim(surecId);
      CREATE INDEX IF NOT EXISTS idx_gorev_surec ON DATA_Gorev(surecId);
      CREATE INDEX IF NOT EXISTS idx_tarihce_surec ON LOG_SurecTarihce(surecId);
    `)
  }

  private seedDefaultsIfEmpty(): void {
    const count = (this.db.prepare('SELECT COUNT(*) as c FROM TANIM_SurecSablonu').get() as { c: number }).c
    if (count > 0) return

    const now = new Date().toISOString()

    const defaultTemplates: SurecSablonu[] = [
      {
        id: 'sbl-talep-01',
        kod: 'SBL-TALEP',
        ad: 'Kurum İçi Mal ve Hizmet Talep Akışı',
        kategori: 'talep',
        aciklama: 'Birimlerin sarf malzeme, donanım veya hizmet taleplerinin amir onayına sunulması ve satınalma incelemesi.',
        versiyon: 1,
        adimlar: [
          {
            adimKodu: 'ADM-01',
            baslik: 'Talep Girişi ve Gerekçe Bildirimi',
            adimTuru: 'form',
            sira: 1,
            sorumluRol: 'talep_sahibi',
            zorunluMu: true,
            formSemasi: [
              { id: 'talep_konusu', label: 'Talep Konusu / Başlık', type: 'text', required: true },
              { id: 'talep_edilen_malzeme', label: 'Talep Edilen Malzeme veya Hizmet Kalemleri', type: 'textarea', required: true },
              { id: 'tahmini_tutar', label: 'Tahmini Tutar (TL)', type: 'currency', required: false },
              { id: 'oncelik', label: 'Öncelik Derecesi', type: 'select', required: true, options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Acil', value: 'acil' },
                { label: 'Kritik', value: 'kritik' }
              ]}
            ]
          },
          {
            adimKodu: 'ADM-02',
            baslik: 'Birim Amiri / Şube Müdürü İnceleme ve Onayı',
            adimTuru: 'approval',
            sira: 2,
            sorumluRol: 'sube_muduru',
            sorumluBirim: 'İlgili Birim',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-03',
            baslik: 'Destek Hizmetleri İnceleme ve Görev Dağılımı',
            adimTuru: 'task',
            sira: 3,
            sorumluRol: 'satinalma_uzmani',
            sorumluBirim: 'Destek Hizmetleri',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-04',
            baslik: 'Nihai Karar ve Sonuç Bildirimi',
            adimTuru: 'action',
            sira: 4,
            sorumluRol: 'birim_yetkilisi',
            zorunluMu: true
          }
        ],
        aktif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sbl-resmi-02',
        kod: 'SBL-RESMI',
        ad: 'Resmî Yazışma ve Paraf Onay Akışı',
        kategori: 'idari',
        aciklama: 'Dış kurumlara veya birimler arası gönderilecek resmî yazıların taslak, paraf ve imza aşamaları.',
        versiyon: 1,
        adimlar: [
          {
            adimKodu: 'ADM-01',
            baslik: 'Resmî Yazı Taslağının Hazırlanması',
            adimTuru: 'form',
            sira: 1,
            sorumluRol: 'yazi_isleri_memuru',
            zorunluMu: true,
            formSemasi: [
              { id: 'gidecegi_yer', label: 'Muhatap Kurum / Birim', type: 'text', required: true },
              { id: 'yazi_konusu', label: 'Yazı Konusu', type: 'text', required: true },
              { id: 'yazi_icerigi', label: 'Metin / İçerik', type: 'textarea', required: true }
            ]
          },
          {
            adimKodu: 'ADM-02',
            baslik: 'Şef / Uzman Paraflama',
            adimTuru: 'approval',
            sira: 2,
            sorumluRol: 'uzman_parafci',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-03',
            baslik: 'Daire Başkanı / Genel Sekreter İmzası',
            adimTuru: 'approval',
            sira: 3,
            sorumluRol: 'imza_yetkilisi',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-04',
            baslik: 'Evrak Kayıt Numarası Alma ve Sevk',
            adimTuru: 'task',
            sira: 4,
            sorumluRol: 'evrak_kayit_gorevlisi',
            sorumluBirim: 'Yazı İşleri',
            zorunluMu: true
          }
        ],
        aktif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sbl-saha-03',
        kod: 'SBL-SAHA',
        ad: 'Saha Denetim ve Görevlendirme Takibi',
        kategori: 'saha',
        aciklama: 'Teknik ekiplerin sahada inceleme, tespit tutanağı düzenleme ve rapor sunma süreci.',
        versiyon: 1,
        adimlar: [
          {
            adimKodu: 'ADM-01',
            baslik: 'Saha Denetim Talebi ve Adres Tespiti',
            adimTuru: 'form',
            sira: 1,
            sorumluRol: 'saha_koordinatoru',
            zorunluMu: true,
            formSemasi: [
              { id: 'denetim_yeri', label: 'Denetim / İnceleme Adresi', type: 'text', required: true },
              { id: 'denetim_amaci', label: 'İnceleme Nedeni ve Amacı', type: 'textarea', required: true },
              { id: 'hedef_tarih', label: 'Planlanan Denetim Tarihi', type: 'date', required: true }
            ]
          },
          {
            adimKodu: 'ADM-02',
            baslik: 'Teknik Ekip Atama ve Görevlendirme',
            adimTuru: 'task',
            sira: 2,
            sorumluRol: 'teknik_ekip_lideri',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-03',
            baslik: 'Saha Tespit Tutanağı Düzenleme',
            adimTuru: 'document',
            sira: 3,
            sorumluRol: 'saha_mufettisi',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-04',
            baslik: 'Denetim Raporu Onayı ve Kapatma',
            adimTuru: 'approval',
            sira: 4,
            sorumluRol: 'denetim_baskani',
            zorunluMu: true
          }
        ],
        aktif: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sbl-it-04',
        kod: 'SBL-IT',
        ad: 'Bilgi İşlem Donanım / Yazılım Destek Talebi',
        kategori: 'it',
        aciklama: 'Personel bilgisayar, çevre birimi veya yazılım arıza ve talep süreçlerinin çözümü.',
        versiyon: 1,
        adimlar: [
          {
            adimKodu: 'ADM-01',
            baslik: 'Destek Çağrısı Açma',
            adimTuru: 'form',
            sira: 1,
            sorumluRol: 'kullanici',
            zorunluMu: true,
            formSemasi: [
              { id: 'ariza_turu', label: 'Talep Türü', type: 'select', required: true, options: [
                { label: 'Donanım / PC / Yazıcı', value: 'donanim' },
                { label: 'Yazılım / İşletim Sistemi', value: 'yazilim' },
                { label: 'Ağ / İnternet / E-Posta', value: 'ag' },
                { label: 'Yetki / Hesap Açma', value: 'yetki' }
              ]},
              { id: 'aciklama', label: 'Sorun / İhtiyaç Özeti', type: 'textarea', required: true },
              { id: 'dahili_no', label: 'Dahili Telefon No', type: 'text', required: false }
            ]
          },
          {
            adimKodu: 'ADM-02',
            baslik: 'IT İnceleme ve Müdahale Görevi',
            adimTuru: 'task',
            sira: 2,
            sorumluRol: 'it_teknisyeni',
            sorumluBirim: 'Bilgi İşlem Dairesi',
            zorunluMu: true
          },
          {
            adimKodu: 'ADM-03',
            baslik: 'Kullanıcı Çözüm Onayı ve Kapatma',
            adimTuru: 'approval',
            sira: 3,
            sorumluRol: 'kullanici',
            zorunluMu: true
          }
        ],
        aktif: true,
        createdAt: now,
        updatedAt: now
      }
    ]

    const insertTemplate = this.db.prepare(`
      INSERT INTO TANIM_SurecSablonu (id, kod, ad, kategori, aciklama, versiyon, adimlarJson, aktif, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = this.db.transaction(() => {
      for (const t of defaultTemplates) {
        insertTemplate.run(
          t.id,
          t.kod,
          t.ad,
          t.kategori,
          t.aciklama || null,
          t.versiyon,
          JSON.stringify(t.adimlar),
          t.aktif ? 1 : 0,
          t.createdAt,
          t.updatedAt
        )
      }
    })
    tx()
  }

  // ==========================================================================
  // ŞABLON İŞLEMLERİ
  // ==========================================================================

  public getTemplates(): SurecSablonu[] {
    const rows = this.db.prepare(`
      SELECT * FROM TANIM_SurecSablonu WHERE aktif = 1 ORDER BY kod ASC
    `).all() as Array<{
      id: string
      kod: string
      ad: string
      kategori: string
      aciklama: string | null
      versiyon: number
      adimlarJson: string
      aktif: number
      createdAt: string
      updatedAt: string
    }>

    return rows.map((r) => ({
      id: r.id,
      kod: r.kod,
      ad: r.ad,
      kategori: r.kategori,
      aciklama: r.aciklama || undefined,
      versiyon: r.versiyon,
      adimlar: JSON.parse(r.adimlarJson || '[]'),
      aktif: Boolean(r.aktif),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
  }

  public getTemplateById(id: string): SurecSablonu | null {
    const row = this.db.prepare(`
      SELECT * FROM TANIM_SurecSablonu WHERE id = ?
    `).get(id) as {
      id: string
      kod: string
      ad: string
      kategori: string
      aciklama: string | null
      versiyon: number
      adimlarJson: string
      aktif: number
      createdAt: string
      updatedAt: string
    } | undefined

    if (!row) return null

    return {
      id: row.id,
      kod: row.kod,
      ad: row.ad,
      kategori: row.kategori,
      aciklama: row.aciklama || undefined,
      versiyon: row.versiyon,
      adimlar: JSON.parse(row.adimlarJson || '[]'),
      aktif: Boolean(row.aktif),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  public createTemplate(data: Omit<SurecSablonu, 'id' | 'createdAt' | 'updatedAt'>): SurecSablonu {
    const id = generateUniqueId('sbl')
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO TANIM_SurecSablonu (id, kod, ad, kategori, aciklama, versiyon, adimlarJson, aktif, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.kod,
      data.ad,
      data.kategori,
      data.aciklama || null,
      data.versiyon || 1,
      JSON.stringify(data.adimlar || []),
      data.aktif ? 1 : 0,
      now,
      now
    )

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    }
  }

  public updateTemplate(id: string, updates: Partial<SurecSablonu>): boolean {
    const existing = this.getTemplateById(id)
    if (!existing) return false

    const now = new Date().toISOString()
    const kod = updates.kod ?? existing.kod
    const ad = updates.ad ?? existing.ad
    const kategori = updates.kategori ?? existing.kategori
    const aciklama = updates.aciklama !== undefined ? updates.aciklama : existing.aciklama
    const versiyon = (updates.versiyon ?? existing.versiyon) + 1
    const adimlarJson = updates.adimlar ? JSON.stringify(updates.adimlar) : JSON.stringify(existing.adimlar)
    const aktif = updates.aktif !== undefined ? (updates.aktif ? 1 : 0) : (existing.aktif ? 1 : 0)

    const res = this.db.prepare(`
      UPDATE TANIM_SurecSablonu
      SET kod = ?, ad = ?, kategori = ?, aciklama = ?, versiyon = ?, adimlarJson = ?, aktif = ?, updatedAt = ?
      WHERE id = ?
    `).run(kod, ad, kategori, aciklama || null, versiyon, adimlarJson, aktif, now, id)

    return res.changes > 0
  }

  // ==========================================================================
  // SÜREÇ YÖNETİMİ (DATA_Surec, DATA_SurecAdim, DATA_Gorev)
  // ==========================================================================

  public getProcesses(filter?: {
    status?: string
    category?: string
    search?: string
  }): SurecKaydi[] {
    let sql = 'SELECT * FROM DATA_Surec WHERE 1=1'
    const params: unknown[] = []

    if (filter?.status && filter.status !== 'all') {
      sql += ' AND durum = ?'
      params.push(filter.status)
    }

    if (filter?.category && filter.category !== 'all') {
      sql += ' AND kategori = ?'
      params.push(filter.category)
    }

    if (filter?.search?.trim()) {
      sql += ' AND (baslik LIKE ? OR baslatanKisi LIKE ? OR aciklama LIKE ?)'
      const term = `%${filter.search.trim()}%`
      params.push(term, term, term)
    }

    sql += ' ORDER BY createdAt DESC'

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: string
      sablonId: string | null
      baslik: string
      kategori: string
      aciklama: string | null
      durum: string
      baslatanKisi: string
      baslatanBirim: string | null
      aktifAdimId: string | null
      ilerlemeYuzdesi: number
      baslangicTarihi: string
      bitisTarihi: string | null
      surecVerisiJson: string | null
      createdAt: string
      updatedAt: string
    }>

    return rows.map((r) => ({
      id: r.id,
      sablonId: r.sablonId || undefined,
      baslik: r.baslik,
      kategori: r.kategori,
      aciklama: r.aciklama || undefined,
      durum: r.durum as SurecKaydi['durum'],
      baslatanKisi: r.baslatanKisi,
      baslatanBirim: r.baslatanBirim || undefined,
      aktifAdimId: r.aktifAdimId || undefined,
      ilerlemeYuzdesi: r.ilerlemeYuzdesi,
      baslangicTarihi: r.baslangicTarihi,
      bitisTarihi: r.bitisTarihi || undefined,
      surecVerisi: JSON.parse(r.surecVerisiJson || '{}'),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
  }

  public getProcessById(id: string): SurecDetay | null {
    const surecRow = this.db.prepare('SELECT * FROM DATA_Surec WHERE id = ?').get(id) as {
      id: string
      sablonId: string | null
      baslik: string
      kategori: string
      aciklama: string | null
      durum: string
      baslatanKisi: string
      baslatanBirim: string | null
      aktifAdimId: string | null
      ilerlemeYuzdesi: number
      baslangicTarihi: string
      bitisTarihi: string | null
      surecVerisiJson: string | null
      createdAt: string
      updatedAt: string
    } | undefined

    if (!surecRow) return null

    const surec: SurecKaydi = {
      id: surecRow.id,
      sablonId: surecRow.sablonId || undefined,
      baslik: surecRow.baslik,
      kategori: surecRow.kategori,
      aciklama: surecRow.aciklama || undefined,
      durum: surecRow.durum as SurecKaydi['durum'],
      baslatanKisi: surecRow.baslatanKisi,
      baslatanBirim: surecRow.baslatanBirim || undefined,
      aktifAdimId: surecRow.aktifAdimId || undefined,
      ilerlemeYuzdesi: surecRow.ilerlemeYuzdesi,
      baslangicTarihi: surecRow.baslangicTarihi,
      bitisTarihi: surecRow.bitisTarihi || undefined,
      surecVerisi: JSON.parse(surecRow.surecVerisiJson || '{}'),
      createdAt: surecRow.createdAt,
      updatedAt: surecRow.updatedAt
    }

    const adimRows = this.db.prepare('SELECT * FROM DATA_SurecAdim WHERE surecId = ? ORDER BY sira ASC').all(id) as Array<{
      id: string
      surecId: string
      adimKodu: string
      baslik: string
      adimTuru: string
      sira: number
      sorumluKisi: string | null
      sorumluRol: string | null
      sorumluBirim: string | null
      durum: string
      formVerisiJson: string | null
      belgeVerisiJson: string | null
      tamamlayanKisi: string | null
      tamamlanmaTarihi: string | null
      notlar: string | null
    }>

    const adimlar: SurecAdimKaydi[] = adimRows.map((a) => ({
      id: a.id,
      surecId: a.surecId,
      adimKodu: a.adimKodu,
      baslik: a.baslik,
      adimTuru: a.adimTuru as SurecAdimKaydi['adimTuru'],
      sira: a.sira,
      sorumluKisi: a.sorumluKisi || undefined,
      sorumluRol: a.sorumluRol || undefined,
      sorumluBirim: a.sorumluBirim || undefined,
      durum: a.durum as SurecAdimKaydi['durum'],
      formVerisi: a.formVerisiJson ? JSON.parse(a.formVerisiJson) : undefined,
      belgeVerisi: a.belgeVerisiJson ? JSON.parse(a.belgeVerisiJson) : undefined,
      tamamlayanKisi: a.tamamlayanKisi || undefined,
      tamamlanmaTarihi: a.tamamlanmaTarihi || undefined,
      notlar: a.notlar || undefined
    }))

    const gorevRows = this.db.prepare('SELECT * FROM DATA_Gorev WHERE surecId = ? ORDER BY createdAt ASC').all(id) as Array<{
      id: string
      surecId: string
      adimId: string | null
      gorevTanimi: string
      atananKisi: string
      atananBirim: string | null
      oncelik: string
      sonTarih: string | null
      tamamlandi: number
      tamamlanmaTarihi: string | null
      tamamlayanKisi: string | null
      notlar: string | null
      createdAt: string
    }>

    const gorevler: SurecGorevKaydi[] = gorevRows.map((g) => ({
      id: g.id,
      surecId: g.surecId,
      adimId: g.adimId || undefined,
      gorevTanimi: g.gorevTanimi,
      atananKisi: g.atananKisi,
      atananBirim: g.atananBirim || undefined,
      oncelik: g.oncelik as SurecGorevKaydi['oncelik'],
      sonTarih: g.sonTarih || undefined,
      tamamlandi: Boolean(g.tamamlandi),
      tamamlanmaTarihi: g.tamamlanmaTarihi || undefined,
      tamamlayanKisi: g.tamamlayanKisi || undefined,
      notlar: g.notlar || undefined,
      createdAt: g.createdAt
    }))

    const belgeRows = this.db.prepare('SELECT * FROM DATA_SurecBelge WHERE surecId = ? ORDER BY createdAt DESC').all(id) as Array<{
      id: string
      surecId: string
      adimId: string | null
      belgeAdi: string
      dosyaYolu: string
      mimeType: string | null
      boyutBayt: number | null
      aciklama: string | null
      yukleyenKisi: string
      createdAt: string
    }>

    const belgeler: SurecBelgeKaydi[] = belgeRows.map((b) => ({
      id: b.id,
      surecId: b.surecId,
      adimId: b.adimId || undefined,
      belgeAdi: b.belgeAdi,
      dosyaYolu: b.dosyaYolu,
      mimeType: b.mimeType || undefined,
      boyutBayt: b.boyutBayt || undefined,
      aciklama: b.aciklama || undefined,
      yukleyenKisi: b.yukleyenKisi,
      createdAt: b.createdAt
    }))

    const tarihceRows = this.db.prepare('SELECT * FROM LOG_SurecTarihce WHERE surecId = ? ORDER BY tarih ASC').all(id) as Array<{
      id: string
      surecId: string
      adimId: string | null
      islem: string
      yapanKisi: string
      tarih: string
      detayJson: string | null
    }>

    const tarihce: SurecTarihceKaydi[] = tarihceRows.map((t) => ({
      id: t.id,
      surecId: t.surecId,
      adimId: t.adimId || undefined,
      islem: t.islem,
      yapanKisi: t.yapanKisi,
      tarih: t.tarih,
      detay: t.detayJson ? JSON.parse(t.detayJson) : undefined
    }))

    return {
      surec,
      adimlar,
      gorevler,
      belgeler,
      tarihce
    }
  }

  /**
   * Yeni bir süreç başlatır.
   * Şablondan başlatılıyorsa şablon adımları klonlanarak DATA_SurecAdim'e yazılır.
   * Şablon sonradan değişse dahi bu örneğin adımları bağımsız kalır.
   */
  public startProcess(params: {
    templateId?: string
    title: string
    category?: string
    description?: string
    initiator: string
    initiatorUnit?: string
    customSteps?: Array<{
      adimKodu: string
      baslik: string
      adimTuru: SurecAdimKaydi['adimTuru']
      sira: number
      sorumluKisi?: string
      sorumluRol?: string
      sorumluBirim?: string
    }>
    initialData?: Record<string, unknown>
  }): SurecDetay {
    const processId = generateUniqueId('prc')
    const now = new Date().toISOString()

    let category = params.category || 'genel'
    let stepsToCreate: Array<{
      adimKodu: string
      baslik: string
      adimTuru: SurecAdimKaydi['adimTuru']
      sira: number
      sorumluKisi?: string
      sorumluRol?: string
      sorumluBirim?: string
    }> = []

    if (params.templateId) {
      const template = this.getTemplateById(params.templateId)
      if (template) {
        category = template.kategori
        stepsToCreate = template.adimlar.map((a) => ({
          adimKodu: a.adimKodu,
          baslik: a.baslik,
          adimTuru: a.adimTuru,
          sira: a.sira,
          sorumluKisi: a.sorumluKisi,
          sorumluRol: a.sorumluRol,
          sorumluBirim: a.sorumluBirim
        }))
      }
    } else if (params.customSteps && params.customSteps.length > 0) {
      stepsToCreate = params.customSteps
    } else {
      // Varsayılan ad-hoc adımlar
      stepsToCreate = [
        { adimKodu: 'ADM-01', baslik: 'Talep / Başlangıç Girişi', adimTuru: 'form', sira: 1, sorumluKisi: params.initiator },
        { adimKodu: 'ADM-02', baslik: 'Yetkili Onayı', adimTuru: 'approval', sira: 2, sorumluRol: 'yonetici' },
        { adimKodu: 'ADM-03', baslik: 'Uygulama ve Sonuçlandırma', adimTuru: 'task', sira: 3, sorumluBirim: 'İlgili Birim' }
      ]
    }

    const firstStepId = generateUniqueId('adm')

    const tx = this.db.transaction(() => {
      // 1. DATA_Surec kaydı
      this.db.prepare(`
        INSERT INTO DATA_Surec (
          id, sablonId, baslik, kategori, aciklama, durum, baslatanKisi, baslatanBirim,
          aktifAdimId, ilerlemeYuzdesi, baslangicTarihi, surecVerisiJson, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, 'aktif', ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(
        processId,
        params.templateId || null,
        params.title,
        category,
        params.description || null,
        params.initiator,
        params.initiatorUnit || null,
        firstStepId,
        now,
        JSON.stringify(params.initialData || {}),
        now,
        now
      )

      // 2. DATA_SurecAdim kayıtları
      const insertStep = this.db.prepare(`
        INSERT INTO DATA_SurecAdim (
          id, surecId, adimKodu, baslik, adimTuru, sira, sorumluKisi, sorumluRol,
          sorumluBirim, durum, formVerisiJson, belgeVerisiJson
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stepsToCreate.forEach((step, idx) => {
        const stepId = idx === 0 ? firstStepId : generateUniqueId('adm')
        const initialStatus = idx === 0 ? 'devam_ediyor' : 'beklemede'
        insertStep.run(
          stepId,
          processId,
          step.adimKodu,
          step.baslik,
          step.adimTuru,
          step.sira || idx + 1,
          step.sorumluKisi || null,
          step.sorumluRol || null,
          step.sorumluBirim || null,
          initialStatus,
          null,
          null
        )
      })

      // 3. LOG_SurecTarihce başlangıç kaydı
      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'surec_baslatildi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        processId,
        firstStepId,
        params.initiator,
        now,
        JSON.stringify({
          baslik: params.title,
          sablonId: params.templateId || 'ozel_surec',
          toplamAdim: stepsToCreate.length
        })
      )
    })

    tx()

    const detail = this.getProcessById(processId)
    if (!detail) throw new Error('Süreç başlatıldıktan sonra okunamadı.')
    return detail
  }

  /**
   * Adım ilerletme (advanceStep)
   * Aktif adımı tamamlar, bir sonraki adıma geçer veya tüm süreci tamamlar.
   */
  public advanceStep(params: {
    processId: string
    stepId: string
    actor: string
    formData?: Record<string, unknown>
    notes?: string
  }): { success: boolean; processCompleted?: boolean; message?: string } {
    const detail = this.getProcessById(params.processId)
    if (!detail) return { success: false, message: 'Süreç bulunamadı.' }
    if (detail.surec.durum !== 'aktif') {
      return { success: false, message: `Süreç aktif durumda değil (Mevcut durum: ${detail.surec.durum})` }
    }

    const currentStepIndex = detail.adimlar.findIndex((a) => a.id === params.stepId)
    if (currentStepIndex === -1) return { success: false, message: 'Adım bulunamadı.' }

    const currentStep = detail.adimlar[currentStepIndex]
    const now = new Date().toISOString()

    // Süreç genel verisine form verilerini birleştir
    const updatedProcessData = {
      ...detail.surec.surecVerisi,
      ...(params.formData || {})
    }

    const nextStep = detail.adimlar[currentStepIndex + 1]
    const isLastStep = !nextStep

    const completedStepCount = detail.adimlar.filter((a) => a.durum === 'tamamlandi').length + 1
    const progressPercent = Math.round((completedStepCount / detail.adimlar.length) * 100)

    const tx = this.db.transaction(() => {
      // 1. Mevcut adımı tamamla
      this.db.prepare(`
        UPDATE DATA_SurecAdim
        SET durum = 'tamamlandi',
            tamamlayanKisi = ?,
            tamamlanmaTarihi = ?,
            formVerisiJson = ?,
            notlar = ?
        WHERE id = ?
      `).run(
        params.actor,
        now,
        params.formData ? JSON.stringify(params.formData) : currentStep.formVerisi ? JSON.stringify(currentStep.formVerisi) : null,
        params.notes || null,
        params.stepId
      )

      if (isLastStep) {
        // Tüm adımlar bitti: Süreci tamamla
        this.db.prepare(`
          UPDATE DATA_Surec
          SET durum = 'tamamlandi',
              aktifAdimId = NULL,
              ilerlemeYuzdesi = 100,
              bitisTarihi = ?,
              surecVerisiJson = ?,
              updatedAt = ?
          WHERE id = ?
        `).run(now, JSON.stringify(updatedProcessData), now, params.processId)

        this.db.prepare(`
          INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
          VALUES (?, ?, ?, 'surec_tamamlandi', ?, ?, ?)
        `).run(
          generateUniqueId('log'),
          params.processId,
          params.stepId,
          params.actor,
          now,
          JSON.stringify({ notlar: params.notes, bitisTarihi: now })
        )
      } else {
        // Sonraki adıma geç
        this.db.prepare(`
          UPDATE DATA_SurecAdim
          SET durum = 'devam_ediyor'
          WHERE id = ?
        `).run(nextStep.id)

        this.db.prepare(`
          UPDATE DATA_Surec
          SET aktifAdimId = ?,
              ilerlemeYuzdesi = ?,
              surecVerisiJson = ?,
              updatedAt = ?
          WHERE id = ?
        `).run(nextStep.id, progressPercent, JSON.stringify(updatedProcessData), now, params.processId)

        this.db.prepare(`
          INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
          VALUES (?, ?, ?, 'adim_tamamlandi', ?, ?, ?)
        `).run(
          generateUniqueId('log'),
          params.processId,
          params.stepId,
          params.actor,
          now,
          JSON.stringify({
            tamamlananAdim: currentStep.baslik,
            sonrakiAdim: nextStep.baslik,
            ilerlemeYuzdesi: progressPercent
          })
        )
      }
    })

    tx()
    return { success: true, processCompleted: isLastStep }
  }

  /**
   * Onay adımında ret kararı verme (rejectStep)
   */
  public rejectStep(params: {
    processId: string
    stepId: string
    actor: string
    reason: string
  }): { success: boolean; message?: string } {
    const detail = this.getProcessById(params.processId)
    if (!detail) return { success: false, message: 'Süreç bulunamadı.' }

    const now = new Date().toISOString()

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE DATA_SurecAdim
        SET durum = 'reddedildi',
            tamamlayanKisi = ?,
            tamamlanmaTarihi = ?,
            notlar = ?
        WHERE id = ?
      `).run(params.actor, now, params.reason, params.stepId)

      this.db.prepare(`
        UPDATE DATA_Surec
        SET durum = 'iptal',
            bitisTarihi = ?,
            updatedAt = ?
        WHERE id = ?
      `).run(now, now, params.processId)

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'adim_reddedildi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        params.processId,
        params.stepId,
        params.actor,
        now,
        JSON.stringify({ gerekce: params.reason })
      )
    })

    tx()
    return { success: true }
  }

  /**
   * Onay adımında iade kararı verme (returnStep)
   * Süreci bir önceki adıma geri gönderir.
   */
  public returnStep(params: {
    processId: string
    stepId: string
    actor: string
    reason: string
  }): { success: boolean; message?: string } {
    const detail = this.getProcessById(params.processId)
    if (!detail) return { success: false, message: 'Süreç bulunamadı.' }

    const currentStepIndex = detail.adimlar.findIndex((a) => a.id === params.stepId)
    if (currentStepIndex <= 0) {
      return { success: false, message: 'İlk adım geriye iade edilemez.' }
    }

    const previousStep = detail.adimlar[currentStepIndex - 1]
    const now = new Date().toISOString()

    const tx = this.db.transaction(() => {
      // Mevcut adımı iade edildi olarak işaretle
      this.db.prepare(`
        UPDATE DATA_SurecAdim
        SET durum = 'iade_edildi',
            tamamlayanKisi = ?,
            tamamlanmaTarihi = ?,
            notlar = ?
        WHERE id = ?
      `).run(params.actor, now, params.reason, params.stepId)

      // Önceki adımı tekrar devam_ediyor durumuna al
      this.db.prepare(`
        UPDATE DATA_SurecAdim
        SET durum = 'devam_ediyor'
        WHERE id = ?
      `).run(previousStep.id)

      this.db.prepare(`
        UPDATE DATA_Surec
        SET aktifAdimId = ?,
            updatedAt = ?
        WHERE id = ?
      `).run(previousStep.id, now, params.processId)

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'adim_iade_edildi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        params.processId,
        params.stepId,
        params.actor,
        now,
        JSON.stringify({ iadeGerekcesi: params.reason, iadeEdilenAdim: previousStep.baslik })
      )
    })

    tx()
    return { success: true }
  }

  /**
   * Süreci iptal etme
   */
  public cancelProcess(processId: string, actor: string, reason: string): boolean {
    const now = new Date().toISOString()
    const tx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE DATA_Surec
        SET durum = 'iptal', bitisTarihi = ?, updatedAt = ?
        WHERE id = ?
      `).run(now, now, processId)

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, 'surec_iptal_edildi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        processId,
        actor,
        now,
        JSON.stringify({ iptalGerekcesi: reason })
      )
    })
    tx()
    return true
  }

  /**
   * Süreci arşivleme
   */
  public archiveProcess(processId: string, actor: string): boolean {
    const now = new Date().toISOString()
    const tx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE DATA_Surec
        SET durum = 'arsivlendi', updatedAt = ?
        WHERE id = ?
      `).run(now, processId)

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, 'surec_arsivlendi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        processId,
        actor,
        now,
        JSON.stringify({ arsivTarihi: now })
      )
    })
    tx()
    return true
  }

  // ==========================================================================
  // GÖREV YÖNETİMİ (DATA_Gorev)
  // ==========================================================================

  public getTasks(filter?: {
    processId?: string
    assignee?: string
    completed?: boolean
  }): SurecGorevKaydi[] {
    let sql = 'SELECT * FROM DATA_Gorev WHERE 1=1'
    const params: unknown[] = []

    if (filter?.processId) {
      sql += ' AND surecId = ?'
      params.push(filter.processId)
    }

    if (filter?.assignee) {
      sql += ' AND atananKisi = ?'
      params.push(filter.assignee)
    }

    if (filter?.completed !== undefined) {
      sql += ' AND tamamlandi = ?'
      params.push(filter.completed ? 1 : 0)
    }

    sql += ' ORDER BY tamamlandi ASC, createdAt DESC'

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: string
      surecId: string
      adimId: string | null
      gorevTanimi: string
      atananKisi: string
      atananBirim: string | null
      oncelik: string
      sonTarih: string | null
      tamamlandi: number
      tamamlanmaTarihi: string | null
      tamamlayanKisi: string | null
      notlar: string | null
      createdAt: string
    }>

    return rows.map((g) => ({
      id: g.id,
      surecId: g.surecId,
      adimId: g.adimId || undefined,
      gorevTanimi: g.gorevTanimi,
      atananKisi: g.atananKisi,
      atananBirim: g.atananBirim || undefined,
      oncelik: g.oncelik as SurecGorevKaydi['oncelik'],
      sonTarih: g.sonTarih || undefined,
      tamamlandi: Boolean(g.tamamlandi),
      tamamlanmaTarihi: g.tamamlanmaTarihi || undefined,
      tamamlayanKisi: g.tamamlayanKisi || undefined,
      notlar: g.notlar || undefined,
      createdAt: g.createdAt
    }))
  }

  public createTask(data: {
    processId: string
    stepId?: string
    taskDescription: string
    assignedTo: string
    assignedUnit?: string
    priority?: SurecGorevKaydi['oncelik']
    dueDate?: string
    actor: string
  }): SurecGorevKaydi {
    const id = generateUniqueId('grv')
    const now = new Date().toISOString()

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO DATA_Gorev (
          id, surecId, adimId, gorevTanimi, atananKisi, atananBirim,
          oncelik, sonTarih, tamamlandi, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        id,
        data.processId,
        data.stepId || null,
        data.taskDescription,
        data.assignedTo,
        data.assignedUnit || null,
        data.priority || 'normal',
        data.dueDate || null,
        now
      )

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'gorev_atandi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        data.processId,
        data.stepId || null,
        data.actor,
        now,
        JSON.stringify({ gorev: data.taskDescription, atananKisi: data.assignedTo })
      )
    })

    tx()

    return {
      id,
      surecId: data.processId,
      adimId: data.stepId,
      gorevTanimi: data.taskDescription,
      atananKisi: data.assignedTo,
      atananBirim: data.assignedUnit,
      oncelik: data.priority || 'normal',
      sonTarih: data.dueDate,
      tamamlandi: false,
      createdAt: now
    }
  }

  public completeTask(taskId: string, actor: string, notes?: string): boolean {
    const now = new Date().toISOString()
    const task = this.db.prepare('SELECT surecId, adimId, gorevTanimi FROM DATA_Gorev WHERE id = ?').get(taskId) as {
      surecId: string
      adimId: string | null
      gorevTanimi: string
    } | undefined

    if (!task) return false

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE DATA_Gorev
        SET tamamlandi = 1,
            tamamlayanKisi = ?,
            tamamlanmaTarihi = ?,
            notlar = ?
        WHERE id = ?
      `).run(actor, now, notes || null, taskId)

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'gorev_tamamlandi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        task.surecId,
        task.adimId,
        actor,
        now,
        JSON.stringify({ gorev: task.gorevTanimi, notlar: notes })
      )
    })

    tx()
    return true
  }

  // ==========================================================================
  // BELGE REFERANSI (DATA_SurecBelge)
  // ==========================================================================

  public addDocument(data: {
    processId: string
    stepId?: string
    fileName: string
    filePath: string
    mimeType?: string
    sizeBytes?: number
    description?: string
    uploader: string
  }): SurecBelgeKaydi {
    const id = generateUniqueId('blg')
    const now = new Date().toISOString()

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO DATA_SurecBelge (
          id, surecId, adimId, belgeAdi, dosyaYolu, mimeType, boyutBayt, aciklama, yukleyenKisi, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.processId,
        data.stepId || null,
        data.fileName,
        data.filePath,
        data.mimeType || null,
        data.sizeBytes || null,
        data.description || null,
        data.uploader,
        now
      )

      this.db.prepare(`
        INSERT INTO LOG_SurecTarihce (id, surecId, adimId, islem, yapanKisi, tarih, detayJson)
        VALUES (?, ?, ?, 'belge_eklendi', ?, ?, ?)
      `).run(
        generateUniqueId('log'),
        data.processId,
        data.stepId || null,
        data.uploader,
        now,
        JSON.stringify({ belgeAdi: data.fileName, dosyaYolu: data.filePath })
      )
    })

    tx()

    return {
      id,
      surecId: data.processId,
      adimId: data.stepId,
      belgeAdi: data.fileName,
      dosyaYolu: data.filePath,
      mimeType: data.mimeType,
      boyutBayt: data.sizeBytes,
      aciklama: data.description,
      yukleyenKisi: data.uploader,
      createdAt: now
    }
  }

  // ==========================================================================
  // İSTATİSTİKLER VE ÖZET
  // ==========================================================================

  public getDashboardStats(): {
    totalProcesses: number
    activeProcesses: number
    completedProcesses: number
    pendingApprovals: number
    openTasks: number
    categories: Array<{ category: string; count: number }>
  } {
    const totalProcesses = (this.db.prepare('SELECT COUNT(*) as c FROM DATA_Surec').get() as { c: number }).c
    const activeProcesses = (this.db.prepare("SELECT COUNT(*) as c FROM DATA_Surec WHERE durum = 'aktif'").get() as { c: number }).c
    const completedProcesses = (this.db.prepare("SELECT COUNT(*) as c FROM DATA_Surec WHERE durum = 'tamamlandi'").get() as { c: number }).c

    const pendingApprovals = (this.db.prepare(`
      SELECT COUNT(*) as c FROM DATA_SurecAdim
      WHERE adimTuru = 'approval' AND durum = 'devam_ediyor'
    `).get() as { c: number }).c

    const openTasks = (this.db.prepare('SELECT COUNT(*) as c FROM DATA_Gorev WHERE tamamlandi = 0').get() as { c: number }).c

    const categoryRows = this.db.prepare(`
      SELECT kategori, COUNT(*) as c FROM DATA_Surec GROUP BY kategori
    `).all() as Array<{ kategori: string; c: number }>

    return {
      totalProcesses,
      activeProcesses,
      completedProcesses,
      pendingApprovals,
      openTasks,
      categories: categoryRows.map((r) => ({ category: r.kategori, count: r.c }))
    }
  }
}
