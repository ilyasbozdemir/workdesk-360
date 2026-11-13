import { IhtiyacListesiType } from '../../templates/ihtiyac-listesi'
import { DocumentDataResolver, DocumentResolutionContext } from '@worksuite-360/document-engine'
import { DefaultDocumentResolver } from './DefaultDocumentResolver'

/**
 * @purpose İhtiyaç Listesi Belge Çözücüsü
 * @source DATA_TeminKalem, DATA_TeminDosyasi, TANIM_Kurum, TANIM_Personel
 * @scope dosyaId
 * @usedBy ihtiyac-listesi
 * @see packages/document-templates/src/templates/ihtiyac-listesi/data.mapping.ts
 *
 * Veri çözümleme Document Engine ve DefaultDocumentResolver tarafından yürütülür.
 * Bu sınıf geriye dönük uyumluluk için DefaultDocumentResolver sarmalayıcısıdır.
 * Şablona özel paralel SQL sorguları çalıştırmaz.
 */
export class IhtiyacListesiResolver extends DefaultDocumentResolver implements DocumentDataResolver<IhtiyacListesiType> {
  override async resolve(context: DocumentResolutionContext): Promise<IhtiyacListesiType> {
    const data = await super.resolve({
      ...context,
      templateKey: context.templateKey || 'ihtiyac_listesi'
    })
    return data as unknown as IhtiyacListesiType
  }
}
