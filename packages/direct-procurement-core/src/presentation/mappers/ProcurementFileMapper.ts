import type { ProcurementFile } from "../../domain/procurement-file/ProcurementFile";
import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";
import { ProcurementFileListMapper } from "./ProcurementFileListMapper";
import { ProcurementFileDetailMapper } from "./ProcurementFileDetailMapper";
import type { ProcurementFileListItemView } from "../view-models/ProcurementFileListViewModel";
import type { ProcurementFileDetailView } from "../view-models/ProcurementFileDetailViewModel";

/**
 * ProcurementFileMapper
 *
 * ProcurementFile Domain modelinden DTO üretir ve liste/detay mapper'larına
 * erişim sağlayan merkezi mapper facade'idir.
 */
export class ProcurementFileMapper {
    /**
     * Domain Entity -> DTO dönüşümü
     */
    static toDto(entity: ProcurementFile): ProcurementFileDto {
        return {
            id: entity.id,
            subject: entity.subject,
            procurementNumber: entity.procurementNumber,
            documentNumber: entity.documentNumber,
            procurementType: entity.procurementType,
            status: entity.status,
            isLocked: entity.isLocked,
            lockReason: entity.lockReason,
            estimatedCost: entity.estimatedCost ?? 0,
            totalAmount: entity.estimatedCost ?? 0,
            budgetYear: entity.budgetYear,
            budgetType: entity.budgetType,
            contractType: entity.contractType,
            deliveryDays: entity.deliveryDays,
            unitName: entity.unitName,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    /**
     * DTO -> Liste Ekranı ViewModel dönüşümü (ProcurementFileListMapper)
     */
    static toListItem(dto: ProcurementFileDto): ProcurementFileListItemView {
        return ProcurementFileListMapper.toListItemView(dto);
    }

    /**
     * DTO Listesi -> Liste Ekranı ViewModel listesi (ProcurementFileListMapper)
     */
    static toList(dtos: ProcurementFileDto[]): ProcurementFileListItemView[] {
        return ProcurementFileListMapper.toList(dtos);
    }

    /**
     * DTO -> Detay Ekranı ViewModel dönüşümü (ProcurementFileDetailMapper)
     */
    static toDetailView(dto: ProcurementFileDto): ProcurementFileDetailView {
        return ProcurementFileDetailMapper.toDetailView(dto);
    }
}
