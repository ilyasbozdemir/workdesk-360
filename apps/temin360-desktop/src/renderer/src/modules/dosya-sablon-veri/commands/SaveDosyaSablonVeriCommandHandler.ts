import { IRequestHandler } from '../../../core/mediator/types'
import { SaveDosyaSablonVeriCommand } from './SaveDosyaSablonVeriCommand'
import { SaveDosyaSablonVeriResultDto } from '../dtos/DosyaSablonVeriDto'
import { dbClient } from '../../../services/db/dbClient'

export class SaveDosyaSablonVeriCommandHandler implements IRequestHandler<
  SaveDosyaSablonVeriCommand,
  SaveDosyaSablonVeriResultDto
> {
  async handle(command: SaveDosyaSablonVeriCommand): Promise<SaveDosyaSablonVeriResultDto> {
    await dbClient.run(
      `INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json, is_active, is_deleted, updated_at)
       VALUES (?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
       ON CONFLICT(dosya_id, sablon_kodu)
       DO UPDATE SET veri_json = excluded.veri_json, is_active = 1, is_deleted = 0, updated_at = CURRENT_TIMESTAMP`,
      [command.dosyaId, command.sablonKodu, command.veriJson]
    )

    return {
      success: true,
      dosya_id: command.dosyaId,
      temin_dosya_id: command.dosyaId,
      sablon_kodu: command.sablonKodu
    }
  }
}
