'use client'

import React, { useState, useEffect } from 'react'
import { ActionCard } from '@/components/playground/ActionCard'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { useTargetApp } from '@/components/layout/AppContext'
import { testRepositoryAction } from '@/app/actions'
import { DatabaseSourceBanner } from '@/components/playground/DatabaseSourceBanner'
import { Boxes, Plus, Search, Trash2, Edit, CheckCircle } from 'lucide-react'

export default function RepositoriesPlaygroundPage() {
  const { targetApp, profile } = useTargetApp()
  const [adapter, setAdapter] = useState<'in-memory' | 'sqlite' | 'prisma'>('in-memory')
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [createName, setCreateName] = useState('John Deere')
  const [createId, setCreateId] = useState('')
  const [customId, setCustomId] = useState('item-1')
  const [updateName, setUpdateName] = useState('John Deere (Güncellendi)')

  const runOp = async (
    op: 'getAll' | 'getById' | 'create' | 'update' | 'delete' | 'exists',
    payload?: any
  ) => {
    setLoading(true)
    try {
      const res = await testRepositoryAction(adapter, op, payload, targetApp)
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  // Load initial list on mount or adapter change
  useEffect(() => {
    runOp('getAll')
  }, [adapter, targetApp])

  return (
    <div className="space-y-6">
      {/* Başlık ve Adaptör Seçici */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Repository Laboratuvarı
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Çekirdek repository sözleşmelerini (IReadRepository / IWriteRepository) farklı veri sağlayıcıları üzerinde test edin.
          </p>
        </div>

        {/* Adaptör Seçim Sekmesi */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setAdapter('in-memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              adapter === 'in-memory'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            InMemoryRepository
          </button>
          <button
            onClick={() => setAdapter('sqlite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              adapter === 'sqlite'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            SQLiteRepository
          </button>
          <button
            onClick={() => setAdapter('prisma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              adapter === 'prisma'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            PrismaRepository
          </button>
        </div>
      </div>

      {/* Aktif Veritabanı Kaynağı */}
      <DatabaseSourceBanner compact onRefreshExtra={() => runOp('getAll')} />

      {/* Aktif Bağlam Uyarısı */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <span>{profile.icon}</span>
          <span>
            Aktif Hedef Uygulama: <strong>{profile.name}</strong> ({profile.runtime})
          </span>
        </div>
        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
          Adaptör: {adapter.toUpperCase()}
        </span>
      </div>

      {/* Aksiyon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tümünü Listele */}
        <ActionCard
          title="getAll() — Tüm Kayıtlar"
          description="Veritabanındaki veya hafızadaki tüm kayıtları getirir."
        >
          <button
            onClick={() => runOp('getAll')}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Kayıtları Getir</span>
          </button>
        </ActionCard>

        {/* Yeni Kayıt Ekle */}
        <ActionCard
          title="create() — Yeni Kayıt Ekle"
          description="RepositoryBase üzerinden yeni bir entity oluşturur."
        >
          <div className="space-y-2">
            <input
              type="text"
              value={createId}
              onChange={(e) => setCreateId(e.target.value)}
              placeholder="Özel ID (İsteğe bağlı, boşsa otomatik üretilir)"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ad Soyad veya İsim"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => runOp('create', { id: createId, name: createName })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kaydet (create)</span>
            </button>
          </div>
        </ActionCard>

        {/* ID ile Getir & Exists */}
        <ActionCard
          title="getById() & exists()"
          description="Belirli bir ID ile arama ve varlık sorgusu yapar."
        >
          <div className="space-y-2">
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="ID (örn: item-1)"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runOp('getById', { id: customId })}
                disabled={loading}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                getById()
              </button>
              <button
                onClick={() => runOp('exists', { id: customId })}
                disabled={loading}
                className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                exists()
              </button>
            </div>
          </div>
        </ActionCard>

        {/* Güncelle */}
        <ActionCard
          title="update() — Kayıt Güncelle"
          description="Mevcut kaydı IWriteRepository ile günceller."
        >
          <div className="space-y-2">
            <input
              type="text"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              placeholder="Yeni İsim Değeri"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => runOp('update', { id: customId, name: updateName })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Güncelle ({customId})</span>
            </button>
          </div>
        </ActionCard>

        {/* Sil */}
        <ActionCard
          title="delete() — Kayıt Sil"
          description="ID ile eşleşen kaydı kalıcı olarak siler."
        >
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 font-mono">Hedef ID: {customId}</p>
            <button
              onClick={() => runOp('delete', { id: customId })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sil ({customId})</span>
            </button>
          </div>
        </ActionCard>
      </div>

      {/* Sonuç Ekranı */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Canlı İşlem Çıktısı
        </h3>
        <ResultDisplay result={lastResult} />
      </div>
    </div>
  )
}
