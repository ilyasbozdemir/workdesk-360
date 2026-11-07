import React from "react";
import { ExternalLink, Layers } from "lucide-react";
import { useTabStore } from "../../../../store/tabStore";
import { useNavigate } from "@tanstack/react-router";
import { useGlobalDocumentPreviewStore } from "../../../../store/globalDocumentPreviewStore";
import { APP_ROUTES } from "../../../../constants/routeConstants";

interface InspectorFooterProps {
  dosya: any;
  mode?: "modal" | "screen";
  onClose?: () => void;
}

export const InspectorFooter: React.FC<InspectorFooterProps> = ({
  dosya,
  mode = "modal",
  onClose,
}) => {
  const { addTab, closeTab, activeTabPath } = useTabStore();
  const navigate = useNavigate();
  const { openDocument } = useGlobalDocumentPreviewStore();

  const handleGoToTakip = () => {
    if (mode === "modal" && onClose) {
      onClose();
    }
    addTab(APP_ROUTES.DOSYA_DETAY);
    navigate({ to: APP_ROUTES.DOSYA_DETAY });
  };

  const handleOpenArastirmaMektubu = () => {
    if (mode === "modal" && onClose) {
      onClose();
    }
    openDocument({
      documentId: "arastirma-mektubu",
      dosyaId: dosya.id,
      documentTitle: "Piyasa Fiyat Araştırma Mektubu",
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (mode === "screen") {
      const nextPath = closeTab(activeTabPath);
      if (nextPath) {
        navigate({ to: nextPath });
      }
    }
  };

  return (
    <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={handleGoToTakip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          Süreç Takip Paneline Git
        </button>
        {mode === "modal" && (
          <button
            onClick={() => {
              if (onClose) onClose();
              const route = `${APP_ROUTES.DOSYA_KUNYE}?id=${dosya.id}`;
              addTab(route);
              navigate({ to: route });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
            title="Dosya Künyesini Yeni Sekmede Aç"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            Sekmede Aç
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
      >
        {mode === "screen" ? "Sekmeyi Kapat" : "Kapat"}
      </button>
    </div>
  );
};
