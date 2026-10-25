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
      `INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, sablon_kodu, veri_json, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(temin_dosya_id, sablon_kodu)
       DO UPDATE SET veri_json = excluded.veri_json, updated_at = CURRENT_TIMESTAMP`,
      [command.dosyaId, command.sablonKodu, command.veriJson]
    )

    return {
      success: true,
      temin_dosya_id: command.dosyaId,
      sablon_kodu: command.sablonKodu
    }
  }
}
