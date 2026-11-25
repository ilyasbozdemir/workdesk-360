"use client";

import React from "react";
import { StatusBadge } from "../playground/StatusBadge";
import { JsonViewer } from "../playground/JsonViewer";
import type { TestRunResult } from "../../lib/test-utils/runTest";
import { Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

interface ResultDisplayProps {
  result: TestRunResult<any> | null;
  emptyMessage?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  emptyMessage = "Henüz bir test çalıştırılmadı. Yukarıdaki aksiyonlardan birini tetikleyin.",
}) => {
  if (!result) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-white/40 dark:bg-slate-900/40">
        <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600 animate-pulse" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div
        className={`p-4 rounded-xl border transition-all ${
          result.success
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
            : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            )}
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {result.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">
              {result.durationMs} ms
            </span>
            <StatusBadge status={result.success ? "success" : "error"} />
          </div>
        </div>

        {!result.success && result.error && (
          <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 text-xs font-mono space-y-1 text-rose-800 dark:text-rose-300">
            {result.error.code ? (
              <div>
                <span className="font-semibold">Hata Kodu:</span> {result.error.code}
              </div>
            ) : null}
            <div>
              <span className="font-semibold">Mesaj:</span> {result.error.message}
            </div>
            {result.error.details ? (
              <div className="mt-2">
                <span className="font-semibold">Hata Detayları (Details):</span>
                <pre className="mt-1 p-2 bg-rose-100/60 dark:bg-rose-900/30 rounded-lg overflow-x-auto text-[11px]">
                  {JSON.stringify(result.error.details, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <JsonViewer
        data={result.success ? result.data : result.error}
        title={result.success ? "Dönen Veri (data)" : "Hata Nesnesi (error)"}
      />
    </div>
  );
};
