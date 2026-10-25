import { BaseQuery } from '../../../core/mediator/types'
import { DosyaSablonVeriDto } from '../dtos/DosyaSablonVeriDto'

/**
 * Belirli bir temin dosyası ve şablon kodu için şablon verisini getiren Query
 */
export class GetDosyaSablonVeriQuery extends BaseQuery<DosyaSablonVeriDto | null> {
  constructor(
    public readonly dosyaId: number,
    public readonly sablonKodu: string
  ) {
    super()
  }
}
