import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  Printer,
  Search,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@renderer/utils/formatters";
import { INITIAL_MIF_LISTESI } from "@renderer/screens/bkmybs-mali-yonetim/bkmybsMockData";
import { MifKayit } from "@renderer/screens/bkmybs-mali-yonetim/types";

export const MifDraftsPage: React.FC<{
  onOpenMatbuMif?: (mif: MifKayit) => void;
}> = ({ onOpenMatbuMif }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDurum, setFilterDurum] = useState("all");
  const [mifList, setMifList] = useState<MifKayit[]>(INITIAL_MIF_LISTESI);

  const filteredMif = mifList.filter((m) => {
    const matchesSearch =
      m.mifNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alacakliUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alacakliVkn.includes(searchTerm);

    if (filterDurum === "all") return matchesSearch;
    return matchesSearch && m.durum === filterDurum;
  });

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Muhasebe İşlem Fişi (MİF) Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                5018 Muhasebat GM Formatı
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Harcama birimlerinden aktarılan tahakkuk fişleri, borç/alacak
              hesap bağlamaları ve resmî MİF dökümleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Toplam MİF:{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {mifList.length} Fiş
            </span>
          </div>
        </div>
      </div>

      {/* Arama & Durum Filtreleri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="MİF No, açıklama, alacaklı unvanı veya vergi kimlik no ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", label: "Tümü" },
            { id: "taslak", label: "Taslaklar" },
            { id: "odenege_baglandi", label: "Ödeneğe Bağlanan" },
            { id: "onaylandi", label: "Onaylandı" },
            { id: "odendi", label: "Ödendi" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDurum(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterDurum === f.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* MİF Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">MİF No / Tarih</th>
                <th className="py-3 px-4">Harcama Açıklaması</th>
                <th className="py-3 px-4">Alacaklı Hak Sahibi</th>
                <th className="py-3 px-4">Bütçe Tertibi</th>
                <th className="py-3 px-4 text-right">Brüt Tutar</th>
                <th className="py-3 px-4 text-right">Net Ödenecek</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMif.map((mif) => (
                <tr
                  key={mif.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {mif.mifNo}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {mif.tarih}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div
                      className="font-medium text-slate-800 dark:text-slate-200 truncate"
                      title={mif.aciklama}
                    >
                      {mif.aciklama}
                    </div>
                    {mif.dosyaId && (
                      <span className="text-[10px] text-blue-500 font-semibold">
                        DT Dosya #{mif.dosyaId}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-[170px]">
                    <div
                      className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                      title={mif.alacakliUnvan}
                    >
                      {mif.alacakliUnvan}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      VKN: {mif.alacakliVkn}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {mif.butceTertibi}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(mif.brutTutar)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(mif.netOdenecekTutar)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        mif.durum === "onaylandi"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : mif.durum === "muhasebeye_sevk"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {mif.durum === "onaylandi"
                        ? "Onaylandı"
                        : mif.durum === "muhasebeye_sevk"
                        ? "Muhasebeye Sevk"
                        : "Taslak"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onOpenMatbuMif?.(mif)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 transition-colors"
                      title="Matbu MİF Belgesi Görüntüle / Yazdır"
                    >
                      <Eye size={12} />
                      <span>Görüntüle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
