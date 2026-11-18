import React from "react";
import { TeminSelector } from "../TeminSelector";

interface HeaderBottomRowProps {
  isDt?: boolean;
  procurementMode?: "dogrudan_temin" | "ihale" | "devlet_ihale_2886";
  handleModeChange?: (
    mode: "dogrudan_temin" | "ihale" | "devlet_ihale_2886",
  ) => void;
  activeDosyaId?: number | string | null;
}

export const HeaderBottomRow = React.memo(
  function HeaderBottomRow(_props: HeaderBottomRowProps): React.JSX.Element {
    return (
      <div
        className="min-h-9 py-1 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/20 border-t border-slate-200/30 dark:border-slate-800/30 select-none px-2 sm:px-3 relative z-20 w-full max-w-full overflow-visible"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Orta: Temin Seçici - Ekranın gerçek yatay merkezi */}
        <div className="flex items-center justify-center min-w-0 z-10">
          <TeminSelector />
        </div>
      </div>
    );
  },
);
