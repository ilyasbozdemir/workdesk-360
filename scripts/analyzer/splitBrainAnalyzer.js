import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Split-Brain Resolver Analizörü
 * `documentContextResolver`, `sourceResolvers`, `previewDataLoader`, `documentCiktiResolver`,
 * `InstitutionalHeaderProvider` ve `TemplateResolver` arasındaki veri otoritelerini inceler.
 * Veri kaynaklarının tekilleştirilip tekilleştirilmediğini veya çatallanma (Split-Brain) olup olmadığını doğrular.
 */
export function analyzeSplitBrainResolvers(files) {
  const ts = getTypeScript()
  const findings = []

  const resolverFiles = {
    mainPayloadResolver: 'apps/temin360-desktop/src/main/ipc/document/documentContextResolver.ts',
    mainCiktiResolver: 'apps/temin360-desktop/src/main/ipc/document/documentCiktiResolver.ts',
    rendererDataLoader: 'apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/hooks/helpers/previewDataLoader.ts',
    rendererAntetResolver: 'packages/document-templates/src/previewData/resolveAntetAndBirim.ts',
    rendererPersonnelResolver: 'packages/document-templates/src/previewData/resolvePersonnelAndCommissions.ts',
    headerProvider: 'packages/document-templates/src/header/InstitutionalHeaderProvider.ts',
    templateResolver: 'packages/document-templates/src/resolver/TemplateResolver.ts'
  }

  // 1. Kurum / Antet Otoritesi Split-Brain İncelemesi
  // Main tarafı: settings tablosundaki activeKurumId veya is_active = 1 baz alır
  // Renderer fallback tarafı: SELECT * FROM TANIM_Kurum LIMIT 1 (aktiflik veya id gözetmeksizin)
  const rendererAntetPath = path.join(rootDir, resolverFiles.rendererAntetResolver)
  if (fs.existsSync(rendererAntetPath)) {
    const content = fs.readFileSync(rendererAntetPath, 'utf-8')
    const match = content.match(/queryExecutor\(\s*['"]SELECT\s+\*\s+FROM\s+TANIM_Kurum\s+LIMIT\s+1['"]/i)
    if (match) {
      const lineNo = content.substring(0, match.index).split('\n').length
      findings.push({
        id: 'RESOLVER-SPLIT-KURUM-001',
        priority: 'P1',
        file: `${resolverFiles.rendererAntetResolver}:L${lineNo}`,
        evidence: `queryExecutor('SELECT * FROM TANIM_Kurum LIMIT 1', []) fallback ignores settings.activeKurumId and is_active flag`,
        affectedModules: ['temin360-desktop/renderer', 'documentContextResolver'],
        confidence: 'YÜKSEK',
        recommendedSolution: 'Renderer kurum fallback sorgusu, Main documentContextResolver ile uyumlu hâle getirilmeli; settings.activeKurumId veya is_active = 1 koşulu ile çekilmeli, mümkünse doğrudan Main payload verisi tek otorite olmalıdır.',
        requiredRegressionTests: 'pnpm --filter temin360-desktop test src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/__tests__/ModularDocumentArchitecture.test.ts'
      })
    }
  }

  // 2. Birim ve İhtiyaç Yeri Adı Split-Brain İncelemesi
  // Dosyadaki harcama birimi ile antet_ek_satir arasındaki çözümleme
  const mainContextPath = path.join(rootDir, resolverFiles.mainPayloadResolver)
  if (fs.existsSync(mainContextPath)) {
    const content = fs.readFileSync(mainContextPath, 'utf-8')
    // Check if main resolver handles fallback for antet
    const hasInstitutionalProvider = content.includes('InstitutionalHeaderProvider')
    if (!hasInstitutionalProvider) {
      const lineNo = 1
      findings.push({
        id: 'RESOLVER-HEADER-ALIGNMENT-002',
        priority: 'P2',
        file: `${resolverFiles.mainPayloadResolver}:L${lineNo}`,
        evidence: `documentContextResolver does not reuse InstitutionalHeaderProvider for antet lines parsing; uses local inline parsing`,
        affectedModules: ['temin360-desktop/main', 'document-engine'],
        confidence: 'ORTA',
        recommendedSolution: 'Main katmanındaki antet ayrıştırma mantığı @worksuite-360/document-engine InstitutionalHeaderProvider kütüphanesine delege edilerek tekilleştirilmelidir.',
        requiredRegressionTests: 'packages/document-engine/src/__tests__/InstitutionalHeaderProvider.test.ts'
      })
    }
  }

  // 3. Document Cikti Resolver vs Context Resolver Kontrolü
  // Çıktı resolver'ın context resolver ile aynı veri köprüsünü paylaşıp paylaşmadığı
  const mainCiktiPath = path.join(rootDir, resolverFiles.mainCiktiResolver)
  if (fs.existsSync(mainCiktiPath)) {
    const content = fs.readFileSync(mainCiktiPath, 'utf-8')
    const callsContextResolver = content.includes('resolveDocumentPayload')
    if (!callsContextResolver) {
      findings.push({
        id: 'RESOLVER-CIKTI-DUPLICATION-003',
        priority: 'P1',
        file: `${resolverFiles.mainCiktiResolver}:L1`,
        evidence: `documentCiktiResolver re-implements separate database queries instead of invoking unified resolveDocumentPayload`,
        affectedModules: ['temin360-desktop/main/ipc/document'],
        confidence: 'YÜKSEK',
        recommendedSolution: 'documentCiktiResolver çıktısı, tek veri otoritesi olan resolveDocumentPayload üzerinden beslenmeli; mükerrer DB sorguları kaldırılmalıdır.',
        requiredRegressionTests: 'apps/temin360-desktop/src/main/ipc/__tests__/testIpc.test.ts'
      })
    }
  }

  return { findings }
}

