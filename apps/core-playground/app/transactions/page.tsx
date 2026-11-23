'use client'

import React, { useState } from 'react'
import { ActionCard } from '@/components/playground/ActionCard'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { useTargetApp } from '@/components/layout/AppContext'
import { testTransactionAction } from '@/app/actions'
import { GitCommit, ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function TransactionsPlaygroundPage() {
  const { profile } = useTargetApp()
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runScenario = async (scenario: 'commit-scenario' | 'rollback-scenario') => {
    setLoading(true)
    try {
      const res = await testTransactionAction(scenario)
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Transaction Motoru ve ACID Bütünlüğü
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          IDatabaseTransaction sözleşmesiyle atomik işlem başlatma, yürütme, commit ve rollback adımlarını görsel olarak gözlemleyin.
        </p>
      </div>

      {/* Bilgilendirme */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <div className="font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>ACID Atomicity & İzolasyon Garantisi</span>
        </div>
        <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
          Temin 360 doğrudan temin ve hakediş işlemlerinde birden fazla tabloya (dosya, komisyon, kalem, onay) eş zamanlı yazım yapılır.
          Bir hata durumunda tüm değişikliklerin sıfır veri kaybı ile geri alınabilmesi (rollback) bu sözleşmeyle garanti edilir.
        </p>
      </div>

      {/* Senaryo Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Senaryo A: Başarılı Commit */}
        <ActionCard
          title="Senaryo 1: Başarılı İşlem (COMMIT)"
          description="İşlem başlatılır, kayıt eklenir ve commit çağrısıyla veritabanına kalıcı olarak mühürlenir."
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-400">
              <div>1. conn.beginTransaction() [tx.isActive = true]</div>
              <div>2. tx.execute(INSERT INTO playground_items ...)</div>
              <div>3. tx.commit() [tx.isActive = false]</div>
              <div>4. query(SELECT ...) -&gt; Kayıt bulundu (ONAYLANDI)</div>
            </div>

            <button
              onClick={() => runScenario('commit-scenario')}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMMIT Senaryosunu Başlat</span>
            </button>
          </div>
        </ActionCard>

        {/* Senaryo B: Geri Alma (Rollback) */}
        <ActionCard
          title="Senaryo 2: Hata Durumu (ROLLBACK)"
          description="İşlem başlatılır, geçici veri yazılır ancak rollback çağrılarak veritabanı orijinal haline döner."
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1 text-slate-600 dark:text-slate-400">
              <div>1. conn.beginTransaction() [tx.isActive = true]</div>
              <div>2. tx.execute(INSERT INTO playground_items ...)</div>
              <div>3. tx.rollback() [tx.isActive = false]</div>
              <div>4. query(SELECT ...) -&gt; Kayıt bulunamadı (GERİ ALINDI)</div>
            </div>

            <button
              onClick={() => runScenario('rollback-scenario')}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ROLLBACK Senaryosunu Başlat</span>
            </button>
          </div>
        </ActionCard>
      </div>

      {/* Sonuç Ekranı */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Transaction Adım Takibi ve Sonuç
        </h3>
        <ResultDisplay result={lastResult} />
      </div>
    </div>
  )
}
