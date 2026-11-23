'use client'

import React, { useState } from 'react'
import { ActionCard } from '@/components/playground/ActionCard'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { useTargetApp } from '@/components/layout/AppContext'
import { testCommonAction } from '@/app/actions'
import { CheckCircle, Hash, BookOpen } from 'lucide-react'

export default function CommonTypesPlaygroundPage() {
  const { profile } = useTargetApp()
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [prefix, setPrefix] = useState('dosya')
  const [pagTotal, setPagTotal] = useState(47)
  const [pagPage, setPagPage] = useState(2)
  const [pagLimit, setPagLimit] = useState(10)
  const [failMsg, setFailMsg] = useState('Piyasa araştırma komisyonu en az 1 üye içermelidir')

  const runTest = async (
    type: 'result-ok' | 'result-fail' | 'entity-id' | 'pagination',
    payload?: any
  ) => {
    setLoading(true)
    try {
      const res = await testCommonAction(type, payload)
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
          <CheckCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Common Types & Result Pattern
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Result&lt;T, E&gt; railway pattern, EntityId UUID üretimi ve Pagination meta hesaplamalarını deneyin.
        </p>
      </div>

      {/* Aksiyon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Result.ok() */}
        <ActionCard
          title="Result.ok(value) — Başarılı Sonuç"
          description="Hata fırlatmak yerine güvenli bir başarı nesnesi üretir."
        >
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Hedef: <code>{profile.name}</code> bağlamında onaylanan doğrudan temin nesnesi.
            </p>
            <button
              onClick={() =>
                runTest('result-ok', {
                  dosyaNo: '2026/1',
                  onaylayan: 'Ahmet ARI',
                  ihaleSekli: '22/d'
                })
              }
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Result.ok() Üret
            </button>
          </div>
        </ActionCard>

        {/* Result.fail() */}
        <ActionCard
          title="Result.fail(error) — Kontrollü Hata"
          description="Exceptionsiz akış (Railway-Oriented) için hata mesajı taşır."
        >
          <div className="space-y-2">
            <input
              type="text"
              value={failMsg}
              onChange={(e) => setFailMsg(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <button
              onClick={() => runTest('result-fail', { error: failMsg })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Result.fail() Üret
            </button>
          </div>
        </ActionCard>

        {/* EntityId */}
        <ActionCard
          title="createEntityId(prefix) — Tipli Kimlik"
          description="Prefixli, sıralanabilir ve çakışmasız EntityId stringi üretir."
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Prefix:</span>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Örn: dosya, komisyon"
                className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={() => runTest('entity-id', { prefix })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Yeni EntityId Üret</span>
            </button>
          </div>
        </ActionCard>

        {/* Pagination */}
        <ActionCard
          title="createPaginationMeta() — Sayfalama"
          description="Toplam kayıt, sayfa numarası ve limit üzerinden sayfalama hesaplar."
        >
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Toplam:</label>
                <input
                  type="number"
                  value={pagTotal}
                  onChange={(e) => setPagTotal(Number(e.target.value))}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Sayfa:</label>
                <input
                  type="number"
                  value={pagPage}
                  onChange={(e) => setPagPage(Number(e.target.value))}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Limit:</label>
                <input
                  type="number"
                  value={pagLimit}
                  onChange={(e) => setPagLimit(Number(e.target.value))}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>
            <button
              onClick={() => runTest('pagination', { total: pagTotal, page: pagPage, limit: pagLimit })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sayfalama Metasını Hesapla</span>
            </button>
          </div>
        </ActionCard>
      </div>

      {/* Sonuç Ekranı */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Canlı Tip & Sözleşme Çıktısı
        </h3>
        <ResultDisplay result={lastResult} />
      </div>
    </div>
  )
}
