import { LuzumMuzekkeresiType } from '../../templates/luzum-muzekkeresi'
import { DocumentDataResolver, DocumentResolutionContext } from '@worksuite-360/document-engine'
import { DefaultDocumentResolver } from './DefaultDocumentResolver'

/**
 * @purpose Lüzum Müzekkeresi Belge Çözücüsü
 * @source DATA_TeminKalem, DATA_TeminDosyasi, TANIM_Kurum, TANIM_Personel
 * @scope dosyaId
 * @usedBy luzum-muzekkeresi
 * @see packages/document-templates/src/templates/luzum-muzekkeresi/data.mapping.ts
 *
 * Veri çözümleme Document Engine ve DefaultDocumentResolver tarafından yürütülür.
 * Bu sınıf geriye dönük uyumluluk için DefaultDocumentResolver sarmalayıcısıdır.
 * Şablona özel paralel SQL sorguları çalıştırmaz.
 */
export class LuzumMuzekkeresiResolver extends DefaultDocumentResolver implements DocumentDataResolver<LuzumMuzekkeresiType> {
  override async resolve(context: DocumentResolutionContext): Promise<LuzumMuzekkeresiType> {
    const data = await super.resolve({
      ...context,
      templateKey: context.templateKey || 'luzum_muzekkeresi'
    })
    return data as unknown as LuzumMuzekkeresiType
  }
}
