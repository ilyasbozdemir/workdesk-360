/**
 * @deprecated Doğrudan temin aşama ve şablon filtreleme tanımları tekil otorite olan
 * `@temin360/direct-procurement-core` paketine taşınmıştır.
 * Bu dosya geriye dönük uyumluluk (backward compatibility) köprüsü olarak korunmaktadır.
 */
export {
  type DocumentStageInfo,
  type StageTemplateItem,
  IHTIYAC_RAPORU_STAGE,
  DOCUMENT_STAGES,
  getStageById,
  getStageForTemplate,
  filterTemplatesByStage,
  getAdjacentStageTemplate
} from '@temin360/direct-procurement-core'
