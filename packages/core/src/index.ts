/**
 * @module @worksuite-360/core
 * @description WorkDesk 360 ekosistemi ortak çekirdek altyapı paketi.
 *
 * Sağlanan modüller:
 * - common/ (Result pattern, EntityId, Pagination, AppError hiyerarşisi)
 * - domain/ (AggregateRoot, DomainEvent, DomainError)
 * - database/ (IDatabaseConnection, IDatabaseProvider, IDatabaseTransaction, ISqlExecutor, SQLite çalıştırıcılar)
 * - persistence/ (Generic CRUD Repository sözleşmeleri, InMemory, SQLite ve Prisma adaptörleri)
 * - application/ (InProcessEventBus, CollectingEventPublisher, EventPublisher)
 * - text/ (Türkçe arama anahtarı, sıralama, collator, normalize araçları)
 */

// 1. Common Types & Result Pattern
export * from "./common/types/Result";
export * from "./common/types/EntityId";
export * from "./common/types/Pagination";

// 2. Common Errors (RFC 7807 Uyumlu Hata Sınıfları)
export * from "./common/errors/AppError";
export * from "./common/errors/ValidationError";
export * from "./common/errors/NotFoundError";
export * from "./common/errors/ConflictError";

// 3. Domain Tabanlı Yapı Taşları
export * from "./domain/AggregateRoot";
export * from "./domain/DomainEvent";
export * from "./domain/DomainError";

// 4. Veritabanı ve Bağlantı Sözleşmeleri
export * from "./database/contracts/IDatabaseConnection";
export * from "./database/contracts/IDatabaseProvider";
export * from "./database/contracts/IDatabaseTransaction";
export * from "./database/contracts/ISqlExecutor";
export * from "./database/sqlite/BetterSqliteExecutor";
export * from "./database/sqlite/IpcSqlExecutor";

// 5. Persistence ve Repository Mimarisi
export * from "./persistence/contracts/IReadRepository";
export * from "./persistence/contracts/IWriteRepository";
export * from "./persistence/contracts/IRepository";
export * from "./persistence/base/ReadRepositoryBase";
export * from "./persistence/base/WriteRepositoryBase";
export * from "./persistence/base/RepositoryBase";
export * from "./persistence/memory/InMemoryRepository";
export * from "./persistence/sqlite/SQLiteRepositoryBase";
export * from "./persistence/sqlite/SQLiteReadRepository";
export * from "./persistence/sqlite/SQLiteWriteRepository";
export * from "./persistence/prisma/PrismaRepositoryBase";
export * from "./persistence/prisma/PrismaReadRepository";
export * from "./persistence/prisma/PrismaWriteRepository";

// 6. Olay ve Mesajlaşma (Event Bus)
export * from "./application/events/EventPublisher";
export * from "./application/events/InProcessEventBus";
export * from "./application/events/CollectingEventPublisher";

// 7. Türkçe Metin Araçları
export * from "./text/index";
