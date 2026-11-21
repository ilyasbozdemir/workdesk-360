import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../../utils/cn";
import {
  ChevronDown,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  FileText,
  Grid,
  List,
  Plus,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "../../../constants/routeConstants";

export function DosyalarPageHeader({
  viewMode,
  setViewMode,
  onOpenAI,
}: {
  viewMode: "grid" | "list" | "table";
  setViewMode: (mode: "grid" | "list" | "table") => void;
  onOpenAI: () => void;
  onOpenWizard?: () => void;
}): React.JSX.Element {
  const navigate = useNavigate();
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        importMenuRef.current &&
        !importMenuRef.current.contains(e.target as Node)
      ) {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const modes = [
    { id: "grid", label: "Kart", icon: Grid },
    { id: "list", label: "Liste", icon: List },
    { id: "table", label: "Tablo", icon: FileText },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-855 dark:text-white flex items-center gap-2">
          <FileText className="text-blue-600" size={24} />
          Doğrudan Temin Dosyaları
        </h1>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
          Dosya süreçlerinizi başlatın, tekliflerinizi ve yaklaşık
          maliyetlerinizi takip edin.
        </p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
        {/* VIEW SWITCHER */}
        <div className="flex bg-slate-100/80 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-850 p-1 rounded-2xl h-10 items-center relative">
          {/* Active indicator sliding background */}
          <div
            className="absolute h-8 rounded-xl bg-white dark:bg-slate-900 shadow-3xs border border-slate-200/20 dark:border-slate-800/20 transition-all duration-300 ease-out"
            style={{
              width: "74px",
              transform: `translateX(${
                viewMode === "grid"
                  ? "0px"
                  : viewMode === "list"
                  ? "78px"
                  : "156px"
              })`,
            }}
          />

          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = viewMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 w-[74px] h-8 rounded-xl text-xs font-bold transition-all duration-300 border-0 bg-transparent cursor-pointer",
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-extrabold"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350",
                )}
                title={m.label}
              >
                <Icon size={14} />
                <span className="text-[10px]">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* GENEL YAPAY ZEKA BUTONU */}
        <button
          onClick={onOpenAI}
          className="px-3.5 py-2 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer shrink-0 h-10 border-0"
          title="Mevzuat ve Genel Süreçler Hakkında AI'a Danışın"
        >
          <Sparkles size={15} />
          <span className="hidden md:inline">AI Asistanı</span>
        </button>

        {/* İÇE AKTAR & TOPLU İŞLEMLER DROPDOWN */}
        <div className="relative" ref={importMenuRef}>
          <button
            type="button"
            onClick={() => setImportMenuOpen(!importMenuOpen)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 h-10"
            title="Toplu dosya ekleme ve JSON içe aktarma araçları"
            aria-expanded={importMenuOpen}
          >
            <FileDown size={15} className="text-slate-500 dark:text-slate-400" />
            <span>İçe Aktar</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-150 ${
                importMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {importMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE as any });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <FileSpreadsheet
                  size={14}
                  className="text-blue-600 dark:text-blue-400 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-bold block">Toplu Hızlı Ekle</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Excel benzeri tablo ile toplu ekleme
                  </span>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  setImportMenuOpen(false);
                  navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR as any });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <FileDown
                  size={14}
                  className="text-emerald-600 dark:text-emerald-400 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-bold block">JSON İçe Aktar</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Doğrudan temin JSON aktarımı
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* YENİ DOSYA */}
        <button
          onClick={() => navigate({ to: APP_ROUTES.YENI_DOSYA })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer shrink-0 h-10 border-0"
        >
          <Plus size={16} />
          Yeni Dosya
        </button>
      </div>
    </div>
  );
}
