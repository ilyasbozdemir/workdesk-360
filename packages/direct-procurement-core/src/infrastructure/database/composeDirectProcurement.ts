import { ApproveResultUseCase } from "../../application/usecases/ApproveResult";
import {
  ApproveAcceptanceUseCase,
  RecordAcceptanceUseCase,
} from "../../application/usecases/Acceptance";
import { CalculateDeductionsUseCase } from "../../application/usecases/CalculateDeductions";
import { EnterQuoteUseCase } from "../../application/usecases/EnterQuote";
import { SelectWinnerUseCase } from "../../application/usecases/SelectWinner";
import { InProcessEventBus } from "../../application/events/InProcessEventBus";
import { FileReactionManager } from "../../application/reactions/FileReactionManager";
import type { SqlExecutor } from "../../application/ports";
import {
  SqliteAuditLog,
  SqliteDocumentStatus,
  SqliteStageProgress,
} from "./SqliteReactionAdapters";
import { SqliteFileRepository } from "./SqliteFileRepository";
import { SqliteMevzuatRateProvider } from "./SqliteMevzuatRateProvider";

/**
 * Doğrudan temin çekirdek motorunun kompozisyon kökü (Composition Root).
 *
 * Temiz mimarinin (Clean / Onion Architecture) en dış katmanıdır.
 * Verilen `SqlExecutor` adaptörüne göre (Electron Main için `BetterSqliteExecutor` / `MainSqlExecutor`,
 * Renderer süreci için `IpcSqlExecutor`) tüm depo, olay yolu, reaksiyon yöneticisi ve
 * use-case bileşenlerini birbirine bağlar ve kullanıma hazır bir nesne olarak döner.
 *
 * @param db - SQL sorgularını yürütecek veritabanı yürütücüsü.
 * @returns Depo, olay veriyolu ve tüm kullanım senaryolarını (use-cases) içeren çekirdek motor paketi.
 *
 * @example
 * ```ts
 * // Electron Main sürecinde:
 * const core = composeDirectProcurement(mainSqlExecutor);
 * await core.enterQuote.execute({ fileId: 275, itemId: 1, bidderId: 10, unitPriceTL: "2500.00", at: "2025-10-21" });
 * ```
 */
export function composeDirectProcurement(db: SqlExecutor) {
  const audit = new SqliteAuditLog(db);
  const bus = new InProcessEventBus((f) =>
    audit.write({
      title: `Olay işleyici hatası: ${f.handler}`,
      message: `${f.event.name} (dosya #${f.event.dosyaId}): ${
        f.error instanceof Error ? f.error.message : String(f.error)
      }`,
      level: "error",
    })
  );
  new FileReactionManager(
    new SqliteDocumentStatus(db),
    new SqliteStageProgress(db),
    audit,
  ).register(bus);

  const repo = new SqliteFileRepository(db);
  return {
    repo,
    bus,
    enterQuote: new EnterQuoteUseCase(repo, bus),
    selectWinner: new SelectWinnerUseCase(repo, bus),
    approveResult: new ApproveResultUseCase(repo, bus),
    recordAcceptance: new RecordAcceptanceUseCase(repo, bus),
    approveAcceptance: new ApproveAcceptanceUseCase(repo, bus),
    calculateDeductions: new CalculateDeductionsUseCase(
      repo,
      new SqliteMevzuatRateProvider(db),
    ),
  };
}
