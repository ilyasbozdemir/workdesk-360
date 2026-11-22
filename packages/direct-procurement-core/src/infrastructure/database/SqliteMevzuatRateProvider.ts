import type { RateProvider, SqlExecutor } from "../../application/ports";
import type { RateSnapshot } from "../../domain/profile/DeductionRule";

/**
 * Yasal kesinti oranlarını (Karar Pulu ve Damga Vergisi) veritabanındaki `TANIM_Mevzuat`
 * tablosundan ilgili yıla göre dinamik olarak sorgulayan sağlayıcı adaptör.
 *
 * @remarks
 * Temiz kod ve mevzuat uyumu gereği oranlar kod içinde sabitlenmez (hardcode edilmez);
 * her yıl değişen KİK mevzuat oranları veritabanı tablosundan okunur.
 */
export class SqliteMevzuatRateProvider implements RateProvider {
  /**
   * @param db - SQL sorgu yürütücü adaptörü.
   */
  constructor(private readonly db: SqlExecutor) {}

  /**
   * Belirtilen ISO tarihinin yılına karşılık gelen mevzuat oranlarını getirir.
   * @param isoDate - Tarih string'i (YYYY-AA-GG biçiminde).
   * @returns Karar pulu ve damga vergisi binde oranlarını içeren anlık görüntü.
   * @throws {Error} Belirtilen yıl için `TANIM_Mevzuat` tablosunda kayıt bulunamazsa fırlatılır.
   */
  async ratesFor(isoDate: string): Promise<RateSnapshot> {
    const year = Number(isoDate.slice(0, 4));
    const [row] = await this.db.query<
      { karar_pulu_orani: number; damga_vergisi_orani: number }
    >(
      "SELECT karar_pulu_orani, damga_vergisi_orani FROM TANIM_Mevzuat WHERE yil = ?",
      [year],
    );
    if (!row) {
      throw new Error(
        `TANIM_Mevzuat içinde ${year} yılı için oran tanımı yok.`,
      );
    }
    return {
      kararPuluBinde: row.karar_pulu_orani,
      damgaVergisiBinde: row.damga_vergisi_orani,
    };
  }
}
