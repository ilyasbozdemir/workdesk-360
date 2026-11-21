import {
  AcceptanceApproved,
  QuoteChanged,
  ResultApproved,
  WinnerSelected,
} from "../../domain/file/events";

import type { InProcessEventBus } from "../events/InProcessEventBus";
import { AuditLogPort, DocumentStatusPort, StageProgressPort } from "../ports";

/** Teklif değişince bayatlayan belgeler (şablon kodları). Profile göre değiştirilebilir. */
export const DEFAULT_RESEARCH_DOCUMENTS = [
  "piyasa-fiyat-arastirma-tutanagi",
  "yaklasik-maliyet-cetveli",
] as const;

/**
 * "Dosyada şu olunca neler olur?" sorusunun TEK cevabı.
 * Tüm yan etkiler burada toplanır; aggregate ve use-case'ler bunları bilmez.
 *
 *  QuoteChanged       -> araştırma belgeleri "yeniden üretilmeli" olur
 *  WinnerSelected     -> denetim kaydı
 *  ResultApproved     -> aşama 3'e ilerler + denetim kaydı
 *  AcceptanceApproved -> aşama 4'e ilerler + denetim kaydı (stok düşümü mevcut akışta, burada YOK)
 */
export class FileReactionManager {
  constructor(
    private readonly documents: DocumentStatusPort,
    private readonly stages: StageProgressPort,
    private readonly audit: AuditLogPort,
    private readonly researchDocs: readonly string[] =
      DEFAULT_RESEARCH_DOCUMENTS,
  ) {}

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
