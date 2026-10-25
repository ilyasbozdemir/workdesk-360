/* eslint-disable @typescript-eslint/no-explicit-any */
import type { YerTutucuTanimi } from '../core/types'

export interface KutuphaneGrup {
  id: number
  parent_id: number | null
  ad: string
  renk: string
  ikon: string
  sira: number
  created_at: string
}

export interface KutuphaneBelge {
  id: number
  grup_id: number | null
  ad: string
  etiketler: string // JSON array
  aktif_surum_id: number | null
  arsiv_mi: number
  favori_mi: number
  silindi_at: string | null
  created_at: string
  // Join alanları
  aktif_surum_no?: number
  aktif_surum_etiket?: string
  aktif_icerik_html?: string
  son_guncelleme_at?: string
}

export interface KutuphaneBelgeSurum {
  id: number
  belge_id: number
  surum_no: number
  etiket: string
  not: string
  icerik_html: string
  kosullar_json: string
  created_at: string
}

export interface KutuphaneYerTutucuRow {
  id: number
  kapsam: 'genel' | 'grup' | 'belge'
  kapsam_id: number | null
  anahtar: string
  etiket: string
  tip: string
  varsayilan: string | null
  secenekler_json: string | null
  kaynak: string
  sira: number
  created_at: string
}

// JSON Paket Formatı (Dışa/İçe aktarma)
export interface BelgePaketi {
  version: '1.0'
  checksum: string
  exportedAt: string
  belge: {
    ad: string
    etiketler: string[]
  }
  surumler: Array<{
    surum_no: number
    etiket: string
    not: string
    icerik_html: string
    kosullar_json: string
  }>
  yerTutucular: Array<Partial<YerTutucuTanimi>>
}

function getIpc() {
  if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
    return (window as any).electron.ipcRenderer
  }
  throw new Error('Electron IPC bulunamadı')
}

