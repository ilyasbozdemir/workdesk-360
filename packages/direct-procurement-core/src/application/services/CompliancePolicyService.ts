import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import type { ProcurementFileType } from "../../domain/procurement-file/ProcurementFile";

export interface LimitCheckResult {
    isWithinLimit: boolean;
    currentLimit: number;
    estimatedCost: number;
    utilizationRate: number; // Yüzde (örn: 85.5)
    isWarningThresholdExceeded: boolean; // %90 üzerinde ise uyarı
    message: string;
}

export interface SeparationOfDutiesCheck {
    isValid: boolean;
    conflicts: Array<{
        personnelId: number;
        personnelName?: string;
        roles: string[];
        violationReason: string;
    }>;
    warnings: string[];
}

export interface RequiredAcceptanceDocumentsResult {
    procurementType: ProcurementFileType;
    requiredDocuments: string[];
    hasDeliveryReceipt: boolean; // Teslim-tesellüm (yalnızca mal alımı)
    hasTimesheet: boolean; // Puantaj cetveli (hizmet alımı)
    deliveryReceiverAuthority: string; // Ambar Memuru / Taşınır Kayıt Yetkilisi
    note: string;
}

/**
 * CompliancePolicyService
 *
 * 4734 Sayılı Kamu İhale Kanunu Madde 22/d ve 11.07.2023 tarihli Doğrudan Temin Tebliği
 * (Mevzuat No: 40666) hükümlerini denetleyen bağımsız mevzuat politikası servisidir.
 *
 * Veritabanından bağımsız (DB-agnostic) çalışır; kural motoru olarak görev yapar.
 */
export class CompliancePolicyService {
    // 2026 yılı KİK Madde 22/d Parasal Limitleri (Tebliğ uyarınca güncellenebilir)
    private static readonly LIMIT_2026_METROPOLITAN = 636800; // Büyükşehir belediyesi sınırları içindeki idareler
    private static readonly LIMIT_2026_OTHER = 212170; // Diğer idareler

    /**
     * Dosya yaklaşık maliyetinin 22/d parasal limitleri dahilinde olup olmadığını denetler.
     */
    checkMd22dLimit(
        estimatedCost: number,
        isMetropolitan = true,
        budgetYear = new Date().getFullYear(),
    ): Result<LimitCheckResult, AppError> {
        if (estimatedCost < 0) {
            return failure(
                new AppError({
                    code: "INVALID_ESTIMATED_COST",
                    message: "Yaklaşık maliyet negatif olamaz.",
                }),
            );
        }

        const currentLimit = isMetropolitan
            ? CompliancePolicyService.LIMIT_2026_METROPOLITAN
            : CompliancePolicyService.LIMIT_2026_OTHER;

        const utilizationRate = Math.round((estimatedCost / currentLimit) * 10000) / 100;
        const isWithinLimit = estimatedCost <= currentLimit;
        const isWarningThresholdExceeded = utilizationRate >= 90;

        let message = `Yaklaşık maliyet limit dahilindedir (%${utilizationRate}).`;
        if (!isWithinLimit) {
            message = `Yaklaşık maliyet (${estimatedCost.toLocaleString("tr-TR")} ₺), 4734 sayılı KİK Md. 22/d yasal sınırını (${currentLimit.toLocaleString("tr-TR")} ₺) aşmaktadır. Açık ihale usulü değerlendirilmelidir.`;
        } else if (isWarningThresholdExceeded) {
            message = `DİKKAT: Yaklaşık maliyet limitin %${utilizationRate}'ine ulaşmıştır. Yıl içi limit aşımlarına dikkat ediniz.`;
        }

        return success({
            isWithinLimit,
            currentLimit,
            estimatedCost,
            utilizationRate,
            isWarningThresholdExceeded,
            message,
        });
    }

