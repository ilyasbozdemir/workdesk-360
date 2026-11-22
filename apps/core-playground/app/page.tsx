'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Boxes,
  Database,
  GitCommit,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  Layers,
  Sparkles,
  Server
} from 'lucide-react'
import { useTargetApp, APP_PROFILES, TargetApp } from '@/components/layout/AppContext'
import { testDatabaseAction, testCommonAction } from './actions'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { StatusBadge } from '@/components/playground/StatusBadge'

export default function DashboardPage() {
  const { targetApp, profile, setTargetApp } = useTargetApp()
  const [quickTestResult, setQuickTestResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const handleQuickSmokeTest = async () => {
    setRunning(true)
    try {
      const dbHealth = await testDatabaseAction('health')
      const commonTest = await testCommonAction('result-ok', {
        activeApp: profile.name,
        timestamp: new Date().toISOString()
      })
      setQuickTestResult({
        testName: 'Hızlı Sistem & Çekirdek Sözleşme Doğrulaması',
        success: dbHealth.success && commonTest.success,
        durationMs: (dbHealth.durationMs || 0) + (commonTest.durationMs || 0),
        data: {
          activeTargetApp: profile.name,
          dbStatus: dbHealth.data,
          resultContractCheck: commonTest.data
        }
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero / Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-lg border border-blue-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>WorkDesk 360 Çekirdek Doğrulama Platformu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Core Playground & Çoklu Uygulama Test Merkezi
          </h2>

          <p className="text-sm text-blue-200/90 leading-relaxed">
            <code className="text-blue-300 font-mono font-bold">@worksuite-360/core</code>{' '}
            paketini Electron veya harici bağımlılıklara ihtiyaç duymadan doğrudan çalıştırın, CRUD
            adaptörlerini, SQL sağlayıcılarını, işlem bütünlüğünü ve mevzuat kurallarını canlı test edin.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleQuickSmokeTest}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'Doğrulanıyor...' : 'Hızlı Çekirdek Doğrulama (Smoke Test)'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Seçili Uygulama:</span>
              <strong className="text-white">{profile.shortName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Duman Testi Çıktısı (varsa) */}
      {quickTestResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Hızlı Doğrulama Sonucu
            </h3>
            <button
              onClick={() => setQuickTestResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Temizle
            </button>
          </div>
          <ResultDisplay result={quickTestResult} />
        </div>
      )}

      {/* Uygulama Seçim Kartları */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Hedef Uygulama ve Bağlam Profilleri
            </h3>
            <p className="text-xs text-slate-500">
              Core paketinin hangi uygulama ekosistemine göre test edileceğini seçin
            </p>
          </div>
          <span className="text-xs text-slate-400">Üst bardaki seçici ile de değiştirebilirsiniz</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(APP_PROFILES).map((item) => {
            const isSelected = targetApp === item.id
            return (
              <div
                key={item.id}
                onClick={() => setTargetApp(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{item.icon}</span>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 space-y-0.5 font-mono">
                  <div>Engine: <span className="text-slate-700 dark:text-slate-300">{item.dbEngine}</span></div>
                  <div>Varsayılan: <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.defaultTable}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Test Modülleri Navigasyon Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Laboratuvar Modülleri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/repositories"
            className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Repository Laboratuvarı
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                InMemory, SQLite ve Prisma repository adaptörleri üzerinden CRUD, exists ve pagination testleri.
              </p>
            </div>
          </Link>

          <Link
            href="/database"
            className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Database & SQL Sağlayıcı
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                IDatabaseConnection ve IDatabaseProvider sözleşmeleriyle SQL query, execute ve connection lifecycle.
              </p>
            </div>
          </Link>

          <Link
            href="/transactions"
            className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <GitCommit className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Transaction Motoru
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Atomicity ve rollback kanıtı: Begin, insert ve commit/rollback adımlarının görsel gözlemi.
              </p>
            </div>
          </Link>

          <Link
            href="/common"
            className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Common Types & Result
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Railway-oriented Result pattern (ok/fail), EntityId ve Pagination meta hesaplayıcıları.
              </p>
            </div>
          </Link>

          <Link
            href="/errors"
            className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition-all shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Hata & Exception Yönetimi
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                AppError, ValidationError, NotFoundError ve ConflictError sınıflarının RFC 7807 uyumluluğu.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
