import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, FileText, RotateCcw, Search } from "lucide-react";

export interface FormFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  hint?: string;
  placeholder?: string;
  aliases?: string[];
}

const FORM_FIELD_CATALOG: FormFieldConfig[] = [
  {
    key: "evrakSayisi",
    label: "Resmî Evrak Sayısı",
    type: "text",
    placeholder: "E-10234521-934.01-0001",
    hint: "DETSİS / SDP resmî evrak kayıt numarası",
  },
  {
    key: "tarih",
    label: "Belge Tarihi",
    type: "date",
    aliases: ["onayaSunulanTarih", "dosyaTarihi", "onayTarihi", "belgeTarihi"],
    placeholder: "GG.AA.YYYY",
    hint: "Evrak veya onay tarihi",
  },
  {
    key: "isAdi",
    label: "İşin Adı / Konu",
    type: "text",
    aliases: ["konu", "isinAdi", "dosyaKonusu"],
    placeholder: "İşin adını giriniz...",
    hint: "Alım veya yapım işinin resmî konusu",
  },
  {
    key: "gerekce",
    label: "Alımın Gerekçesi / Açıklama",
    type: "textarea",
    aliases: ["aciklama", "isinAciklamasi"],
    placeholder: "Alımın gerekçesini ve ihtiyacı belirtiniz...",
    hint: "İhtiyaç gerekçesi ve mevzuat dayanağı",
  },
  {
    key: "sure",
    label: "İşin Süresi",
    type: "text",
    aliases: ["isinSuresi"],
    placeholder: "Örn: 15 Gün",
    hint: "Teslimat veya işin tamamlanma süresi",
  },
  {
    key: "teminSekli",
    label: "Temin Usulü / KİK Maddesi",
    type: "text",
    aliases: ["ihaleSekli", "ihaleUsulu"],
    placeholder: "Örn: 22/d Doğrudan Temin",
    hint: "4734 Sayılı KİK kapsamındaki alım usulü",
  },
  {
    key: "yaklasikMaliyet",
    label: "Yaklaşık Maliyet Tutarı",
    type: "number",
    placeholder: "Örn: 85.000,00 ₺",
    hint: "KDV hariç yaklaşık maliyet toplamı",
  },
  {
    key: "odenekTutari",
    label: "Kullanılabilir Ödenek",
    type: "number",
    placeholder: "Örn: 100.000,00 ₺",
    hint: "Bütçede tahsis edilen ödenek tutarı",
  },
  {
    key: "isTutari",
    label: "İş Tutarı / Avans Bedeli",
    type: "number",
    placeholder: "Örn: 83.000,00 ₺",
    hint: "Onaylanan veya teklif edilen toplam iş tutarı",
  },
  {
    key: "butceTertibi",
    label: "Bütçe Tertibi",
    type: "text",
    placeholder: "Örn: 03.2.1.01",
    hint: "Harcamanın yapılacağı analitik bütçe kodu",
  },
  {
    key: "sunulacakMakamAdi",
    label: "Sunulacak Makam / Muhatap",
    type: "text",
    aliases: ["makam", "makamAdi", "muhatap", "muhatapBirim"],
    placeholder: "Örn: Destek Hizmetleri Müdürlüğüne",
    hint: "Yazının arz edildiği birim veya makam başlığı",
  },
  {
    key: "ihtiyacYeri",
    label: "İhtiyaç Yeri",
    type: "text",
    placeholder: "Örn: Fen İşleri Şantiyesi",
    hint: "Malzeme veya hizmetin kullanılacağı yer",
  },
  {
    key: "ilgi",
    label: "İlgi Evrak / Dayanak",
    type: "text",
    placeholder: "Örn: 10.10.2026 tarihli ve 104 sayılı Olur",
    hint: "Dayanak gösterilen resmî yazı veya onay",
  },
  {
    key: "ekler",
    label: "Ekler Listesi",
    type: "textarea",
    placeholder: "Ek-1: Şartname\nEk-2: Teklif Cetveli",
    hint: "Evrak ekinde yer alan belgeler",
  },
  {
    key: "dagitim",
    label: "Dağıtım",
    type: "text",
    aliases: ["dagitimListesi"],
    placeholder: "Örn: Mali Hizmetler Müdürlüğüne",
    hint: "Yazının gönderileceği ek birimler",
  },
  {
    key: "mutemetAdi",
    label: "Harcama Yetkilisi Mutemedi",
    type: "text",
    aliases: ["muhasebeYetkilisiAdi"],
    placeholder: "Mutemet adını giriniz...",
    hint: "Avans verilecek mutemet personeli",
  },
  {
    key: "faturaNo",
    label: "Fatura Numarası",
    type: "text",
    placeholder: "Örn: GIB202600000123",
    hint: "Yüklenici tarafından kesilen fatura seri/sıra no",
  },
  {
    key: "faturaTarihi",
    label: "Fatura Tarihi",
    type: "date",
    placeholder: "GG.AA.YYYY",
    hint: "Faturanın düzenlendiği tarih",
  },
  {
    key: "teslimTarihi",
    label: "Teslim Tarihi",
    type: "date",
    placeholder: "GG.AA.YYYY",
    hint: "Mal veya işin teslim alındığı tarih",
  },
];

export interface DocumentPreviewFormBuilderProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  selectedDocId?: string;
}

export function DocumentPreviewFormBuilder({
  formData,
  setFormData,
  selectedDocId,
}: DocumentPreviewFormBuilderProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());
  const initialDataRef = useRef<Record<string, any>>({});

  useEffect(() => {
    initialDataRef.current = { ...(formData || {}) };
    setEditedKeys(new Set());
  }, [selectedDocId]);

  // Şablon ve formData ile uyumlu alanların filtrelenmesi
  const relevantFields = useMemo(() => {
    return FORM_FIELD_CATALOG.filter((spec) => {
      if (formData && formData[spec.key] !== undefined) return true;
      if (
        spec.aliases &&
        spec.aliases.some((a) => formData && formData[a] !== undefined)
      ) {
        return true;
      }
      // Temel alanlar her belgede geçerlidir
      const coreKeys = [
        "evrakSayisi",
        "tarih",
        "isAdi",
        "gerekce",
        "sure",
        "teminSekli",
        "yaklasikMaliyet",
      ];
      return coreKeys.includes(spec.key);
    });
  }, [formData, selectedDocId]);

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return relevantFields;
    const q = searchQuery.toLocaleLowerCase("tr-TR").trim();
    return relevantFields.filter(
      (f) =>
        f.label.toLocaleLowerCase("tr-TR").includes(q) ||
        f.key.toLocaleLowerCase("tr-TR").includes(q) ||
        (f.hint && f.hint.toLocaleLowerCase("tr-TR").includes(q)),
    );
  }, [relevantFields, searchQuery]);

  const getFieldValue = (spec: FormFieldConfig): string => {
    if (!formData) return "";
    if (formData[spec.key] !== undefined && formData[spec.key] !== null) {
      return String(formData[spec.key]);
    }
    if (spec.aliases) {
      for (const alias of spec.aliases) {
        if (formData[alias] !== undefined && formData[alias] !== null) {
          return String(formData[alias]);
        }
      }
    }
    return "";
  };

  const handleFieldChange = (spec: FormFieldConfig, value: string) => {
    setEditedKeys((prev) => new Set(prev).add(spec.key));
    setFormData((prev: any) => {
      const next = { ...prev, [spec.key]: value };
      if (spec.aliases) {
        for (const alias of spec.aliases) {
          next[alias] = value;
        }
      }
      return next;
    });
  };

  const handleResetField = (spec: FormFieldConfig) => {
    const origVal = initialDataRef.current[spec.key] ??
      (spec.aliases?.find((a) => initialDataRef.current[a] !== undefined)
        ? initialDataRef.current[
          spec.aliases.find((a) => initialDataRef.current[a] !== undefined)!
        ]
        : "");

    setEditedKeys((prev) => {
      const next = new Set(prev);
      next.delete(spec.key);
      return next;
    });

    setFormData((prev: any) => {
      const next = { ...prev, [spec.key]: origVal };
      if (spec.aliases) {
        for (const alias of spec.aliases) {
          next[alias] = origVal;
        }
      }
      return next;
    });
  };

  const getOriginBadge = (spec: FormFieldConfig, val: string) => {
    if (editedKeys.has(spec.key)) {
      return {
        label: "✏️ Manuel Seçim",
        className:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    }
    if (val && String(val).trim() !== "") {
      return {
        label: "📁 Dosyadan",
        className:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    }
    return {
      label: "⚙️ Varsayılan Ayar",
      className:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };
  };

  return (
    <div
      id="sidebar-ayarlar-form"
      className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Belge Form Alanları
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          {relevantFields.length} Alan
        </span>
      </div>

      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Belge verilerini doğrudan buradan düzenleyebilirsiniz. Değişiklikler
        canlı olarak A4 tuvaline yansır.
      </p>

      {/* Arama Kutusu */}
      {relevantFields.length > 4 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Alan ara (evrak, tutar, makam...)"
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      )}

      {/* Alan Listesi */}
      <div className="space-y-2.5">
        {filteredFields.map((field) => {
          const val = getFieldValue(field);
          const badge = getOriginBadge(field, val);
          const isEdited = editedKeys.has(field.key);

          return (
            <div
              key={field.key}
              className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 shadow-2xs transition-colors focus-within:border-blue-400"
            >
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <span>{field.label}</span>
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {isEdited && (
                    <button
                      type="button"
                      onClick={() => handleResetField(field)}
                      className="text-[10px] text-amber-700 hover:text-amber-900 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Orijinal dosyadan gelen değere geri döndür"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Geri Al</span>
                    </button>
                  )}
                </div>
              </div>

              {field.type === "textarea"
                ? (
                  <textarea
                    rows={2}
                    value={val}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 custom-scrollbar resize-y min-h-[44px]"
                  />
                )
                : field.type === "date"
                ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={field.placeholder || "GG.AA.YYYY"}
                      className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                )
                : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                )}

              {field.hint && (
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight">
                  {field.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
