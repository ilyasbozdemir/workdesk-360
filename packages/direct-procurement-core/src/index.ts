/**
 * @packageDocumentation
 * @module @temin360/direct-procurement-core
 *
 * # Doğrudan Temin Çekirdeği (Direct Procurement Core)
 *
 * Bu paket, 4734 Sayılı Kamu İhale Kanunu Madde 22 ve ilgili Doğrudan Temin Tebliği (Mevzuat No: 40666)
 * hükümleri doğrultusunda Doğrudan Temin süreçlerinin tüm iş kurallarını (domain logic),
 * kullanım senaryolarını (use cases) ve veritabanı/IPC altyapı adaptörlerini (infrastructure)
 * Clean Architecture / Domain-Driven Design (DDD) prensipleriyle yöneten saf çekirdek kütüphanedir.
 *
 * ## Mimari Katmanlar
 * ```
 * ┌────────────────────────────────────────────────────────┐
 * │  Domain (Saf İş Kuralları, Varlıklar, Değer Nesneleri)   │
 * │  - DirectProcurementFile (Aggregate Root)              │
 * │  - NeedItem, Bidder, QuoteMatrix, AcceptanceRecord     │
 * │  - PricingBasis, ApproximateCostCalculator             │
 * │  - WinnerSelectionStrategy, DeductionCalculator        │
 * └───────────────────────────┬────────────────────────────┘
 *                             ▲
 * ┌───────────────────────────┴────────────────────────────┐
 * │  Application (Kullanım Senaryoları / Use Cases)        │
 * │  - OpenFile, EnterQuote, SelectWinner, ApproveResult   │
 * │  - Acceptance, CalculateDeductions                     │
 * │  - Ports & Interfaces (Repository, EventBus)           │
 * └───────────────────────────┬────────────────────────────┘
 *                             ▲
 * ┌───────────────────────────┴────────────────────────────┐
 * │  Infrastructure (Adaptörler ve Somut Uygulamalar)      │
 * │  - SqliteFileRepository, InMemoryFileRepository       │
 * │  - BetterSqliteExecutor, IpcSqlExecutor                │
 * │  - composeDirectProcurement (Composition Root)         │
 * └────────────────────────────────────────────────────────┘
 * ```
 *
 * @author WorkDesk 360 / Temin 360 Team
 * @version 1.0.0
 */

// ─── DOMAIN KATMANI (Saf İş Mantığı) ──────────────────────────────────
export * from "./domain/shared/DomainError";
export * from "./domain/shared/DomainEvent";
export * from "./domain/shared/AggregateRoot";
export * from "./domain/money";
export * from "./domain/shared/numeric";
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

// ─── APPLICATION KATMANI (Use Case & Portlar) ─────────────────────────
export * from "./application/ports";
export * from "./application/usecases/FileUseCase";
export * from "./application/usecases/OpenFile";
export * from "./application/usecases/EnterQuote";
export * from "./application/usecases/SelectWinner";
export * from "./application/usecases/ApproveResult";
export * from "./application/usecases/Acceptance";
export * from "./application/usecases/CalculateDeductions";
export * from "./application/events/InProcessEventBus";
export * from "./application/reactions/FileReactionManager";

// ─── INFRASTRUCTURE KATMANI (Veritabanı & Adaptörler) ─────────────────
export * from "./infrastructure/InMemoryFileRepository";
export * from "./infrastructure/CollectingEventPublisher";
export * from "./infrastructure/SqliteMevzuatRateProvider";
export * from "./infrastructure/BetterSqliteExecutor";
export * from "./infrastructure/IpcSqlExecutor";
export * from "./infrastructure/TeminPreferencesStore";
export * from "./infrastructure/mappers/AcceptanceJsonMapper";
export * from "./infrastructure/SqliteFileRepository";
export * from "./infrastructure/SqliteReactionAdapters";
export * from "./infrastructure/composeDirectProcurement";
