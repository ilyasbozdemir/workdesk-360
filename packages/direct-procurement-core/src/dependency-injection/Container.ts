import type { SqlExecutor } from "@worksuite-360/core";
import { InProcessEventBus } from "@worksuite-360/core";
import type {
    AuditLogPort,
    DocumentStatusPort,
    FileRepository,
    RateProvider,
    StageProgressPort,
} from "../application/ports";
import { FileReactionManager } from "../application/reactions/FileReactionManager";
import { EnterQuoteUseCase } from "../application/usecases/EnterQuote";
import { SelectWinnerUseCase } from "../application/usecases/SelectWinner";
import { ApproveResultUseCase } from "../application/usecases/ApproveResult";
import {
    ApproveAcceptanceUseCase,
    RecordAcceptanceUseCase,
} from "../application/usecases/Acceptance";
import { CalculateDeductionsUseCase } from "../application/usecases/CalculateDeductions";
import {
    bindFileRepository,
    bindPreferencesStore,
    bindRateProvider,
    bindReactionAdapters,
} from "./RepositoryBinding";
import { DirectProcurementService } from "./DirectProcurementService";
import type { ITeminPreferencesStore } from "../infrastructure/database/contracts/ITeminPreferencesStore";

/**
 * Dependency Injection Token Tanımları
 */
export const TOKENS = {
    SqlExecutor: Symbol.for("SqlExecutor"),
    EventBus: Symbol.for("EventBus"),
    FileRepository: Symbol.for("FileRepository"),
    PreferencesStore: Symbol.for("PreferencesStore"),
    AuditLog: Symbol.for("AuditLog"),
    DocumentStatus: Symbol.for("DocumentStatus"),
    StageProgress: Symbol.for("StageProgress"),
    RateProvider: Symbol.for("RateProvider"),
    ReactionManager: Symbol.for("ReactionManager"),

    // Use Cases
    EnterQuoteUseCase: Symbol.for("EnterQuoteUseCase"),
    SelectWinnerUseCase: Symbol.for("SelectWinnerUseCase"),
    ApproveResultUseCase: Symbol.for("ApproveResultUseCase"),
    RecordAcceptanceUseCase: Symbol.for("RecordAcceptanceUseCase"),
    ApproveAcceptanceUseCase: Symbol.for("ApproveAcceptanceUseCase"),
    CalculateDeductionsUseCase: Symbol.for("CalculateDeductionsUseCase"),

    // Services
    DirectProcurementService: Symbol.for("DirectProcurementService"),
} as const;

export type TokenKey = keyof typeof TOKENS;

type Factory<T> = (container: DirectProcurementContainer) => T;

interface ServiceDescriptor<T = unknown> {
    factory?: Factory<T>;
    instance?: T;
    isSingleton: boolean;
}

/**
 * DirectProcurement IoC/DI Konteyneri
 *
 * Bağımlılıkların merkezi kaydını, yaşam döngüsünü ve lazy-resolution
 * mekanizmasını yönetir.
 */
export class DirectProcurementContainer {
    private readonly services = new Map<symbol, ServiceDescriptor>();

    /**
     * Hazır bir nesne örneğini (singleton) kaydeder.
     */
    registerInstance<T>(token: symbol, instance: T): this {
        this.services.set(token, {
            instance,
            isSingleton: true,
        });
        return this;
    }

    /**
     * Fabrika fonksiyonu ile servis kaydeder.
     */
    registerFactory<T>(
        token: symbol,
        factory: Factory<T>,
        isSingleton = true,
    ): this {
        this.services.set(token, {
            factory,
            isSingleton,
        });
        return this;
    }

    /**
     * Servisin kayıtlı olup olmadığını kontrol eder.
     */
    has(token: symbol): boolean {
        return this.services.has(token);
    }

    /**
     * Belirtilen token'a karşılık gelen servisi çözümler.
     */
    resolve<T>(token: symbol): T {
        const descriptor = this.services.get(token);
        if (!descriptor) {
            throw new Error(
                `[DirectProcurementContainer] '${String(token)}' için kayıtlı bağımlılık bulunamadı.`,
            );
        }

        if (descriptor.instance !== undefined) {
            return descriptor.instance as T;
        }

        if (descriptor.factory) {
            const resolved = descriptor.factory(this) as T;
            if (descriptor.isSingleton) {
                descriptor.instance = resolved;
            }
            return resolved;
        }

        throw new Error(
            `[DirectProcurementContainer] '${String(token)}' çözümlenemedi.`,
        );
    }

    // Kolay erişim özellikleri
    get service(): DirectProcurementService {
        return this.resolve<DirectProcurementService>(
            TOKENS.DirectProcurementService,
        );
    }

    get repository(): FileRepository {
        return this.resolve<FileRepository>(TOKENS.FileRepository);
    }

