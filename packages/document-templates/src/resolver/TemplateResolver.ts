import { resolveTemplateData } from "./mappingResolver";
import { ProcessMapping } from "./types";

/**
 * Service class to handle template mapping resolution.
 */
export class TemplateResolver {
  private queryExecutor: (sql: string, params: any[]) => Promise<any[]>;

  constructor(queryExecutor: (sql: string, params: any[]) => Promise<any[]>) {
    this.queryExecutor = queryExecutor;
  }

  /**
   * @purpose Şablonun ProcessMapping kuralları üzerinden SQLite verilerini genel amaçlı çözümler.
   * @source ProcessMapping tanımı, SQLite tabloları (DATA_*, TANIM_*)
   * @scope activeDosyaId, templateId
   * @usedBy DefaultDocumentResolver, IhtiyacListesiResolver, LuzumMuzekkeresiResolver
   * @see packages/document-templates/src/resolver/mappingResolver.ts
   *
   * Veri çözümleme Document Engine tarafından yürütülür.
   * Bu fonksiyon ikinci bir SQL çözümleme zinciri oluşturmamalıdır.
   */
  async resolve(
    mapping: ProcessMapping,
    activeDosyaId: number,
    templateId?: string,
  ): Promise<Record<string, any>> {
    return resolveTemplateData(
      mapping,
      activeDosyaId,
      this.queryExecutor,
      templateId,
    );
  }
}
