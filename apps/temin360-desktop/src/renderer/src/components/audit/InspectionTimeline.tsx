import React, { useEffect, useState, useMemo } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Laptop,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Filter,
  ArrowRight,
  Link as LinkIcon,
  Lock
} from 'lucide-react'

export interface AuditLog {
  id: number
  table_name: string
  operation_type: 'UPDATE' | 'DELETE' | 'INSERT'
  record_id: number
  old_values: string | null
  new_values: string | null
  timestamp: string
  mac_hash: string
  prev_hash?: string | null
  current_hash?: string | null
  changed_by?: string
}

export interface ChainStatus {
  isValid: boolean
  totalRecords: number
  unhashedRecords: number
  brokenRecordId?: number
  error?: string
}

interface InspectionTimelineProps {
  recordId?: number
  tableName?: string
  title?: string
  className?: string
  showHeader?: boolean
}

export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  recordId,
  tableName,
  title = 'Teftiş Kurulu Veri Değişiklik Zaman Çizelgesi',
  className = '',
  showHeader = true
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [chainStatus, setChainStatus] = useState<ChainStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedOp, setSelectedOp] = useState<'ALL' | 'UPDATE' | 'DELETE' | 'TAMPER'>('ALL')
  const [copiedHashId, setCopiedHashId] = useState<number | null>(null)
  const [copiedBlockHashId, setCopiedBlockHashId] = useState<number | null>(null)

  const verifyChain = async (): Promise<void> => {
    try {
      let result: ChainStatus | null = null
      if (window.api?.verifyAuditChain) {
        result = await window.api.verifyAuditChain()
      } else if (window.electron?.ipcRenderer) {
        result = await window.electron.ipcRenderer.invoke('audit:verify-chain')
      }
      setChainStatus(result)
    } catch (err) {
      console.warn('[InspectionTimeline] Blokzincir bütünlüğü doğrulanamadı:', err)
    }
  }

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true)
    try {
      let results: AuditLog[] = []
      if (window.api?.getAuditHistory) {
        results = (await window.api.getAuditHistory({
          recordId,
          tableName
        })) as unknown as AuditLog[]
      } else if (window.electron?.ipcRenderer) {
        results = await window.electron.ipcRenderer.invoke('audit:get-history', {
          recordId,
          tableName
        })
      }
      setLogs(results || [])
      await verifyChain()
    } catch (err) {
      console.warn('[InspectionTimeline] Kayıtlar getirilemedi:', err)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [recordId, tableName])

  useEffect(() => {
    let isSubscribed = true
    const load = async (): Promise<void> => {
      try {
        let results: AuditLog[] = []
        if (window.api?.getAuditHistory) {
          results = (await window.api.getAuditHistory({
            recordId,
            tableName
          })) as unknown as AuditLog[]
        } else if (window.electron?.ipcRenderer) {
          results = await window.electron.ipcRenderer.invoke('audit:get-history', {
            recordId,
            tableName
          })
        }
        let chain: ChainStatus | null = null
        if (window.api?.verifyAuditChain) {
          chain = await window.api.verifyAuditChain()
        } else if (window.electron?.ipcRenderer) {
          chain = await window.electron.ipcRenderer.invoke('audit:verify-chain')
        }

        if (isSubscribed) {
          setLogs(results || [])
          setChainStatus(chain)
          setIsLoading(false)
        }
      } catch (err) {
        console.warn('[InspectionTimeline] Kayıtlar getirilemedi:', err)
        if (isSubscribed) {
          setLogs([])
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      isSubscribed = false
    }
  }, [recordId, tableName])

  const copyMacHash = (id: number, hash: string): void => {
    navigator.clipboard.writeText(hash)
    setCopiedHashId(id)
    setTimeout(() => setCopiedHashId(null), 2000)
  }

  const copyBlockHash = (id: number, hash: string): void => {
    navigator.clipboard.writeText(hash)
    setCopiedBlockHashId(id)
    setTimeout(() => setCopiedBlockHashId(null), 2000)
  }

  const parseJsonSafe = (str: string | null): Record<string, unknown> => {
    if (!str) return {}
    try {
      return JSON.parse(str)
    } catch {
      return { raw: str }
    }
  }

  const formatTimestamp = (raw: string): string => {
    if (!raw) return '-'
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return raw
      return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return raw
    }
  }

  // Yetkisiz dış müdahale var mı?
  const hasExternalTamper = useMemo(() => {
    return logs.some((l) => l.mac_hash === 'UNAUTHORIZED_EXTERNAL_CLIENT')
  }, [logs])

  const filteredLogs = useMemo(() => {
    if (selectedOp === 'ALL') return logs
    if (selectedOp === 'TAMPER')
      return logs.filter((l) => l.mac_hash === 'UNAUTHORIZED_EXTERNAL_CLIENT')
    return logs.filter((l) => l.operation_type === selectedOp)
  }, [logs, selectedOp])

  return (
    <div className={`p-6 max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Donanım imzalı (mac_hash) inkâr edilemez adli teftiş günlüğü
                  {tableName ? ` • Tablo: ${tableName}` : ''}
                  {recordId ? ` • Kayıt ID: ${recordId}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>
      )}

      {/* Blokzincir Bütünlük Rozeti / Alarmı */}
      {chainStatus && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
            chainStatus.isValid
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-sm animate-pulse'
          }`}
        >
          <div
            className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
              chainStatus.isValid
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300'
            }`}
          >
            {chainStatus.isValid ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                {chainStatus.isValid
                  ? '🛡️ Blokzincir Bütünlüğü Doğrulandı (Mühürlü Zincir)'
                  : '🚨 KRİTİK ALARM: Blokzincir Zincir Bütünlüğü Bozulmuş!'}
              </h4>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  chainStatus.isValid
                    ? 'bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100'
                }`}
              >
                {chainStatus.totalRecords} Mühürlü Blok
                {chainStatus.unhashedRecords > 0
                  ? ` • ${chainStatus.unhashedRecords} Bekleyen`
                  : ' • %100 Mühürlü'}
              </span>
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {chainStatus.isValid ? (
                <>
                  Tüm denetim logları SHA-256 kriptografik hash zinciri ile birbirine bağlanmış
                  ve Genesis bloğundan son satıra kadar adli bilişim (forensics) standartlarında
                  doğrulanmıştır. Kayıt silinemez ve manipüle edilemez.
                </>
              ) : (
                <>
                  <strong>{chainStatus.error}</strong>
                  <br />
                  Veritabanı dosyası harici bir araçla manipüle edilmiş veya kayıtlar aradan silinmiştir.
                  Zincir halkası koptuğu için adli geçerlilik güvenliği ihlal edilmiştir!
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Dış Müdahale Uyarısı (Eğer harici SQLite client ile değiştirilmişse) */}
      {hasExternalTamper && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-200 animate-in fade-in">
          <div className="p-1.5 bg-rose-100 dark:bg-rose-900/60 rounded-lg text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-100 flex items-center gap-1.5">
              ⚠️ Yetkisiz Dış Müdahale Tespit Edildi!
            </h4>
            <p className="leading-relaxed">
              Bu veritabanında en az bir kayıt <strong>WorkDesk 360 uygulaması dışında</strong>{' '}
              (harici SQLite DB Browser veya üçüncü taraf bir betik) ile değiştirilmiştir. Güvenli
              donanım oturum anahtarı bulunamadığı için bu kayıt adli olarak şüpheli olarak
              etiketlenmiştir.
            </p>
          </div>
        </div>
      )}

      {/* Filtre ve İstatistik Barı */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold">Filtre:</span>
          {(['ALL', 'UPDATE', 'DELETE', 'TAMPER'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOp(op)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                selectedOp === op
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {op === 'ALL' && `Tümü (${logs.length})`}
              {op === 'UPDATE' &&
                `Güncellemeler (${logs.filter((l) => l.operation_type === 'UPDATE').length})`}
              {op === 'DELETE' &&
                `Silinenler (${logs.filter((l) => l.operation_type === 'DELETE').length})`}
              {op === 'TAMPER' &&
                `Yetkisiz Değişiklik (${logs.filter((l) => l.mac_hash === 'UNAUTHORIZED_EXTERNAL_CLIENT').length})`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Toplam {logs.length} Değişiklik Kaydı
        </div>
      </div>

      {/* Yükleniyor Durumu */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-xs font-medium">Denetim günlüğü kayıtları taranıyor...</span>
        </div>
      )}

      {/* Boş Durum */}
      {!isLoading && filteredLogs.length === 0 && (
        <div className="py-12 px-4 text-center bg-white dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Değişiklik Kaydı Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {recordId
              ? `Kayıt #${recordId} için bu tabloda yapılmış herhangi bir güncelleme veya silme geçmişi bulunmamaktadır.`
              : 'Henüz kaydedilmiş bir değişiklik veya silme kaydı bulunmuyor.'}
          </p>
        </div>
      )}

      {/* Dikey Zaman Çizgisi (Timeline) */}
      {!isLoading && filteredLogs.length > 0 && (
        <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-4 sm:ml-6 space-y-6">
          {filteredLogs.map((log) => {
            const oldData = parseJsonSafe(log.old_values)
            const newData = parseJsonSafe(log.new_values)
            const allKeys = Array.from(
              new Set([...Object.keys(oldData), ...Object.keys(newData)])
            )
            const isExternal = log.mac_hash === 'UNAUTHORIZED_EXTERNAL_CLIENT'

            return (
              <div key={log.id} className="relative pl-6 sm:pl-8 group">
                {/* Zaman Çizgisi Noktası */}
                <span
                  className={`absolute -left-[11px] top-3.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-slate-50 dark:ring-slate-900 shadow-2xs transition-transform group-hover:scale-110 ${
                    isExternal
                      ? 'bg-rose-600 ring-rose-100 dark:ring-rose-950'
                      : log.operation_type === 'DELETE'
                        ? 'bg-red-500'
                        : log.operation_type === 'INSERT'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>

                {/* Log Kartı */}
                <div
                  className={`bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl shadow-2xs border transition-all ${
                    isExternal
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60'
                  }`}
                >
                  {/* Başlık ve Meta Bilgiler */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          log.operation_type === 'DELETE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : log.operation_type === 'INSERT'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {log.operation_type}
                      </span>

                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                        {log.table_name} #{log.record_id}
                      </span>

                      {log.changed_by && (
                        <span className="text-[11px] text-slate-400">
                          Kullanıcı: {log.changed_by}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Değişiklik Karşılaştırma Tablosu (Diff) */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Değişiklik Detayları (Eski Değer <ArrowRight className="w-3 h-3 inline text-slate-400" /> Yeni Değer)
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {allKeys.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Detay verisi boş.</span>
                      ) : (
                        allKeys.map((key) => {
                          const oldVal = oldData[key]
                          const newVal = newData[key]
                          const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)

                          return (
                            <div
                              key={key}
                              className={`py-1.5 text-xs grid grid-cols-1 md:grid-cols-12 gap-2 items-start ${
                                hasChanged ? 'bg-amber-50/50 dark:bg-amber-950/20 px-2 rounded' : ''
                              }`}
                            >
                              <div className="md:col-span-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                {key}
                              </div>

                              <div className="md:col-span-4 text-red-600 dark:text-red-400 font-mono bg-red-50/50 dark:bg-red-950/30 px-2 py-0.5 rounded break-all">
                                {oldVal !== undefined ? String(oldVal) : <span className="text-slate-400 italic">—</span>}
                              </div>

                              <div className="hidden md:flex md:col-span-1 justify-center text-slate-400">
                                <ArrowRight className="w-3.5 h-3.5 self-center" />
                              </div>

                              <div className="md:col-span-4 text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded break-all">
                                {newVal !== undefined ? String(newVal) : <span className="text-slate-400 italic">— (Silindi)</span>}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Donanım Kilidi İmzası (MAC Hash) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cihaz Donanım İmzası:</span>
                    </div>

                    {isExternal ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900">
                        <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        UNAUTHORIZED_EXTERNAL_CLIENT (Yetkisiz Müdahale)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 max-w-55 sm:max-w-none truncate"
                          title={log.mac_hash}
                        >
                          {log.mac_hash ? `${log.mac_hash.substring(0, 16)}...${log.mac_hash.substring(log.mac_hash.length - 8)}` : 'UNKNOWN'}
                        </span>
                        {log.mac_hash && (
                          <button
                            onClick={() => copyMacHash(log.id, log.mac_hash)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Tam SHA-256 MAC Hash Değerini Kopyala"
                          >
                            {copiedHashId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kriptografik Blokzincir Mührü (Chained Hash) */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-medium">Blokzincir Mührü:</span>
                      {log.prev_hash && (log.prev_hash.includes('WORKDESK_360_GENESIS_BLOCK') || log.prev_hash === '4a49629b31be2729938b8c56fa761ef7655d4d3148ae8e4a9e525fdad9459223') ? (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                          Genesis Blok
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      {log.prev_hash ? (
                        <div
                          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                          title={`Önceki Blok Hash (prev_hash): ${log.prev_hash}`}
                        >
                          <span className="text-[10px] text-slate-400">prev:</span>
                          <span>{log.prev_hash.substring(0, 8)}...</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Mühürsüz</span>
                      )}

                      {log.prev_hash && log.current_hash && (
                        <LinkIcon className="w-3 h-3 text-indigo-400" />
                      )}

                      {log.current_hash ? (
                        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          <span className="text-[10px] text-indigo-400">block:</span>
                          <span
                            title={`Mevcut Blok Hash (current_hash): ${log.current_hash}`}
                            className="font-bold"
                          >
                            {log.current_hash.substring(0, 8)}...{log.current_hash.substring(log.current_hash.length - 6)}
                          </span>
                          <button
                            onClick={() => copyBlockHash(log.id, log.current_hash!)}
                            className="p-0.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 rounded transition-colors"
                            title="Tam SHA-256 Blok Hash Değerini Kopyala"
                          >
                            {copiedBlockHashId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500 italic bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          Mühürleme Bekliyor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
