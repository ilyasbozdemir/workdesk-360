import React from "react";

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ActionCard({
  title,
  description,
  icon,
  children,
  footer,
}: ActionCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
      {footer && <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">{footer}</div>}
    </div>
  );
}
