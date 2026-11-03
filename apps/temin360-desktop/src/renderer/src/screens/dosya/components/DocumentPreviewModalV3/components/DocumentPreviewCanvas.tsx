import React from "react";
import { FileText, Layers } from "lucide-react";
import {
  IhtiyacListesiType,
  resolveTemplateKey,
  TemplateComponentType,
  TemplateKey,
  toTrDate,
} from "@temin360/document-templates";
import { DocumentRenderer } from "@worksuite-360/document-engine";
import { Personel } from "../types";
import { TemplateOptionItem } from "../templateResolver";
import { useSettingsStore } from "../../../../../store/settingsStore";
import { formatDateString } from "../../../contextBuilder/dateHelpers";

interface DocumentPreviewCanvasProps {
  isLoading?: boolean;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  previewScale: number;
  orientation: "portrait" | "landscape";
  ActiveComponent?: TemplateComponentType | null;
  selectedDocId?: string;
  isEditingMode: boolean;
  formData: Partial<IhtiyacListesiType>;
  setFormData: React.Dispatch<
    React.SetStateAction<Partial<IhtiyacListesiType>>
  >;
  personelListesi: Personel[];
  firmaListesi: any[];
  birimListesi?: any[];
  localShowLogoLeft: boolean;
  localShowLogoRight: boolean;
  onSelectTemplate?: (id: string) => void;
  templateOptions?: TemplateOptionItem[];
}

export function DocumentPreviewCanvas({
  isLoading,
  previewContainerRef,
  previewScale,
  orientation,
  ActiveComponent,
  selectedDocId,
  isEditingMode,
  formData,
  setFormData,
  personelListesi,
  firmaListesi,
  birimListesi = [],
  localShowLogoLeft,
  localShowLogoRight,
  onSelectTemplate,
  templateOptions = [],
}: DocumentPreviewCanvasProps): React.JSX.Element {
  const resolvedKey = selectedDocId
    ? resolveTemplateKey(selectedDocId)
    : undefined;
  const effectiveTemplateKey: TemplateKey = resolvedKey || "ihtiyac_listesi";

  if (isLoading) {
    return (
      <div
        ref={previewContainerRef}
        className="flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center items-center h-full py-8 custom-scrollbar min-h-0 min-w-0"
      >
        <div className="flex flex-col items-center justify-center text-slate-500 py-36 gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Belge Verileri Yükleniyor...
          </span>
          <span className="text-[11px] text-slate-400">
            Dosya ve mevzuat değişkenleri şablona aktarılıyor
          </span>
        </div>
      </div>
    );
  }

  if (!selectedDocId && !ActiveComponent) {
    return (
      <div
        ref={previewContainerRef}
        className="flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center items-center h-full py-8 custom-scrollbar min-h-0 min-w-0"
      >
        <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-300 py-20 px-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            Görüntülenecek Belge Şablonunu Seçin
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Önizlemek veya düzenlemek istediğiniz belge şablonunu seçerek hemen
            çalışmaya başlayabilirsiniz.
          </p>
          {templateOptions && templateOptions.length > 0 && onSelectTemplate &&
            (
              <div className="grid grid-cols-1 gap-2 w-full max-w-md text-left">
                {templateOptions.slice(0, 6).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectTemplate(opt.id)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {opt.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {opt.categoryLabel}
                      </span>
                    </div>
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>
    );
  }

  const mergedData = {
    ...formData,
    personelListesi: (formData as any).personelListesi || personelListesi,
    firmaListesi: (formData as any).firmaListesi || firmaListesi,
    birimListesi: (formData as any).birimListesi || birimListesi,
    tarih: formatDateString(formData.tarih) ||
      formatDateString(formData.onayaSunulanTarih) ||
      toTrDate(new Date()),
    onayaSunulanTarih: formatDateString(formData.onayaSunulanTarih) ||
      formatDateString(formData.tarih) ||
      toTrDate(new Date()),
    onayTarihi: formatDateString(formData.onayTarihi) ||
      formatDateString(formData.olurTarihi) ||
      formatDateString(formData.dosyaTarihi) ||
      "",
    dosyaTarihi: formatDateString((formData as any).dosyaTarihi) || "",
    teslimTarihi: formatDateString((formData as any).teslimTarihi) || "",
    solLogo: localShowLogoLeft
      ? (formData.solLogo && String(formData.solLogo).trim() !== ""
        ? formData.solLogo
        : null) ||
        useSettingsStore.getState().logoLeft ||
        useSettingsStore.getState().institutionLogo ||
        null
      : null,
    sagLogo: localShowLogoRight
      ? (formData.sagLogo && String(formData.sagLogo).trim() !== ""
        ? formData.sagLogo
        : null) ||
        useSettingsStore.getState().logoRight ||
        null
      : null,
    olurYazisi: formData.olurYazisi !== false,
    orientation,
  };

  return (
    <div
      ref={previewContainerRef}
      className="flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center overflow-auto h-full py-8 custom-scrollbar min-h-0 min-w-0"
    >
      <DocumentRenderer
        templateKey={effectiveTemplateKey}
        data={mergedData}
        orientation={orientation}
        chrome="paper"
        scale={previewScale}
        isEditing={isEditingMode}
        onFieldChange={(key, val) =>
          setFormData((prev) => {
            const updated = { ...prev, [key]: val };
            if (key === "onayaSunulanTarih" || key === "tarih") {
              const trVal = toTrDate(val);
              updated.tarih = trVal;
              updated.onayaSunulanTarih = trVal;
              updated.belgeTarihi = trVal;
            }
            if (key === "onayTarihi" || key === "olurTarihi") {
              const trVal = toTrDate(val);
              updated.onayTarihi = trVal;
              updated.olurTarihi = trVal;
            }
            return updated;
          })}
        personelListesi={personelListesi}
        firmaListesi={firmaListesi}
        birimListesi={birimListesi}
        firstPageLimit={formData.firstPageLimit}
      />
    </div>
  );
}
