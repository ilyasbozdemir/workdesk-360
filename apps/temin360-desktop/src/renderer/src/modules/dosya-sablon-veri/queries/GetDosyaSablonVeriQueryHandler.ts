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
      `SELECT id, dosya_id, dosya_id AS temin_dosya_id, sablon_kodu, veri_json, updated_at 
       FROM DATA_TeminBelgeSnapshot 
       WHERE dosya_id = ? AND sablon_kodu = ? AND is_deleted = 0
       LIMIT 1`,
      [query.dosyaId, query.sablonKodu]
    )
    return row
  }
}
