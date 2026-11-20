import React, { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Columns3,
  Eye,
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Pencil,
  Sparkles,
} from "lucide-react";
import { APP_ROUTES } from "../../../../constants/routeConstants";
import { useTeminSelector } from "@renderer/components/layout/temin-selector/useTeminSelector";
import { useWorkspaceStore } from "../../../../store/workspaceStore";

export type TakipViewMode = "kanban" | "grid" | "list" | "metrik" | "detay";

interface TakipHeaderProps {
  activeDosya?: any;
  onEditClick: () => void;
  activeView: TakipViewMode;
  setActiveView: (view: TakipViewMode) => void;
  onOpenWizard: () => void;
  onOpenAI?: () => void;
  onGoToDetayTab?: () => void;
}

const VIEW_OPTIONS: {
  id: TakipViewMode;
  label: string;
  icon: typeof Columns3;
  title: string;
}[] = [
  {
    id: "kanban",
    label: "Kanban",
    icon: Columns3,
    title: "Aşamalara göre iş akışı panosu",
  },
  {
    id: "grid",
    label: "Kartlar",
    icon: LayoutGrid,
    title: "Dosyaları kart görünümünde listele",
  },
  {
    id: "list",
    label: "Liste",
    icon: List,
    title: "Dosyaları kompakt listede görüntüle",
  },
  {
    id: "metrik",
    label: "Metrikler",
    icon: BarChart3,
    title: "Süreç istatistikleri ve analizler",
  },
  {
    id: "detay",
    label: "Dosya Detayı",
    icon: Eye,
    title: "Aktif dosyanın künye ve detay parametreleri",
  },
];

export function TakipHeader({
  activeDosya,
  onEditClick,
  activeView,
  setActiveView,
  onOpenWizard,
  onOpenAI,
  onGoToDetayTab,
}: TakipHeaderProps): React.JSX.Element {
  const { navigate } = useTeminSelector();
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında içe aktar menüsünü kapat
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

  const handleSelectView = (id: TakipViewMode): void => {
    if (id === "detay") {
      if (activeDosya) {
        try {
          useWorkspaceStore.getState().setActiveDosyaId(activeDosya.id);
          localStorage.setItem("temin_takip_view_mode", "detay");
          window.dispatchEvent(
            new CustomEvent("takip:view-mode-changed", {
              detail: {
                mode: "detay",
                dosyaId: activeDosya.id,
                tab: "kunye",
              },
            }),
          );
        } catch {
          // ignore
        }
        if (onGoToDetayTab) {
          onGoToDetayTab();
        }
      }
      setActiveView("detay");
      return;
    }
    setActiveView(id);
  };

  return (
    <header className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
      {/* Sol: Kompakt Başlık & İkon */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400">
          <ClipboardList size={17} strokeWidth={2} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-850 dark:text-slate-100 whitespace-nowrap">
            Dosya Takip & Detay
          </h1>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            Doğrudan Temin (4734)
          </span>
        </div>
      </div>

      {/* Sağ: Düzenli Gruplanmış Görünüm Seçici ve Aksiyon Grubu */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* 1. GRUP: Görünüm Navigasyonu (Segmented Switch) */}
        <nav
          aria-label="Dosya görünüm seçenekleri"
          className="flex items-center p-0.5 rounded-lg border border-slate-200/80 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/70"
        >
          {VIEW_OPTIONS.map(({ id, label, icon: Icon, title }) => {
            const isActive = activeView === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectView(id)}
                title={title}
                aria-label={label}
                aria-pressed={isActive}
                className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "border border-slate-200/80 bg-white text-blue-600 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 font-bold"
                    : "border border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 2. GRUP: Araçlar & Aksiyonlar */}
        <div className="flex items-center gap-2">
          {/* YAPAY ZEKA ASİSTANI */}
          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex h-7 items-center justify-center gap-1.5 px-2.5 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer border-0"
              title="Mevzuat ve Genel Süreçler Hakkında AI'a Danışın"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">AI Asistanı</span>
            </button>
          )}

          {/* İÇE AKTAR & TOPLU İŞLEMLER DROPDOWN */}
          <div className="relative" ref={importMenuRef}>
            <button
              type="button"
              onClick={() => setImportMenuOpen(!importMenuOpen)}
              className="inline-flex h-7 items-center justify-center gap-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Toplu dosya ekleme ve JSON içe aktarma araçları"
              aria-expanded={importMenuOpen}
            >
              <FileDown size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">İçe Aktar</span>
              <ChevronDown
                size={12}
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

          {/* DÜZENLE BUTONU (Sadece aktif dosya ve detay görünümünde) */}
          {activeView === "detay" && activeDosya && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              title="Dosya Formunu Düzenle"
            >
              <Pencil size={12} />
              <span>Düzenle</span>
            </button>
          )}

          {/* YENİ DOSYA (BİRİNCİL AKSİYON) */}
          <button
            type="button"
            onClick={onOpenWizard}
            className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
            title="Yeni Doğrudan Temin Dosyası Başlat"
          >
            <FilePlus2 size={13} strokeWidth={2} />
            <span>Yeni Dosya</span>
          </button>
        </div>
      </div>
    </header>
  );
}
