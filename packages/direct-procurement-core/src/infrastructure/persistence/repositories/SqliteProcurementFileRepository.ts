import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    type SqlExecutor,
    success,
} from "@worksuite-360/core";
import {
    ProcurementFile,
    type ProcurementFileType,
    type BudgetType,
    type ContractType,
} from "../../../domain/procurement-file/ProcurementFile";
import { ProcurementFileStatus } from "../../../domain/procurement-file/ProcurementFileStatus";
import type { IProcurementFileRepository } from "../../../application/contracts/IProcurementFileRepository";
import type {
    CreateEntity,
    UpdateEntity,
} from "@worksuite-360/core";

interface RowTeminDosyasi {
    id: number;
    dosya_no: string | null;
    evrak_sayisi: string | null;
    konu: string | null;
    ihale_tipi: string | null;
    durum: string | null;
    butce_yili: number | null;
    butce_turu: string | null;
    birim_id: number | null;
    birim_adi: string | null;
    sozlesme_turu: string | null;
    yaklasik_maliyet: number | null;
    teslim_suresi_gun: number | null;
    is_deleted?: number | null;
}

export class SqliteProcurementFileRepository implements IProcurementFileRepository {
    constructor(private readonly db: SqlExecutor) {}

    private mapRowToEntity(row: RowTeminDosyasi): ProcurementFile {
        const rawId = Number(row.id);
        const validId = Number.isInteger(rawId) && rawId > 0 ? rawId : 1;
        const validSubject = (row.konu && row.konu.trim()) ? row.konu.trim() : (row.dosya_no ? `Dosya ${row.dosya_no}` : "Doğrudan Temin Dosyası");

        return new ProcurementFile({
            id: validId,
            procurementNumber: row.dosya_no ?? undefined,
            documentNumber: row.evrak_sayisi ?? undefined,
            subject: validSubject,
            procurementType: (row.ihale_tipi as ProcurementFileType) ?? "mal",
            status: (row.durum as ProcurementFileStatus) ?? ProcurementFileStatus.Draft,
            budgetYear: row.butce_yili ?? new Date().getFullYear(),
            budgetType: (row.butce_turu as BudgetType) ?? "Öz Bütçe",
            unitId: row.birim_id ?? undefined,
            unitName: row.birim_adi ?? undefined,
            contractType: (row.sozlesme_turu as ContractType) ?? "Doğrudan Temin",
            estimatedCost: row.yaklasik_maliyet ?? 0,
            deliveryDays: row.teslim_suresi_gun ?? undefined,
        });
    }

    private async runSql(sql: string, params: readonly unknown[] = []): Promise<void> {
        if (this.db.execute) {
            await this.db.execute(sql, params);
        } else {
            await this.db.query(sql, params);
        }
    }

    async getById(id: number): Promise<Result<ProcurementFile, AppError>> {
        try {
            const rows = await this.db.query<RowTeminDosyasi>(
                `SELECT * FROM DATA_TeminDosyasi WHERE id = ? AND COALESCE(is_deleted, 0) = 0`,
                [id],
            );
            if (!rows.length) {
                return failure(new NotFoundError({ resource: "ProcurementFile", resourceId: String(id) }));
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

    async getAll(): Promise<Result<ProcurementFile[], AppError>> {
        try {
            const rows = await this.db.query<RowTeminDosyasi>(
                `SELECT * FROM DATA_TeminDosyasi WHERE COALESCE(is_deleted, 0) = 0 ORDER BY id DESC`,
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
                `SELECT COUNT(*) as count FROM DATA_TeminDosyasi WHERE id = ? AND COALESCE(is_deleted, 0) = 0`,
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
        data: CreateEntity<ProcurementFile, number>,
    ): Promise<Result<ProcurementFile, AppError>> {
        try {
            await this.runSql(
                `INSERT INTO DATA_TeminDosyasi (
                    dosya_no, evrak_sayisi, konu, ihale_tipi, durum, butce_yili, butce_turu,
                    birim_id, birim_adi, sozlesme_turu, yaklasik_maliyet, teslim_suresi_gun
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.procurementNumber ?? null,
                    data.documentNumber ?? null,
                    data.subject,
                    data.procurementType,
                    data.status ?? ProcurementFileStatus.Draft,
                    data.budgetYear ?? new Date().getFullYear(),
                    data.budgetType ?? "Öz Bütçe",
                    data.unitId ?? null,
                    data.unitName ?? null,
                    data.contractType ?? "Doğrudan Temin",
                    data.estimatedCost ?? 0,
                    data.deliveryDays ?? null,
                ],
            );

            const [lastRow] = await this.db.query<{ id: number }>("SELECT last_insert_rowid() as id");
            const insertedId = lastRow?.id ?? (data.id as number) ?? Date.now();
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
        data: UpdateEntity<ProcurementFile>,
    ): Promise<Result<ProcurementFile, AppError>> {
        try {
            const currentRes = await this.getById(id);
            if (!currentRes.success) return currentRes;

            await this.runSql(
                `UPDATE DATA_TeminDosyasi SET
                    konu = COALESCE(?, konu),
                    birim_id = COALESCE(?, birim_id),
                    birim_adi = COALESCE(?, birim_adi),
                    yaklasik_maliyet = COALESCE(?, yaklasik_maliyet),
                    teslim_suresi_gun = COALESCE(?, teslim_suresi_gun)
                WHERE id = ?`,
                [
                    data.subject ?? null,
                    data.unitId ?? null,
                    data.unitName ?? null,
                    data.estimatedCost ?? null,
                    data.deliveryDays ?? null,
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
            await this.runSql(
                `UPDATE DATA_TeminDosyasi SET is_deleted = 1 WHERE id = ?`,
                [id],
            );
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

    async findByNumber(procurementNumber: string): Promise<ProcurementFile | null> {
        const rows = await this.db.query<RowTeminDosyasi>(
            `SELECT * FROM DATA_TeminDosyasi WHERE dosya_no = ? AND COALESCE(is_deleted, 0) = 0 LIMIT 1`,
            [procurementNumber],
        );
        return rows[0] ? this.mapRowToEntity(rows[0]) : null;
    }

    async findByYear(year: number): Promise<ProcurementFile[]> {
        const rows = await this.db.query<RowTeminDosyasi>(
            `SELECT * FROM DATA_TeminDosyasi WHERE butce_yili = ? AND COALESCE(is_deleted, 0) = 0`,
            [year],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }

    async findActiveFiles(): Promise<ProcurementFile[]> {
        const rows = await this.db.query<RowTeminDosyasi>(
            `SELECT * FROM DATA_TeminDosyasi WHERE durum != ? AND COALESCE(is_deleted, 0) = 0`,
            [ProcurementFileStatus.Completed],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }
}
