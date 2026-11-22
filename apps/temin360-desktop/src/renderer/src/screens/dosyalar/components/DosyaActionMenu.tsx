import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  Lock,
  MoreVertical,
  Sliders,
  Trash2,
  Unlock,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "../../../utils/cn";
import { useTabStore } from "../../../store/tabStore";
import { APP_ROUTES } from "../../../constants/routeConstants";

export interface DosyaActionMenuProps {
  dosya: any;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  selectedDosyaIds: number[];
  menuClassName?: string;
  handleOpenInNewWindow?: (dosya: any) => void;
  handleUpdateStatus?: (id: number, status: string) => Promise<void>;
  handleEkapGonder?: (id: number) => void;
  handleKilidiAc?: (id: number) => Promise<void>;
  handleOpenAI?: (dosya: any) => void;
  handleDelete?: (id: number) => Promise<void>;
  handleHardDelete?: (id: number) => Promise<void>;
  handleOpenMaliyetAyarlari?: (dosya: any) => void;
}

export function DosyaActionMenu({
  dosya,
  openMenuId,
  setOpenMenuId,
  selectedDosyaIds,
  menuClassName,
  handleOpenInNewWindow,
  handleUpdateStatus,
  handleEkapGonder,
  handleKilidiAc,
  handleOpenAI,
  handleDelete,
  handleHardDelete,
  handleOpenMaliyetAyarlari,
}: DosyaActionMenuProps) {
  const navigate = useNavigate();
  const { addTab } = useTabStore();
  const isOpen = openMenuId === dosya.id;

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);

  // Ekranda veya kolonda yer yoksa yukarı doğru aç ve Fixed position ile overflow kesilmesini önle
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 310;
      const menuWidth = 208; // w-52 (13rem = 208px)

      let top = rect.bottom + 4;
      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        top = Math.max(8, rect.top - menuHeight - 4);
      }

      // Sağa veya sola taşmaması için
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }

      setMenuCoords({ top, left });
    } else {
      setMenuCoords(null);
    }
  }, [isOpen]);

  // Dışarı tıklandığında veya pencere kaydırıldığında menüyü kapat
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    const handleScrollOrResize = () => {
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, setOpenMenuId]);

  return (
    <div
      className={cn(
        "relative",
        menuClassName?.includes("inline-block") ? "inline-block" : "",
        isOpen ? "z-50" : "z-auto"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(isOpen ? null : dosya.id);
        }}
        className={`p-1 rounded-lg transition-colors cursor-pointer ${
          isOpen
            ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white"
            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        }`}
        title="Dosya İşlem Menüsü"
      >
        <MoreVertical
          size={menuClassName?.includes("inline-block") ? 16 : 14}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={
            menuCoords
              ? {
                  position: "fixed",
                  top: `${menuCoords.top}px`,
                  left: `${menuCoords.left}px`,
                  zIndex: 99999,
                }
              : undefined
          }
          className={cn(
            "fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 flex flex-col text-xs font-semibold z-[99999] w-52 animate-in fade-in-50 zoom-in-95 duration-100",
            menuClassName,
          )}
        >
          <button
            onClick={() => {
              setOpenMenuId(null);
              handleOpenInNewWindow && handleOpenInNewWindow(dosya);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink size={13} className="text-slate-400" />{" "}
            Yeni Pencerede Aç
          </button>

          {dosya.is_deleted !== 1 && dosya.is_ekap_sent !== 1 && (
            <button
              disabled={selectedDosyaIds.length > 1}
              onClick={() => {
                setOpenMenuId(null);
                navigate({
                  to: `${APP_ROUTES.YENI_DOSYA}?id=${dosya.id}`,
                });
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Edit size={13} className="text-slate-400" /> Düzenle
            </button>
          )}

          {/* Dosya Detayları & Süreç Takip */}
          <button
            onClick={() => {
              setOpenMenuId(null);
              try {
                localStorage.setItem("temin_takip_view_mode", "detay");
                window.dispatchEvent(
                  new CustomEvent("takip:view-mode-changed", {
                    detail: { mode: "detay", dosyaId: dosya.id, tab: "kunye" },
                  }),
                );
              } catch {
                // ignore
              }
              addTab(APP_ROUTES.DOSYA_DETAY);
              navigate({ to: APP_ROUTES.DOSYA_DETAY });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-2 font-bold cursor-pointer"
          >
            <Eye size={13} className="text-blue-500" />{" "}
            Dosya Detayına Git
          </button>

          {dosya.is_deleted !== 1 && handleOpenMaliyetAyarlari && (
            <button
              onClick={() => {
                setOpenMenuId(null);
                handleOpenMaliyetAyarlari(dosya);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Sliders size={13} className="text-slate-400" />{" "}
              Yaklaşık Maliyet Ayarları
            </button>
          )}

          {dosya.is_deleted !== 1 && (
            <button
              onClick={() => {
                setOpenMenuId(null);
                handleUpdateStatus &&
                  handleUpdateStatus(
                    dosya.id,
                    dosya.status === "tamamlandi"
                      ? "devam_ediyor"
                      : "tamamlandi",
                  );
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              {dosya.status === "tamamlandi" ? (
                <>
                  <Clock size={13} className="text-amber-500" /> Aktife Al
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500" />{" "}
                  Tamamlandı İşaretle
                </>
              )}
            </button>
          )}

          {dosya.is_deleted !== 1 && (
            <button
              onClick={() => {
                setOpenMenuId(null);
                dosya.is_ekap_sent === 1
                  ? handleKilidiAc && handleKilidiAc(dosya.id)
                  : handleEkapGonder && handleEkapGonder(dosya.id);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              {dosya.is_ekap_sent === 1 ? (
                <>
                  <Unlock size={13} className="text-amber-500" /> Kilidi Aç / EKAP İptal
                </>
              ) : (
                <>
                  <Lock size={13} className="text-indigo-500" /> Dosyayı Kilitle (EKAP)
                </>
              )}
            </button>
          )}

          {dosya.is_deleted !== 1 && (
            <button
              onClick={() => {
                setOpenMenuId(null);
                handleOpenAI && handleOpenAI(dosya);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-purple-600 dark:text-purple-400 flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle size={13} className="text-purple-500" /> Yapay Zeka Asistanı
            </button>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {/* SİLME İŞLEMLERİ */}
          <button
            onClick={() => {
              setOpenMenuId(null);
              handleDelete && handleDelete(dosya.id);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={13} className="text-rose-500" />{" "}
            {dosya.is_deleted === 1 ? "Geri Yükle" : "İptal Et / Sil"}
          </button>

          {handleHardDelete && (
            <button
              onClick={() => {
                setOpenMenuId(null);
                handleHardDelete(dosya.id);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center gap-2 font-bold cursor-pointer"
            >
              <AlertCircle size={13} className="text-red-600" /> Kalıcı Olarak Sil
            </button>
          )}
        </div>
      )}
    </div>
  );
}
