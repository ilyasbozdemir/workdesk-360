import { dbClient } from './db/dbClient'

export interface KurumInfo {
  kurum_adi?: string
  kurum_anteti?: string[]
  makam_adi?: string
  harcama_birim_adi?: string
  il?: string
  ilce?: string
}

export const kurumService = {
  /**
   * TANIM_Kurum tablosundan kurum bilgilerini ve ayrıştırılmış antet satırlarını çeker.
   */
  async getKurumInfo(): Promise<KurumInfo | null> {
    try {
      const row = await dbClient.queryFirst<{
        kurum_adi?: string | null
        kurum_anteti?: string | null
        makam_adi?: string | null
        harcama_birim_adi?: string | null
        il?: string | null
        ilce?: string | null
      }>(
        'SELECT kurum_adi, kurum_anteti, makam_adi, harcama_birim_adi, il, ilce FROM TANIM_Kurum LIMIT 1'
      )

      if (!row) return null

      let antetSatirlari: string[] | undefined
      if (row.kurum_anteti) {
        try {
          const raw = row.kurum_anteti.trim()
          if (raw.startsWith('[') && raw.endsWith(']')) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              antetSatirlari = parsed.map((s) => String(s).trim()).filter(Boolean)
            }
          } else {
            antetSatirlari = raw
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          }
        } catch {
          antetSatirlari = [row.kurum_anteti.trim()]
        }
      }

      return {
        kurum_adi: row.kurum_adi || undefined,
        kurum_anteti: antetSatirlari && antetSatirlari.length > 0 ? antetSatirlari : undefined,
        makam_adi: row.makam_adi || undefined,
        harcama_birim_adi: row.harcama_birim_adi || undefined,
        il: row.il || undefined,
        ilce: row.ilce || undefined
      }
    } catch (err) {
      console.error('[kurumService] getKurumInfo error:', err)
      return null
    }
  }
}
