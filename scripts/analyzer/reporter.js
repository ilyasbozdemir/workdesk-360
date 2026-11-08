import fs from 'fs'
import path from 'path'
import { rootDir } from './tsLoader.js'

/**
 * WorkDesk 360 - Raporlama Motoru
 * `reports/codebase-analysis.md` ve `reports/codebase-analysis.json` dosyalarını üretir.
 */
export function generateReports(analysisResult) {
  const reportsDir = path.join(rootDir, 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const {
    scanStats,
    allFindings,
    packageGraph,
    templateStats,
    godComponentStats
  } = analysisResult

  // 1. JSON Raporu
  const jsonPath = path.join(reportsDir, 'codebase-analysis.json')
  const jsonPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      monorepoVersion: '1.0.0-rc.12',
      analyzerVersion: '2.0.0-architectural-ast',
      totalFilesScanned: scanStats.totalFiles,
      totalLinesOfCode: scanStats.totalLines,
      findingsCount: {
        total: allFindings.length,
        p0: allFindings.filter(f => f.priority === 'P0').length,
        p1: allFindings.filter(f => f.priority === 'P1').length,
        p2: allFindings.filter(f => f.priority === 'P2').length
      }
    },
    packageGraph,
    templateStats,
    godComponentStats: godComponentStats.slice(0, 15),
    findings: allFindings
  }

  fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), 'utf-8')

  // 2. Markdown Raporu
  const mdPath = path.join(reportsDir, 'codebase-analysis.md')

  const p0Findings = allFindings.filter(f => f.priority === 'P0')
  const p1Findings = allFindings.filter(f => f.priority === 'P1')
  const p2Findings = allFindings.filter(f => f.priority === 'P2')

  const mdLines = [
    `# WorkDesk 360 — Mimari Teknik Borç ve Kod Analiz Raporu (V2)`,
    ``,
    `> **Raporlama Tarihi:** ${new Date().toLocaleString('tr-TR')}  `,
    `> **Analiz Motoru:** AST Tabanlı Mimari Analiz Motoru (V2.0)  `,
    `> **Taranan Dosya:** ${scanStats.totalFiles.toLocaleString('tr-TR')} | **Toplam Satır:** ${scanStats.totalLines.toLocaleString('tr-TR')}`,
    ``,
    `---`,
    ``,
    `## 1. Yönetici Özeti ve Temel Bulgular`,
    ``,
    `| Öncelik | Tanım | Adet | Durum |`,
    `|---|---|:---:|:---:|`,
    `| 🔴 **P0 (Kritik)** | Mimari sınır ihlalleri, güvenlik ve veri kaybı riskleri | **${p0Findings.length}** | Acil Müdahale |`,
    `| 🟡 **P1 (Yüksek)** | God-Component, mükerrer veri çözümleme ve yapısal klonlar | **${p1Findings.length}** | Planlı Refactoring |`,
    `| ⚪ **P2 (Orta)** | Co-located eksiklikler, kullanılmayan yardımcı kodlar | **${p2Findings.length}** | Teknik İyileştirme |`,
    `| **Toplam** | **Sistem Geneli Mimari Bulgu Sayısı** | **${allFindings.length}** | **Aktif İzleme** |`,
    ``,
    `---`,
    ``,
    `## 2. Paket Bağımlılık ve Mimari Akış Grafiği`,
    ``,
    `Mevcut monorepo paketleri ve izin verilen bağımlılık yönleri aşağıdaki Mermaid şemasında gösterilmiştir:`,
    ``,
    `\`\`\`mermaid`,
    `flowchart TD`,
    `    subgraph Apps["Masaüstü Uygulamaları"]`,
    `        A1["temin360-desktop"]`,
    `        A2["ihale360-desktop"]`,
    `        A3["flowdesk-desktop"]`,
    `        A4["app-workspace"]`,
    `    end`,
    ``,
    `    subgraph Packages["Çekirdek Paketler"]`,
    `        P1["@temin360/contracts"]`,
    `        P2["@worksuite-360/contracts"]`,
    `        P3["@dt/database"]`,
    `        P4["@worksuite-360/document-engine"]`,
    `        P5["@temin360/document-templates"]`,
    `        P6["@temin360/pdf-generator"]`,
    `    end`,
    ``,
    `    A1 --> P5`,
    `    A1 --> P3`,
    `    A1 --> P4`,
    `    A1 --> P1`,
    `    A4 --> P2`,
    `    P5 --> P4`,
    `    P5 --> P1`,
    `    P4 --> P1`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 3. En Riskli God-Component Sıralaması (Çok Boyutlu Skor)`,
    ``,
    `| Sıra | Bileşen Dosyası | Satır | Hook Sayısı | State / Effect | Doğrudan IPC | God Skoru |`,
    `|:---:|---|:---:|:---:|:---:|:---:|:---:|`
  ]

  godComponentStats.slice(0, 10).forEach((gc, idx) => {
    mdLines.push(
      `| ${idx + 1} | \`${gc.file}\` | ${gc.lines} | ${gc.totalHooks} | ${gc.stateCount} / ${gc.effectCount} | ${gc.directIpcCallCount} | **${gc.godScore}** |`
    )
  })

  mdLines.push(
    ``,
    `---`,
    ``,
    `## 4. Detaylı Bulgu Listesi (ID, Kanıt ve Önerilen Çözüm)`,
    ``
  )

  const renderFindingBlock = (f) => {
    return [
      `### [${f.id}] — Öncelik: ${f.priority}`,
      `- **Dosya ve Satır:** \`${f.file}\``,
      `- **Etkilenen Modüller:** ${f.affectedModules.map(m => `\`${m}\``).join(', ')}`,
      `- **Güven Düzeyi:** ${f.confidence}`,
      `- **Somut Kanıt:**`,
      `  > \`${f.evidence}\``,
      `- **Önerilen Çözüm:** ${f.recommendedSolution}`,
      `- **Gerekli Regresyon Testi:** \`${f.requiredRegressionTests}\``,
      ``
    ].join('\n')
  }

  if (p0Findings.length > 0) {
    mdLines.push(`### 🔴 P0 — Kritik Mimari Bulgular`, ``)
    p0Findings.forEach(f => mdLines.push(renderFindingBlock(f)))
  }

  if (p1Findings.length > 0) {
    mdLines.push(`### 🟡 P1 — Yüksek Öncelikli Bulgular`, ``)
    p1Findings.forEach(f => mdLines.push(renderFindingBlock(f)))
  }

  if (p2Findings.length > 0) {
    mdLines.push(`### ⚪ P2 — Orta Öncelikli Teknik İyileştirmeler`, ``)
    p2Findings.forEach(f => mdLines.push(renderFindingBlock(f)))
  }

  mdLines.push(
    `---`,
    ``,
    `## 5. Şablon Mimarisi Durum Tablosu (Co-location Matrisi)`,
    ``,
    `| Şablon Adı | Schema (.schema.ts) | Template (.template.tsx) | Rota (.route.definition.ts) | Hook (.hook.ts) | Testler |`,
    `|---|:---:|:---:|:---:|:---:|:---:|`
  )

  templateStats.forEach(ts => {
    mdLines.push(
      `| \`${ts.id}\` | ${ts.hasSchema ? '✅' : '❌'} | ${ts.hasTemplate ? '✅' : '❌'} | ${ts.hasRouteDef ? '✅' : '⚠️ Merkezi'} | ${ts.hasHook ? '✅' : '—'} | ${ts.hasTests ? '✅' : '⚠️'} |`
    )
  })

  mdLines.push(
    ``,
    `---`,
    ``,
    `*WorkDesk 360 pnpm analyze V2 Mimari Analiz Motoru tarafından otomatik üretilmiştir.*`
  )

  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf-8')

  return { jsonPath, mdPath }
}

