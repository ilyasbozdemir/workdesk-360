import { IhtiyacTalepFormuType } from "../../templates/ihtiyac-talep-formu";
import {
  DocumentDataResolver,
  DocumentResolutionContext,
} from "@worksuite-360/document-engine";
import { DefaultDocumentResolver } from "./DefaultDocumentResolver";

/**
 * @purpose İhtiyaç Talep Formu Belge Çözücüsü
 * @source DATA_TeminKalem, DATA_TeminDosyasi, TANIM_Kurum, TANIM_Personel
 * @scope dosyaId
 * @usedBy ihtiyac-talep-formu
 * @see packages/document-templates/src/templates/ihtiyac-talep-formu/data.mapping.ts
 *
 * Veri çözümleme Document Engine ve DefaultDocumentResolver tarafından yürütülür.
 * Bu sınıf geriye dönük uyumluluk için DefaultDocumentResolver sarmalayıcısıdır.
 * Şablona özel paralel SQL sorguları çalıştırmaz.
 */
export class IhtiyacTalepFormuResolver extends DefaultDocumentResolver
  implements DocumentDataResolver<IhtiyacTalepFormuType> {
  override async resolve(
    context: DocumentResolutionContext,
  ): Promise<IhtiyacTalepFormuType> {
    const data = await super.resolve({
      ...context,
      templateKey: context.templateKey || "ihtiyac_talep_formu",
    });
    return data as unknown as IhtiyacTalepFormuType;
  }
}
