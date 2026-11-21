import { Bidder } from "../../domain/file/Bidder";
import { DirectProcurementFile } from "../../domain/file/DirectProcurementFile";
import { NeedItem } from "../../domain/file/NeedItem";
import type { EventPublisher, FileRepository } from "../../domain/ports";
import { FileUseCase } from "./FileUseCase";

export interface OpenFileCommand {
  id: number;
  subject: string;
  date: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    kdvPercent: number;
  }[];
  bidders: { id: number; title: string; taxNo?: string }[];
}

export class OpenFileUseCase extends FileUseCase<OpenFileCommand> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  async execute(c: OpenFileCommand): Promise<void> {
    const file = DirectProcurementFile.open(c.id, c.subject, c.date);
    c.items.forEach((i) =>
      file.addNeedItem(
        new NeedItem(i.id, i.name, i.quantity, i.unit, i.kdvPercent),
      )
    );
    c.bidders.forEach((b) =>
      file.addBidder(new Bidder(b.id, b.title, b.taxNo))
    );
    await this.commit(file);
  }
}
