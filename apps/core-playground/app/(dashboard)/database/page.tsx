'use client'

import React, { useState } from 'react'
import { ActionCard } from '@/components/playground/ActionCard'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { useTargetApp } from '@/components/layout/AppContext'
import { testDatabaseAction, testAuthAction } from '@/app/actions'
import { Database, Terminal, Play, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react'

export default function DatabasePlaygroundPage() {
  const { profile } = useTargetApp()
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM playground_items ORDER BY id ASC')
  const [executeSql, setExecuteSql] = useState(
    'INSERT INTO playground_items (id, name, target_app) VALUES ("item-manual", "SQL ile Eklendi", "temin360-desktop")'
  )
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runHealth = async () => {
    setLoading(true)
    try {
      const res = await testDatabaseAction('health')
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  const runAuth = async () => {
    setLoading(true)
    try {
      const res = await testAuthAction('Acme', 'AcmeAcme')
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  const runQuery = async (customSql?: string) => {
    setLoading(true)
    try {
      const target = customSql || sqlQuery
      const res = await testDatabaseAction('query', target)
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  const runExecute = async () => {
    setLoading(true)
    try {
      const res = await testDatabaseAction('execute', executeSql, [])
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Database Bağlantısı ve SQL Sağlayıcı
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            IDatabaseProvider ve IDatabaseConnection sözleşmeleri üzerinden canlı SQL sorguları ve komutları çalıştırın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAuth}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>Acme Girişini Doğrula (Acme/AcmeAcme)</span>
          </button>

          <button
            onClick={runHealth}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Bağlantı Sağlık Kontrolü</span>
          </button>
        </div>
      </div>

      {/* Profil Detayı */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{profile.icon}</span>
            <span>Sağlayıcı: {profile.dbEngine}</span>
          </div>
          <p className="text-slate-500">
            Node.js server-side izole bağlantı havuzu ve güvenli parametre bağlama.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>IDatabaseConnection: Hazır</span>
        </div>
      </div>

      {/* SQL Sorgulama Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SQL Okuma (query) */}
        <ActionCard
          title="query() — Veri Okuma Sorgusu (SELECT)"
          description="Salt-okunur SELECT sorgularını parametreli veya ham biçimde çalıştırır."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-semibold">Örnekler:</span>
              <button
                type="button"
                onClick={() => {
                  const s = 'SELECT id, temin_no, konu, yaklasik_maliyet, tur FROM DATA_TeminDosyasi'
                  setSqlQuery(s)
                  runQuery(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold hover:bg-blue-200 cursor-pointer"
              >
                Dosyalar (DATA_TeminDosyasi)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'SELECT id, unvan, vergi_no, telefon FROM TANIM_Firma'
                  setSqlQuery(s)
                  runQuery(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-200 cursor-pointer"
              >
                Firmalar (TANIM_Firma)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'SELECT id, ad_soyad, unvan, eposta FROM TANIM_Personel'
                  setSqlQuery(s)
                  runQuery(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-semibold hover:bg-purple-200 cursor-pointer"
              >
                Personel (TANIM_Personel)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'SELECT key, value FROM settings WHERE key IN ("adminUsername", "adminName", "institutionName")'
                  setSqlQuery(s)
                  runQuery(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-200 cursor-pointer"
              >
                Ayarlar (settings)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'SELECT * FROM playground_items ORDER BY id ASC'
                  setSqlQuery(s)
                  runQuery(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Playground Items
              </button>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={() => runQuery()}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Sorguyu Çalıştır (query)</span>
            </button>
          </div>
        </ActionCard>

        {/* SQL Yazma (execute) */}
        <ActionCard
          title="execute() — Veri Değiştirme Komutu (INSERT / UPDATE)"
          description="Etkilenen satır sayısını (affectedRows) döndüren DML sorgularını çalıştırır."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-semibold">Örnek Ekleme:</span>
              <button
                type="button"
                onClick={() => {
                  const s = 'INSERT INTO TANIM_Firma (unvan, vergi_no, telefon) VALUES ("Acme Test Ortaklığı A.Ş.", "3344556677", "0212 333 4455")'
                  setExecuteSql(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold hover:bg-blue-200 cursor-pointer"
              >
                Firma Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'INSERT INTO DATA_TeminDosyasi (temin_no, konu, yaklasik_maliyet, tur) VALUES ("2026/88", "Acme Lisans ve Destek Hizmeti", 90000.00, "hizmet")'
                  setExecuteSql(s)
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-200 cursor-pointer"
              >
                Dosya Ekle
              </button>
            </div>

            <textarea
              rows={4}
              value={executeSql}
              onChange={(e) => setExecuteSql(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={runExecute}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Komutu Yürüt (execute)</span>
            </button>
          </div>
        </ActionCard>
      </div>

      {/* Sonuç Ekranı */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          SQL Sonucu / Çıktı Konsolu
        </h3>
        <ResultDisplay result={lastResult} />
      </div>
    </div>
  )
}
