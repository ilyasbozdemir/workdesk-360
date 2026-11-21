import { Money } from "@temin360/domain";
import { FileUseCase } from "./FileUseCase";
import type { EventPublisher, FileRepository } from "../../domain/ports";

export interface EnterQuoteCommand {
  fileId: number;
  itemId: number;
  bidderId: number;
  /** KDV hariç birim fiyat, "1550.00" biçiminde */
  unitPriceTL: string;
  at: string;
}

export class EnterQuoteUseCase extends FileUseCase<EnterQuoteCommand> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  async execute(c: EnterQuoteCommand): Promise<void> {
    const file = await this.load(c.fileId);
    file.enterQuote(c.itemId, c.bidderId, Money.fromTL(c.unitPriceTL), c.at);
    await this.commit(file);
  }
}
