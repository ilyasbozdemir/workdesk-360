import React, { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Cpu,
  FolderSearch,
  Layers,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Terminal,
  Zap
} from 'lucide-react'
import { DriveInfo } from '../../../shared/types'

interface PythonEngineRunnerViewProps {
  drives: DriveInfo[]
  sourceDir: string
  onChangeSourceDir: (dir: string) => void
  onReportsUpdated: () => void
}

export function PythonEngineRunnerView({
  drives,
  sourceDir,
  onChangeSourceDir,
  onReportsUpdated
}: PythonEngineRunnerViewProps): React.JSX.Element {
  const [targetDir, setTargetDir] = useState<string>('D:\\E_BIRLESTIRME')
  const [runnerScheme, setRunnerScheme] = useState<string>('konu-tip')
  const [scannerDrives, setScannerDrives] = useState<string[]>([sourceDir || 'D:\\'])
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const terminalEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (sourceDir && scannerDrives.length === 0) {
      setScannerDrives([sourceDir])
    }
  }, [sourceDir])

  useEffect(() => {
    const api = window.diskAnalizAPI
    if (!api) return

    const unsubOutput = api.onPythonOutput((data) => {
      setTerminalLogs((prev) => [...prev, data.text])
    })

    const unsubExit = api.onPythonExit((data) => {
      setTerminalLogs((prev) => [
        ...prev,
        `\n[Süreç Tamamlandı: Çıkış Kodu ${data.code}]\n`
      ])
      setRunningTaskId(null)
      onReportsUpdated()
    })

    return () => {
      unsubOutput()
      unsubExit()
    }
  }, [onReportsUpdated])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs])

  const runScript = async (
    taskId: string,
    scriptName: string,
    args: string[]
  ): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api) return
    setRunningTaskId(taskId)
    setTerminalLogs((prev) => [
      ...prev,
      `\n====================================================================\n` +
        `[NATIVE PYTHON MOTORU BAŞLATILIYOR] python -u ${scriptName} ${args.join(' ')}\n` +
        `====================================================================\n`
    ])
    const res = await api.runPythonTask({ taskId, scriptName, args })
    if (!res.success) {
      setTerminalLogs((prev) => [
        ...prev,
        `\n[HATA] ${res.message || 'Python görevi başlatılamadı'}\n`
      ])
      setRunningTaskId(null)
    }
  }

  const stopScript = async (taskId: string): Promise<void> => {
    await window.diskAnalizAPI?.stopPythonTask({ taskId })
    setRunningTaskId(null)
    setTerminalLogs((prev) => [...prev, `\n[KULLANICI TARAFINDAN DURDURULDU]\n`])
  }

  const handleSelectSource = async (): Promise<void> => {
    const picked = await window.diskAnalizAPI?.selectFolderDialog()
    if (picked) onChangeSourceDir(picked)
  }

  const handleSelectTarget = async (): Promise<void> => {
    const picked = await window.diskAnalizAPI?.selectFolderDialog()
    if (picked) setTargetDir(picked)
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Dinamik Klasör & Şema Yapılandırma Kartı */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-sky-500" />
            Native Python Motoru (Win32 ctypes + ThreadPoolExecutor + os.scandir)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            3 Seviyeli Sistem İmzası Koruması + Windows 220 MAX_PATH Koruması Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kaynak Klasör */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              1. Taranacak Kaynak Klasör / Sürücü (--kaynak)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={sourceDir}
                onChange={(e) => onChangeSourceDir(e.target.value)}
                placeholder="Örn: D:\ veya E:\"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleSelectSource}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <FolderSearch className="w-3.5 h-3.5" />
                Seç
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] text-slate-400">Hızlı:</span>
              {drives.map((d) => (
                <button
                  key={`src-${d.mountPath}`}
                  onClick={() => onChangeSourceDir(d.mountPath)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                    sourceDir.toUpperCase().startsWith(d.driveCode.toUpperCase())
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {d.driveCode}
                </button>
              ))}
            </div>
          </div>

          {/* Hedef Klasör */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>2. Hedef Düzenli Arşiv Dizini (--hedef)</span>
              <button
                onClick={() => setTargetDir('D:\\E_BIRLESTIRME')}
                className="text-[10px] text-amber-500 hover:underline"
              >
                D:\E_BIRLESTIRME Sıfırla
              </button>
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                placeholder="Örn: D:\E_BIRLESTIRME"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSelectTarget}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <FolderSearch className="w-3.5 h-3.5" />
                Seç
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="text-[10px] text-slate-400">Birleştirme Düzeni:</span>
              <select
                value={runnerScheme}
                onChange={(e) => setRunnerScheme(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-[11px]"
              >
                <option value="konu-tip">Konu ve Dosya Tipine Göre (00..11 - Önerilen)</option>
                <option value="konu">Sadece Konu Klasörleri (00..11)</option>
                <option value="tip">Sadece Dosya Uzantı / Tür Kümeleri</option>
                <option value="duz">Tek Klasör Düz Aktarım</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Native Python Görev Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
        {/* Kart 1: scanner.py */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-sky-500 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> 1. Çoklu Sürücü SHA-256 Kopya
              </span>
              <span className="text-[10px] font-mono text-slate-400">scanner.py</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              ThreadPoolExecutor + 128KB Örnek + Tam SHA-256 ile çapraz disk kopyalarını bulur.
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {drives.map((d) => {
                const selected = scannerDrives.includes(d.mountPath)
                return (
                  <button
                    key={d.mountPath}
                    onClick={() => {
                      if (selected && scannerDrives.length > 1) {
                        setScannerDrives(scannerDrives.filter((p) => p !== d.mountPath))
                      } else if (!selected) {
                        setScannerDrives([...scannerDrives, d.mountPath])
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      selected
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    {selected ? '☑' : '☐'} {d.driveCode}
                  </button>
                )
              })}
              <button
                onClick={() => setScannerDrives([sourceDir])}
                className="px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-sky-400"
              >
                Aktif Dizin
              </button>
            </div>
          </div>
          <button
            disabled={!!runningTaskId || scannerDrives.length === 0}
            onClick={() => runScript('scanner', 'scanner.py', scannerDrives)}
            className="py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Kopya Taramasını Başlat</span>
          </button>
        </div>

        {/* Kart 2: inventory_cli.py */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-emerald-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> 2. Win32 & os.scandir Envanter
              </span>
              <span className="text-[10px] font-mono text-slate-400">inventory_cli.py</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Win32 Volume GUID, NTFS File ID (st_ino) ve 3 Seviyeli Sistem İmzası Koruması ile
              SQLite WAL indeksleme yapar.
            </p>
          </div>
          <button
            disabled={!!runningTaskId}
            onClick={() => runScript('inventory', 'inventory_cli.py', [sourceDir])}
            className="py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hızlı Envanter & Kalkan</span>
          </button>
        </div>

        {/* Kart 3: birlestir.py --onizleme */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-indigo-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> 3. Birleştirme Simülasyonu
              </span>
              <span className="text-[10px] font-mono text-slate-400">--onizleme</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Dosyalara dokunmadan 00..11 kurumsal konu sınıflandırmasını ve MAX_PATH yol
              kısaltmalarını simüle eder.
            </p>
          </div>
          <button
            disabled={!!runningTaskId}
            onClick={() =>
              runScript('simulasyon', 'birlestir.py', [
                'faz1',
                '--kaynak',
                sourceDir,
                '--hedef',
                targetDir,
                '--duzen',
                runnerScheme,
                '--onizleme'
              ])
            }
            className="py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simülasyonu Başlat</span>
          </button>
        </div>

        {/* Kart 4: birlestir.py --uygula */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4. Tekilleştir & Birleştir
              </span>
              <span className="text-[10px] font-mono text-slate-400">--uygula</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Kaynak dizindeki tekil dosyaları koruyarak hedef arşive düzenli şekilde kopyalar ve
              doğrular.
            </p>
          </div>
          <button
            disabled={!!runningTaskId}
            onClick={() =>
              runScript('birlestir', 'birlestir.py', [
                'faz1',
                '--kaynak',
                sourceDir,
                '--hedef',
                targetDir,
                '--duzen',
                runnerScheme,
                '--uygula'
              ])
            }
            className="py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Gerçek Aktarımı Başlat</span>
          </button>
        </div>
      </div>

      {/* Canlı Python Konsolu */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-[#07090e] text-slate-200 overflow-hidden shadow-xl">
        <div className="h-10 border-b border-slate-800 bg-[#0e131d] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-300 font-bold">
              Canlı Python Konsolu (PYTHONUNBUFFERED=1)
            </span>
            {runningTaskId ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold animate-pulse">
                ÇALIŞIYOR ({runningTaskId})
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                BOŞTA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {runningTaskId && (
              <button
                onClick={() => stopScript(runningTaskId)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
              >
                <Square className="w-3 h-3" /> Durdur
              </button>
            )}
            <button
              onClick={() => setTerminalLogs([])}
              className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg text-[11px]"
            >
              Temizle
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 select-text leading-relaxed whitespace-pre-wrap">
          {terminalLogs.length === 0 ? (
            <span className="text-slate-500 italic">
              Yukarıdaki Native Python Motoru kartlarından birini başlatın (scanner.py,
              inventory_cli.py veya birlestir.py)...
            </span>
          ) : (
            terminalLogs.join('')
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  )
}

