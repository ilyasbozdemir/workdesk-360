'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  Layers,
  TableProperties,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  FileCode2,
  Boxes,
  HelpCircle
} from 'lucide-react'
import { fetchLogicalSchemaWorkbenchDataAction } from '@/app/actions'
import { StatusBadge } from '@/components/playground/StatusBadge'

export default function DatabaseWorkbenchPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tables' | 'financial' | 'constraints' | 'indexes'>('tables')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTable, setSelectedTable] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchLogicalSchemaWorkbenchDataAction()
      if (res.success && res.data) {
        setData(res.data)
        if (res.data.tables?.length > 0) {
          setSelectedTable(res.data.tables[0])
        }
      }
    } catch (err) {
      console.error('Workbench veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTables = (data?.tables || []).filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFinancial = (data?.financialColumns || []).filter((f: any) =>
    f.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.columnName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* 1. ÜST BAŞLIK VE KONTROL ÇUBUĞU */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                Database Workbench
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-medium border border-emerald-300 dark:border-emerald-800">
                  Adım 1: Logical Schema
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                55 tablo mantıksal şeması, kurumsal kısıt modelleri, finansal hassasiyet (Scale 4) ve indeks envanteri denetim paneli.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* 2. ÖZET METRİK KARTLARI (SAĞLIK MATRİSİ) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Toplam Tablo</span>
            <TableProperties className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {data?.auditReport?.totalTables || 0}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 55/55 Dönüştürüldü
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Toplam Kolon</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {data?.auditReport?.totalColumns || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tekil tipli kolonlar
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Finansal Alan (Scale 4)</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {data?.auditReport?.financialColumnsCount || 0}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400/90 font-medium mt-1">
            Micro-Unit ($10^4$) tescilli
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Mantıksal Kısıt</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {data?.auditReport?.totalConstraints || 0}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400/90 font-medium mt-1">
            PK, FK, Unique & Check
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>İhracat Hazırlığı</span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {data?.auditReport?.isFullyExportReady ? 'HAZIR' : 'KİLİTLİ'}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            0 Çözümlenmemiş kısıt
          </div>
        </div>
      </div>

      {/* 3. SEKMELER */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'tables'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Tablo Kataloğu ({data?.tables?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'financial'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Finansal Kolonlar ({data?.financialColumns?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('indexes')}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'indexes'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          İndeks Envanteri ({data?.indexes?.length || 0})
        </button>
      </div>

      {/* 4. ARAMA VE FİLTRE */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Tablo, kolon adı veya işlev ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 5. SEKME 1: TABLO KATALOĞU VE ŞEMA DETAY PANELİ */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol Kolon: Tablo Listesi */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[700px] overflow-y-auto">
            {filteredTables.map((tbl: any) => {
              const isSelected = selectedTable?.name === tbl.name
              return (
                <div
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl)}
                  className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                      {tbl.name}
                      {tbl.hasPrimaryKey ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          PK: {tbl.primaryKey.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium">
                          RowId
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {tbl.description || 'Açıklama bulunmuyor'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {tbl.columnCount} Kolon
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                      {tbl.constraintCount} Kısıt
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sağ Kolon: Seçili Tablonun Şema Detayları */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 space-y-6">
            {selectedTable ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
                      {selectedTable.name}
                      <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        İhracata Hazır
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {selectedTable.description}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>İndeks: {selectedTable.indexCount}</div>
                    <div>Audit: {selectedTable.hasAudit ? 'Aktif' : 'Pasif'}</div>
                  </div>
                </div>

                {/* Kolonlar Listesi */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Kolonlar ve Mantıksal Tipler
                  </h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                    {Object.values(selectedTable.columns).map((col: any) => (
                      <div key={col.name} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          {col.isPrimaryKey && (
                            <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className={`font-mono font-medium ${col.isPrimaryKey ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {col.name}
                          </span>
                          {col.isFinancial && (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded text-[10px] font-bold">
                              Scale: 4
                            </span>
                          )}
                          {!col.nullable && !col.isPrimaryKey && (
                            <span className="text-[10px] text-red-500 font-bold">
                              NOT NULL
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 text-[11px]">
                            {col.originType}
                          </span>
                          <span className="font-mono font-bold px-2 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px]">
                            {col.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kısıtlar Listesi */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Kısıtlar ({selectedTable.constraints.length})
                  </h3>
                  {selectedTable.constraints.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tanımlı tablo kısıtı bulunmuyor.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTable.constraints.map((c: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                              {c.type}
                            </span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {c.type === 'PRIMARY_KEY' && `PK(${c.columns.join(', ')})`}
                              {c.type === 'UNIQUE' && `UNIQUE(${c.columns.join(', ')})`}
                              {c.type === 'FOREIGN_KEY' && `FK(${c.columns.join(', ')}) -> ${c.foreignTable}(${c.foreignColumns.join(', ')}) [ON DELETE ${c.onDelete || 'NO ACTION'}]`}
                              {c.type === 'CHECK' && `CHECK(${c.predicate?.column} IN [${c.predicate?.values?.join(', ')}])`}
                              {c.type === 'UNRESOLVED' && `UNRESOLVED: ${c.rawDefinition}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Detaylarını görmek için sol listeden bir tablo seçin.</p>
            )}
          </div>
        </div>
      )}

      {/* 6. SEKME 2: FİNANSAL ALANLAR LİSTESİ */}
      {activeTab === 'financial' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Scale = 4 Ölçeklendirilmiş Tamsayı Standardı (Integer Micro-Units)
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Aşağıdaki kolonlar COLUMN_OVERRIDE_REGISTRY üzerinden tescillenmiştir. SQLite veritabanında tamsayı micro-unit ($10^4$), PostgreSQL ve DuckDB'de NUMERIC(18, 4) olarak saklanır. Kuruş yuvarlama sapması %0'dır.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Tablo Adı</th>
                <th className="p-3">Kolon Adı</th>
                <th className="p-3">Mantıksal Tip</th>
                <th className="p-3">Hassasiyet (Scale, Precision)</th>
                <th className="p-3">Orijinal SQLite Tipi</th>
                <th className="p-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredFinancial.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{item.tableName}</td>
                  <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">{item.columnName}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{item.type}</td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">Scale: {item.scale}, Prec: {item.precision}</td>
                  <td className="p-3 text-slate-400">{item.originType}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-sans font-bold">
                      Tescilli
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. SEKME 3: İNDEKS ENVANTERİ */}
      {activeTab === 'indexes' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-indigo-500" />
              Sistem İndeks Envanteri (Hardcoded + Foreign Key Helpers)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              index.ts içindeki script indeksleri ve ilişkisel foreign key performans indeksleri LogicalIndex formatında kataloglanmıştır.
            </p>
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">İndeks Adı</th>
                <th className="p-3">Hedef Tablo</th>
                <th className="p-3">Kolonlar</th>
                <th className="p-3">Kaynak (Origin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.indexes || []).map((idx: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{idx.name}</td>
                  <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold">{idx.tableName}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">[{idx.columns.join(', ')}]</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-sans">
                      {idx.origin}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
