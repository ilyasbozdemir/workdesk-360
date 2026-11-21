import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Layers,
  Link2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@renderer/utils/cn";

export interface DbSignedDocItem {
  id: number;
  belge_adi: string;
  is_signed: number;
  imzali_dosya_yolu: string;
  dosya_yolu?: string;
  belge_tarihi?: string;
  veri_json?: string;
  created_at?: string;
  targetTemplateCode?: string;
  sayfaAraligi?: string;
}

interface ImzaliBelgelerYonetimModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDosyaId: number | null;
  teminNo?: string;
  templateOptions: Array<{ code: string; title: string; stageName: string }>;
  onUploadNew: () => void;
  onRefreshParent: () => void;
}

export function ImzaliBelgelerYonetimModal({
  isOpen,
  onClose,
  activeDosyaId,
  teminNo,
  templateOptions,
  onUploadNew,
  onRefreshParent,
}: ImzaliBelgelerYonetimModalProps): React.JSX.Element | null {
  const [docs, setDocs] = useState<DbSignedDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<
    { msg: string; type: "success" | "error" } | null
  >(null);

  // Veritabanındaki tüm imzalı ve yüklenen belgeleri çek
  const fetchDocs = async () => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) return;
    try {
      setLoading(true);
      const res = await window.electron.ipcRenderer.invoke(
        "db:query",
        `SELECT id, dosya_id, temin_dosya_id, belge_adi, is_signed, imzali_dosya_yolu, dosya_yolu, belge_tarihi, veri_json, created_at 
         FROM DATA_TeminBelge 
         WHERE (temin_dosya_id = ? OR dosya_id = ?) 
         ORDER BY id DESC`,
        [activeDosyaId, activeDosyaId],
      );

      if (res?.success && Array.isArray(res.data)) {
        const parsed: DbSignedDocItem[] = res.data.map((d: any) => {
          let targetCode = "";
          let sayfa = "";
          if (d.veri_json) {
            try {
              const p = typeof d.veri_json === "string"
                ? JSON.parse(d.veri_json)
                : d.veri_json;
              targetCode = p?.targetTemplateCode || "";
              sayfa = p?.sayfaAraligi || "";
            } catch {
              // ignore
            }
          }
          return {
            ...d,
            targetTemplateCode: targetCode,
            sayfaAraligi: sayfa,
          };
        });
        setDocs(parsed);
      } else {
        setDocs([]);
      }
    } catch (err) {
      console.error("[ImzaliBelgelerYonetimModal] Hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen, activeDosyaId]);

  if (!isOpen || typeof document === "undefined") return null;

  // Eşleşen şablonu güncelle (Kullanıcı manuel değiştirdiğinde)
  const handleUpdateTemplateMapping = async (
    docId: number,
    newTargetCode: string,
  ) => {
    if (!window.electron?.ipcRenderer) return;
    try {
      setSavingId(docId);
      const targetDoc = docs.find((d) => d.id === docId);
      let currentJson: any = {};
      if (targetDoc?.veri_json) {
        try {
          currentJson = typeof targetDoc.veri_json === "string"
            ? JSON.parse(targetDoc.veri_json)
            : targetDoc.veri_json;
        } catch {
          currentJson = {};
        }
      }
      currentJson.targetTemplateCode = newTargetCode;

      await window.electron.ipcRenderer.invoke(
        "db:run",
        `UPDATE DATA_TeminBelge SET veri_json = ? WHERE id = ?`,
        [JSON.stringify(currentJson), docId],
      );

      setDocs((prev) =>
        prev.map((
          d,
        ) => (d.id === docId
          ? {
            ...d,
            targetTemplateCode: newTargetCode,
            veri_json: JSON.stringify(currentJson),
          }
          : d)
        )
      );
      setFeedback({ msg: "Belge eşleştirmesi güncellendi.", type: "success" });
      setTimeout(() => setFeedback(null), 3000);
      onRefreshParent();
    } catch (err) {
      console.error("Eşleme güncelleme hatası:", err);
      setFeedback({ msg: "Güncelleme yapılamadı.", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  // İmzalı belge kaydını sil
  const handleDeleteDoc = async (docId: number, title: string) => {
    if (!window.electron?.ipcRenderer) return;
    const confirmed = window.confirm(
      `"${title}" imzalı belge kaydını dosyadan silmek istediğinize emin misiniz?`,
    );
    if (!confirmed) return;

    try {
      await window.electron.ipcRenderer.invoke(
        "db:run",
        "DELETE FROM DATA_TeminBelge WHERE id = ?",
        [docId],
      );
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setFeedback({
        msg: "İmzalı belge dosyadan kaldırıldı.",
        type: "success",
      });
      setTimeout(() => setFeedback(null), 3000);
      onRefreshParent();
    } catch (err) {
      console.error("Silme hatası:", err);
      setFeedback({ msg: "Belge silinemedi.", type: "error" });
    }
  };

  // Harici PDF Okuyucuda Aç
  const handleOpenFile = async (filePath: string) => {
    if (!window.electron?.ipcRenderer || !filePath) return;
    try {
      await window.electron.ipcRenderer.invoke("workspace:open-file", filePath);
    } catch (e) {
      console.error("Dosya açma hatası:", e);
    }
  };

  const filteredDocs = docs.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.belge_adi?.toLowerCase().includes(q) ||
      d.imzali_dosya_yolu?.toLowerCase().includes(q) ||
      d.targetTemplateCode?.toLowerCase().includes(q)
    );
  });

  const matchedCount = docs.filter((d) => Boolean(d.targetTemplateCode)).length;
  const standaloneCount = docs.length - matchedCount;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. ÜST BAŞLIK */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  İmzalı Belge & Nüsha Yönetim Masası
                </h3>
                {teminNo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {teminNo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dosyaya yüklenen ıslak imzalı taranmış PDF nüshalarını, şablon
                eşleşmelerini ve arşiv durumlarını yönetin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. BİLGİLENDİRME & İSTATİSTİK ŞERİDİ */}
        <div className="bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Layers size={14} className="text-blue-500" />
              <span>Toplam:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-black">
                {docs.length} İmzalı Belge
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Süreçle Eşleşen:</span>
              <span className="font-mono font-black">{matchedCount}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
              <FileText size={14} className="text-slate-400" />
              <span>Bağımsız Ek Belge:</span>
              <span className="font-mono font-black">{standaloneCount}</span>
            </div>
          </div>

          {feedback && (
            <div
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in",
                feedback.type === "success"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300",
              )}
            >
              <CheckCircle2 size={13} />
              <span>{feedback.msg}</span>
            </div>
          )}
        </div>

        {/* 3. ARAMA VE FİLTRE ÇUBUĞU */}
        <div className="px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İmzalı belge veya dosya adı ara..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchDocs}
            disabled={loading}
            className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Listeyi yeniden tara"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-emerald-500" : ""}
            />
            <span>Yenile</span>
          </button>
        </div>

        {/* 4. BELGE LİSTESİ (TABLO GÖRÜNÜMÜ) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 min-h-[240px]">
          {loading
            ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="text-xs font-bold">
                  İmzalı belgeler taranıyor...
                </span>
              </div>
            )
            : filteredDocs.length === 0
            ? (
              <div className="py-16 text-center text-slate-400 space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <FileCheck size={24} />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {search
                    ? "Aramaya uygun imzalı belge bulunamadı"
                    : "Bu dosyada henüz kayıtlı ıslak imzalı belge yok"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Resmî makamlardan, komisyon üyelerinden veya yüklenicilerden
                  gelen ıslak imzalı taranmış evrakları sisteme
                  yükleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUploadNew();
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Upload size={14} />
                  <span>+ İlk İmzalı Belgeyi Yükle</span>
                </button>
              </div>
            )
            : (
              filteredDocs.map((doc, idx) => {
                const fileName = doc.imzali_dosya_yolu
                  ? doc.imzali_dosya_yolu.split(/[/\\]/).pop()
                  : doc.belge_adi;
                const isMatched = Boolean(doc.targetTemplateCode);

                return (
                  <div
                    key={`signed-row-${doc.id}-${idx}`}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Sol: İkon + Dosya ve Belge Bilgileri */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60 mt-0.5">
                        <FileCheck size={20} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                            {doc.belge_adi || "İsimsiz İmzalı Belge"}
                          </span>

                          <span
                            className={cn(
                              "text-[9px] font-extrabold px-2 py-0.5 rounded-md border",
                              isMatched
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                            )}
                          >
                            {isMatched
                              ? "Süreç Şablonu Eşleşti"
                              : "Bağımsız Ek Belge"}
                          </span>

                          {doc.sayfaAraligi && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Sayfa: {doc.sayfaAraligi}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap font-medium">
                          <span
                            className="truncate max-w-xs font-mono text-slate-600 dark:text-slate-300"
                            title={doc.imzali_dosya_yolu}
                          >
                            📄 {fileName}
                          </span>

                          {doc.belge_tarihi && (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar size={11} className="text-slate-400" />
                              <span>{doc.belge_tarihi.slice(0, 10)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orta: Eşleşen Şablon Seçici (Dropdown) */}
                    <div className="flex flex-col gap-1 shrink-0 w-full md:w-64">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Link2 size={11} className="text-blue-500" />
                        <span>Eşleşen Süreç Şablonu:</span>
                      </label>
                      <select
                        value={doc.targetTemplateCode || ""}
                        onChange={(e) =>
                          handleUpdateTemplateMapping(doc.id, e.target.value)}
                        disabled={savingId === doc.id}
                        className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">
                          -- Bağımsız Belge (Eşleşme Yok) --
                        </option>
                        {templateOptions.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            [{opt.stageName.slice(0, 8)}] {opt.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sağ: Aksiyon Butonları (Aç & Sil) */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenFile(
                            doc.imzali_dosya_yolu || doc.dosya_yolu || "",
                          )}
                        className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="PDF dosyasını harici okuyucuda aç"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">Aç</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.belge_adi)}
                        className="w-8 h-8 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="İmzalı Belge Kaydını Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
        </div>

        {/* 5. ALT AKSİYON BARI */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-500" />
            <span>
              Islak imzalı nüshalar taranarak yüklendiğinde otomatik eşleşir
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadNew();
              }}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>+ Yeni İmzalı Nüsha Yükle</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
