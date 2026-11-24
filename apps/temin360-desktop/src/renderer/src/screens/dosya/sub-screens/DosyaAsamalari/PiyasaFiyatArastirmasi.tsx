import React, { useState } from "react";
import { Layers, Sparkles } from "lucide-react";
import { PiyasaFiyatArastirmasiNew } from "./PiyasaFiyatArastirmasi.new";
import { PiyasaFiyatArastirmasiOld } from "./PiyasaFiyatArastirmasi.old";

export function PiyasaFiyatArastirmasi(): React.JSX.Element {
  const [useOldView, setUseOldView] = useState<boolean>(() => {
    try {
      return localStorage.getItem("temin360_use_old_piyasa_view") === "true";
    } catch {
      return false;
    }
  });

  const toggleViewMode = (): void => {
    setUseOldView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("temin360_use_old_piyasa_view", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <div className="relative">
      {/* Üst Görünüm Geçiş Butonu */}
      <div className="sticky top-2 z-40 flex justify-end px-4 mb-2">
        <button
          type="button"
          onClick={toggleViewMode}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-100/90 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700/50 dark:border-slate-300"
          title={useOldView ? "Yeni Görünüme Geç" : "Eski Tasarıma Dön"}
        >
          {useOldView
            ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Yeni Görünüme Geç</span>
              </>
            )
            : (
              <>
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>🏛️ Eski Tasarıma Dön</span>
              </>
            )}
        </button>
      </div>

      {/* Seçili Ekran */}
      {useOldView
        ? <PiyasaFiyatArastirmasiOld />
        : <PiyasaFiyatArastirmasiNew />}
    </div>
  );
}

export default PiyasaFiyatArastirmasi;
