import { Bidder } from "../../domain/file/Bidder";
import { DirectProcurementFile } from "../../domain/file/DirectProcurementFile";
import { NeedItem } from "../../domain/file/NeedItem";
import type { EventPublisher, FileRepository } from "../ports";
import { FileUseCase } from "./FileUseCase";

/**
 * Yeni bir doğrudan temin dosyası açma komutunun parametreleri.
 */
export interface OpenFileCommand {
  /** Dosya benzersiz kimliği (ID) */
  id: number;
  /** Temin konusu veya işin adı */
  subject: string;
  /** Dosya açılış tarihi (YYYY-AA-GG) */
  date: string;
  /** İhtiyaç duyulan mal/hizmet/yapım kalemleri */
  items: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    kdvPercent: number;
  }[];
  /** Teklife davet edilen veya teklif veren istekli firmalar */
  bidders: { id: number; title: string; taxNo?: string }[];
}

/**
 * Yeni bir doğrudan temin dosyasını etki alanı modelinde oluşturan use-case.
 *
 * Kalemleri ve istekli firmaları ekleyerek aggregate'i `hazirlik` aşamasında başlatır
 * ve depoya kaydeder.
 */
export class OpenFileUseCase extends FileUseCase<OpenFileCommand> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /**
   * Dosya açma komutunu yürütür.
   * @param c - Dosya açılış bilgileri, kalemler ve istekliler.
   */
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
