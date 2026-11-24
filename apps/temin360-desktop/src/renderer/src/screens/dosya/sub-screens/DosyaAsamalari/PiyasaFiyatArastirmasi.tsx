import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Layers, Sparkles } from "lucide-react";
import { cn } from "@renderer/utils/cn";
import { PiyasaFiyatArastirmasiNew } from "./PiyasaFiyatArastirmasi.new";
import { PiyasaFiyatArastirmasiOld } from "./PiyasaFiyatArastirmasi.old";

export function PiyasaFiyatArastirmasi(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

  // URL search parametresinden (?view=old / ?view=new) çözümle
  const getViewFromUrl = (): "old" | "new" | null => {
    try {
      const searchObj = location.search as Record<string, unknown> | undefined;
      if (searchObj && typeof searchObj === "object" && "view" in searchObj) {
        const val = String(searchObj.view).toLowerCase();
        if (val === "old" || val === "new") return val;
      }
    } catch {
      // fallback
    }
    return null;
  };

  const getInitialView = (): "old" | "new" => {
    const urlView = getViewFromUrl();
    if (urlView) return urlView;
    try {
      const stored = localStorage.getItem("temin360_use_old_piyasa_view");
      if (stored === "true" || stored === "old") return "old";
    } catch {
      // fallback
    }
    return "new";
  };

  const [activeView, setActiveView] = useState<"old" | "new">(getInitialView);

  // URL değiştiğinde aktif görünümü senkronize et
  useEffect(() => {
    const urlView = getViewFromUrl();
    if (urlView && urlView !== activeView) {
      setActiveView(urlView);
    }
  }, [location.search]);

  // Görünümü değiştir ve URL ile senkronize et
  const setViewMode = (mode: "old" | "new"): void => {
    setActiveView(mode);
    try {
      localStorage.setItem(
        "temin360_use_old_piyasa_view",
        mode === "old" ? "true" : "false",
      );
    } catch (e) {
      console.error(e);
    }

    navigate({
      search: ((prev: Record<string, unknown> = {}) => ({
        ...prev,
        view: mode,
      })) as any,
    });
  };

  return (
    <div className="relative flex flex-col gap-2">
      {/* ÜST GEÇİŞ VE MEVCUT GÖRÜNÜM BİLGİ DOCK'U */}
      <div className="sticky top-2 z-40 flex items-center justify-between gap-3 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs select-none">
        {/* Sol Alan: Mevcut Aktif Görünüm Bilgisi */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <span
              className={cn(
                "w-2 h-2 rounded-full animate-pulse shrink-0",
                activeView === "new" ? "bg-blue-500 shadow-blue-500/50" : "bg-amber-500 shadow-amber-500/50",
              )}
            />
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
              Mevcut Görünüm:
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-[11px]">
              {activeView === "new" ? "⚡ Yeni Tasarım (Studio & Matris)" : "🏛️ Eski Tasarım (Klasik Form)"}
            </span>
          </div>

          <span className="hidden md:inline text-[11px] text-slate-400 dark:text-slate-500 italic">
            {activeView === "new"
              ? "• 3 Adımlı iş akışı ve dinamik teklif tablosu"
              : "• Geliştirici düzenleme ve karşılaştırma referansı"}
          </span>
        </div>

        {/* Sağ Alan: Segment Geçiş Butonları (Rotalı) */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          {/* Yeni Tasarım Butonu */}
          <button
            type="button"
            onClick={() => setViewMode("new")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
              activeView === "new"
                ? "bg-blue-600 text-white border-blue-500 shadow-xs shadow-blue-500/25"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60",
            )}
            title="Yeni Tasarıma Geç (Rota: ?view=new)"
          >
            <Sparkles
              className={cn(
                "w-3.5 h-3.5",
                activeView === "new" ? "text-amber-300" : "text-slate-400",
              )}
            />
            <span>⚡ Yeni Tasarım</span>
            {activeView === "new" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
            )}
          </button>

          {/* Eski Tasarım Butonu */}
          <button
            type="button"
            onClick={() => setViewMode("old")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
              activeView === "old"
                ? "bg-amber-500 text-white border-amber-400 shadow-xs shadow-amber-500/25"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60",
            )}
            title="Eski Tasarıma Geç (Rota: ?view=old)"
          >
            <Layers
              className={cn(
                "w-3.5 h-3.5",
                activeView === "old" ? "text-white" : "text-slate-400",
              )}
            />
            <span>🏛️ Eski Tasarım</span>
            {activeView === "old" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* SEÇİLİ EKRAN (YENİ / ESKİ) */}
      {activeView === "old" ? <PiyasaFiyatArastirmasiOld /> : <PiyasaFiyatArastirmasiNew />}
    </div>
  );
}

export default PiyasaFiyatArastirmasi;
