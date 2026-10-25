import { mediator } from '../../core/mediator'
import { GetDosyaSablonVeriQuery } from './queries/GetDosyaSablonVeriQuery'
import { GetDosyaSablonVeriQueryHandler } from './queries/GetDosyaSablonVeriQueryHandler'
import { SaveDosyaSablonVeriCommand } from './commands/SaveDosyaSablonVeriCommand'
import { SaveDosyaSablonVeriCommandHandler } from './commands/SaveDosyaSablonVeriCommandHandler'
import { DosyaSablonVeriDto } from './dtos/DosyaSablonVeriDto'

// Mediator Handler Kayıtları (Self-Registering)
mediator.register(GetDosyaSablonVeriQuery, new GetDosyaSablonVeriQueryHandler())
mediator.register(SaveDosyaSablonVeriCommand, new SaveDosyaSablonVeriCommandHandler())

/**
 * Dosya Şablon Veri Servisi (Application Service Facade)
 * TSX bileşenleri doğrudan SQL yazmak yerine bu servisi veya mediator.send() metodunu kullanır.
 */
export const dosyaSablonVeriService = {
  /**
   * Şablon verisini Query aracılığıyla getirir
   */
  async getVeri(dosyaId: number, sablonKodu: string): Promise<DosyaSablonVeriDto | null> {
    return await mediator.send(new GetDosyaSablonVeriQuery(dosyaId, sablonKodu))
  },

  /**
   * Şablon verisini Command aracılığıyla kaydeder / günceller
   */
  async saveVeri(dosyaId: number, sablonKodu: string, veriJson: string): Promise<boolean> {
    const res = await mediator.send(new SaveDosyaSablonVeriCommand(dosyaId, sablonKodu, veriJson))
    return res.success
  }
}