// Basit FNV-1a checksum fonksiyonu (yeni bağımlılık gerektirmeden paket bütünlüğü doğrulaması)
export function calculateChecksum(content: string): string {
  let hash = 2166136261
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

export const kutuphaneService = {
  // Gruplar
  async listGruplar(): Promise<KutuphaneGrup[]> {
    const res = await getIpc().invoke('kutuphane:grup:list')
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async saveGrup(grup: Partial<KutuphaneGrup>): Promise<number> {
    const res = await getIpc().invoke('kutuphane:grup:save', grup)
    if (!res.success) throw new Error(res.error)
    return res.id
  },

  async deleteGrup(id: number): Promise<void> {
    const res = await getIpc().invoke('kutuphane:grup:delete', id)
    if (!res.success) throw new Error(res.error)
  },

  // Belgeler
  async listBelgeler(
    filters: {
      grup_id?: number | null
      cop_kutusu?: boolean
      arsiv_mi?: boolean
      favori_mi?: boolean
      q?: string
    } = {}
  ): Promise<KutuphaneBelge[]> {
    const res = await getIpc().invoke('kutuphane:belge:list', filters)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async getBelge(id: number): Promise<{ belge: KutuphaneBelge; surumler: KutuphaneBelgeSurum[] }> {
    const res = await getIpc().invoke('kutuphane:belge:get', id)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async createBelge(payload: {
    grup_id?: number | null
    ad: string
    etiketler?: string[]
    icerik_html?: string
    kosullar_json?: string
  }): Promise<{ belgeId: number; surumId: number }> {
    const res = await getIpc().invoke('kutuphane:belge:create', payload)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async saveRevision(payload: {
    belge_id: number
    etiket?: string
    not?: string
    icerik_html: string
    kosullar_json?: string
  }): Promise<{ belgeId: number; surumId: number; surumNo: number }> {
    const res = await getIpc().invoke('kutuphane:belge:saveRevision', payload)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async updateMeta(payload: {
    id: number
    ad?: string
    grup_id?: number | null
    etiketler?: string[] | string
    arsiv_mi?: boolean
    favori_mi?: boolean
    aktif_surum_id?: number
  }): Promise<void> {
    const res = await getIpc().invoke('kutuphane:belge:updateMeta', payload)
    if (!res.success) throw new Error(res.error)
  },

  // Çöp Kutusu
  async trashBelge(id: number): Promise<void> {
    const res = await getIpc().invoke('kutuphane:belge:trash', id)
    if (!res.success) throw new Error(res.error)
  },

  async restoreBelge(id: number): Promise<void> {
    const res = await getIpc().invoke('kutuphane:belge:restore', id)
    if (!res.success) throw new Error(res.error)
  },

  async permanentDeleteBelge(id: number): Promise<void> {
    const res = await getIpc().invoke('kutuphane:belge:permanentDelete', id)
    if (!res.success) throw new Error(res.error)
  },

  async purgeExpired(): Promise<number> {
    const res = await getIpc().invoke('kutuphane:belge:purgeExpired')
    if (!res.success) throw new Error(res.error)
    return res.count
  },

  // Yer Tutucular
  async listYerTutucular(
    filters: {
      kapsam?: 'genel' | 'grup' | 'belge'
      kapsam_id?: number | null
    } = {}
  ): Promise<KutuphaneYerTutucuRow[]> {
    const res = await getIpc().invoke('kutuphane:yertutucu:list', filters)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async saveYerTutucu(payload: Partial<KutuphaneYerTutucuRow>): Promise<number> {
    const res = await getIpc().invoke('kutuphane:yertutucu:save', payload)
    if (!res.success) throw new Error(res.error)
    return res.id
  },

  async deleteYerTutucu(id: number): Promise<void> {
    const res = await getIpc().invoke('kutuphane:yertutucu:delete', id)
    if (!res.success) throw new Error(res.error)
  },

  async findYerTutucuUsages(
    anahtar: string
  ): Promise<Array<{ id: number; ad: string; surum_no: number }>> {
    const res = await getIpc().invoke('kutuphane:yertutucu:findUsages', anahtar)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async renameYerTutucuKey(payload: {
    yerTutucuId?: number
    eskiAnahtar: string
    yeniAnahtar: string
    belgeIds: number[]
  }): Promise<void> {
    const res = await getIpc().invoke('kutuphane:yertutucu:renameKey', payload)
    if (!res.success) throw new Error(res.error)
  },

  // Paket Dışa Aktarma
  exportBelgePaketi(
    belge: KutuphaneBelge,
    surumler: KutuphaneBelgeSurum[],
    yerTutucular: Partial<YerTutucuTanimi>[]
  ): BelgePaketi {
    const rawData = {
      version: '1.0' as const,
      exportedAt: new Date().toISOString(),
      belge: {
        ad: belge.ad,
        etiketler:
          typeof belge.etiketler === 'string'
            ? JSON.parse(belge.etiketler || '[]')
            : belge.etiketler
      },
      surumler: surumler.map((s) => ({
        surum_no: s.surum_no,
        etiket: s.etiket,
        not: s.not,
        icerik_html: s.icerik_html,
        kosullar_json: s.kosullar_json
      })),
      yerTutucular
    }

    const payloadString = JSON.stringify(rawData)
    const checksum = calculateChecksum(payloadString)

    return {
      ...rawData,
      checksum
    }
  },

  // Paket İçe Aktarma Doğrulama
  validateImportPaketi(paket: any): { valid: boolean; error?: string } {
    if (!paket || typeof paket !== 'object') {
      return { valid: false, error: 'Geçersiz JSON paketi' }
    }
    if (paket.version !== '1.0') {
      return { valid: false, error: `Uyumsuz paket sürümü: ${paket.version}` }
    }
    if (!paket.checksum || !paket.belge?.ad || !Array.isArray(paket.surumler)) {
      return { valid: false, error: 'Paket yapısı eksik veya bozuk' }
    }

    // Checksum kontrolü
    const rawForCheck = {
      version: paket.version,
      exportedAt: paket.exportedAt,
      belge: paket.belge,
      surumler: paket.surumler,
      yerTutucular: paket.yerTutucular || []
    }
    const expectedChecksum = calculateChecksum(JSON.stringify(rawForCheck))
    if (expectedChecksum !== paket.checksum) {
      return {
        valid: false,
        error: 'Paket bütünlük doğrulaması (checksum) başarısız! Dosya değiştirilmiş olabilir.'
      }
    }

    return { valid: true }
  },

  // Faz 5: Dosya Entegrasyonu & Şablona Yayınlama
  async dosyayaBagla(payload: {
    dosyaId: number
    belgeId: number
    surumNo: number
    baslik?: string
    dondurulmusHtml: string
    doldurulanDegerler?: Record<string, any>
    olusturan?: string
  }): Promise<number> {
    const res = await getIpc().invoke('kutuphane:dosyaya-bagla', payload)
    if (!res.success) throw new Error(res.error)
    return res.revizyonId
  },

  async listDosyaEkBelgeleri(dosyaId: number): Promise<any[]> {
    const res = await getIpc().invoke('kutuphane:dosya-ek-belgeleri:list', dosyaId)
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async sablonaYayinla(payload: {
    belgeId: number
    surumNo: number
    ad: string
    compileEdilmisMustacheHtml: string
    kategori?: string
  }): Promise<number> {
    const res = await getIpc().invoke('kutuphane:sablona-yayinla', payload)
    if (!res.success) throw new Error(res.error)
    return res.sablonId
  }
}
