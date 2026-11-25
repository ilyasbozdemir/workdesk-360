import React from "react";

interface StatusBadgeProps {
  status: "success" | "error" | "pending" | "idle";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
      text: label || "Başarılı (Success)",
    },
    error: {
      bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      dot: "bg-rose-500",
      text: label || "Hatalı (Failure)",
    },
    pending: {
      bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500 animate-ping",
      text: label || "Çalışıyor...",
    },
    idle: {
      bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      dot: "bg-slate-400",
      text: label || "Bekliyor",
    },
  };

  const current = configs[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.text}
    </span>
  );
}
