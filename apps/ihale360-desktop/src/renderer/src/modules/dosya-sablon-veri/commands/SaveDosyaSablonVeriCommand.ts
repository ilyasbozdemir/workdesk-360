import { BaseCommand } from '../../../core/mediator/types'
import { SaveDosyaSablonVeriResultDto } from '../dtos/DosyaSablonVeriDto'

/**
 * Belirli bir temin dosyası ve şablon kodu için şablon veri json'ını kaydeden / güncelleyen Command
 */
export class SaveDosyaSablonVeriCommand extends BaseCommand<SaveDosyaSablonVeriResultDto> {
  constructor(
    public readonly dosyaId: number,
    public readonly sablonKodu: string,
    public readonly veriJson: string
  ) {
    super()
  }
}
