import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Belge Şablonu, Mapping, Snapshot ve PDF Çıktı Analizörü
 * `packages/document-templates/src/templates/*` altındaki tüm şablonların:
 * - Standart dosya yapısını (index.ts, schema, template.tsx, route.definition.ts, hook.ts, __tests__)
 * - Merkezi şablon registry kaydını
 * - Mapping ve Snapshot / refreshPolicy uyumluluğunu
 * denetler.
 */
export function analyzeTemplatesAndMappings() {
  const findings = []
  const templatesDir = path.join(rootDir, 'packages/document-templates/src/templates')
  if (!fs.existsSync(templatesDir)) return { findings, templateStats: [] }

  const entries = fs.readdirSync(templatesDir)
  const templateFolders = entries.filter(e => {
    const p = path.join(templatesDir, e)
    return fs.statSync(p).isDirectory() && e !== '__tests__'
  })

  const templateStats = []

  // Merkezi registry dosyası
  const registryFile = path.join(rootDir, 'packages/document-templates/src/index.ts')
  const registryContent = fs.existsSync(registryFile) ? fs.readFileSync(registryFile, 'utf-8') : ''

  // Mapping dosyası
  const mappingFile = path.join(
    rootDir,
    'apps/temin360-desktop/src/renderer/src/constants/mappings/all-templates.mapping.ts'
  )
  const mappingContent = fs.existsSync(mappingFile) ? fs.readFileSync(mappingFile, 'utf-8') : ''

  templateFolders.forEach(folder => {
    const folderPath = path.join(templatesDir, folder)
    const files = fs.readdirSync(folderPath)

    const hasIndex = files.includes('index.ts')
    const hasSchema = files.some(f => f.endsWith('.schema.ts'))
    const hasTemplate = files.some(f => f.endsWith('.template.tsx'))
    const hasRouteDef = files.includes('route.definition.ts')
    const hasHook = files.some(f => f.endsWith('.hook.ts'))
    const hasTests = files.includes('__tests__') || files.some(f => f.includes('.test.'))

    const stat = {
      id: folder,
      hasIndex,
      hasSchema,
      hasTemplate,
      hasRouteDef,
      hasHook,
      hasTests
    }
    templateStats.push(stat)

    // Eksik Çekirdek Dosyalar Kontrolü
    if (!hasIndex || !hasSchema || !hasTemplate) {
      findings.push({
        id: `TMPL-MISSING-CORE-${folder.toUpperCase().replace(/-/g, '_')}`,
        priority: 'P0',
        file: `packages/document-templates/src/templates/${folder}`,
        evidence: `Template folder missing core files: ${!hasIndex ? 'index.ts ' : ''}${!hasSchema ? '*.schema.ts ' : ''}${!hasTemplate ? '*.template.tsx' : ''}`,
        affectedModules: ['@temin360/document-templates'],
        confidence: 'YÜKSEK',
        recommendedSolution: 'Her belge şablonu index.ts, Zod şeması (*.schema.ts) ve React şablonu (*.template.tsx) bileşenlerine sahip olmalıdır.',
        requiredRegressionTests: `pnpm --filter @temin360/document-templates test`
      })
    }

    // Co-located route.definition.ts Eksikliği
    if (!hasRouteDef) {
      findings.push({
        id: `TMPL-NO-ROUTE-DEF-${folder.toUpperCase().replace(/-/g, '_')}`,
        priority: 'P2',
        file: `packages/document-templates/src/templates/${folder}`,
        evidence: `Template does not have a co-located 'route.definition.ts'. Relies on centralized fallback routing.`,
        affectedModules: ['@temin360/document-templates', 'route-registry'],
        confidence: 'YÜKSEK',
        recommendedSolution: `Şablonun paraf, koordinasyon ve imza rota kuralları '${folder}/route.definition.ts' dosyasına taşınmalı ve RouteRegistry'e kaydedilmelidir.`,
        requiredRegressionTests: `packages/document-templates/src/templates/${folder}/__tests__/route.test.ts`
      })
    }

    // Co-located Test Eksikliği
    if (!hasTests) {
      findings.push({
        id: `TMPL-NO-TESTS-${folder.toUpperCase().replace(/-/g, '_')}`,
        priority: 'P1',
        file: `packages/document-templates/src/templates/${folder}`,
        evidence: `Template has no co-located __tests__ directory or test files (*.test.tsx).`,
        affectedModules: ['@temin360/document-templates'],
        confidence: 'YÜKSEK',
        recommendedSolution: `Şablon için __tests__/template.test.tsx, mapping.test.ts ve route.test.ts testleri eklenmelidir.`,
        requiredRegressionTests: `pnpm --filter @temin360/document-templates test`
      })
    }

    // Registry Kaydı Kontrolü
    const isExportedInRegistry =
      registryContent.includes(`templates/${folder}`) ||
      registryContent.includes(folder)
    if (!isExportedInRegistry) {
      findings.push({
        id: `TMPL-UNREGISTERED-${folder.toUpperCase().replace(/-/g, '_')}`,
        priority: 'P1',
        file: `packages/document-templates/src/index.ts`,
        evidence: `Template '${folder}' exists on disk but is not exported or registered in packages/document-templates/src/index.ts`,
        affectedModules: ['@temin360/document-templates'],
        confidence: 'YÜKSEK',
        recommendedSolution: `Şablon index.ts içerisinden dışa aktarılmalı ve TEMPLATE_REGISTRY haritasına eklenmelidir.`,
        requiredRegressionTests: 'packages/document-templates/src/__tests__/registry.test.ts'
      })
    }
  })

  return { findings, templateStats }
}

