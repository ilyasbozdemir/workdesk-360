import { IRequestHandler } from '../../../core/mediator/types'
import { GetDosyaSablonVeriQuery } from './GetDosyaSablonVeriQuery'
import { DosyaSablonVeriDto } from '../dtos/DosyaSablonVeriDto'
import { dbClient } from '../../../services/db/dbClient'

export class GetDosyaSablonVeriQueryHandler implements IRequestHandler<
  GetDosyaSablonVeriQuery,
  DosyaSablonVeriDto | null
> {
  async handle(query: GetDosyaSablonVeriQuery): Promise<DosyaSablonVeriDto | null> {
    const row = await dbClient.queryFirst<DosyaSablonVeriDto>(
      `SELECT id, temin_dosya_id, sablon_kodu, veri_json, updated_at 
       FROM DATA_DosyaSablonVeri 
       WHERE temin_dosya_id = ? AND sablon_kodu = ? 
       LIMIT 1`,
      [query.dosyaId, query.sablonKodu]
    )
    return row
  }
}
