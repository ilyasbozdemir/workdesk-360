import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Info,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "../../../../../utils/cn";

interface PricesSummaryDashboardProps {
  invitedFirms: any[];
  items: any[];
  bids: Record<string, number>;
  onManageFirmsClick?: () => void;
  manualWinnerFirmaId?: number | null;
  handleSetWinnerFirma?: (firmaMasterId: number | null) => Promise<void>;
  hesaplamaEsasi?: string;
}

export function PricesSummaryDashboard({
  invitedFirms,
  items,
  bids,
  onManageFirmsClick,
  manualWinnerFirmaId,
  handleSetWinnerFirma,
  hesaplamaEsasi,
}: PricesSummaryDashboardProps): React.JSX.Element {
  const isLowestBasis = !hesaplamaEsasi ||
    hesaplamaEsasi.toLowerCase().includes("en düşük") ||
    hesaplamaEsasi.toLowerCase().includes("en dusuk");

  if (invitedFirms.length === 0) {
    return (
      <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-9 h-9 text-slate-350 dark:text-slate-655" />
        <div className="text-slate-700 dark:text-slate-300 text-sm font-bold">
          Teklif bilgisi bulunamadı.
        </div>
        <p className="text-xs text-slate-450 dark:text-slate-500 max-w-md">
          Fiyat tekliflerini görmek için lütfen &quot;Yeni Tutanak Ekle / Teklif
          Girişi&quot; butonuna tıklayarak firmaları davet edin ve teklifleri
          girin.
        </p>
        {onManageFirmsClick && (
          <button
            type="button"
            onClick={onManageFirmsClick}
            className="mt-2 flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            İstekli Firmaları Yönet
          </button>
        )}
      </div>
    );
  }

  // Calculate totals
  const firmTotals = invitedFirms.map((firm: any) => {
    let total = 0;
    items.forEach((item: any) => {
      const bidVal = bids[`${item.id}_${firm.id}`] ??
        (firm.firma_id ? bids[`${item.id}_${firm.firma_id}`] : undefined) ??
        0;
      if (bidVal && bidVal > 0) {
        total += bidVal * (Number(item.miktar) > 0 ? Number(item.miktar) : 1);
      }
    });
    const effectiveTotal = total > 0 ? total : Number(firm.teklif_toplami) || 0;
    return { firm, total: effectiveTotal };
  });

  const nonZeroTotals = firmTotals.filter((t) => t.total > 0);
  const lowestTotal = nonZeroTotals.length > 0
    ? Math.min(...nonZeroTotals.map((t) => t.total))
    : 0;

  const MIN_REQUIRED_FIRMS = 3;
  const totalInvitedCount = invitedFirms.length; // Dosyaya Eklenen / Davet Edilen İstekli Firma
  const submittedFirmsCount = nonZeroTotals.length; // Teklif Fiyatı Giren Firma Sayısı
  const pendingFirmsCount = Math.max(
    0,
    totalInvitedCount - submittedFirmsCount,
  );
  const isMevzuatUygun = totalInvitedCount >= MIN_REQUIRED_FIRMS;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* İSTEKLİ & TEKLİF KATILIM ÖZETİ BARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-help transition-all hover:border-blue-300"
            title="1. Adımda dosyaya eklenen istekli sayısı. Mektup ve boş teklif cetveli dağıtılan firmaları ifade eder."
          >
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Davet Edilen:
            </span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
              {totalInvitedCount} Firma
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-2xs cursor-help transition-all",
              submittedFirmsCount === totalInvitedCount && totalInvitedCount > 0
                ? "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
            )}
            title="Mektup dağıtılan firmalardan teklifi teslim alınıp birim fiyatları girilen (teklif tutarı 0,00 ₺'nin üzerinde olan) firma sayısı. 3 firmanın tamamı fiyat verdiğinde yeşil rozet ile kesinleşir."
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Teklif Veren:
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {submittedFirmsCount} Firma
            </span>
          </div>

          {pendingFirmsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-2xs cursor-help transition-all hover:border-amber-400"
              title="Davet edildiği halde henüz fiyat girişi yapılmamış firma sayısı. Örneğin 1 firma henüz fiyat vermemişse sarı uyarı rozeti olarak gösterilir."
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                Fiyat Beklenen:
              </span>
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                {pendingFirmsCount}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onManageFirmsClick && (
            <button
              type="button"
              onClick={onManageFirmsClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="1. Adıma Dönerek İstekli Firmaları Seç ve Yönet"
            >
              <Users size={13} />
              <span>Firmaları Yönet</span>
            </button>
          )}
        </div>
      </div>

      {/* TEKLİF STATÜSÜ & SÜREÇ REHBERİ (Açıklayıcı Başlık & Uyarı Kartı) */}
      {pendingFirmsCount > 0 ? (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-amber-900 dark:text-amber-200 text-xs">
                Teklif Veren Statüsü (Nasıl Değişir?)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300/40">
                Fiyat Bekleniyor: {pendingFirmsCount} Firma
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90 font-medium">
              Firmalara dağıtılan mektuplara istinaden firmalar tekliflerini idareye sunduğunda; aşağıdaki tabloda ilgili firmanın birim fiyatlarını giriniz. Bir firmanın fiyatları girilip teklif tutarı <strong>0,00 ₺&apos;nin üzerine çıktığı anda</strong>, program o firmayı otomatik olarak <strong>&quot;Teklif Veren Firma&quot;</strong> statüsüne geçirir. Tüm firmalar fiyat girdiğinde yeşil rozet ile katılım tamamlanacak ve en uygun teklif sahibi kesinleşecektir.
            </p>
          </div>
        </div>
      ) : totalInvitedCount > 0 ? (
        <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
              <strong>Tam Katılım Sağlandı:</strong> Davet edilen {totalInvitedCount} firmanın tamamının teklif tutarları 0,00 ₺&apos;nin üzerindedir ({submittedFirmsCount} Firma Teklif Veren - Yeşil Rozet).
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
            Piyasa Fiyatı Hazır
          </span>
        </div>
      ) : null}

      {/* Firm totals summary card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {firmTotals.map(({ firm, total }, fIdx) => {
          const isLowest = total > 0 && total === lowestTotal;
          const isSelectedWinner = manualWinnerFirmaId
            ? manualWinnerFirmaId === firm.firma_id ||
              manualWinnerFirmaId === firm.id
            : isLowest;

          return (
            <div
              key={`firm_card_${firm.id ?? firm.firma_id ?? fIdx}_${fIdx}`}
              className={cn(
                "p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden",
                isSelectedWinner
                  ? "bg-amber-50/40 dark:bg-amber-955/10Firmaları Yönet border-amber-300 dark:border-amber-700 shadow-sm ring-1 ring-amber-400/40"
                  : isLowest
                  ? "bg-emerald-50/30 dark:bg-emerald-955/10 border-emerald-300 dark:border-emerald-800"
                  : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80",
              )}
            >
              {isSelectedWinner && (
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center rotate-45">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-450 mt-8" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isSelectedWinner
                        ? "text-amber-500"
                        : isLowest
                        ? "text-emerald-500"
                        : "text-slate-400",
                    )}
                  />
                  <span
                    className="font-extrabold text-xs text-slate-800 dark:text-slate-250 truncate block max-w-[180px]"
                    title={firm.unvan}
                  >
                    {firm.unvan}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {total > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-black bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/25"
                      title="Firmaya ait birim fiyatlar girilmiş olup teklif tutarı 0,00 ₺'nin üzerindedir. Statü: Teklif Veren Firma."
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                      Teklif Veren
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/25"
                      title="Teklif isteme mektubu dağıtıldı. İdarenize sunduğu teklif birim fiyatlarını aşağıdaki tablodan giriniz; tutar 0,00 ₺'nin üzerine çıktığı anda otomatik 'Teklif Veren' olacaktır."
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                      Fiyat Bekleniyor
                    </span>
                  )}
                  {isSelectedWinner && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/25">
                      <Trophy className="w-2.5 h-2.5 text-amber-600" />
                      Kazanan Firma
                    </span>
                  )}
                  {isLowest && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded-md border border-emerald-500/15">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      {isLowestBasis ? "En Düşük Teklif" : "En Uygun Teklif"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    Toplam Teklif
                  </span>
                  <span
                    className={cn(
                      "text-base font-extrabold font-mono",
                      total > 0
                        ? isSelectedWinner
                          ? "text-amber-600 dark:text-amber-400"
                          : isLowest
                          ? "text-emerald-650 dark:text-emerald-455"
                          : "text-slate-800 dark:text-slate-200"
                        : "text-slate-400 italic text-xs font-semibold",
                    )}
                  >
                    {total > 0
                      ? `${
                        total.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      } TL`
                      : "Fiyat girilmedi"}
                  </span>
                </div>

                {handleSetWinnerFirma && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelectedWinner) {
                        handleSetWinnerFirma(null);
                      } else {
                        handleSetWinnerFirma(firm.firma_id || firm.id);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border-0 shrink-0 inline-flex items-center gap-1",
                      isSelectedWinner
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
                        : "bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300",
                    )}
                    title={isSelectedWinner
                      ? "Kazanan seçimini kaldır"
                      : "Bu firmayı kazanan yap"}
                  >
                    <Trophy className="w-3 h-3" />
                    {isSelectedWinner ? "Seçili" : "Kazanan Yap"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {onManageFirmsClick && (
          <div
            onClick={onManageFirmsClick}
            className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 dark:border-slate-800 dark:hover:border-blue-700 bg-slate-50/30 hover:bg-blue-50/30 dark:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group min-h-[140px]"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              + İstekli Firma Ekle / Yönet
            </span>
            <span className="text-[10px] text-slate-400 text-center">
              {totalInvitedCount} İstekli · {submittedFirmsCount} Teklif Alındı
            </span>
          </div>
        )}
      </div>

      {/* Needs comparison breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          Kalem Bazlı Fiyat Karşılaştırması
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-455 font-extrabold">
                <th className="py-2.5 px-3">İhtiyaç Kalemi</th>
                <th className="py-2.5 px-3 text-center">Miktar</th>
                {invitedFirms.map((firm: any, fIdx: number) => (
                  <th
                    key={`firm_head_${
                      firm.id ?? firm.firma_id ?? fIdx
                    }_${fIdx}`}
                    className="py-2.5 px-3 text-right max-w-[150px] truncate"
                    title={firm.unvan}
                  >
                    {firm.unvan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, itmIdx: number) => {
                // Find lowest bid for this item
                const itemBids = invitedFirms
                  .map((f: any) => {
                    const key = `${item.id}_${f.id}`;
                    return {
                      firmId: f.id,
                      price: bids[key] || 0,
                    };
                  })
                  .filter((b) => b.price > 0);

                const minItemPrice = itemBids.length > 0
                  ? Math.min(...itemBids.map((b) => b.price))
                  : 0;

                return (
                  <tr
                    key={`item_row_${item.id ?? itmIdx}_${itmIdx}`}
                    className="border-b border-slate-50 dark:border-slate-900/60 hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-250">
                      {item.kalem_adi}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-semibold">
                      {item.miktar} {item.birim}
                    </td>
                    {invitedFirms.map((firm: any, fIdx: number) => {
                      const key = `${item.id}_${firm.id}`;
                      const bidVal = bids[key] || 0;
                      const isItemWinner = bidVal > 0 &&
                        bidVal === minItemPrice;

                      return (
                        <td
                          key={`firm_cell_${item.id ?? itmIdx}_${
                            firm.id ?? firm.firma_id ?? fIdx
                          }_${fIdx}`}
                          className="py-3 px-3 text-right font-mono font-bold"
                        >
                          {bidVal > 0
                            ? (
                              <span
                                className={isItemWinner
                                  ? "text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-500/10"
                                  : "text-slate-700 dark:text-slate-300"}
                              >
                                {bidVal.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} TL
                              </span>
                            )
                            : (
                              <span className="text-slate-350 italic text-[11px] font-semibold">
                                -
                              </span>
                            )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 font-extrabold text-xs">
                <td className="py-3.5 px-3 text-slate-850 dark:text-slate-100 font-black">
                  TOPLAM TEKLİF TUTARI (KDV Hariç)
                </td>
                <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                  {items.length} Kalem
                </td>
                {invitedFirms.map((firm: any, fIdx: number) => {
                  const firmTotObj = firmTotals.find(
                    (ft) =>
                      (ft.firm.id && ft.firm.id === firm.id) ||
                      (ft.firm.firma_id &&
                        ft.firm.firma_id === (firm.firma_id || firm.id)),
                  );
                  const total = firmTotObj ? firmTotObj.total : 0;
                  const isLowest = total > 0 && total === lowestTotal;
                  const isSelectedWinner = manualWinnerFirmaId
                    ? manualWinnerFirmaId === firm.firma_id ||
                      manualWinnerFirmaId === firm.id
                    : isLowest;

                  return (
                    <td
                      key={`firm_foot_${
                        firm.id ?? firm.firma_id ?? fIdx
                      }_${fIdx}`}
                      className="py-3.5 px-3 text-right font-mono"
                    >
                      {total > 0
                        ? (
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "text-xs font-black",
                                isSelectedWinner
                                  ? "text-amber-600 dark:text-amber-400"
                                  : isLowest
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-800 dark:text-slate-100",
                              )}
                            >
                              {total.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} TL
                            </span>
                            {isSelectedWinner && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">
                                ★ Kazanan
                              </span>
                            )}
                            {!isSelectedWinner && isLowest && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                                ✓ En Düşük
                              </span>
                            )}
                          </div>
                        )
                        : (
                          <span className="text-slate-400 italic text-[11px] font-normal">
                            Fiyat Eksik
                          </span>
                        )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
