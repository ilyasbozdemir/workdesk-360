import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    type SqlExecutor,
    success,
} from "@worksuite-360/core";
import { Commission } from "../../../domain/commission/Commission";
import { ProcurementCommissionMember } from "../../../domain/commission/ProcurementCommission";
import type { ICommissionRepository } from "../../../application/contracts/ICommissionRepository";
import type { CreateEntity, UpdateEntity } from "@worksuite-360/core";

interface RowCommission {
    id: number;
    ad: string;
    tur?: string | null;
    aciklama?: string | null;
    aktif?: number | null;
}

interface RowCommissionMember {
    id: number;
    dosya_id: number;
    komisyon_id?: number | null;
    personel_id: number;
    ad_soyad?: string | null;
    unvan?: string | null;
    komisyon_gorevi?: string | null;
    gorev?: string | null;
    komisyon_turu?: string | null;
    birim_id?: number | null;
    birim_adi?: string | null;
}

export class SqliteCommissionRepository implements ICommissionRepository {
    constructor(private readonly db: SqlExecutor) {}

    private async runSql(sql: string, params: readonly unknown[] = []): Promise<void> {
        if (this.db.execute) {
            await this.db.execute(sql, params);
        } else {
            await this.db.query(sql, params);
        }
    }

    private mapRowToCommission(row: RowCommission): Commission {
        return new Commission({
            id: row.id,
            name: row.ad,
            type: row.tur ?? null,
            description: row.aciklama ?? null,
            isActive: row.aktif === 1,
        });
    }

    private mapRowToMember(row: RowCommissionMember): ProcurementCommissionMember {
        return new ProcurementCommissionMember({
            id: row.id,
            procurementFileId: row.dosya_id,
            commissionId: row.komisyon_id ?? 1,
            personnelId: row.personel_id,
            fullName: row.ad_soyad ?? "Bilinmeyen Personel",
            title: row.unvan ?? null,
            duty: row.gorev ?? null,
            role: row.komisyon_gorevi ?? "Asil",
            commissionType: row.komisyon_turu ?? null,
            unitId: row.birim_id ?? null,
            unitName: row.birim_adi ?? null,
        });
    }

    async getById(id: number): Promise<Result<Commission, AppError>> {
        try {
            const rows = await this.db.query<RowCommission>(
                `SELECT id, ad, tur, aciklama, aktif FROM TANIM_Komisyon WHERE id = ?`,
                [id],
            );
            if (!rows.length) {
                return failure(new NotFoundError({ resource: "Commission", resourceId: String(id) }));
            }
            return success(this.mapRowToCommission(rows[0]));
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DB_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getAll(): Promise<Result<Commission[], AppError>> {
        try {
            const rows = await this.db.query<RowCommission>(
                `SELECT id, ad, tur, aciklama, aktif FROM TANIM_Komisyon ORDER BY ad ASC`,
            );
            return success(rows.map((r) => this.mapRowToCommission(r)));
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
                `SELECT COUNT(*) as count FROM TANIM_Komisyon WHERE id = ?`,
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
        data: CreateEntity<Commission, number>,
    ): Promise<Result<Commission, AppError>> {
        try {
            await this.runSql(
                `INSERT INTO TANIM_Komisyon (ad, tur, aciklama, aktif) VALUES (?, ?, ?, ?)`,
                [
                    (data as any).name ?? (data as any).ad,
                    (data as any).type ?? (data as any).tur ?? null,
                    (data as any).description ?? (data as any).aciklama ?? null,
                    (data as any).isActive ? 1 : 0,
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
        data: UpdateEntity<Commission>,
    ): Promise<Result<Commission, AppError>> {
        try {
            await this.runSql(
                `UPDATE TANIM_Komisyon SET
                    ad = COALESCE(?, ad),
                    tur = COALESCE(?, tur),
                    aciklama = COALESCE(?, aciklama)
                 WHERE id = ?`,
                [
                    (data as any).name ?? null,
                    (data as any).type ?? null,
                    (data as any).description ?? null,
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
            await this.runSql(`DELETE FROM TANIM_Komisyon WHERE id = ?`, [id]);
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

    async findMembersByProcurementFileId(fileId: number): Promise<ProcurementCommissionMember[]> {
        const rows = await this.db.query<RowCommissionMember>(
            `SELECT * FROM DATA_TeminKomisyon WHERE dosya_id = ?`,
            [fileId],
        );
        return rows.map((r) => this.mapRowToMember(r));
    }

    async saveMember(member: ProcurementCommissionMember): Promise<void> {
        await this.runSql(
            `INSERT INTO DATA_TeminKomisyon (
                dosya_id, personel_id, ad_soyad, unvan, komisyon_gorevi, gorev, komisyon_turu, birim_id, birim_adi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                member.procurementFileId,
                member.personnelId,
                member.fullName,
                member.title,
                member.role,
                member.duty,
                member.commissionType,
                member.unitId,
                member.unitName,
            ],
        );
    }

    async removeMember(memberId: number): Promise<void> {
        await this.runSql(`DELETE FROM DATA_TeminKomisyon WHERE id = ?`, [memberId]);
    }
}
