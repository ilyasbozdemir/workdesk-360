import type { RateProvider, SqlExecutor } from '../application/ports'
import type { RateSnapshot } from '../domain/profile/DeductionRule'

/** Oranları TANIM_Mevzuat tablosundan (yıla göre) okur. Kodda sabit oran tutulmaz. */
export class SqliteMevzuatRateProvider implements RateProvider {
  constructor(private readonly db: SqlExecutor) {}

  async ratesFor(isoDate: string): Promise<RateSnapshot> {
    const year = Number(isoDate.slice(0, 4))
    const [row] = await this.db.query<{ karar_pulu_orani: number; damga_vergisi_orani: number }>(
      'SELECT karar_pulu_orani, damga_vergisi_orani FROM TANIM_Mevzuat WHERE yil = ?', [year])
    if (!row) throw new Error(`TANIM_Mevzuat içinde ${year} yılı için oran tanımı yok.`)
    return { kararPuluBinde: row.karar_pulu_orani, damgaVergisiBinde: row.damga_vergisi_orani }
  }
}
