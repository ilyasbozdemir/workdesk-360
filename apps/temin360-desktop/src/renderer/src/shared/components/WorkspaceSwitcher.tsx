import React from "react";
import { Coins, ShoppingCart } from "lucide-react";
import { useWorkspaceContextStore } from "@renderer/store/workspaceContextStore";

export const WorkspaceSwitcher: React.FC = () => {
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceContextStore();

  const handleSwitch = (target: "procurement" | "finance") => {
    setActiveWorkspace(target);
  };

  return (
    <div
      className="flex items-center select-none"
      title="Doğrudan Temin & Satın Alma Masası (4734 Sayılı KİK Md. 22)"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* 2'li Çalışma Masası Toggle Düğmesi */}
      <div
        className="flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-inner"
        title="Doğrudan Temin & Satın Alma Masası (4734 Sayılı KİK Md. 22)"
      >
        {/* Satın Alma Masası Butonu */}
        <button
          type="button"
          onClick={() => handleSwitch("procurement")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeWorkspace === "procurement"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-[1.02]"
              : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          title="Doğrudan Temin & Satın Alma Masası (4734 Sayılı KİK Md. 22)"
        >
          <ShoppingCart size={13} className="shrink-0" />
          <span>Doğrudan Temin (4734)</span>
        </button>

        {/* Mali Hizmetler & Muhasebe Masası Butonu */}
        <button
          type="button"
          onClick={() => handleSwitch("finance")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeWorkspace === "finance"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 scale-[1.02]"
              : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          title="Mali Hizmetler & Muhasebe Çalışma Masası (5018 Sayılı Kamu Mali Yönetimi Kanunu)"
        >
          <Coins size={13} className="shrink-0" />
          <span>Mali Hizmetler (5018)</span>
        </button>
      </div>
    </div>
  );
};
