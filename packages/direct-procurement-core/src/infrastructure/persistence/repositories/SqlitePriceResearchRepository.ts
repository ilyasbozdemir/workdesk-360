import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    type SqlExecutor,
    success,
} from "@worksuite-360/core";
import { PriceOffer } from "../../../domain/price-research/PriceOffer";
import type { IPriceResearchRepository } from "../../../application/contracts/IPriceResearchRepository";
import type { CreateEntity, UpdateEntity } from "@worksuite-360/core";

interface RowTeminKalemTeklif {
    id: number;
    dosya_id?: number | null;
    kalem_id: number;
    firma_id: number;
    birim_fiyat: number;
    kdv_tutari?: number | null;
    teklif_var_mi?: number | null;
}

export class SqlitePriceResearchRepository implements IPriceResearchRepository {
    constructor(private readonly db: SqlExecutor) {}

    private async runSql(sql: string, params: readonly unknown[] = []): Promise<void> {
        if (this.db.execute) {
            await this.db.execute(sql, params);
        } else {
            await this.db.query(sql, params);
        }
    }

    private mapRowToEntity(row: RowTeminKalemTeklif): PriceOffer {
        return new PriceOffer({
            id: row.id,
            procurementFileId: row.dosya_id ?? 1,
            itemId: row.kalem_id,
            supplierId: row.firma_id,
            unitPrice: row.birim_fiyat,
            vatAmount: row.kdv_tutari ?? 0,
            hasOffer: row.teklif_var_mi !== 0,
        });
    }

    async getById(id: number): Promise<Result<PriceOffer, AppError>> {
        try {
            const rows = await this.db.query<RowTeminKalemTeklif>(
                `SELECT * FROM DATA_TeminKalemTeklif WHERE id = ?`,
                [id],
            );
            if (!rows.length) {
                return failure(new NotFoundError({ resource: "PriceOffer", resourceId: String(id) }));
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

    async getAll(): Promise<Result<PriceOffer[], AppError>> {
        try {
            const rows = await this.db.query<RowTeminKalemTeklif>(
                `SELECT * FROM DATA_TeminKalemTeklif ORDER BY id DESC`,
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
                `SELECT COUNT(*) as count FROM DATA_TeminKalemTeklif WHERE id = ?`,
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
        data: CreateEntity<PriceOffer, number>,
    ): Promise<Result<PriceOffer, AppError>> {
        try {
            await this.runSql(
                `INSERT INTO DATA_TeminKalemTeklif (
                    dosya_id, kalem_id, firma_id, birim_fiyat, kdv_tutari, teklif_var_mi
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.procurementFileId,
                    data.itemId,
                    data.supplierId,
                    data.unitPrice,
                    data.vatAmount ?? 0,
                    data.hasOffer !== false ? 1 : 0,
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
        data: UpdateEntity<PriceOffer>,
    ): Promise<Result<PriceOffer, AppError>> {
        try {
            await this.runSql(
                `UPDATE DATA_TeminKalemTeklif SET
                    birim_fiyat = COALESCE(?, birim_fiyat),
                    kdv_tutari = COALESCE(?, kdv_tutari),
                    teklif_var_mi = COALESCE(?, teklif_var_mi)
                 WHERE id = ?`,
                [
                    data.unitPrice ?? null,
                    data.vatAmount ?? null,
                    data.hasOffer !== undefined ? (data.hasOffer ? 1 : 0) : null,
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
            await this.runSql(`DELETE FROM DATA_TeminKalemTeklif WHERE id = ?`, [id]);
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

    async findByProcurementFileId(fileId: number): Promise<PriceOffer[]> {
        const rows = await this.db.query<RowTeminKalemTeklif>(
            `SELECT t.* FROM DATA_TeminKalemTeklif t
             JOIN DATA_TeminKalem k ON k.id = t.kalem_id
             WHERE k.dosya_id = ?`,
            [fileId],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }

    async findByItemId(itemId: number): Promise<PriceOffer[]> {
        const rows = await this.db.query<RowTeminKalemTeklif>(
            `SELECT * FROM DATA_TeminKalemTeklif WHERE kalem_id = ?`,
            [itemId],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }

    async findBySupplierId(supplierId: number): Promise<PriceOffer[]> {
        const rows = await this.db.query<RowTeminKalemTeklif>(
            `SELECT * FROM DATA_TeminKalemTeklif WHERE firma_id = ?`,
            [supplierId],
        );
        return rows.map((r) => this.mapRowToEntity(r));
    }
}