    get eventBus(): InProcessEventBus {
        return this.resolve<InProcessEventBus>(TOKENS.EventBus);
    }
}

export interface ContainerOptions {
    customEventBus?: InProcessEventBus;
}

/**
 * Verilen SqlExecutor ile tam yapılandırılmış Doğrudan Temin DI Konteyneri kurar.
 */
export function createDirectProcurementContainer(
    db: SqlExecutor,
    options?: ContainerOptions,
): DirectProcurementContainer {
    const container = new DirectProcurementContainer();

    // 1. Altyapı ve Veritabanı
    container.registerInstance<SqlExecutor>(TOKENS.SqlExecutor, db);

    // 2. Olay Yolu (Event Bus) ve Reaksiyon Adaptörleri
    const adapters = bindReactionAdapters(db);
    container.registerInstance<AuditLogPort>(TOKENS.AuditLog, adapters.audit);
    container.registerInstance<DocumentStatusPort>(
        TOKENS.DocumentStatus,
        adapters.docStatus,
    );
    container.registerInstance<StageProgressPort>(
        TOKENS.StageProgress,
        adapters.stageProgress,
    );

    const bus = options?.customEventBus ??
        new InProcessEventBus((f) =>
            adapters.audit.write({
                title: `Olay işleyici hatası: ${f.handler}`,
                message: `${f.event.name} (dosya #${f.event.dosyaId}): ${
                    f.error instanceof Error ? f.error.message : String(f.error)
                }`,
                level: "error",
            }),
        );
    container.registerInstance<InProcessEventBus>(TOKENS.EventBus, bus);

    const reactionManager = new FileReactionManager(
        adapters.docStatus,
        adapters.stageProgress,
        adapters.audit,
    );
    reactionManager.register(bus);
    container.registerInstance(TOKENS.ReactionManager, reactionManager);

    // 3. Repositories & Providers
    container.registerFactory<FileRepository>(
        TOKENS.FileRepository,
        () => bindFileRepository(db),
    );
    container.registerFactory<ITeminPreferencesStore>(
        TOKENS.PreferencesStore,
        () => bindPreferencesStore(db),
    );
    container.registerFactory<RateProvider>(
        TOKENS.RateProvider,
        () => bindRateProvider(db),
    );

    // 4. Use Cases
    container.registerFactory<EnterQuoteUseCase>(
        TOKENS.EnterQuoteUseCase,
        (c) =>
            new EnterQuoteUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<InProcessEventBus>(TOKENS.EventBus),
            ),
    );

    container.registerFactory<SelectWinnerUseCase>(
        TOKENS.SelectWinnerUseCase,
        (c) =>
            new SelectWinnerUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<InProcessEventBus>(TOKENS.EventBus),
            ),
    );

    container.registerFactory<ApproveResultUseCase>(
        TOKENS.ApproveResultUseCase,
        (c) =>
            new ApproveResultUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<InProcessEventBus>(TOKENS.EventBus),
            ),
    );

    container.registerFactory<RecordAcceptanceUseCase>(
        TOKENS.RecordAcceptanceUseCase,
        (c) =>
            new RecordAcceptanceUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<InProcessEventBus>(TOKENS.EventBus),
            ),
    );

    container.registerFactory<ApproveAcceptanceUseCase>(
        TOKENS.ApproveAcceptanceUseCase,
        (c) =>
            new ApproveAcceptanceUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<InProcessEventBus>(TOKENS.EventBus),
            ),
    );

    container.registerFactory<CalculateDeductionsUseCase>(
        TOKENS.CalculateDeductionsUseCase,
        (c) =>
            new CalculateDeductionsUseCase(
                c.resolve<FileRepository>(TOKENS.FileRepository),
                c.resolve<RateProvider>(TOKENS.RateProvider),
            ),
    );

    // 5. DirectProcurementService (Merkezi Uygulama Servisi)
    container.registerFactory<DirectProcurementService>(
        TOKENS.DirectProcurementService,
        (c) =>
            new DirectProcurementService({
                repo: c.resolve<FileRepository>(TOKENS.FileRepository),
                enterQuote: c.resolve<EnterQuoteUseCase>(
                    TOKENS.EnterQuoteUseCase,
                ),
                selectWinner: c.resolve<SelectWinnerUseCase>(
                    TOKENS.SelectWinnerUseCase,
                ),
                approveResult: c.resolve<ApproveResultUseCase>(
                    TOKENS.ApproveResultUseCase,
                ),
                recordAcceptance: c.resolve<RecordAcceptanceUseCase>(
                    TOKENS.RecordAcceptanceUseCase,
                ),
                approveAcceptance: c.resolve<ApproveAcceptanceUseCase>(
                    TOKENS.ApproveAcceptanceUseCase,
                ),
                calculateDeductions: c.resolve<CalculateDeductionsUseCase>(
                    TOKENS.CalculateDeductionsUseCase,
                ),
            }),
    );

    return container;
}
