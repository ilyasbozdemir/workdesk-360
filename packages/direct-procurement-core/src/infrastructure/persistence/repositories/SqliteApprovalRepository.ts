import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    type SqlExecutor,
    success,
} from "@worksuite-360/core";
import { ProcurementDocument, type DocumentKanbanStatus } from "../../../domain/approval/Approval";
import type { IApprovalRepository } from "../../../application/contracts/IApprovalRepository";
import type { CreateEntity, UpdateEntity } from "@worksuite-360/core";

interface RowTeminBelge {
    id: number;
    dosya_id: number;
    sablon_id?: number | null;
    belge_adi: string;
    dosya_yolu?: string | null;
    imzalandi_mi?: number | null;
    imza_tarihi?: string | null;
    olusturan_personel_id?: number | null;
    snapshot_data_json?: string | null;
    kanban_durumu?: string | null;
}

export class SqliteApprovalRepository implements IApprovalRepository {
    constructor(private readonly db: SqlExecutor) {}

    private async runSql(sql: string, params: readonly unknown[] = []): Promise<void> {
        if (this.db.execute) {
            await this.db.execute(sql, params);
        } else {
            await this.db.query(sql, params);
        }
    }

    private mapRowToEntity(row: RowTeminBelge): ProcurementDocument {
        return new ProcurementDocument({
            id: row.id,
            procurementFileId: row.dosya_id,
            templateId: row.sablon_id ?? null,
            documentName: row.belge_adi,
            filePath: row.dosya_yolu ?? null,
            isSigned: row.imzalandi_mi === 1,
            documentDate: row.imza_tarihi ?? null,
            creatingPersonnelId: row.olusturan_personel_id ?? null,
            snapshotDataJson: row.snapshot_data_json ?? null,
            status: (row.kanban_durumu as DocumentKanbanStatus) ?? (row.imzalandi_mi === 1 ? "tamamlandi" : "hazirlaniyor"),
        });
    }

    async getById(id: number): Promise<Result<ProcurementDocument, AppError>> {
        try {
            const rows = await this.db.query<RowTeminBelge>(
                `SELECT * FROM DATA_TeminBelge WHERE id = ?`,
                [id],
            );
            if (!rows.length) {
                return failure(new NotFoundError({ resource: "ProcurementDocument", resourceId: String(id) }));
            }
            return success(this.mapRowToEntity(rows[0]));
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getAll(): Promise<Result<ProcurementDocument[], AppError>> {
        try {
            const rows = await this.db.query<RowTeminBelge>(
                `SELECT * FROM DATA_TeminBelge ORDER BY id DESC`,
            );
            return success(rows.map((r) => this.mapRowToEntity(r)));
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async exists(id: number): Promise<Result<boolean, AppError>> {
        try {
            const rows = await this.db.query<{ count: number }>(
                `SELECT COUNT(*) as count FROM DATA_TeminBelge WHERE id = ?`,
                [id],
            );
            return success((rows[0]?.count ?? 0) > 0);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async create(
        data: CreateEntity<ProcurementDocument, number>,
    ): Promise<Result<ProcurementDocument, AppError>> {
        try {
            await this.runSql(
                `INSERT INTO DATA_TeminBelge (
                    dosya_id, sablon_id, belge_adi, dosya_yolu, imzalandi_mi, imza_tarihi
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.procurementFileId,
                    data.templateId ?? null,
                    data.documentName,
                    data.filePath ?? null,
                    data.isSigned ? 1 : 0,
                    data.documentDate ?? null,
                ],
            );
            const [lastRow] = await this.db.query<{ id: number }>("SELECT last_insert_rowid() as id");
            const insertedId = lastRow?.id ?? Date.now();
            return this.getById(insertedId);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_INSERT_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async update(
        id: number,
        data: UpdateEntity<ProcurementDocument>,
    ): Promise<Result<ProcurementDocument, AppError>> {
        try {
            await this.runSql(
                `UPDATE DATA_TeminBelge SET
                    belge_adi = COALESCE(?, belge_adi),
                    dosya_yolu = COALESCE(?, dosya_yolu),
                    imzalandi_mi = COALESCE(?, imzalandi_mi)
                 WHERE id = ?`,
                [
                    data.documentName ?? null,
                    data.filePath ?? null,
                    data.isSigned !== undefined ? (data.isSigned ? 1 : 0) : null,
                    id,
                ],
            );
            return this.getById(id);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_UPDATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async delete(id: number): Promise<Result<void, AppError>> {
        try {
            await this.runSql(`DELETE FROM DATA_TeminBelge WHERE id = ?`, [id]);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_DELETE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async findByProcurementFileId(fileId: number): Promise<ProcurementDocument[]> {
        const rows = await this.db.query<RowTeminBelge>(
            `SELECT * FROM DATA_TeminBelge WHERE dosya_id = ? ORDER BY id ASC`,
            [fileId],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }

    async findByStatus(status: string): Promise<ProcurementDocument[]> {
        const rows = await this.db.query<RowTeminBelge>(
            `SELECT * FROM DATA_TeminBelge WHERE kanban_durumu = ?`,
            [status],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }
}
