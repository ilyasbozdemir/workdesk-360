import type { FileRepository, RateProvider } from "../ports";
import type { DeductionLine } from "../../domain/profile/DeductionRule";
import { DeductionCalculator } from "../../domain/services/DeductionCalculator";
import { DomainError } from "@worksuite-360/core";

/**
 * Bir doğrudan temin dosyasında kazanan firmanın teklifi ve ilgili mevzuat oranları üzerinden
 * yasal kesintileri (Karar Pulu, Damga Vergisi vb.) hesaplayan salt sorgu (Query) use-case'i.
 *
 * Durum değiştirmez, veritabanına yazmaz ve etki alanı olayı üretmez.
 */
export class CalculateDeductionsUseCase {
  /**
   * @param repo - Dosya verilerine erişim sağlayan depo.
   * @param rates - Belirtilen yıl için mevzuat kesinti oranlarını getiren sağlayıcı.
   * @param calculator - Kesinti hesaplama etki alanı servisi.
   */
  constructor(
    private readonly repo: FileRepository,
    private readonly rates: RateProvider,
    private readonly calculator: DeductionCalculator =
      new DeductionCalculator(),
  ) {}

  /**
   * Dosyanın yasal kesinti kalemlerini hesaplar.
   * @param c - Dosya ID ve hesaplama baz alınacak tarih (oranların yılı için).
   * @returns Hesaplanan kesinti satırları listesi.
   * @throws {DomainError} Dosya bulunamazsa veya henüz kazanan firma seçilmemişse fırlatılır.
   */
  async execute(c: { fileId: number; date: string }): Promise<DeductionLine[]> {
    const file = await this.repo.findById(c.fileId);
    if (!file) {
      throw new DomainError("FILE_NOT_FOUND", `Dosya bulunamadı: #${c.fileId}`);
    }
    if (file.winnerId === undefined) {
      throw new DomainError(
        "NO_WINNER",
        "Kazanan belirlenmeden kesinti hesaplanamaz.",
      );
    }

    const totals = file.totalsOf(file.winnerId)!;
    return this.calculator.calculate(file.profile, {
      totalKdvHaric: totals.haric,
      totalKdvDahil: totals.dahil,
      rates: await this.rates.ratesFor(c.date),
    });
  }
}
