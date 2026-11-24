import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";
import type {
    EditPermissionIndicator,
    ProcurementFileDetailView,
} from "../view-models/ProcurementFileDetailViewModel";

/**
 * ProcurementFileDetailMapper
 *
 * Ortak ProcurementFileDto'yu alarak Detay Ekranı için özel
 * ProcurementFileDetailView üretir.
 *
 * Sağladığı temel alan grupları:
 * - Dosya bilgileri (konu, numaralar, birim, bütçe, tutar vb.)
 * - Alım türü (mal, hizmet, yapım işi, danışmanlık etiketleri)
 * - Kilit durumu (isLocked, lockStatusLabel, lockBadgeColor, lockReason)
 * - Düzenleme yetkisi göstergesi (canEdit, editPermissionIndicator)
 */
export class ProcurementFileDetailMapper {
    private static readonly statusBadgeColors: Record<string, "gray" | "blue" | "green" | "red"> = {
        draft: "gray",
        in_progress: "blue",
        completed: "green",
        cancelled: "red",
    };

    private static readonly statusLabels: Record<string, string> = {
        draft: "Taslak",
        in_progress: "Süreç Devam Ediyor",
        completed: "Sonuçlandırıldı",
        cancelled: "İptal Edildi",
    };

    private static readonly procurementTypeLabels: Record<string, string> = {
        mal: "Mal Alımı",
        hizmet: "Hizmet Alımı",
        yapim_isi: "Yapım İşi",
        danismanlik: "Danışmanlık Hizmet Alımı",
    };

    static toDetailView(dto: ProcurementFileDto): ProcurementFileDetailView {
        const estimatedCost = dto.estimatedCost || 0;
        const formattedCost = new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(estimatedCost);

        const createdAt = dto.createdAt;
        let formattedCreatedAt: string | undefined;
        if (createdAt) {
            const dateObj = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
            if (!isNaN(dateObj.getTime())) {
                formattedCreatedAt = new Intl.DateTimeFormat("tr-TR").format(dateObj);
            }
        }

        // 3. Kilit Durumu Hesaplaması
        const isLocked = Boolean(
            dto.isLocked || dto.status === "completed" || dto.status === "cancelled",
        );
        const lockStatusLabel = isLocked
            ? "Kilitli (Salt Okunur)"
            : "Açık (İşlem Yapılabilir)";
        const lockBadgeColor = isLocked ? "red" : "green";
        const lockReason = dto.lockReason || (
            dto.status === "completed"
                ? "Dosya tamamlandığı için kilitlenmiştir."
                : dto.status === "cancelled"
                  ? "Dosya iptal edildiği için kilitlenmiştir."
                  : dto.isLocked
                    ? "Dosya kilitli durumdadır."
                    : undefined
        );

        // 4. Düzenleme Yetkisi Göstergesi
        const userHasPermission = dto.permissions?.canEdit ?? true;
        const canEdit = !isLocked && userHasPermission;
        const canApprove = !isLocked && (dto.permissions?.canApprove ?? true);
        const canDelete = !isLocked && (dto.permissions?.canDelete ?? true);

        let editPermissionIndicator: EditPermissionIndicator;
        if (isLocked) {
            editPermissionIndicator = {
                canEdit: false,
                badgeText: "Salt Okunur (Kilitli)",
                badgeColor: "gray",
                reason: lockReason,
            };
        } else if (!userHasPermission) {
            editPermissionIndicator = {
                canEdit: false,
                badgeText: "Yetki Yok",
                badgeColor: "red",
                reason: dto.permissions?.reason || "Bu dosyayı düzenleme yetkiniz bulunmamaktadır.",
            };
        } else {
            editPermissionIndicator = {
                canEdit: true,
                badgeText: "Düzenlenebilir",
                badgeColor: "green",
            };
        }

        return {
            // 1. Dosya bilgileri
            id: dto.id,
            procurementNumber: dto.procurementNumber || "—",
            documentNumber: dto.documentNumber || "—",
            subject: dto.subject,
            unitName: dto.unitName || "Belirtilmemiş Birim",
            budgetYear: dto.budgetYear || new Date().getFullYear(),
            budgetType: dto.budgetType || "Öz Bütçe",
            contractType: dto.contractType || "Doğrudan Temin",
            deliveryDays: dto.deliveryDays ?? null,
            estimatedCost,
            formattedEstimatedCost: formattedCost,
            status: dto.status,
            statusLabel: this.statusLabels[dto.status] || dto.status,
            statusBadgeColor: this.statusBadgeColors[dto.status] || "gray",
            createdAt,
            formattedCreatedAt,

            // 2. Alım türü
            procurementType: dto.procurementType,
            procurementTypeLabel:
                this.procurementTypeLabels[dto.procurementType] || dto.procurementType,

            // 3. Kilit durumu
            isLocked,
            lockStatusLabel,
            lockBadgeColor,
            lockReason,

            // 4. Düzenleme yetkisi göstergesi
            canEdit,
            canApprove,
            canDelete,
            editPermissionIndicator,
        };
    }
}
