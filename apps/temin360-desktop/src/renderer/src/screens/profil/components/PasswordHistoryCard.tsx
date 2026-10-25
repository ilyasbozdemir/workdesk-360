import React from "react";
import { Calendar, Key, Laptop, Lock, User } from "lucide-react";

export interface PasswordHistoryItem {
  id?: string;
  username?: string;
  hostname?: string;
  osUsername?: string;
  createdAt?: string;
}

interface PasswordHistoryCardProps {
  passwordHistory: PasswordHistoryItem[];
  adminPassword?: string;
}

export const PasswordHistoryCard: React.FC<PasswordHistoryCardProps> = (
  { passwordHistory },
) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Parola Değişiklik Denetim Kaydı ({passwordHistory.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Parola değişiklikleri yalnızca denetim amacıyla tarih ve cihazla
              saklanır. Parolalar kaydedilmez ve eski parolalarla giriş
              yapılamaz.
            </p>
          </div>
        </div>
        <span className="text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" /> SQLite Kilit Uyumlu
        </span>
      </div>

      {passwordHistory.length === 0
        ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Henüz kaydedilmiş geçmiş şifre kaydı bulunmuyor. Şifre
            değişiklikleri otomatik olarak buraya arşivlenir.
          </div>
        )
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {passwordHistory.map((item, index) => {
              const itemId = item.id || `hist_${index}`;

              return (
                <div
                  key={itemId}
                  className="p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {item.username || "admin"}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Parola Değişti
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span
                      className="flex items-center gap-1 truncate max-w-35"
                      title={item.hostname}
                    >
                      <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                      {" "}
                      {item.hostname || "Bilinmiyor"}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("tr-TR")
                        : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};
