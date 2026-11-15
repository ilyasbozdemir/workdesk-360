import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Columns2,
  Columns3,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

export type FieldCategory = "all" | "evrak" | "is" | "mali" | "sevk";

export interface FormFieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  category: FieldCategory;
  hint?: string;
  placeholder?: string;
  aliases?: string[];
}

const FORM_FIELD_CATALOG: FormFieldConfig[] = [
  // 1. Evrak & Tarih
  {
    key: "evrakSayisi",
    label: "Resmî Evrak Sayısı",
    type: "text",
    category: "evrak",
    placeholder: "E-10234521-934.01-0001",
    hint: "DETSİS / SDP resmî evrak kayıt numarası",
  },
  {
    key: "tarih",
    label: "Belge Tarihi",
    type: "date",
    category: "evrak",
    aliases: ["onayaSunulanTarih", "dosyaTarihi", "onayTarihi", "belgeTarihi"],
    placeholder: "GG.AA.YYYY",
    hint: "Evrak veya onay tarihi",
  },
  {
    key: "faturaNo",
    label: "Fatura Numarası",
    type: "text",
    category: "evrak",
    placeholder: "Örn: GIB202600000123",
    hint: "Yüklenici tarafından kesilen fatura seri/sıra no",
  },
  {
    key: "faturaTarihi",
    label: "Fatura Tarihi",
    type: "date",
    category: "evrak",
    placeholder: "GG.AA.YYYY",
    hint: "Faturanın düzenlendiği tarih",
  },
  {
    key: "teslimTarihi",
    label: "Teslim Tarihi",
    type: "date",
    category: "evrak",
    placeholder: "GG.AA.YYYY",
    hint: "Mal veya işin teslim alındığı tarih",
  },

  // 2. İş & Gerekçe
  {
    key: "isAdi",
    label: "İşin Adı / Konu",
    type: "text",
    category: "is",
    aliases: ["konu", "isinAdi", "dosyaKonusu"],
    placeholder: "İşin adını giriniz...",
    hint: "Alım veya yapım işinin resmî konusu",
  },
  {
    key: "gerekce",
    label: "Alımın Gerekçesi / Açıklama",
    type: "textarea",
    category: "is",
    aliases: ["aciklama", "isinAciklamasi"],
    placeholder: "Alımın gerekçesini ve ihtiyacı belirtiniz...",
    hint: "İhtiyaç gerekçesi ve mevzuat dayanağı",
  },
  {
    key: "sure",
    label: "İşin Süresi",
    type: "text",
    category: "is",
    aliases: ["isinSuresi"],
    placeholder: "Örn: 15 Gün",
    hint: "Teslimat veya işin tamamlanma süresi",
  },
  {
    key: "teminSekli",
    label: "Temin Usulü / KİK Maddesi",
    type: "text",
    category: "is",
    aliases: ["ihaleSekli", "ihaleUsulu"],
    placeholder: "Örn: 22/d Doğrudan Temin",
    hint: "4734 Sayılı KİK kapsamındaki alım usulü",
  },
  {
    key: "ihtiyacYeri",
    label: "İhtiyaç Yeri",
    type: "text",
    category: "is",
    placeholder: "Örn: Fen İşleri Şantiyesi",
    hint: "Malzeme veya hizmetin kullanılacağı yer",
  },

  // 3. Mali & Bütçe
  {
    key: "yaklasikMaliyet",
    label: "Yaklaşık Maliyet Tutarı",
    type: "number",
    category: "mali",
    placeholder: "Örn: 85.000,00 ₺",
    hint: "KDV hariç yaklaşık maliyet toplamı",
  },
  {
    key: "odenekTutari",
    label: "Kullanılabilir Ödenek",
    type: "number",
    category: "mali",
    placeholder: "Örn: 100.000,00 ₺",
    hint: "Bütçede tahsis edilen ödenek tutarı",
  },
  {
    key: "isTutari",
    label: "İş Tutarı / Avans Bedeli",
    type: "number",
    category: "mali",
    placeholder: "Örn: 83.000,00 ₺",
    hint: "Onaylanan veya teklif edilen toplam iş tutarı",
  },
  {
    key: "butceTertibi",
    label: "Bütçe Tertibi",
    type: "text",
    category: "mali",
    placeholder: "Örn: 03.2.1.01",
    hint: "Harcamanın yapılacağı analitik bütçe kodu",
  },
  {
    key: "mutemetAdi",
    label: "Harcama Yetkilisi Mutemedi",
    type: "text",
    category: "mali",
    aliases: ["muhasebeYetkilisiAdi"],
    placeholder: "Mutemet adını giriniz...",
    hint: "Avans verilecek mutemet personeli",
  },

  // 4. Makam & Sevk
  {
    key: "sunulacakMakamAdi",
    label: "Sunulacak Makam / Muhatap",
    type: "text",
    category: "sevk",
    aliases: ["makam", "makamAdi", "muhatap", "muhatapBirim"],
    placeholder: "Örn: Destek Hizmetleri Müdürlüğüne",
    hint: "Yazının arz edildiği birim veya makam başlığı",
  },
  {
    key: "ilgi",
    label: "İlgi Evrak / Dayanak",
    type: "text",
    category: "sevk",
    placeholder: "Örn: 10.10.2026 tarihli ve 104 sayılı Olur",
    hint: "Dayanak gösterilen resmî yazı veya onay",
  },
  {
    key: "ekler",
    label: "Ekler Listesi",
    type: "textarea",
    category: "sevk",
    placeholder: "Ek-1: Şartname\nEk-2: Teklif Cetveli",
    hint: "Evrak ekinde yer alan belgeler",
  },
  {
    key: "dagitim",
    label: "Dağıtım",
    type: "text",
    category: "sevk",
    aliases: ["dagitimListesi"],
    placeholder: "Örn: Mali Hizmetler Müdürlüğüne",
    hint: "Yazının gönderileceği ek birimler",
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
  const [activeCategory, setActiveCategory] = useState<FieldCategory>("all");
  const [columnLayout, setColumnLayout] = useState<"single" | "auto">("auto");
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
    return relevantFields.filter((f) => {
      // Kategori filtresi
      if (activeCategory !== "all" && f.category !== activeCategory) {
        return false;
      }
      // Arama filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLocaleLowerCase("tr-TR").trim();
        const matchLabel = f.label.toLocaleLowerCase("tr-TR").includes(q);
        const matchKey = f.key.toLocaleLowerCase("tr-TR").includes(q);
        const matchHint = f.hint && f.hint.toLocaleLowerCase("tr-TR").includes(q);
        return Boolean(matchLabel || matchKey || matchHint);
      }
      return true;
    });
  }, [relevantFields, activeCategory, searchQuery]);

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

  const handleResetAll = () => {
    setEditedKeys(new Set());
    setFormData((prev: any) => {
      const next = { ...prev };
      for (const spec of relevantFields) {
        if (initialDataRef.current[spec.key] !== undefined) {
          next[spec.key] = initialDataRef.current[spec.key];
        }
        if (spec.aliases) {
          for (const alias of spec.aliases) {
            if (initialDataRef.current[alias] !== undefined) {
              next[alias] = initialDataRef.current[alias];
            }
          }
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
      label: "⚙️ Varsayılan",
      className:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };
  };

  const categories: { id: FieldCategory; label: string; count: number }[] = [
    { id: "all", label: "Tümü", count: relevantFields.length },
    {
      id: "evrak",
      label: "Evrak & Tarih",
      count: relevantFields.filter((f) => f.category === "evrak").length,
    },
    {
      id: "is",
      label: "İş & Gerekçe",
      count: relevantFields.filter((f) => f.category === "is").length,
    },
    {
      id: "mali",
      label: "Mali & Bütçe",
      count: relevantFields.filter((f) => f.category === "mali").length,
    },
    {
      id: "sevk",
      label: "Makam & Sevk",
      count: relevantFields.filter((f) => f.category === "sevk").length,
    },
  ];

  return (
    <div
      id="sidebar-ayarlar-form"
      className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800"
    >
      {/* Üst Başlık & Eylem Çubuğu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
              Belge Form Alanları
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              A4 tuvali ile canlı çift yönlü veri köprüsü
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Düzen Toggle (1 Kolon / 2 Kolon) */}
          <button
            type="button"
            onClick={() =>
              setColumnLayout((prev) => (prev === "auto" ? "single" : "auto"))}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              columnLayout === "auto"
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-500"
            }`}
            title={columnLayout === "auto"
              ? "Geniş ekranda 2 kolonlu görünüm aktif"
              : "Tek kolonlu görünüm aktif"}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          {editedKeys.size > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Tüm manuel düzenlenen alanları orijinal dosya verilerine geri döndür"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Sıfırla ({editedKeys.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Kategori Filtre Sekmeleri */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => {
          if (cat.id !== "all" && cat.count === 0) return null;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          );
        })}
      </div>

      {/* Arama Kutusu */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Alan adı, bütçe kodu veya konu ara..."
          className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Alan Listesi / Izgara (Grid) */}
      <div
        className={columnLayout === "auto"
          ? "grid grid-cols-1 md:grid-cols-2 gap-2.5"
          : "space-y-2.5"}
      >
        {filteredFields.map((field) => {
          const val = getFieldValue(field);
          const badge = getOriginBadge(field, val);
          const isEdited = editedKeys.has(field.key);
          const isFullWidth = field.type === "textarea" || columnLayout === "single";

          return (
            <div
              key={field.key}
              className={`p-3 bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 ${
                isFullWidth ? "col-span-full" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <span className="truncate">{field.label}</span>
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {isEdited && (
                    <button
                      type="button"
                      onClick={() => handleResetField(field)}
                      className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-0.5 ml-0.5"
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
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 custom-scrollbar resize-y min-h-[50px] transition-all"
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
                      className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
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
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                )}

              {field.hint && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="truncate">{field.hint}</span>
                  <span className="font-mono text-[9px] text-slate-400/80 shrink-0">
                    {field.key}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
          <p className="text-xs font-semibold">Eşleşen form alanı bulunamadı</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Farklı bir arama terimi deneyin veya kategori filtresini temizleyin.
          </p>
        </div>
      )}
    </div>
  );
}
