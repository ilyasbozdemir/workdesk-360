import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    type SqlExecutor,
    success,
} from "@worksuite-360/core";
import { RequirementReport, type RequirementStatus } from "../../../domain/requirement/Requirement";
import type { IRequirementRepository } from "../../../application/contracts/IRequirementRepository";
import type { CreateEntity, UpdateEntity } from "@worksuite-360/core";

interface RowIhtiyacRaporu {
    id: number;
    rapor_no: string;
    baslik: string;
    gerekce?: string | null;
    talep_eden_birim_id?: number | null;
    talep_eden_birim_adi?: string | null;
    talep_eden_personel_id?: number | null;
    talep_eden_personel_adi?: string | null;
    tahmini_butce?: number | null;
    durum?: string | null;
}

export class SqliteRequirementRepository implements IRequirementRepository {
    constructor(private readonly db: SqlExecutor) {}

    private async runSql(sql: string, params: readonly unknown[] = []): Promise<void> {
        if (this.db.execute) {
            await this.db.execute(sql, params);
        } else {
            await this.db.query(sql, params);
        }
    }

    private mapRowToEntity(row: RowIhtiyacRaporu): RequirementReport {
        return new RequirementReport({
            id: row.id,
            reportNumber: row.rapor_no,
            title: row.baslik,
            justification: row.gerekce ?? null,
            unitId: row.talep_eden_birim_id ?? null,
            unitName: row.talep_eden_birim_adi ?? null,
            requestingPersonnelId: row.talep_eden_personel_id ?? null,
            requestingPersonnelName: row.talep_eden_personel_adi ?? null,
            estimatedBudget: row.tahmini_butce ?? 0,
            status: (row.durum as RequirementStatus) ?? "taslak",
        });
    }

    async getById(id: number): Promise<Result<RequirementReport, AppError>> {
        try {
            const rows = await this.db.query<RowIhtiyacRaporu>(
                `SELECT * FROM DATA_IhtiyacRaporu WHERE id = ?`,
                [id],
            );
            if (!rows.length) {
                return failure(new NotFoundError({ resource: "RequirementReport", resourceId: String(id) }));
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

    async getAll(): Promise<Result<RequirementReport[], AppError>> {
        try {
            const rows = await this.db.query<RowIhtiyacRaporu>(
                `SELECT * FROM DATA_IhtiyacRaporu ORDER BY id DESC`,
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
                `SELECT COUNT(*) as count FROM DATA_IhtiyacRaporu WHERE id = ?`,
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
        data: CreateEntity<RequirementReport, number>,
    ): Promise<Result<RequirementReport, AppError>> {
        try {
            await this.runSql(
                `INSERT INTO DATA_IhtiyacRaporu (
                    rapor_no, baslik, gerekce, talep_eden_birim_id, talep_eden_birim_adi,
                    talep_eden_personel_id, talep_eden_personel_adi, tahmini_butce, durum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.reportNumber,
                    data.title,
                    data.justification ?? null,
                    data.unitId ?? null,
                    data.unitName ?? null,
                    data.requestingPersonnelId ?? null,
                    data.requestingPersonnelName ?? null,
                    data.estimatedBudget ?? 0,
                    data.status ?? "taslak",
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
        data: UpdateEntity<RequirementReport>,
    ): Promise<Result<RequirementReport, AppError>> {
        try {
            await this.runSql(
                `UPDATE DATA_IhtiyacRaporu SET
                    baslik = COALESCE(?, baslik),
                    gerekce = COALESCE(?, gerekce),
                    tahmini_butce = COALESCE(?, tahmini_butce)
                 WHERE id = ?`,
                [
                    data.title ?? null,
                    data.justification ?? null,
                    data.estimatedBudget ?? null,
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
            await this.runSql(`DELETE FROM DATA_IhtiyacRaporu WHERE id = ?`, [id]);
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

    async findByReportNumber(reportNumber: string): Promise<RequirementReport | null> {
        const rows = await this.db.query<RowIhtiyacRaporu>(
            `SELECT * FROM DATA_IhtiyacRaporu WHERE rapor_no = ? LIMIT 1`,
            [reportNumber],
        );
        return rows[0] ? this.mapRowToEntity(rows[0]) : null;
    }

    async findByUnitId(unitId: number): Promise<RequirementReport[]> {
        const rows = await this.db.query<RowIhtiyacRaporu>(
            `SELECT * FROM DATA_IhtiyacRaporu WHERE talep_eden_birim_id = ?`,
            [unitId],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }
}
