import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import { Commission } from "../../domain/commission/Commission";
import { ProcurementCommissionMember } from "../../domain/commission/ProcurementCommission";
import type { ICommissionRepository } from "../contracts/ICommissionRepository";
import type {
    AssignCommissionMemberDto,
    CreateCommissionDto,
} from "../dto/commission/CommissionDto";

export class CommissionService {
    constructor(private readonly repo: ICommissionRepository) {}

    async createCommission(
        dto: CreateCommissionDto,
    ): Promise<Result<Commission, AppError>> {
        try {
            const commission = new Commission({
                id: null,
                name: dto.name,
                type: dto.type,
                description: dto.description,
            });
            return this.repo.create(commission as any);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "COMMISSION_CREATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    /**
     * Doğrudan temin dosyasına komisyon üyesi atar.
     * 4734 Tebliği 40666 gereğince rol ayrımı prensiplerine uyar.
     */
    async assignMember(
        dto: AssignCommissionMemberDto,
    ): Promise<Result<ProcurementCommissionMember, AppError>> {
        try {
            const member = new ProcurementCommissionMember({
                id: null,
                procurementFileId: dto.procurementFileId,
                commissionId: dto.commissionId,
                personnelId: dto.personnelId,
                fullName: dto.fullName,
                title: dto.title,
                duty: dto.duty ?? "Üye",
                role: dto.role ?? "Asil",
                commissionType: dto.commissionType,
                unitId: dto.unitId,
                unitName: dto.unitName,
            });

            await this.repo.saveMember(member);
            return success(member);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "COMMISSION_MEMBER_ASSIGN_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getMembersForFile(
        fileId: number,
    ): Promise<Result<ProcurementCommissionMember[], AppError>> {
        try {
            const members = await this.repo.findMembersByProcurementFileId(fileId);
            return success(members);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "COMMISSION_MEMBERS_FETCH_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }
}