    /**
     * Doğrudan Temin Tebliği (40666) Madde 5 uyarınca Rol İzolasyonunu (Separation of Duties) denetler.
     *
     * Kurallar:
     * 1. Harcama Yetkilisi, Muayene ve Kabul Komisyonu üyesi olamaz.
     * 2. Piyasa Fiyat Araştırması görevlisi olan kişi, Muayene ve Kabul Komisyonu başkanı olamaz.
     * 3. Gerçekleştirme Görevlisi, Harcama Yetkilisi ile aynı kişi olamaz.
     */
    validateSeparationOfDuties(params: {
        spendingAuthorizerId?: number;
        realizationOfficerId?: number;
        pfaMembers: Array<{ id: number; name?: string }>;
        acceptanceMembers: Array<{ id: number; name?: string; isChairman?: boolean }>;
    }): Result<SeparationOfDutiesCheck, AppError> {
        const conflicts: SeparationOfDutiesCheck["conflicts"] = [];
        const warnings: string[] = [];

        const {
            spendingAuthorizerId,
            realizationOfficerId,
            pfaMembers,
            acceptanceMembers,
        } = params;

        // Kural 1: Gerçekleştirme Görevlisi == Harcama Yetkilisi kontrolü
        if (
            spendingAuthorizerId &&
            realizationOfficerId &&
            spendingAuthorizerId === realizationOfficerId
        ) {
            conflicts.push({
                personnelId: spendingAuthorizerId,
                roles: ["Harcama Yetkilisi", "Gerçekleştirme Görevlisi"],
                violationReason:
                    "Harcama Yetkilisi ile Gerçekleştirme Görevlisi aynı kişi olamaz (5018 Sayılı Kanun Md. 31-33).",
            });
        }

        // Kural 2: Harcama Yetkilisi Muayene Kabul Komisyonunda yer alamaz
        if (spendingAuthorizerId) {
            const inAcceptance = acceptanceMembers.find(
                (m) => m.id === spendingAuthorizerId,
            );
            if (inAcceptance) {
                conflicts.push({
                    personnelId: spendingAuthorizerId,
                    personnelName: inAcceptance.name,
                    roles: ["Harcama Yetkilisi", "Muayene Kabul Komisyon Üyesi"],
                    violationReason:
                        "Harcama Yetkilisi kabul komisyonunda üye olarak görev alamaz (Tebliğ No: 40666).",
                });
            }
        }

        // Kural 3: PFA üyesi Kabul Komisyonu Başkanı olamaz
        for (const pfa of pfaMembers) {
            const inAcceptanceChairman = acceptanceMembers.find(
                (m) => m.id === pfa.id && m.isChairman,
            );
            if (inAcceptanceChairman) {
                conflicts.push({
                    personnelId: pfa.id,
                    personnelName: pfa.name,
                    roles: [
                        "Piyasa Fiyat Araştırma Görevlisi",
                        "Muayene Kabul Komisyon Başkanı",
                    ],
                    violationReason:
                        "Piyasa fiyat araştırması yapan personel, muayene kabul komisyonuna başkanlık edemez.",
                });
            }
        }

        return success({
            isValid: conflicts.length === 0,
            conflicts,
            warnings,
        });
    }

    /**
     * Doğrudan Temin Tebliği (40666) gereğince Alım Türüne göre zorunlu kabul belgelerini belirler.
     *
     * - Mal Alımı: Teslim Tesellüm Belgesi (Taşınır/Ambar) + Muayene ve Kabul Tutanağı.
     * - Hizmet Alımı: Hizmet İşleri Kabul Tutanağı + Puantaj Cetveli (Teslim-tesellüm DÜZENLENMEZ).
     * - Yapım İşi: KİK048/051 Geçici/Kesin Kabul Tutanağı.
     * - Danışmanlık: Danışmanlık Kabul Tutanağı.
     */
    getRequiredAcceptanceDocuments(
        procurementType: ProcurementFileType,
    ): RequiredAcceptanceDocumentsResult {
        switch (procurementType) {
            case "mal":
                return {
                    procurementType: "mal",
                    requiredDocuments: [
                        "Teslim Tesellüm Belgesi",
                        "Muayene ve Kabul Komisyonu Tutanağı",
                    ],
                    hasDeliveryReceipt: true,
                    hasTimesheet: false,
                    deliveryReceiverAuthority:
                        "Taşınır Kayıt ve Kontrol Yetkilisi / Ambar Memuru (Tek Yetkili)",
                    note: "Fiziki teslimatta tek ambar görevlisi teslim alır; komisyon daha sonra muayene eder.",
                };
            case "hizmet":
                return {
                    procurementType: "hizmet",
                    requiredDocuments: [
                        "Hizmet İşleri Kabul Tutanağı",
                        "Puantaj Cetveli / Hizmet İfa Çizelgesi",
                    ],
                    hasDeliveryReceipt: false,
                    hasTimesheet: true,
                    deliveryReceiverAuthority: "Kontrol Teşkilatı / Hizmet Denetim Görevlisi",
                    note: "Tebliğ 40666 gereği hizmet alımlarında teslim-tesellüm düzenlenmez; puantaj esastır.",
                };
            case "yapim_isi":
                return {
                    procurementType: "yapim_isi",
                    requiredDocuments: [
                        "KİK048 Geçici Kabul Tutanağı",
                        "KİK051 Kesin Kabul Tutanağı",
                        "İş Sonu Pursantaj / Hakediş Raporu",
                    ],
                    hasDeliveryReceipt: false,
                    hasTimesheet: false,
                    deliveryReceiverAuthority: "Yapım Denetim Heyeti / Şantiye Şefi",
                    note: "Yapım işlerinde KİK standart formları esastır; fen kurallarına uygunluk aranır.",
                };
            case "danismanlik":
            default:
                return {
                    procurementType: "danismanlik",
                    requiredDocuments: [
                        "Danışmanlık Hizmetleri Kabul Tutanağı",
                        "Rapor ve Çıktı Teslim Formu",
                    ],
                    hasDeliveryReceipt: false,
                    hasTimesheet: false,
                    deliveryReceiverAuthority: "Proje Yöneticisi / İlgili Şube Müdürü",
                    note: "Danışmanlık çıktısı (rapor, proje vb.) incelenerek kabul tutanağı bağlanır.",
                };
        }
    }
}
