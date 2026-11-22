/**
 * @packageDocumentation
 * @module @temin360/direct-procurement-core
 *
 * # Doğrudan Temin Çekirdeği (Direct Procurement Core)
 *
 * Bu paket, 4734 Sayılı Kamu İhale Kanunu Madde 22 ve ilgili Doğrudan Temin Tebliği (Mevzuat No: 40666)
 * hükümleri doğrultusunda Doğrudan Temin süreçlerinin tüm iş kurallarını (domain logic),
 * kullanım senaryolarını (use cases) ve veritabanı/IPC altyapı adaptörlerini (infrastructure)
 * Clean Architecture / Domain-Driven Design (DDD) prensipleriyle yöneten etki alanı kütüphanesidir.
 *
 * Genel WorkDesk Core altyapısı `@worksuite-360/core` paketinden tüketilir ve dışa aktarılır.
 *
 * @author WorkDesk 360 / Temin 360 Team
 * @version 1.0.0
 */

// ─── 0. GENEL WORKDESK CORE ALTYAPISI (Re-exported from @worksuite-360/core) ───
export * from "@worksuite-360/core";

// ─── 1. DOĞRUDAN TEMİN DOMAIN KATMANI (Saf İş Mantığı) ─────────────────
export * from "./domain/money";
export * from "./domain/numeric";
export * from "./domain/procurement-file";
export * from "./domain/file/DirectProcurementFile";
export * from "./domain/file/NeedItem";
export * from "./domain/file/Bidder";
export * from "./domain/file/QuoteMatrix";
export * from "./domain/file/AcceptanceRecord";
export * from "./domain/file/ProcurementStages";
export * from "./domain/file/events";
export * from "./domain/profile/DeductionRule";
export * from "./domain/profile/ProcurementProfile";
export * from "./domain/profile/profiles";
export * from "./domain/pricing/PricingBasis";
export * from "./domain/pricing/ApproximateCostCalculator";
export * from "./domain/winner/WinnerSelectionStrategy";
export * from "./domain/services/DeductionCalculator";
export * from "./domain/services/Md22dLimitPolicy";

// ─── 2. DOĞRUDAN TEMİN APPLICATION KATMANI (Use Cases & Portlar) ──────
export type {
    AuditLogPort,
    DocumentStatusPort,
    FileRepository,
    RateProvider,
    StageProgressPort,
} from "./application/ports";
export * from "./application/usecases/FileUseCase";
export * from "./application/usecases/OpenFile";
export * from "./application/usecases/EnterQuote";
export * from "./application/usecases/SelectWinner";
export * from "./application/usecases/ApproveResult";
export * from "./application/usecases/Acceptance";
export * from "./application/usecases/CalculateDeductions";
export * from "./application/reactions/FileReactionManager";

// ─── 3. DOĞRUDAN TEMİN INFRASTRUCTURE KATMANI ─────────────────────────
export * from "./infrastructure/database/InMemoryFileRepository";
export * from "./infrastructure/database/SqliteMevzuatRateProvider";
export * from "./infrastructure/database/TeminPreferencesStore";
export * from "./infrastructure/database/contracts/ITeminPreferencesStore";
export * from "./infrastructure/database/mappers/AcceptanceJsonMapper";
export * from "./infrastructure/database/SqliteFileRepository";
export * from "./infrastructure/database/SqliteReactionAdapters";
export * from "./infrastructure/database/composeDirectProcurement";
