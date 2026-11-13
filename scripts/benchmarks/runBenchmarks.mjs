import fs from 'node:fs'
import path from 'node:path'
import { runSqliteBenchmarks } from './sqliteBenchmark.mjs'
import { runHardwareAndReactBenchmark } from './hardwareAndReactBenchmark.mjs'

async function main() {
  console.log('================================================================');
  console.log('TEMİN 360 PERFORMANS PROFİLİ VE DARBOĞAZ BENCHMARK BAŞLATILIYOR');
  console.log('================================================================\n');

  // 1. SQLite Benchmarks (100, 1.000, 10.000 Dosya)
  console.log('[1/3] SQLite Sorgu ve İndeks Performansı Ölçülüyor...');
  const sqliteResults = runSqliteBenchmarks([100, 1000, 10000], 25);

  // 2. Hardware and React Benchmarks
  console.log('\n[2/3] Düşük Donanım Benzetimi, React Render ve IPC Ölçülüyor...');
  const hardwareResults = runHardwareAndReactBenchmark();

  // 3. Document Engine Benchmarks (Önceden vitest ile ölçülen faz verileri)
  console.log('\n[3/3] Document Engine Aşama Verileri Yükleniyor...');
  const reportsDir = path.resolve(process.cwd(), 'reports');
  const deBenchPath = path.join(reportsDir, 'document-engine-benchmarks.json');
  let documentEngineResults = {};
  if (fs.existsSync(deBenchPath)) {
    documentEngineResults = JSON.parse(fs.readFileSync(deBenchPath, 'utf8'));
  }

  // 4. Rapor Nesnesi
  const finalReport = {
    metadata: {
      title: 'Temin 360 Performans Profili, Darboğaz Analizi ve Düşük Donanım Test Raporu',
      date: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    },
    sqlite: sqliteResults,
    documentEngine: documentEngineResults,
    hardwareAndReact: hardwareResults
  };

  fs.writeFileSync(
    path.join(reportsDir, 'performance-profile-report.json'),
    JSON.stringify(finalReport, null, 2),
    'utf-8'
  );

  console.log('\n--> Rapor JSON başarıyla oluşturuldu: reports/performance-profile-report.json');
}

main().catch(err => {
  console.error('Benchmark sırasında hata:', err);
  process.exit(1);
});

