export * from './types'
export * from './registry/types'
export * from './registry/TemplateRegistry'
export * from './providers/InstitutionalHeaderProvider'
export * from './resolvers/LuzumMuzekkeresiResolver'
export * from './resolvers/IhtiyacListesiResolver'
export * from './resolvers/DefaultDocumentResolver'
export * from './renderers/LuzumMuzekkeresiRenderer'
export * from './renderers/IhtiyacListesiRenderer'
export * from './renderers/DefaultDocumentRenderer'
export * from './dosyaResolver'
export * from './ihtiyacRaporuResolver'
export * from './DocumentRenderer'
export * from './DocumentEngine'
export type { TemplateOptionItem } from '../templateResolver'

import { DocumentResolver, DocumentSource } from './types'
import { dosyaResolver } from './dosyaResolver'
import { ihtiyacRaporuResolver } from './ihtiyacRaporuResolver'

export const resolvers: Record<DocumentSource['kind'], DocumentResolver> = {
  dosya: dosyaResolver,
  ihtiyacRaporu: ihtiyacRaporuResolver
}
