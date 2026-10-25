import { TemplateManager } from './TemplateManager'

export function registerLegacyMappings(manager: TemplateManager): void {
  // Map legacy route paths and files to specific V2 template IDs
  const legacyRoutesMap: Record<string, string> = {
    // 1-ihtiyac-tespiti-ve-baslangic
    'ihtiyac-listesi': 'ihtiyac-listesi',
    'malzeme-hizmet-kalem-listesi': 'ihtiyac-listesi',
    'hazirlik-ve-ihtiyac': 'ihtiyac-listesi',
    '/dosya/hazirlik-ve-ihtiyac': 'ihtiyac-listesi',
    '/dosya/malzemeler/liste': 'ihtiyac-listesi',

    'luzum-muzekkeresi': 'luzum-muzekkeresi',
    'luzum-muzekkeresi-belgesi': 'luzum-muzekkeresi',
    'luzum-muzekkeresi-onay-eki': 'luzum-muzekkeresi',
    'luzum-onay-eki': 'luzum-muzekkeresi',

    'harcama-talimati': 'harcama-talimati'
  }

  for (const [path, templateId] of Object.entries(legacyRoutesMap)) {
    manager.registerLegacyPath(path, templateId)
  }
}
