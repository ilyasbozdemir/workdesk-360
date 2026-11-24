import React, { useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useTabStore } from "../../store/tabStore";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Layers } from "lucide-react";
import { ProcessStepper } from "./components/ProcessStepper";
import { APP_ROUTES } from "../../constants/routeConstants";

const STEPPER_ROUTES = [
  "hazirlik-ve-ihtiyac",
  "piyasa-fiyat-arastirmasi",
  "siparis-ve-sozlesme",
  "kabul-ve-odeme",
];

interface SubScreenProps {
  title: string;
  icon: React.ElementType;
  description: string;
  children?: React.ReactNode;
  hideStepper?: boolean;
  requireActiveDosya?: boolean;
  previewDocumentId?: string | null;
  selectedFirma?: unknown;
  invitedFirms?: unknown[];
  onClosePreview?: () => void;
}

export function SubScreen({
  title,
  icon: Icon,
  description,
  children,
  hideStepper = false,
  requireActiveDosya = true,
}: SubScreenProps): React.JSX.Element {
  const navigate = useNavigate();
  const addTab = useTabStore((s) => s.addTab);
  const activeTabPath = useTabStore((s) => s.activeTabPath);
  const activeDosyaId = useWorkspaceStore((s) => s.activeDosyaId);
  const setActiveStarredDocs = useWorkspaceStore((s) => s.setActiveStarredDocs);

  useEffect(() => {
    document.title = `${title} - Doğrudan Temin`;
  }, [title]);

  useEffect(() => {
    if (!activeDosyaId) return;
    window.electron.ipcRenderer
      .invoke(
        "db:query",
        "SELECT starred_docs FROM DATA_TeminDosyasi WHERE id = ?",
        [
          activeDosyaId,
        ],
      )
      .then((res) => {
        if (res.success && res.data.length > 0) {
          try {
            const docs = res.data[0].starred_docs
              ? JSON.parse(res.data[0].starred_docs)
              : [];
            setActiveStarredDocs(docs);
          } catch (e) {
            console.error("Failed to parse active file starred docs:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to query active file starred docs:", err);
      });
  }, [activeDosyaId, title, setActiveStarredDocs]);

  // Mevcut sayfanın stepper'a dahil olup olmadığını belirle
  const currentPath = activeTabPath ||
    (typeof window !== "undefined" ? window.location.pathname : "");
  const showStepper = !hideStepper &&
    STEPPER_ROUTES.some((r) => currentPath.includes(r));

  return (
    <div className="w-full flex flex-col gap-3.5 animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 print:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-855 dark:text-slate-100 truncate">
              {title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-2xl mt-0.5">
              {description}
            </p>
          </div>
        </div>

        {activeDosyaId && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem("temin_takip_view_mode", "detay");
                  window.dispatchEvent(
                    new CustomEvent("takip:view-mode-changed", {
                      detail: { mode: "detay", dosyaId: activeDosyaId },
                    }),
                  );
                } catch {
                  // ignore
                }
                addTab(APP_ROUTES.DOSYA_DETAY);
                navigate({ to: APP_ROUTES.DOSYA_DETAY });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              title="Dosya Detaylarına ve Süreç Takip Paneline Git"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Dosya Detayı
            </button>
          </div>
        )}
      </div>

      {/* PROCESS STEPPER */}
      {showStepper && activeDosyaId && (
        <ProcessStepper currentRoute={currentPath} />
      )}

      {/* ACTIVE DOSYA CONTEXT */}
      {requireActiveDosya && !activeDosyaId && (
        <div className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400 font-semibold shadow-sm print:hidden">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            Aktif bir doğrudan temin dosyası seçmediniz. Bu ekranda işlem
            yapabilmek için lütfen önce{" "}
            <Link
              to="/dosyalar"
              className="underline font-bold text-blue-600 dark:text-blue-400"
            >
              dosyalar listesinden
            </Link>{" "}
            bir dosya seçin.
          </div>
        </div>
      )}

      {/* CHILDREN VIEW */}
      {(activeDosyaId || !requireActiveDosya) && children}
    </div>
  );
}
