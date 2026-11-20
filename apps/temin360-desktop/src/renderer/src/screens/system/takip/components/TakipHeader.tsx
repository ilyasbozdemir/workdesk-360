import React from "react";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Columns3,
  FileDown,
  FilePlus2,
  LayoutGrid,
  List,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "../../../../constants/routeConstants";

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
  id: Exclude<TakipViewMode, "detay">;
  label: string;
  icon: typeof Columns3;
  title: string;
}[] = [
  {
    id: "kanban",
    label: "Kanban",
    icon: Columns3,
    title: "Aşamalara göre iş akışı",
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
    title: "Süreç istatistikleri ve grafikler",
  },
];

export function TakipHeader({
  activeDosya,
  onEditClick,
  activeView,
  setActiveView,
  onOpenWizard,
  onOpenAI,
}: TakipHeaderProps): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
      {/* Sol: Kompakt Başlık & İkon */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400">
          <ClipboardList size={17} strokeWidth={2} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-850 dark:text-slate-100 whitespace-nowrap">
            Dosya Detayları
          </h1>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            Doğrudan Temin
          </span>
        </div>
      </div>

      {/* Sağ: Kompakt Görünüm Seçici ve Aksiyonlar Tek Satırda */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Görünüm Navigasyonu (Kompakt Switch) */}
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
                onClick={() => setActiveView(id)}
                title={title}
                aria-label={label}
                aria-pressed={isActive}
                className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "border border-slate-200/80 bg-white text-blue-600 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
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

        {/* Aksiyon Butonları */}

        <button
          type="button"
          onClick={() => setActiveView("kanban")}
          className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          title="Panoya Geri Dön"
        >
          <ArrowLeft size={13} />
          <span>Panoya Dön</span>
        </button>
        {activeView === "detay"
          ? (
            <>
              {activeDosya && (
                <button
                  type="button"
                  onClick={onEditClick}
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <Pencil size={12} />
                  Düzenle
                </button>
              )}
            </>
          )
          : null}

        {/* YAPAY ZEKA ASİSTANI */}
        {onOpenAI && (
          <button
            type="button"
            onClick={onOpenAI}
            className="inline-flex h-7 items-center justify-center gap-1.5 px-2.5 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer border-0"
            title="Mevzuat ve Genel Süreçler Hakkında AI'a Danışın"
          >
            <Sparkles size={13} />
            <span className="hidden lg:inline">Yapay Zeka Asistanı</span>
            <span className="lg:hidden">AI</span>
          </button>
        )}

        {/* EXCEL HIZLI EKLEME */}
        <button
          type="button"
          onClick={() => navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE as any })}
          className="inline-flex h-7 items-center justify-center gap-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="Excel benzeri tablo ile toplu dosya ekleme"
        >
          <ClipboardList size={13} />
          <span className="hidden sm:inline">Toplu Hızlı Ekle</span>
        </button>

        {/* HARİCİ JSON AKTAR */}
        <button
          type="button"
          onClick={() => navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR as any })}
          className="inline-flex h-7 items-center justify-center gap-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer"
          title="Harici doğrudan temin JSON dosyasını içeri aktar"
        >
          <FileDown
            size={13}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <span className="hidden sm:inline">JSON İçe Aktar</span>
        </button>

        {/* YENİ DOSYA */}
        <button
          type="button"
          onClick={onOpenWizard}
          className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <FilePlus2 size={13} strokeWidth={2} />
          Yeni Dosya
        </button>
      </div>
    </header>
  );
}
