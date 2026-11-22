import { FileUseCase } from "./FileUseCase";
import type { EventPublisher, FileRepository } from "../ports";

/**
 * Kazananı belirlenmiş bir doğrudan temin dosyasının sonuç onayını (olur / karar onayı) gerçekleştiren use-case.
 *
 * Bu işlem yapıldığında dosya `yuklenici` aşamasına ilerletilir, teklif matrisi kilitlenir
 * ve `ResultApproved` olayı tetiklenerek aşama ilerlemesi ile denetim günlüğü yazımı tetiklenir.
 */
export class ApproveResultUseCase
  extends FileUseCase<{ fileId: number; at: string }> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /**
   * Sonuç onayını yürütür.
   * @param c - Onaylanacak dosya ID ve onay tarihi.
   */
  async execute(c: { fileId: number; at: string }): Promise<void> {
    const file = await this.load(c.fileId);
    file.approveResult(c.at);
    await this.commit(file);
  }
}
