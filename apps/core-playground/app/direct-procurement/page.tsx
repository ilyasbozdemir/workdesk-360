'use client'

import React, { useState } from 'react'
import {
  Boxes,
  Play,
  Layers,
  Sparkles,
  Printer,
  ShieldCheck,
  FileCheck2,
  Share2,
  Workflow,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { testDirectProcurementArchitectureAction } from '@/app/actions'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { StatusBadge } from '@/components/playground/StatusBadge'

interface ArchitectureTestCard {
  id: any
  title: string
  category: string
  description: string
  icon: React.ReactNode
  badge: string
}

const ARCHITECTURE_TESTS: ArchitectureTestCard[] = [
  {
    id: 'domain-entity',
    title: '1. Domain Entities & Aggregate Roots',
    category: 'Domain Layer',
    description: 'ProcurementFile nesnesi, aşama kontrolleri, yaklaşık maliyet ve iş kuralları.',
    icon: <Boxes className="w-5 h-5 text-indigo-500" />,
    badge: 'Saf Domain',
  },
  {
    id: 'repository-contract',
    title: '2. SQLite Repository Sözleşmeleri',
    category: 'Persistence Layer',
    description: 'IProcurementFileRepository ve somut SqliteProcurementFileRepository veri tabanı işlemleri.',
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    badge: 'SQLite',
  },
  {
    id: 'application-service',
    title: '3. Uygulama Servisleri (Services)',
    category: 'Application Layer',
    description: 'ProcurementFileService ile Result<T, AppError> pattern altında koordinasyon.',
    icon: <Workflow className="w-5 h-5 text-cyan-500" />,
    badge: 'Result Pattern',
  },
  {
    id: 'presentation-mappers',
    title: '4. DTO -> 2 Mapper -> 2 ViewModel',
    category: 'Presentation Layer',
    description: 'Tek bir DTO üzerinden Liste Ekranı (4 alan) ve Detay Ekranı (kilit ve yetki göstergesi) görünümü.',
    icon: <Share2 className="w-5 h-5 text-emerald-500" />,
    badge: 'Dual Mapper',
  },
  {
    id: 'printer-service',
    title: '5. Yazıcı Listeleme ve Baskı Servisi',
    category: 'DB Harici Servisler',
    description: 'PrinterService ile sistem yazıcılarını listeleme, varsayılan yazıcıyı seçme ve HTML belge basımı.',
    icon: <Printer className="w-5 h-5 text-amber-500" />,
    badge: 'IPrinterPort',
  },
  {
    id: 'compliance-policy',
    title: '6. Mevzuat Uyumluluğu & Tebliğ 40666',
    category: 'Mevzuat Motoru',
    description: '4734 md. 22/d parasal limit denetimi, Rol İzolasyonu (Separation of Duties) ve Mal vs Hizmet kabul kuralları.',
    icon: <ShieldCheck className="w-5 h-5 text-rose-500" />,
    badge: 'Tebliğ 40666',
  },
  {
    id: 'document-export',
    title: '7. EKAP Kayıt Formu & Belge Dışa Aktarımı',
    category: 'Dış Entegrasyon',
    description: 'KİK Doğrudan Temin Kayıt Formu (KİK Ek-1) JSON payload üretimi ve PDF/DOCX paketleme.',
    icon: <FileCheck2 className="w-5 h-5 text-violet-500" />,
    badge: 'EKAP JSON',
  },
  {
    id: 'direct-procurement-facade',
    title: '8. En Üst Seviye Master Facade',
    category: 'Master Orchestration',
    description: 'DirectProcurementFacade: Tüm servisleri tek bir merkezden yöneten en üst seviye uygulama cephesi.',
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    badge: 'En Üst Servis',
  },
  {
    id: 'di-container',
    title: '9. IoC / Dependency Injection Konteyneri',
    category: 'Composition Root',
    description: 'DirectProcurementContainer: Tüm servislerin lazy-loading singleton olarak çözümlenmesi.',
    icon: <Cpu className="w-5 h-5 text-purple-500" />,
    badge: 'DI Container',
  },
]

export default function DirectProcurementLaboratoryPage() {
  const [runningTest, setRunningTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const handleRunTest = async (testId: string) => {
    setRunningTest(testId)
    try {
      const res = await testDirectProcurementArchitectureAction(testId as any)
      setTestResults((prev) => ({
        ...prev,
        [testId]: res,
      }))
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [testId]: {
          success: false,
          error: err.message,
          durationMs: 0,
        },
      }))
    } finally {
      setRunningTest(null)
    }
  }

  const handleRunAll = async () => {
    setRunningTest('all')
    try {
      const res = await testDirectProcurementArchitectureAction('all')
      setTestResults((prev) => ({
        ...prev,
        all: res,
      }))
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        all: {
          success: false,
          error: err.message,
        },
      }))
    } finally {
      setRunningTest(null)
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Başlık ve Üst Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Doğrudan Temin 360 — Mimari & Test Laboratuvarı
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Next.js test ortamında Domain, Repository, Servisler, Yazıcı, Tebliğ 40666, EKAP ve En Üst Facade katmanlarının canlı testi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAll}
            disabled={runningTest !== null}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
          >
            {runningTest === 'all' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Tüm Mimariyi Test Et (9 Katman)
          </button>
        </div>
      </div>

      {/* Toplu Test Özeti (Eğer All çalıştırıldıysa) */}
      {testResults['all'] && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Tüm Mimari Katmanların Test Özeti
            </h2>
            <StatusBadge status={testResults['all'].success ? 'success' : 'error'} />
          </div>
          <ResultDisplay result={testResults['all']} />
        </div>
      )}

      {/* Test Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ARCHITECTURE_TESTS.map((test) => {
          const result = testResults[test.id]
          const isRunning = runningTest === test.id

          return (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {test.icon}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                    {test.badge}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  {test.category}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {test.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleRunTest(test.id)}
                  disabled={runningTest !== null}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition disabled:opacity-50"
                >
                  {isRunning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {isRunning ? 'Çalıştırılıyor...' : 'Testi Çalıştır'}
                </button>

                {result && (
                  <div className="mt-3">
                    <ResultDisplay result={result} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
