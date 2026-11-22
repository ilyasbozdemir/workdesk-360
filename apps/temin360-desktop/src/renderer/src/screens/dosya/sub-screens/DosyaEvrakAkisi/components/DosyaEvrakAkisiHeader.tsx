import React from "react";
import {
  Building2,
  CheckCircle2,
  Coins,
  FileCheck,
  FileText,
  FolderCheck,
  FolderOpen,
  RefreshCw,
  Tag,
} from "lucide-react";
import { DosyaSummaryInfo, EvrakItem } from "../types";
import { formatCurrency } from "@renderer/utils/formatters";

interface DosyaEvrakAkisiHeaderProps {
  dosyaInfo: DosyaSummaryInfo | null;
  dosyalarList?: Array<{ id: number; teminNo: string; konu: string }>;
  activeDosyaId?: number | null;
  onSelectDosya?: (id: number) => void;
  onRefresh: () => void;
  loading: boolean;
  evraklar: EvrakItem[];
  onOpenSignedDocsManagement?: () => void;
}

export const DosyaEvrakAkisiHeader: React.FC<DosyaEvrakAkisiHeaderProps> = ({
  dosyaInfo,
  activeDosyaId,
  onRefresh,
  loading,
  evraklar,
  onOpenSignedDocsManagement,
}) => {
  const signedCount =
    (evraklar || []).filter((e) => e.status === "imzali").length;
  const readyCount =
    (evraklar || []).filter((e) => e.status === "hazir").length;

  const formatAlimTuru = (tur?: string) => {
    switch (tur?.toLowerCase()) {
      case "mal":
        return "Mal Alımı";
      case "hizmet":
        return "Hizmet Alımı";
      case "danismanlik":
        return "Danışmanlık";
      case "yapim":
      case "yapim_isi":
        return "Yapım İşi";
      default:
        return tur || "Doğrudan Temin";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sol Taraf: Aktif Dosya Başlık ve Kimlik Bilgileri (Global Temin Selector ile Senkron) */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
            <FolderOpen size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                {dosyaInfo?.teminNo ||
                  (activeDosyaId
                    ? `Dosya #${activeDosyaId}`
                    : "Aktif Dosya Yok")}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shadow-xs shrink-0">
                <FolderCheck
                  size={11}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Aktif Temin Dosyası
              </span>

              {dosyaInfo && (
                <>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    <Tag size={11} className="text-slate-400" />
                    <span>{formatAlimTuru(dosyaInfo.alimTuru)}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      dosyaInfo.sozlesmeliMi
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    <span>
                      {dosyaInfo.sozlesmeliMi ? "Sözleşmeli" : "Sözleşmesiz"}
                    </span>
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate mt-1">
              {dosyaInfo?.konu || (activeDosyaId
                ? "Doğrudan Temin Evrak Akışı & Belge İnceleme"
                : "Lütfen üst bardaki Temin Seçici üzerinden aktif bir dosya belirleyiniz.")}
            </h1>
          </div>
        </div>

        {/* Sağ Taraf: Birim, Maliyet & İstatistik Rozetleri */}
        <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap justify-between lg:justify-end shrink-0">
          {dosyaInfo && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 divide-x divide-slate-200 dark:divide-slate-800">
              {dosyaInfo.harcamaBirimi && (
                <div
                  className="flex items-center gap-1.5"
                  title="Harcama Birimi"
                >
                  <Building2 size={13} className="text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {/^\d+$/.test(String(dosyaInfo.harcamaBirimi).trim())
                      ? `Birim #${dosyaInfo.harcamaBirimi}`
                      : dosyaInfo.harcamaBirimi}
                  </span>
                </div>
              )}

              <div className="pl-3 flex items-center gap-1.5">
                <Coins size={13} className="text-emerald-500" />
                <span className="text-slate-400 text-[11px]">Bedel:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(
                    dosyaInfo.netOdenen || dosyaInfo.yaklasikMaliyet,
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Sayaç Rozetleri & Yenile Butonu (Standart h-8) */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Dosyadaki toplam evrak sayısı"
            >
              <FileText size={13} className="text-slate-400" />
              <span>{evraklar.length} Belge</span>
            </span>

            {readyCount > 0 && (
              <span
                className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs"
                title="Verileri hazırlanmış ve onaylanmış belgeler"
              >
                <CheckCircle2 size={13} className="text-blue-500" />
                <span>{readyCount} Hazır</span>
              </span>
            )}

            <button
              type="button"
              onClick={onOpenSignedDocsManagement}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer group"
              title="İmzalı nüshaları ve taranmış belgeleri yönet (Listele, Eşleştir, Aç, Sil)"
            >
              <FileCheck
                size={13}
                className="text-emerald-500 group-hover:scale-110 transition-transform"
              />
              <span>{signedCount} İmzalı Nüsha</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
              title="Dosya evraklarını ve veritabanı snapshotlarını yenile"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin text-blue-500" : ""}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
