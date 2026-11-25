import React from "react";

interface JsonViewerProps {
  data: unknown;
  title?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, title = "Sonuç / JSON Çıktısı", maxHeight = "max-h-80" }: JsonViewerProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden text-xs font-mono shadow-sm">
      {title && (
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="font-semibold text-slate-400">{title}</span>
          <span className="text-[10px] text-slate-500">JSON</span>
        </div>
      )}
      <div className={`p-4 overflow-auto ${maxHeight} leading-relaxed`}>
        <pre className="text-emerald-400">
          {data !== undefined ? JSON.stringify(data, null, 2) : "// Veri yok veya tanımsız"}
        </pre>
      </div>
    </div>
  );
}
