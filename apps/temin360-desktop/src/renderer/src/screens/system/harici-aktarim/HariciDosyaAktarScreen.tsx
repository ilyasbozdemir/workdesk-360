import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  FileCheck2,
  FileCode2,
  FolderOpen,
  Layers,
  Lock,
  Package,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import {
  executeBatchDossierSync,
  executeDossierEzmeSync,
  fetchExistingDossiers,
  findMatchingDossier,
  parseDogrudanTeminJson,
} from "./hariciAktarimService";
import {
  BatchSyncResult,
  DogrudanTeminDosyasi,
  ExistingDossierSummary,
  SyncOptions,
  SyncResult,
} from "./types";
import { downloadSampleJsonTemplate, SAMPLE_DOGRUDA_TEMIN_JSON } from "./sampleData";
import { APP_ROUTES } from "../../../constants/routeConstants";
import { emitAppEvent } from "../../../utils/appEvents";

type ActiveTab = "genel" | "malzemeler" | "teklifler" | "komisyonlar";

import * as XLSX from "xlsx";
import JSZip from "jszip";
import { onizlemeHesapla, tahminEtEslesme } from "./dtExcelService";

export default function HariciDosyaAktarScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [rawJson, setRawJson] = useState("");
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [existingDossiers, setExistingDossiers] = useState<
    ExistingDossierSummary[]
  >([]);
  const [selectedTargetId, setSelectedTargetId] = useState<
    number | "new" | null
  >(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("genel");

  const [options, setOptions] = useState<SyncOptions>({
    overwriteGeneralInfo: true,
    overwriteMaterials: true,
    overwriteOffers: true,
    overwriteCommissions: true,
    createNewIfNotFound: false,
    lockImported: true,
    lockReason: "Eski Sistemden Aktarıldı (İmzalı/Korumalı Arşiv)",
    kayitKaynagi: "eski_sistem",
    isLegacyMigration: true,
    legacyIdField: "dosyaNo",
    forceUnlockOverwrite: false,
  });

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [batchResult, setBatchResult] = useState<BatchSyncResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mevcut dosyaları yükle
  useEffect(() => {
    let isMounted = true;
    fetchExistingDossiers().then((list) => {
      if (isMounted) setExistingDossiers(Array.isArray(list) ? list : []);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // JSON çözümleme
  const parseResult = useMemo(() => {
    if (!rawJson.trim()) return null;
    return parseDogrudanTeminJson(rawJson);
  }, [rawJson]);

  const parsedData: DogrudanTeminDosyasi | null =
    (parseResult?.files && parseResult.files[activeFileIndex]) ||
    parseResult?.data ||
    null;

  // Eşleşen dosyayı otomatik tespit et
  const autoMatch = useMemo(() => {
    if (!parsedData || !Array.isArray(existingDossiers) || existingDossiers.length === 0) return null;
    return findMatchingDossier(existingDossiers, parsedData);
  }, [parsedData, existingDossiers]);

  // Etkin hedef dosya kimliği
  const effectiveTargetId = useMemo(() => {
    if (selectedTargetId !== null) return selectedTargetId;
    if (autoMatch) {
      // Eğer eşleşen dosya kilitliyse, ezmeyi önlemek için varsayılan olarak yeni dosya aç
      if (autoMatch.is_locked === 1) return "new";
      return autoMatch.id;
    }
    if (parsedData) return "new";
    return null;
  }, [selectedTargetId, autoMatch, parsedData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event): void => {
      const text = event.target?.result as string;
      setRawJson(text || "");
      setActiveFileIndex(0);
      setSyncResult(null);
      setErrorMsg(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const zip = await JSZip.loadAsync(file);
      // manifest veya liste veya dosyalar ara
      const manifestFile = zip.file("data/manifest.json") || zip.file("manifest.json");
      if (manifestFile) {
        // Statik API data.zip formatı
        const manifestStr = await manifestFile.async("string");
        const manifest = JSON.parse(manifestStr);
        if (manifest.schemaVersion && manifest.schemaVersion !== 1) {
          throw new Error(`Desteklenmeyen schemaVersion: ${manifest.schemaVersion}`);
        }
        // dosyalar/*.json topla
        const fileEntries = Object.keys(zip.files).filter(
          (k) => k.includes("dosyalar/") && k.endsWith(".json") && !k.endsWith("liste.json")
        );
        const files: any[] = [];
        for (const entry of fileEntries) {
          const content = await zip.files[entry].async("string");
          try {
            files.push(JSON.parse(content));
          } catch {}
        }
        setRawJson(JSON.stringify({ files }, null, 2));
      } else {
        // Direkt JSON içeren zip
        const jsonFiles = Object.keys(zip.files).filter((k) => k.endsWith(".json"));
        if (jsonFiles.length > 0) {
          const firstJson = await zip.files[jsonFiles[0]].async("string");
          setRawJson(firstJson);
        } else {
          throw new Error("Zip içinde JSON dosyası bulunamadı.");
        }
      }
      setActiveFileIndex(0);
      setSyncResult(null);
    } catch (err: unknown) {
      setErrorMsg(`Zip okunamadı: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = "";
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event): void => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (rows.length < 2) {
          throw new Error("Excel dosyasında yeterli veri satırı bulunamadı.");
        }
        const headers = (rows[0] as string[]).map(String);
        const mapping = tahminEtEslesme(headers, "malzeme");
        const parsed = onizlemeHesapla(rows, 0, mapping, "malzeme");
        
        // Malzeme listesini DT JSON formatına çevir
        const mat = parsed.onizleme.map((item, idx) => [
          String(idx + 1),
          item.veri.kod || "",
          item.veri.ad || "",
          item.veri.aciklama || "",
          item.veri.birim || "Adet",
          item.veri.kdvOrani || "20",
          item.veri.miktar || "1",
          item.veri.birimFiyat || "",
          item.veri.kazananFirma || "",
          item.veri.tasinirKodu || "",
          item.veri.okas || ""
        ]);

        const dtObj = {
          files: [
            {
              f: {
                "İhalesi Yapılacak Birim": "Fen İşleri Müdürlüğü",
                "İhale Tipi": "Doğrudan Temin",
                "Bütçe": "Genel Bütçe",
                "KDV": "Hariç",
                "Sunulacak Makam": "Başkanlık Makamı",
                "İhtiyaç Yeri": "Belediye Deposu",
                "Hesaplama Esası": "En düşük fiyat esasına göre",
                "Hesaplamada": "Sadece araştırma fiyatları dikkate alınacak",
                "Alım Türü": "Mal Alımı",
                "Dosya Açılış Tarihi": new Date().toISOString().slice(0, 10),
                "İşin Adı / Tanımı": file.name.replace(/\.[^/.]+$/, ""),
                "Dosya No": "EXCEL-" + Math.floor(Math.random() * 9000 + 1000),
                "Doğrudan Temin Numarası": "1",
                "Bütçe Yılı": String(new Date().getFullYear())
              },
              mat,
              tek: [],
              win: [],
              con: [],
              yak: [],
              muay: [],
              kab: []
            }
          ]
        };

        setRawJson(JSON.stringify(dtObj, null, 2));
        setActiveFileIndex(0);
        setSyncResult(null);
      } catch (err: unknown) {
        setErrorMsg(`Excel okuma hatası: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleFillSample = (): void => {
    setRawJson(SAMPLE_DOGRUDA_TEMIN_JSON);
    setActiveFileIndex(0);
    setSyncResult(null);
    setErrorMsg(null);
    setSelectedTargetId(null);
  };

  const targetDossier = typeof effectiveTargetId === "number" && Array.isArray(existingDossiers)
    ? existingDossiers.find((d) => d.id === effectiveTargetId) || null
    : null;

  const isTargetLocked = Boolean(targetDossier?.is_locked === 1);

  const handleExecuteSync = async (): Promise<void> => {
    if (!parsedData) return;
    setShowConfirm(false);
    setIsProcessing(true);
    setErrorMsg(null);
    setSyncResult(null);

    try {
      const isNewTarget = effectiveTargetId === "new";
      const targetId = isNewTarget ? null : effectiveTargetId;
      const res = await executeDossierEzmeSync(targetId, parsedData, {
        ...options,
        createNewIfNotFound: isNewTarget,
      });
      setSyncResult(res);

      // Çalışma dosyasını diske kaydet ve uygulama geneline event fırlat
      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke("workspace:save");
      }
      emitAppEvent(isNewTarget ? "dossier:created" : "dossier:updated", {
        dosyaId: res.dosyaId,
      });
      emitAppEvent("workspace:refreshed");

      const refreshed = await fetchExistingDossiers();
      setExistingDossiers(Array.isArray(refreshed) ? refreshed : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteBatchSync = async (): Promise<void> => {
    if (!parseResult?.files || parseResult.files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setBatchResult(null);

    try {
      const res = await executeBatchDossierSync(
        parseResult.files,
        existingDossiers,
        {
          ...options,
          createNewIfNotFound: true,
        },
        (current, total, item) => {
          setBatchProgress({
            current,
            total,
            title:
              item.dosyaBilgileri.isinAdi ||
              item.dosyaBilgileri.dosyaNo ||
              `Dosya ${current}`,
          });
        }
      );
      setBatchResult(res);

      // Çalışma dosyasını diske kaydet ve tüm ekranların listesini (React Query) yenile
      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke("workspace:save");
      }
      emitAppEvent("dossier:created", { count: res.successCount });
      emitAppEvent("workspace:refreshed");

      const refreshed = await fetchExistingDossiers();
      setExistingDossiers(Array.isArray(refreshed) ? refreshed : []);
    } catch (err: unknown) {
      setErrorMsg(
        `Toplu aktarım hatası: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsProcessing(false);
      setBatchProgress(null);
    }
  };

  const handleFinishAndCloseBatch = async (navigateTarget?: string): Promise<void> => {
    try {
      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke("workspace:save");
      }
      emitAppEvent("dossier:created", {
        count: batchResult?.successCount || 0,
      });
      emitAppEvent("workspace:refreshed");
      const refreshed = await fetchExistingDossiers();
      setExistingDossiers(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      console.error("Toplu aktarım tamamlama hatası:", err);
    } finally {
      setBatchModalOpen(false);
      if (navigateTarget) {
        navigate({ to: navigateTarget } as never);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Üst Başlık & Açıklama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileCode2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                Harici Dosya Entegrasyonu &amp; Ezme (JSON / Excel / Zip)
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold">
                  dosyalar.schema.json Tam Uyumlu
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Doğrudan Temin kök modelindeki (files, mat, win, kab, tek) JSON, data.zip veya Excel/CSV dosyalarını yükleyip mevcut dosyalarla eşleyin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadSampleJsonTemplate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-all shadow-xs"
            title="Standart Doğrudan Temin JSON Şablonunu İndir"
          >
            <Download size={14} />
            Örnek JSON
          </button>

          <button
            onClick={handleFillSample}
            aria-label="Örnek JSON'ı Doldur"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={14} className="text-amber-500" />
            Örnek JSON'ı Doldur
          </button>

          {/* Gizli Inputlar */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={handleZipUpload}
          />
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
          >
            <UploadCloud size={14} />
            JSON Yükle
          </button>

          <button
            onClick={() => zipInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
            title="data.zip veya yedek zip yükle"
          >
            <Package size={14} />
            data.zip
          </button>

          <button
            onClick={() => excelInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
            title="Excel (.xlsx, .xls) veya CSV yükle"
          >
            <Building2 size={14} />
            Excel/CSV
          </button>
        </div>
      </div>

      {/* JSON Girdi Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <FileCode2 size={14} />
              Gelen JSON Verisi (Doğrudan Temin Şeması)
            </label>
            {rawJson && (
              <button
                onClick={() => {
                  setRawJson("");
                  setActiveFileIndex(0);
                  setSyncResult(null);
                  setErrorMsg(null);
                }}
                className="text-xs text-rose-500 hover:underline"
              >
                Temizle
              </button>
            )}
          </div>

          <textarea
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              setActiveFileIndex(0);
              setSyncResult(null);
              setErrorMsg(null);
            }}
            placeholder='{\n  "files": [\n    {\n      "f": {\n        "Dosya No": "183259",\n        "İşin Adı / Tanımı": "Lisans Sözleşmesi"\n      }\n    }\n  ]\n}'
            className="w-full h-96 p-3.5 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-xs"
          />

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 <strong>Tekil veya Toplu Dosya Desteği:</strong> Hem tek dosya formatı (<code>f</code>, <code>mat</code>, <code>tek</code> veya <code>dosyaBilgileri</code>), hem de toplu dosya formatı (<code>files: [...]</code> veya <code>[...]</code>) otomatik tanınır.
          </p>

          {parseResult?.error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{parseResult.error}</span>
            </div>
          )}

          {/* Çoğul Dosya Seçici */}
          {parseResult?.files && parseResult.files.length > 1 && (
            <div className="p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Package size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  Toplu JSON: {parseResult.files.length} Doğrudan Temin Dosyası Bulundu
                </span>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-800">
                  Dosya {activeFileIndex + 1} / {parseResult.files.length}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  İşlem Yapılacak Dosyayı Seçin:
                </label>
                <select
                  value={activeFileIndex}
                  onChange={(e) => {
                    setActiveFileIndex(Number(e.target.value));
                    setSelectedTargetId(null);
                    setSyncResult(null);
                    setErrorMsg(null);
                  }}
                  className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  {parseResult.files.map((file, idx) => (
                    <option key={idx} value={idx}>
                      #{idx + 1} — No: {file.dosyaBilgileri.dosyaNo || 'Yok'} | {file.dosyaBilgileri.isinAdi} ({file.dosyaBilgileri.butceYili || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBatchResult(null);
                  setBatchModalOpen(true);
                }}
                disabled={isProcessing}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Layers size={14} />
                Tümünü Toplu Aktar ({parseResult.files.length} Dosyayı Senkronize Et)
              </button>
            </div>
          )}

          {parsedData && (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2
                size={16}
                className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
              />
              <div>
                <span className="font-bold">JSON Doğrulandı:</span>{" "}
                {parsedData.dosyaBilgileri.isinAdi}
                <div className="text-[11px] opacity-80 mt-1">
                  Asıl Dosya No: {parsedData.dosyaBilgileri.dosyaNo} · DT No:
                  {" "}
                  {parsedData.dosyaBilgileri.dogrudanTeminNumarasi || "Yok"}
                  {" "}
                  · Harici ID: {parsedData.id || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Eşleşme ve Önizleme Paneli */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {parsedData
            ? (
              <>
                {/* Hedef Dosya Seçimi & Ezme Kararı */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-blue-500" />
                      Hedef Dosya Seçimi ve Ezme Stratejisi
                    </h3>
                    {autoMatch && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          autoMatch.is_locked
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        {autoMatch.is_locked ? (
                          <>
                            <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                            <span>Eşleşen Dosya Kilitli (İmzalı)</span>
                          </>
                        ) : (
                          <span>🎯 Otomatik Eşleşti</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all border-slate-200 dark:border-slate-800 hover:border-blue-400">
                        <input
                          type="radio"
                          name="targetChoice"
                          checked={effectiveTargetId !== "new"}
                          onChange={() => {
                            if (autoMatch) setSelectedTargetId(autoMatch.id);
                            else if (existingDossiers.length > 0) {
                              setSelectedTargetId(existingDossiers[0].id);
                            }
                          }}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            Mevcut Dosyayı Ez / Güncelle
                            {autoMatch?.is_locked === 1 && (
                              <Lock size={12} className="text-amber-500" />
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Seçilen dosyanın parametre ve kalemleri bu verilerle
                            üzerine yazılır.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all border-slate-200 dark:border-slate-800 hover:border-blue-400">
                        <input
                          type="radio"
                          name="targetChoice"
                          checked={effectiveTargetId === "new"}
                          onChange={() => setSelectedTargetId("new")}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">
                            Yeni Dosya Olarak Ekle
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Mevcut hiçbir dosyaya dokunmadan yeni bir doğrudan
                            temin kaydı oluşturur.
                          </span>
                        </div>
                      </label>
                    </div>

                    {effectiveTargetId !== "new" && (
                      <div className="flex flex-col gap-2 mt-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Eşlenecek / Ezilecek Hedef Dosya:
                        </label>
                        <select
                          value={typeof effectiveTargetId === "number"
                            ? effectiveTargetId
                            : ""}
                          onChange={(e) =>
                            setSelectedTargetId(Number(e.target.value))}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {existingDossiers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.is_locked ? "🔒 [KİLİTLİ] " : ""}[ID: {d.id}] — {d.temin_no || "No Yok"} — {d.konu}{" "}
                              ({d.butce_yili || "Bütçe Yok"})
                            </option>
                          ))}
                        </select>

                        {isTargetLocked && (
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-col gap-2 animate-in fade-in">
                            <div className="flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                              <ShieldAlert
                                size={16}
                                className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                              />
                              <div>
                                <span>Hedef Dosya Korumalı / Kilitli: </span>
                                <span className="font-normal">
                                  {targetDossier?.lock_reason || "İmzalı / Resmi Arşiv"}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-tight">
                              Bu dosya daha önce imzalanmış veya onaylanmış olduğu için kilitlidir. Orijinal verileri korumak adına üzerine yazma işlemi varsayılan olarak engellenmiştir.
                            </p>
                            <label className="flex items-center gap-2 mt-1 cursor-pointer text-xs font-semibold text-rose-700 dark:text-rose-400">
                              <input
                                type="checkbox"
                                checked={options.forceUnlockOverwrite || false}
                                onChange={(e) =>
                                  setOptions((p) => ({
                                    ...p,
                                    forceUnlockOverwrite: e.target.checked,
                                  }))}
                                className="rounded text-rose-600 focus:ring-rose-500"
                              />
                              <span>
                                🔓 Kilidi Kaldır ve Üzerine Yazmayı Onayla (Kritik İşlem)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ezme Kapsamı Seçenekleri */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-2">
                        Ezilecek Alanlar &amp; Modüller
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.overwriteGeneralInfo}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                overwriteGeneralInfo: e.target.checked,
                              }))}
                            className="rounded text-blue-600"
                          />
                          <span>Genel Bilgiler &amp; Kodlar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.overwriteMaterials}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                overwriteMaterials: e.target.checked,
                              }))}
                            className="rounded text-blue-600"
                          />
                          <span>
                            Malzeme Kalemleri ({parsedData.malzemeler?.length ||
                              0})
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.overwriteOffers}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                overwriteOffers: e.target.checked,
                              }))}
                            className="rounded text-blue-600"
                          />
                          <span>
                            Teklifler &amp; Firmalar
                            ({parsedData.teklifler?.length || 0})
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.overwriteCommissions}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                overwriteCommissions: e.target.checked,
                              }))}
                            className="rounded text-blue-600"
                          />
                          <span>Komisyon Heyetleri</span>
                        </label>
                      </div>

                      {/* Kayıt Kaynağı & Kilit Güvenliği */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={options.lockImported !== false}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                lockImported: e.target.checked,
                              }))
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex items-center gap-1.5">
                            <Lock size={13} className="text-amber-500" />
                            <span>
                              Aktarılan dosyayı kilitli / salt-okunur arşiv olarak koru
                            </span>
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                          Aktarılan dosya, kullanıcı açıkça düzeltme yapmadığı sürece yeni sistemin taslak kurallarına veya onay zorlamalarına sokulmaz; eski imza ve içerik bütünlüğü kilitli tutulur.
                        </p>
                      </div>

                      {/* Eski Sistem / Geçmiş Veri Aktarımı Seçeneği */}
                      <div className="mt-2.5 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                          <input
                            type="checkbox"
                            checked={options.isLegacyMigration !== false}
                            onChange={(e) =>
                              setOptions((p) => ({
                                ...p,
                                isLegacyMigration: e.target.checked,
                                kayitKaynagi: e.target.checked ? "eski_sistem" : "içe_aktarim",
                              }))
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="flex items-center gap-1.5">
                            <Archive size={13} className="text-indigo-600 dark:text-indigo-400" />
                            <span>
                              Eski Sistem / Geçmiş Veri Aktarıyorum (Güvenli ID Koruma)
                            </span>
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                          Gelen verideki <strong>&quot;Dosya No&quot;</strong> (örn. 183259) portal takip numarasıdır ve asla doğrudan temin sıra numarası yapılmaz; <code>kaynak_kayit_id</code> olarak saklanır. Doğrudan temin sıra numarası varsa DT No (örn. 1) veya sıradaki max sıra numarasından atanır.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Önizleme Sekmeleri */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button
                      onClick={() => setActiveTab("genel")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === "genel"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Dosya Bilgileri
                    </button>
                    <button
                      onClick={() => setActiveTab("malzemeler")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                        activeTab === "malzemeler"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Package size={12} />
                      Malzemeler ({parsedData.malzemeler?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("teklifler")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                        activeTab === "teklifler"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Building2 size={12} />
                      Teklifler ({parsedData.teklifler?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab("komisyonlar")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                        activeTab === "komisyonlar"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Users size={12} />
                      Komisyonlar
                    </button>
                  </div>

                  {/* Sekme İçerikleri */}
                  {activeTab === "genel" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Asıl Dosya No (Kaynak ID)
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedData.dosyaBilgileri.dosyaNo || "-"}
                          </span>
                          {options.isLegacyMigration && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold">
                              Eski Kayıt ID
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Doğrudan Temin No
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedData.dosyaBilgileri.dogrudanTeminNumarasi ||
                              (options.isLegacyMigration ? "Sıradan Atanacak" : "-")}
                          </span>
                          {options.isLegacyMigration && !parsedData.dosyaBilgileri.dogrudanTeminNumarasi && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                              Max + 1
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Harici ID / EKAP No
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {parsedData.dosyaBilgileri.ekapNo || parsedData.id || "-"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 col-span-2">
                        <span className="text-[10px] text-slate-500 block">
                          İşin Adı
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {parsedData.dosyaBilgileri.isinAdi}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Alım Türü / Madde
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {parsedData.dosyaBilgileri.alimTuru}{" "}
                          ({parsedData.dosyaBilgileri.madde})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Birim / Makam
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {parsedData.dosyaBilgileri.ihalesiYapilacakBirim ||
                            "-"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          Bütçe / Yıl
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {parsedData.dosyaBilgileri.butce}{" "}
                          ({parsedData.dosyaBilgileri.butceYili})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 block">
                          KDV &amp; Hesaplama
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {parsedData.dosyaBilgileri.kdv} ·{" "}
                          {parsedData.dosyaBilgileri.hesaplamaEsasi}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === "malzemeler" && (
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-1.5">Sıra</th>
                            <th className="p-1.5">Malzeme Adı</th>
                            <th className="p-1.5">Miktar</th>
                            <th className="p-1.5">Birim Fiyat</th>
                            <th className="p-1.5">Toplam Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(parsedData.malzemeler || []).map((m, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            >
                              <td className="p-1.5 font-mono">
                                {m.siraNo || idx + 1}
                              </td>
                              <td className="p-1.5 font-medium">
                                {m.malzemeAdi}
                              </td>
                              <td className="p-1.5">
                                {m.miktar} {m.birimi || "Adet"}
                              </td>
                              <td className="p-1.5 font-mono">
                                {m.birimFiyat ? `${m.birimFiyat} ₺` : "-"}
                              </td>
                              <td className="p-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {m.toplamTutar ? `${m.toplamTutar} ₺` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "teklifler" && (
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-1.5">Firma</th>
                            <th className="p-1.5">Durum</th>
                            <th className="p-1.5">Vergi No</th>
                            <th className="p-1.5">Teklif Tutarı</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(parsedData.teklifler || []).map((t, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            >
                              <td className="p-1.5 font-medium">{t.firma}</td>
                              <td className="p-1.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    t.durum === "Kabul Edildi"
                                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {t.durum || "Teklif"}
                                </span>
                              </td>
                              <td className="p-1.5 font-mono">
                                {t.vergiNo || "-"}
                              </td>
                              <td className="p-1.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                                {t.tutarKdvHaric ? `${t.tutarKdvHaric} ₺` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "komisyonlar" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                          Yaklaşık Maliyet Komisyonu
                        </span>
                        {(parsedData.komisyonlar?.yaklasikMaliyet || []).map((
                          k,
                          i,
                        ) => (
                          <div
                            key={i}
                            className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/50"
                          >
                            <span className="font-medium">{k.adiSoyadi}</span>
                            <span className="text-slate-500">{k.gorevi}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                          Muayene ve Kabul Komisyonu
                        </span>
                        {(parsedData.komisyonlar?.muayeneKabul || []).map((
                          k,
                          i,
                        ) => (
                          <div
                            key={i}
                            className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/50"
                          >
                            <span className="font-medium">{k.adiSoyadi}</span>
                            <span className="text-slate-500">{k.gorevi}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hata Bildirimi */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Başarı Bildirimi */}
                {syncResult && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2
                        size={18}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                      <span>{syncResult.message}</span>
                    </div>
                    <div className="text-[11px] opacity-90">
                      Güncellenen Bileşenler:{" "}
                      {syncResult.updatedFields.join(", ")}
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate({
                            to: APP_ROUTES.DOSYA_MANAGE,
                            search: { id: syncResult.dosyaId },
                          })}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <FolderOpen size={14} />
                        Dosyayı Yönetim Ekranında Aç
                      </button>
                    </div>
                  </div>
                )}

                {/* Son Onay Paneli */}
                {showConfirm && (
                  <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertCircle size={16} />
                      {effectiveTargetId === "new"
                        ? "Yeni Kayıt Onayı"
                        : "Üzerine Yazma Onayı"}
                    </div>
                    {effectiveTargetId === "new"
                      ? (
                        <div>
                          Yeni doğrudan temin dosyası oluşturulacak:{" "}
                          <strong>
                            {parsedData.dosyaBilgileri.dosyaNo || "-"} —{" "}
                            {parsedData.dosyaBilgileri.isinAdi}
                          </strong>
                        </div>
                      )
                      : (
                        <div>
                          Hedef dosya:{" "}
                          <strong>
                            [ID: {effectiveTargetId}]{" "}
                            {targetDossier?.temin_no || "No Yok"} —{" "}
                            {targetDossier?.konu || "-"}
                          </strong>
                          <div className="mt-0.5">
                            Gelen JSON:{" "}
                            {parsedData.dosyaBilgileri.dosyaNo || "-"} —{" "}
                            {parsedData.dosyaBilgileri.isinAdi}
                          </div>
                        </div>
                      )}
                    <ul className="list-disc pl-5 space-y-0.5">
                      {options.overwriteGeneralInfo && (
                        <li>Genel bilgiler ve kodlar güncellenecek</li>
                      )}
                      {options.overwriteMaterials && (
                        <li>
                          Malzeme kalemleri ({parsedData.malzemeler?.length ||
                            0})
                          {effectiveTargetId !== "new" &&
                            " — mevcutlar silinip yeniden yazılacak"}
                        </li>
                      )}
                      {options.overwriteOffers && (
                        <li>
                          Teklifler ({parsedData.teklifler?.length || 0})
                          {effectiveTargetId !== "new" &&
                            " — mevcutlar silinip yeniden yazılacak"}
                        </li>
                      )}
                      {options.overwriteCommissions && (
                        <li>
                          Komisyon heyetleri
                          {effectiveTargetId !== "new" &&
                            " — mevcutlar silinip yeniden yazılacak"}
                        </li>
                      )}
                    </ul>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleExecuteSync}
                        className="px-3.5 py-1.5 rounded-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Onayla ve Uygula
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-3.5 py-1.5 rounded-lg font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}

                {/* Ana İşlem Butonu */}
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={
                    isProcessing ||
                    showConfirm ||
                    (effectiveTargetId !== "new" && isTargetLocked && !options.forceUnlockOverwrite)
                  }
                  className="w-full py-3 rounded-xl font-bold text-sm bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Veriler Eşleniyor ve Dosya Eziliyor...</span>
                    </>
                  ) : effectiveTargetId !== "new" && isTargetLocked && !options.forceUnlockOverwrite ? (
                    <>
                      <Lock size={18} className="text-amber-300" />
                      <span>Hedef Dosya Kilitli (Ezme İşlemi Engellendi)</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 size={18} />
                      <span>
                        {effectiveTargetId === "new"
                          ? "Verileri Sisteme Yeni Dosya Olarak Ekle"
                          : `Verileri Eşle ve Hedef Dosyayı (${effectiveTargetId}) Ez / Güncelle`}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </>
            )
            : (
              <div className="h-96 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
                <FileCode2
                  size={48}
                  className="mb-3 opacity-40 text-blue-500"
                />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  JSON Verisi Bekleniyor
                </h3>
                <p className="text-xs max-w-sm mt-1 text-slate-500">
                  Sol tarafa harici Doğrudan Temin JSON kodunu yapıştırın veya
                  yukarıdaki{" "}
                  <strong>&quot;Örnek JSON&apos;ı Doldur&quot;</strong>{" "}
                  butonuna tıklayarak testi başlatın.
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Toplu İçe Aktarım Modalı */}
      {batchModalOpen && parseResult?.files && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Toplu İçe Aktarım &amp; Senkronizasyon
                  </h3>
                  <p className="text-xs text-slate-500">
                    Toplam {parseResult.files.length} doğrudan temin dosyası işlenecek.
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button
                  onClick={() => handleFinishAndCloseBatch()}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* İlerleme Çubuğu */}
            {isProcessing && batchProgress && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    İşleniyor: {batchProgress.title}
                  </span>
                  <span>
                    {batchProgress.current} / {batchProgress.total} (%
                    {Math.round((batchProgress.current / batchProgress.total) * 100)})
                  </span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sonuç Özeti */}
            {batchResult && (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {batchResult.successCount}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                      Başarılı Aktarıldı
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {batchResult.lockedSkippedCount}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                      Kilitli Korunan
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                    <div className="text-xl font-bold text-rose-700 dark:text-rose-400">
                      {batchResult.failedCount}
                    </div>
                    <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-400">
                      Hatalı
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  Aktarım Grubu ID: <strong>{batchResult.aktarimGrubuId}</strong>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dosya Detayları:
                  </span>
                  <div className="space-y-1.5">
                    {batchResult.details.map((d) => (
                      <div
                        key={d.index}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-400">
                              #{d.index}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {d.dosyaNo || "No Yok"} — {d.isinAdi}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === "created"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : d.status === "updated"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                : d.status === "skipped_locked"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                            }`}
                          >
                            {d.status === "created"
                              ? "Yeni Eklendi"
                              : d.status === "updated"
                              ? "Güncellendi"
                              : d.status === "skipped_locked"
                              ? "Kilitli Korundu"
                              : "Hata"}
                          </span>
                        </div>
                        {d.error && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono pl-6">
                            ⚠️ Hata Detayı: {d.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ön Bilgilendirme (Henüz Başlamadıysa) */}
            {!isProcessing && !batchResult && (
              <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldAlert size={16} className="text-blue-500" />
                    Toplu Aktarım Kuralları ve Güvenlik
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <li>
                      Tüm dosyalar için ortak bir benzersiz <strong>Aktarım Grubu ID</strong> oluşturulacaktır.
                    </li>
                    <li>
                      Mevcut sistemde eşleşen ve <strong>kilitli/imzalı</strong> olan dosyalar asla ezilmeyecek, veri kaybını önlemek için bağımsız yeni kayıt olarak eklenecektir.
                    </li>
                    <li>
                      Yeni aktarılan dosyalar <strong>kayıt kaynağı: içe_aktarim</strong> ve <strong>kilitli/korumalı</strong> olarak kaydedilir; form kurallarına zorlanmaz.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Alt Butonlar */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              {batchResult ? (
                <div className="flex items-center justify-between w-full gap-3 flex-wrap">
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>
                      <strong>{batchResult.successCount}</strong> dosya veritabanına ve dizine kaydedildi.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFinishAndCloseBatch()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    >
                      Tamamla ve Burada Kal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFinishAndCloseBatch(APP_ROUTES.DOSYALAR)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FolderOpen size={15} />
                      Dosyalar Dizini'ne Git ({batchResult.successCount})
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setBatchModalOpen(false)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleExecuteBatchSync}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Aktarım Sürüyor...
                      </>
                    ) : (
                      <>
                        <Layers size={14} />
                        Toplu Aktarımı Başlat
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
