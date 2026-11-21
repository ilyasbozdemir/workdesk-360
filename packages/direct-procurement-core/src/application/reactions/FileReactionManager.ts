import {
  AcceptanceApproved,
  QuoteChanged,
  ResultApproved,
  WinnerSelected,
} from "../../domain/file/events";

import type { InProcessEventBus } from "../events/InProcessEventBus";
import { AuditLogPort, DocumentStatusPort, StageProgressPort } from "../ports";

/**
 * Teklif fiyatları değiştiğinde bayatlatılması gereken varsayılan araştırma belgesi şablon kodları.
 */
export const DEFAULT_RESEARCH_DOCUMENTS = [
  "piyasa-fiyat-arastirma-tutanagi",
  "yaklasik-maliyet-cetveli",
] as const;

/**
 * Doğrudan temin etki alanı olaylarına karşı tetiklenen sistem yan etkilerinin tek merkezi yöneticisi.
 *
 * "Dosyada bir değişiklik olduğunda dış sistemlerde ne yapılmalı?" kuralının yanıtıdır.
 * Aggregate ve use-case'ler bu yan etkileri doğrudan bilmez; olaylar üzerinden iletişim sağlanır:
 * - `QuoteChanged`: İlgili araştırma belgelerini "yeniden üretilmeli / beklemede" statüsüne alır.
 * - `WinnerSelected`: Kazanan firma belirlendiğinde denetim günlüğü (audit log) yazar.
 * - `ResultApproved`: Dosya aşamasını `yuklenici` (aşama 3) yapar ve denetim kaydı düşer.
 * - `AcceptanceApproved`: Dosya aşamasını `kabul` (aşama 4) yapar ve denetim kaydı düşer.
 */
export class FileReactionManager {
  /**
   * @param documents - Belge bayatlatma ve durum güncelleme portu.
   * @param stages - Dosya aşama ilerletme portu.
   * @param audit - Sistem denetim günlüğü kayıt portu.
   * @param researchDocs - Teklif değiştiğinde bayatlatılacak şablon kodları listesi.
   */
  constructor(
    private readonly documents: DocumentStatusPort,
    private readonly stages: StageProgressPort,
    private readonly audit: AuditLogPort,
    private readonly researchDocs: readonly string[] =
      DEFAULT_RESEARCH_DOCUMENTS,
  ) {}

  /**
   * Olay dinleyicilerini (handlers) süreç içi olay veriyoluna (event bus) kaydeder.
   * @param bus - Dinleyicilerin bağlanacağı InProcessEventBus örneği.
   */
  register(bus: InProcessEventBus): void {
    bus
      .on(
        QuoteChanged,
        "belgeleri-bayatla",
        (e) =>
          this.documents.markNeedsRegeneration(
            e.dosyaId,
            this.researchDocs,
            "Teklif fiyatı değişti, belgeyi yeniden üretin.",
          ),
      )
      .on(
        WinnerSelected,
        "kazanan-kaydi",
        (e) =>
          this.audit.write({
            title: `Dosya #${e.dosyaId}`,
            message: `Kazanan firma belirlendi (firma satırı ${e.bidderId}).`,
            level: "info",
          }),
      )
      .on(ResultApproved, "sonuc-onayi", async (e) => {
        await this.stages.advanceTo(e.dosyaId, "yuklenici");
        await this.audit.write({
          title: `Dosya #${e.dosyaId}`,
          message: "Sonuç onaylandı, dosya kilitlendi.",
          level: "success",
        });
      })
      .on(AcceptanceApproved, "kabul-onayi", async (e) => {
        await this.stages.advanceTo(e.dosyaId, "kabul");
        await this.audit.write({
          title: `Dosya #${e.dosyaId}`,
          message: `Kabul tutanağı #${e.seqNo} onaylandı.`,
          level: "success",
        });
      });
  }
}
