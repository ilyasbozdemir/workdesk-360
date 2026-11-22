/**
 * # Doğrudan Temin Domain Katmanı (Procurement File & Ecosystem Domain)
 *
 * `packages/database/src/index.ts` şema ve tablo mimarisiyle 1-e-1 örtüşen,
 * Clean Architecture ve Domain-Driven Design (DDD) prensiplerine uygun olarak
 * yapılandırılmış etki alanı modelleri ve tip tanımlarıdır.
 *
 * @author WorkDesk 360 / Temin 360
 */

// ============================================================================
// 1. DOĞRUDAN TEMİN DOSYA MODELLERİ (DATA_TeminDosyasi)
// ============================================================================
export {
    ProcurementFile,
    type ProcurementFileProps,
    type ProcurementFileType,
    type BudgetType,
    type ContractType,
    type ProcurementFileSource,
} from "./ProcurementFile";

export {
    ProcurementFileStatus,
} from "./ProcurementFileStatus";

// ============================================================================
// 2. TEMİN KALEMLERİ VE ALIM TÜRLERİ (DATA_TeminKalem)
// ============================================================================
export {
    ProcurementItem,
    type ProcurementItemProps,
    type ProcurementItemType,
} from "./ProcurementItem";

// ============================================================================
// 3. FİRMA, TEDARİKÇİ VE İSTEKLİLER (TANIM_Firma & DATA_TeminFirma)
// ============================================================================
export {
    Supplier,
    ProcurementSupplier,
    type SupplierProps,
    type ProcurementSupplierProps,
} from "../supplier/Supplier";

// ============================================================================
// 4. PİYASA FİYAT ARAŞTIRMASI VE KALEM TEKLİFLERİ (DATA_TeminKalemTeklif)
// ============================================================================
export {
    PriceOffer,
    type PriceOfferProps,
} from "../price-research/PriceOffer";

export {
    PriceResearch,
    type PriceResearchProps,
} from "../price-research/PriceResearch";

// ============================================================================
// 5. KOMİSYON VE GÖREVLENDİRME HEYETLERİ (TANIM_Komisyon & DATA_TeminKomisyon)
// ============================================================================
export {
    Commission,
    type CommissionProps,
} from "../commission/Commission";

export {
    CommissionMember,
    type CommissionMemberProps,
} from "../commission/CommissionMember";

export {
    ProcurementCommissionMember,
    type ProcurementCommissionMemberProps,
} from "../commission/ProcurementCommission";

// ============================================================================
// 6. İHTİYAÇ RAPORU VE LÜZUM MÜZEKKERESİ (DATA_IhtiyacRaporu & Kalemleri)
// ============================================================================
export {
    RequirementReport,
    RequirementItem,
    type RequirementReportProps,
    type RequirementItemProps,
    type RequirementStatus,
} from "../requirement/Requirement";

// ============================================================================
// 7. DOSYA BELGELERİ VE ONAY İŞLEMLERİ (DATA_TeminBelge)
// ============================================================================
export {
    ProcurementDocument,
    type ProcurementDocumentProps,
    type DocumentKanbanStatus,
} from "../approval/Approval";
