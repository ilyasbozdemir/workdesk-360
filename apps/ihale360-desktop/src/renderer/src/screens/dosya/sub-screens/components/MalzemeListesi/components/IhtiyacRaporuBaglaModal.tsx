import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  FileDown,
  Info,
  Layers,
  Link2,
  Package,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
  User,
} from "lucide-react";
import { Modal } from "../../../../../../components/ui/Modal";
import {
  IhtiyacRaporu,
  IhtiyacRaporuKalem,
  ihtiyacRaporuService,
  TransferKalemMode,
} from "../../../../../../services/ihtiyacRaporuService";
import { formatCurrency, formatDate } from "../../../../../../utils/formatters";
import { emitAppEvent } from "../../../../../../utils/appEvents";

interface IhtiyacRaporuBaglaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dosyaId: number;
  activeDosya?: any;
  onSuccess: () => Promise<void> | void;
}

export function IhtiyacRaporuBaglaModal({
  isOpen,
  onClose,
  dosyaId,
  activeDosya,
  onSuccess,
}: IhtiyacRaporuBaglaModalProps): React.JSX.Element | null {
  const [raporlar, setRaporlar] = useState<IhtiyacRaporu[]>([]);
  const [linkedRapor, setLinkedRapor] = useState<IhtiyacRaporu | null>(null);
  const [selectedRaporId, setSelectedRaporId] = useState<number | null>(null);
  const [previewKalemler, setPreviewKalemler] = useState<IhtiyacRaporuKalem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [loadingKalemler, setLoadingKalemler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "available" | "linked">(
    "all",
  );
  const [copyItems, setCopyItems] = useState(true);
  const [transferMode, setTransferMode] = useState<TransferKalemMode>(
    "append_if_missing",
  );
  const [syncDosyaInfo, setSyncDosyaInfo] = useState(true);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Modalı açınca raporları ve halihazırda bağlı olan raporu getir
  useEffect(() => {
    if (!isOpen || !dosyaId) return;

    setSearch("");
    setCopyItems(true);
    setTransferMode("append_if_missing");
    setSyncDosyaInfo(true);
    setResultMessage(null);
    setLoading(true);

    Promise.all([
      ihtiyacRaporuService.getLinkedRaporForDosya(dosyaId),
      ihtiyacRaporuService.getRaporlar(),
    ])
      .then(([currentLinked, allRaporlar]) => {
        setLinkedRapor(currentLinked);
        setRaporlar(allRaporlar);
        if (currentLinked) {
          setSelectedRaporId(currentLinked.id);
        } else if (allRaporlar.length > 0) {
          // Bağlı yoksa ilk onaylı veya ilk raporu seç
          const approved = allRaporlar.find((r) =>
            r.durum === "onaylandi" && !r.temin_dosya_id
          );
          setSelectedRaporId(approved ? approved.id : allRaporlar[0].id);
        }
      })
      .catch((err) => {
        console.error("[IhtiyacRaporuBaglaModal] Veri yüklenemedi:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, dosyaId]);

  // Seçili rapor değiştikçe kalemleri önizleme için getir
  useEffect(() => {
    if (!selectedRaporId) {
      setPreviewKalemler([]);
      return;
    }

    setLoadingKalemler(true);
    ihtiyacRaporuService
      .getRaporKalemleri(selectedRaporId)
      .then((kalemler) => {
        setPreviewKalemler(kalemler);
      })
      .catch((err) => {
        console.error("[IhtiyacRaporuBaglaModal] Kalemler alınamadı:", err);
        setPreviewKalemler([]);
      })
      .finally(() => {
        setLoadingKalemler(false);
      });
  }, [selectedRaporId]);

  const selectedRapor = useMemo(() => {
    return raporlar.find((r) => r.id === selectedRaporId) || null;
  }, [raporlar, selectedRaporId]);

  // Filtreleme
  const filteredRaporlar = useMemo(() => {
    return raporlar.filter((r) => {
      // Tab filtreleme
      if (
        filterMode === "available" && r.temin_dosya_id &&
        r.temin_dosya_id !== dosyaId
      ) {
        return false;
      }
      if (filterMode === "linked" && r.temin_dosya_id !== dosyaId) {
        return false;
      }

      // Arama filtreleme
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.rapor_no.toLowerCase().includes(q) ||
        r.baslik.toLowerCase().includes(q) ||
        (r.birim_adi && r.birim_adi.toLowerCase().includes(q)) ||
        (r.talep_eden_personel &&
          r.talep_eden_personel.toLowerCase().includes(q))
      );
    });
  }, [raporlar, search, filterMode, dosyaId]);

  if (!isOpen) return null;

  // Bağlama ve Kalem Aktarma İşlemi
  const handleLinkAndTransfer = async () => {
    if (!selectedRaporId) {
      alert("Lütfen bağlanacak bir ihtiyaç raporu seçiniz.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await ihtiyacRaporuService.linkToDosya(
        selectedRaporId,
        dosyaId,
        {
          copyItemsToDosya: copyItems,
          transferMode,
        },
      );

      // Dosya kalemlerini ve arayüzü güncelle
      await onSuccess();
      emitAppEvent("items:changed", { dosyaId });
      emitAppEvent("dossier:updated", { dosyaId });

      let msg =
        `İhtiyaç raporu (${selectedRapor?.rapor_no}) başarıyla bağlandı.`;
      if (copyItems) {
        msg += ` ${res.transferredCount} kalem malzeme listesine aktarıldı.`;
        if (res.skippedCount > 0) {
          msg += ` (${res.skippedCount} mükerrer kalem atlandı)`;
        }
      }
      setResultMessage(msg);

      // 1.5 sn sonra kapat
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      alert("İhtiyaç raporu bağlanırken hata oluştu: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Bağlantıyı Kaldırma
  const handleUnlink = async () => {
    if (!linkedRapor) return;
    if (
      !confirm(
        `"${linkedRapor.rapor_no}" numaralı ihtiyaç raporunun bu doğrudan temin dosyasıyla olan bağlantısını kaldırmak istediğinize emin misiniz?\n\nNot: Malzeme listesine önceden aktarılmış kalemler silinmez.`,
      )
    ) {
      return;
    }

    try {
      setUnlinking(true);
      await ihtiyacRaporuService.unlinkFromDosya(linkedRapor.id);
      setLinkedRapor(null);
      // Listeyi yenile
      const allRaporlar = await ihtiyacRaporuService.getRaporlar();
      setRaporlar(allRaporlar);
      await onSuccess();
      emitAppEvent("dossier:updated", { dosyaId });
    } catch (err: any) {
      alert("Bağlantı kaldırılırken hata oluştu: " + (err.message || err));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="İhtiyaç Raporunu Bağla & Kalemleri Aktar"
      description="Hazırlanan ihtiyaç raporundaki onaylı ihtiyaç kalemlerini doğrudan bu doğrudan temin dosyasının malzeme listesine kopyalayın."
      className="max-w-6xl w-full"
    >
      <div className="space-y-4 pt-1 max-h-[78vh] overflow-y-auto pr-1">
        {/* Başarı Mesajı Bildirimi */}
        {resultMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{resultMessage}</span>
          </div>
        )}

        {/* Halihazırda Bağlı Rapor Bildirimi */}
        {linkedRapor && (
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Link2 className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Şu Anda Bu Dosyaya Bağlı Rapor
                  </span>
                  <span className="px-1.5 py-0.2 bg-indigo-200/60 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-[10px] rounded-full font-bold">
                    {linkedRapor.rapor_no}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                  {linkedRapor.baslik}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                  <span>{linkedRapor.birim_adi || "Birim Belirtilmemiş"}</span>
                  <span>•</span>
                  <span>{linkedRapor.kalem_sayisi || 0} Kalem</span>
                  {linkedRapor.tahmini_butce
                    ? (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(linkedRapor.tahmini_butce)}
                        </span>
                      </>
                    )
                    : null}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUnlink}
              disabled={unlinking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Rapor bağlantısını kaldır"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{unlinking ? "Kaldırılıyor..." : "Bağlantıyı Kaldır"}</span>
            </button>
          </div>
        )}

        {/* Ana İçerik Grid: Sol Liste - Sağ Önizleme & Ayarlar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Sol Kolon: Rapor Seçim Listesi (5 Kolon) */}
          <div className="md:col-span-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>İhtiyaç Raporu Seçimi</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {filteredRaporlar.length} / {raporlar.length} rapor
              </span>
            </div>

            {/* Arama ve Filtreleme */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rapor no, başlık, birim ara..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Filtre Butonları */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                    filterMode === "all"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("available")}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                    filterMode === "available"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  Boşta Olanlar
                </button>
                {linkedRapor && (
                  <button
                    type="button"
                    onClick={() => setFilterMode("linked")}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                      filterMode === "linked"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    Bağlı Rapor
                  </button>
                )}
              </div>
            </div>

            {/* Rapor Listesi */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 max-h-[360px] overflow-y-auto p-1.5 space-y-1.5">
              {loading
                ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-500" />
                    Raporlar yükleniyor...
                  </div>
                )
                : filteredRaporlar.length === 0
                ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Eşleşen ihtiyaç raporu bulunamadı.
                  </div>
                )
                : (
                  filteredRaporlar.map((r) => {
                    const isSelected = r.id === selectedRaporId;
                    const isLinkedToThis = r.temin_dosya_id === dosyaId;
                    const isLinkedToOther = r.temin_dosya_id &&
                      r.temin_dosya_id !== dosyaId;

                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setSelectedRaporId(r.id)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30"
                            : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {r.rapor_no}
                          </span>
                          <div className="flex items-center gap-1">
                            {isLinkedToThis
                              ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  Bu Dosyada
                                </span>
                              )
                              : isLinkedToOther
                              ? (
                                <span
                                  className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  title={`Dosya: ${
                                    r.dosya_no || r.temin_dosya_id
                                  }`}
                                >
                                  Başka Dosyada
                                </span>
                              )
                              : r.durum === "onaylandi"
                              ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                  Onaylı
                                </span>
                              )
                              : null}
                            <span className="text-[10px] text-slate-400">
                              {formatDate(r.tarih)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {r.baslik}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/40">
                          <span className="truncate max-w-[130px]">
                            {r.birim_adi || "Birim Yok"}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {r.kalem_sayisi || 0} Kalem
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
            </div>
          </div>

          {/* Sağ Kolon: Kalem Önizlemesi & Aktarım Ayarları (7 Kolon) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {selectedRapor
              ? (
                <>
                  {/* Seçili Rapor Detay Kartı */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Seçilen Rapor Özeti
                      </span>
                      <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                        {selectedRapor.rapor_no}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {selectedRapor.baslik}
                    </div>

                    {selectedRapor.gerekce && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                        &quot;{selectedRapor.gerekce}&quot;
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/40 text-[11px]">
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="truncate">
                          {selectedRapor.birim_adi || "Belirtilmedi"}
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate">
                          {selectedRapor.talep_eden_personel || "Belirtilmedi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kalemler Önizleme Tablosu */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Rapordaki İhtiyaç Kalemleri ({previewKalemler.length})
                        </span>
                      </span>
                      {selectedRapor.tahmini_butce
                        ? (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Öngörü Bütçe:{" "}
                            {formatCurrency(selectedRapor.tahmini_butce)}
                          </span>
                        )
                        : null}
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto bg-white dark:bg-slate-900">
                      {loadingKalemler
                        ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            <RefreshCw className="w-4 h-4 mx-auto mb-1 animate-spin text-blue-500" />
                            Kalemler yükleniyor...
                          </div>
                        )
                        : previewKalemler.length === 0
                        ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Bu raporda tanımlı kalem bulunmuyor.
                          </div>
                        )
                        : (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                              <tr>
                                <th className="py-1.5 px-2.5 w-8">#</th>
                                <th className="py-1.5 px-2.5">Kalem Adı</th>
                                <th className="py-1.5 px-2 text-right">
                                  Miktar
                                </th>
                                <th className="py-1.5 px-2">Birim</th>
                                <th className="py-1.5 px-2 text-right">KDV</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {previewKalemler.map((k, idx) => (
                                <tr
                                  key={k.id || idx}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                  <td className="py-1 px-2.5 text-[10px] text-slate-400 font-mono">
                                    {k.sira_no || idx + 1}
                                  </td>
                                  <td className="py-1 px-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                    {k.kalem_adi}
                                    {k.aciklama
                                      ? (
                                        <span className="block text-[10px] text-slate-400 truncate font-normal">
                                          {k.aciklama}
                                        </span>
                                      )
                                      : null}
                                  </td>
                                  <td className="py-1 px-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {k.miktar}
                                  </td>
                                  <td className="py-1 px-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                    {k.birim}
                                  </td>
                                  <td className="py-1 px-2 text-right text-slate-500 text-[11px]">
                                    %{k.kdv_orani ?? 20}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                    </div>
                  </div>

                  {/* Aktarım Tercihleri */}
                  <div className="space-y-2 p-3 bg-blue-50/40 dark:bg-slate-800/40 rounded-2xl border border-blue-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kalem Aktarım Yöntemi</span>
                      </span>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={copyItems}
                          onChange={(e) => setCopyItems(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Kalemleri Malzeme Listesine Kopyala
                        </span>
                      </label>
                    </div>

                    {copyItems && (
                      <div className="space-y-1.5 pt-1">
                        {/* Seçenek 1: Mükerrerleri Atla */}
                        <label
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            transferMode === "append_if_missing"
                              ? "bg-white dark:bg-slate-800 border-blue-500 shadow-2xs"
                              : "bg-transparent border-slate-200 dark:border-slate-700/60 hover:bg-white/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="transferMode"
                            value="append_if_missing"
                            checked={transferMode === "append_if_missing"}
                            onChange={() =>
                              setTransferMode("append_if_missing")}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span>
                                Mevcut Kalemleri Koru & Mükerrerleri Atla
                              </span>
                              <span className="text-[9px] px-1 py-0.1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 rounded-sm font-bold">
                                Tavsiye Edilen
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Dosyadaki mevcut kalemleri korur; aynı isim ve
                              özellikteki kalemleri tekrar eklemez, yalnızca
                              yeni olanları ekler.
                            </div>
                          </div>
                        </label>

                        {/* Seçenek 2: Tümünü Ekle */}
                        <label
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            transferMode === "append_all"
                              ? "bg-white dark:bg-slate-800 border-blue-500 shadow-2xs"
                              : "bg-transparent border-slate-200 dark:border-slate-700/60 hover:bg-white/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="transferMode"
                            value="append_all"
                            checked={transferMode === "append_all"}
                            onChange={() => setTransferMode("append_all")}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              Tüm Kalemleri Doğrudan Ekle
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Mevcut listedeki kalemleri silmez; rapordaki tüm
                              kalemleri kontrolsüzce listenin sonuna ekler.
                            </div>
                          </div>
                        </label>

                        {/* Seçenek 3: Mevcutları Temizle */}
                        <label
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            transferMode === "replace_all"
                              ? "bg-red-50/60 dark:bg-red-950/30 border-red-400 shadow-2xs"
                              : "bg-transparent border-slate-200 dark:border-slate-700/60 hover:bg-red-50/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="transferMode"
                            value="replace_all"
                            checked={transferMode === "replace_all"}
                            onChange={() => setTransferMode("replace_all")}
                            className="mt-0.5 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <div className="font-bold text-red-700 dark:text-red-300">
                              Mevcut Listeyi Temizle ve Rapordakileri Aktar
                            </div>
                            <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                              Dikkat: Dosyadaki mevcut tüm malzeme kalemleri
                              silinir ve sadece bu rapordaki kalemler aktarılır.
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )
              : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <span className="text-xs font-medium">
                    Lütfen sol listeden bir ihtiyaç raporu seçin
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Bilgilendirme Notu */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            İhtiyaç raporunu doğrudan temin dosyasına bağladığınızda; rapor
            durumu otomatik olarak{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              &apos;dosyaya_aktarildi&apos;
            </strong>{" "}
            olarak güncellenir. Dosyadaki talep eden personel veya iş gerekçesi
            boş ise rapordan otomatik olarak tamamlanır.
          </div>
        </div>

        {/* Modal Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleLinkAndTransfer}
            disabled={!selectedRaporId || submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aktarılıyor...</span>
                </>
              )
              : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>
                    {copyItems
                      ? "İhtiyaç Raporunu Bağla ve Kalemleri Aktar"
                      : "İhtiyaç Raporunu Bağla (Kalemsiz)"}
                  </span>
                </>
              )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
