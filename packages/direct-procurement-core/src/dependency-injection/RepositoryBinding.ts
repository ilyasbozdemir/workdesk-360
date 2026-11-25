import type { SqlExecutor } from "@worksuite-360/core";
import type {
    AuditLogPort,
    DocumentStatusPort,
    FileRepository,
    RateProvider,
    StageProgressPort,
} from "../application/ports";
import { SqliteFileRepository } from "../infrastructure/database/SqliteFileRepository";
import {
    SqliteAuditLog,
    SqliteDocumentStatus,
    SqliteStageProgress,
} from "../infrastructure/database/SqliteReactionAdapters";
import { SqliteMevzuatRateProvider } from "../infrastructure/database/SqliteMevzuatRateProvider";
import { TeminPreferencesStore } from "../infrastructure/database/TeminPreferencesStore";
import type { ITeminPreferencesStore } from "../infrastructure/database/contracts/ITeminPreferencesStore";

/**
 * Dosya reposu bağlayıcısı
 */
export function bindFileRepository(db: SqlExecutor): FileRepository {
    return new SqliteFileRepository(db);
}

/**
 * Kullanıcı şablon tercihleri deposu bağlayıcısı
 */
export function bindPreferencesStore(
    db: SqlExecutor,
): ITeminPreferencesStore {
    return new TeminPreferencesStore(db);
}

/**
 * Mevzuat kesinti oranları sağlayıcısı bağlayıcısı
 */
export function bindRateProvider(db: SqlExecutor): RateProvider {
    return new SqliteMevzuatRateProvider(db);
}

/**
 * Reaksiyon ve denetim adaptörleri bağlayıcısı
 */
export function bindReactionAdapters(db: SqlExecutor): {
    audit: AuditLogPort;
    docStatus: DocumentStatusPort;
    stageProgress: StageProgressPort;
} {
    return {
        audit: new SqliteAuditLog(db),
        docStatus: new SqliteDocumentStatus(db),
        stageProgress: new SqliteStageProgress(db),
    };
}
