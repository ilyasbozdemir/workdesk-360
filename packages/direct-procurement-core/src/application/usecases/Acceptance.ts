import { AcceptanceLine } from "../../domain/file/AcceptanceRecord";
import { EventPublisher, FileRepository } from "../ports";
import { FileUseCase } from "./FileUseCase";

/**
 * Bir doğrudan temin dosyasında yeni bir fiziki/hizmet muayene ve kabul tutanağı oluşturan use-case.
 *
 * Mal alımlarında teslim tesellüm ve muayene kabul doğrulaması yapılarak
 * teslim edilen kalem miktarları kaydedilir. Tutanak başlangıçta taslak (`draft`) statüsünde oluşur.
 */
export class RecordAcceptanceUseCase extends FileUseCase<
  { fileId: number; date: string; lines: AcceptanceLine[] },
  number
> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /**
   * Muayene kabul kaydı oluşturur.
   * @param c - Dosya ID, tutanak tarihi ve kabul edilen kalem miktarları.
   * @returns Oluşturulan kabul tutanağının sıra numarası (`seqNo`).
   */
  async execute(
    c: { fileId: number; date: string; lines: AcceptanceLine[] },
  ): Promise<number> {
    const file = await this.load(c.fileId);
    const rec = file.recordAcceptance(c.lines, c.date);
    await this.commit(file);
    return rec.seqNo;
  }
}

/**
 * Taslak halindeki bir muayene kabul tutanağını onaylayan use-case.
 *
 * Tutanak onaylandığında durum `approved` yapılır ve `AcceptanceApproved` etki alanı olayı yayınlanır.
 * Bu olay sayesinde dosya `kabul` aşamasına ilerletilir ve denetim günlüğü düşülür.
 */
export class ApproveAcceptanceUseCase
  extends FileUseCase<{ fileId: number; seqNo: number; at: string }> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /**
   * Muayene kabul tutanağını onaylar.
   * @param c - Dosya ID, onaylanacak tutanak sıra no ve onay zamanı.
   */
  async execute(
    c: { fileId: number; seqNo: number; at: string },
  ): Promise<void> {
    const file = await this.load(c.fileId);
    file.approveAcceptance(c.seqNo, c.at);
    await this.commit(file);
  }
}
