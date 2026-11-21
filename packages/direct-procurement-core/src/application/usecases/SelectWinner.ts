import { FileUseCase } from "./FileUseCase";
import type { EventPublisher, FileRepository } from "../ports";
import {
  LowestTotalStrategy,
  type WinnerResult,
  type WinnerSelectionStrategy,
} from "../../domain/winner/WinnerSelectionStrategy";

/**
 * Teklif matrisi tamamlanan bir doğrudan temin dosyasında kazanan istekliyi belirleyen use-case.
 *
 * Seçim kuralı olarak varsayılan `LowestTotalStrategy` (en düşük toplam teklif) kullanılır.
 * Kazanan belirlendiğinde `WinnerSelected` etki alanı olayı tetiklenir ve denetim günlüğüne işlenir.
 */
export class SelectWinnerUseCase
  extends FileUseCase<{ fileId: number; at: string }, WinnerResult> {
  /**
   * @param repo - Dosya depo adaptörü.
   * @param events - Etki alanı olay yayıncısı.
   * @param strategy - Kazananı belirleme algoritması (varsayılan: en düşük toplam teklif).
   */
  constructor(
    repo: FileRepository,
    events: EventPublisher,
    private readonly strategy: WinnerSelectionStrategy =
      new LowestTotalStrategy(),
  ) {
    super(repo, events);
  }

  /**
   * Kazananı seçer, dosya durumunu günceller ve olayları yayınlar.
   * @param c - Dosya ID ve işlem tarihi.
   * @returns Seçilen kazanan isteklinin ID ve toplam tutar bilgisi.
   */
  async execute(c: { fileId: number; at: string }): Promise<WinnerResult> {
    const file = await this.load(c.fileId);
    const result = file.selectWinner(this.strategy, c.at);
    await this.commit(file);
    return result;
  }
}
