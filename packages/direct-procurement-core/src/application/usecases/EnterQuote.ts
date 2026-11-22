import { Money } from "@temin360/domain";
import { FileUseCase } from "./FileUseCase";
import type { EventPublisher, FileRepository } from "../ports";

/**
 * Bir isteklinin belirli bir kaleme verdiği birim fiyat teklifini sisteme girme komutu.
 */
export interface EnterQuoteCommand {
  /** Temin dosya ID */
  fileId: number;
  /** Fiyat verilen ihtiyaç kalemi ID */
  itemId: number;
  /** Teklif veren istekli firma ID */
  bidderId: number;
  /** KDV hariç birim fiyat ("1550.00" string biçiminde) */
  unitPriceTL: string;
  /** Teklifin girildiği tarih veya zaman damgası */
  at: string;
}

/**
 * Doğrudan temin dosyasındaki bir kaleme bir istekli tarafından verilen birim fiyatı kaydeden use-case.
 *
 * Fiyat değişikliği yapıldığında `QuoteChanged` etki alanı olayı üretilir ve
 * bağlı olan piyasa fiyat araştırma tutanakları bayatlatılarak yeniden üretime işaretlenir.
 */
export class EnterQuoteUseCase extends FileUseCase<EnterQuoteCommand> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /**
   * Teklif fiyatı giriş komutunu yürütür.
   * @param c - Teklif giriş parametreleri.
   */
  async execute(c: EnterQuoteCommand): Promise<void> {
    const file = await this.load(c.fileId);
    file.enterQuote(c.itemId, c.bidderId, Money.fromTL(c.unitPriceTL), c.at);
    await this.commit(file);
  }
}
