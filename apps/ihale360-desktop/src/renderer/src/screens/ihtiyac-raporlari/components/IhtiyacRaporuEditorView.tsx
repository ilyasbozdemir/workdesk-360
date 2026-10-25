import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderOpen,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  IhtiyacRaporuDurum,
  IhtiyacRaporuKalem,
  ihtiyacRaporuService,
  KalemTipi,
} from "../../../services/ihtiyacRaporuService";
import { dbClient } from "../../../services/db/dbClient";
import { formatCurrency } from "../../../utils/formatters";
import { cn } from "../../../utils/cn";
import { BirimOption, CatalogKalemOption, PersonelOption } from "../types";

interface EditorViewProps {
  editId: number | null;
  initialTeminDosyaId?: number | null;
  onBack: () => void;
  onSuccess: (savedId: number) => void;
}

const BIRIM_OPTIONS = [
  "Adet",
  "Kg",
  "Gram",
  "Litre",
  "Metre",
  "Metrekare",
  "Metreküp",
  "Paket",
  "Koli",
  "Takım",
  "Rulo",
  "Saat",
  "Gün",
  "Ay",
  "Yıl",
  "Kişi",
  "Sefer",
  "Ton",
];

const KALEM_TIPLERI: KalemTipi[] = ["Mal", "Hizmet", "Yapım", "Danışmanlık"];

export function IhtiyacRaporuEditorView({
  editId,
  initialTeminDosyaId,
  onBack,
  onSuccess,
}: EditorViewProps): React.JSX.Element {
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);

  // Dossier association
  const [teminDosyaId, setTeminDosyaId] = useState<number | null>(
    initialTeminDosyaId ?? null,
  );
  const [linkedDosya, setLinkedDosya] = useState<
    {
      id: number;
      dosya_no: string;
      konu: string;
      tur?: string;
    } | null
  >(null);

  // Fetch linked dosya details when teminDosyaId changes
  useEffect(() => {
    if (!teminDosyaId) return;
    let isCurrent = true;
    dbClient
      .queryFirst<{ id: number; dosya_no: string; konu: string; tur: string }>(
        `SELECT id, COALESCE(temin_no, dosya_no, 'Dosya #' || id) as dosya_no, konu, tur FROM DATA_TeminDosyasi WHERE id = ?`,
        [teminDosyaId],
      )
      .then((d) => {
        if (isCurrent) setLinkedDosya(d);
      })
      .catch(() => {
        if (isCurrent) setLinkedDosya(null);
      });
    return () => {
      isCurrent = false;
    };
  }, [teminDosyaId]);

  // Form Fields
  const [raporNo, setRaporNo] = useState("");
  const [evrakSayisi, setEvrakSayisi] = useState("");
  const [baslik, setBaslik] = useState("");
  const [gerekce, setGerekce] = useState("");
  const [birimId, setBirimId] = useState<number | null>(null);
  const [birimAdi, setBirimAdi] = useState("");
  const [personelId, setPersonelId] = useState<number | null>(null);
  const [personelAdi, setPersonelAdi] = useState("");
  const [personelUnvan, setPersonelUnvan] = useState("");
  const [durum, setDurum] = useState<IhtiyacRaporuDurum>("taslak");
  const [tarih, setTarih] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [notlar, setNotlar] = useState("");
  const [kalemler, setKalemler] = useState<IhtiyacRaporuKalem[]>([]);

  // Rapor No Checker & Otomatik Numara Üretim Durumu (Doğrudan Temin Mantığı)
  const [isCheckingNo, setIsCheckingNo] = useState(false);
  const [duplicateRapor, setDuplicateRapor] = useState<
    {
      id: number;
      rapor_no: string;
      baslik: string;
    } | null
  >(null);
  const [nextSuggestedNo, setNextSuggestedNo] = useState("");

  const targetYear = useMemo(() => {
    if (tarih) {
      const parsed = new Date(tarih).getFullYear();
      if (!isNaN(parsed)) return parsed;
    }
    return new Date().getFullYear();
  }, [tarih]);

  const isYearMismatch = useMemo(() => {
    if (!raporNo.trim()) return false;
    const match = raporNo.match(/(?:IR-)?(\d{4})[/-]/i);
    if (match) {
      const yearInNo = parseInt(match[1], 10);
      return yearInNo !== targetYear;
    }
    return false;
  }, [raporNo, targetYear]);

  const isAvailableRaporNo = useMemo(() => {
    return !isCheckingNo && !duplicateRapor && !isYearMismatch &&
      Boolean(raporNo.trim());
  }, [isCheckingNo, duplicateRapor, isYearMismatch, raporNo]);

  // Canlı Mükerrer Rapor Numarası Kontrolü (Doğrudan Temin ile Birebir Aynı)
  useEffect(() => {
    const trimmed = raporNo.trim();
    if (!trimmed) {
      setDuplicateRapor(null);
      setIsCheckingNo(false);
      return;
    }

    let isCurrent = true;
    setIsCheckingNo(true);

    const timer = setTimeout(async () => {
      try {
        const sql = editId
          ? `SELECT id, rapor_no, baslik FROM DATA_IhtiyacRaporu WHERE LOWER(rapor_no) = LOWER(?) AND id != ? LIMIT 1`
          : `SELECT id, rapor_no, baslik FROM DATA_IhtiyacRaporu WHERE LOWER(rapor_no) = LOWER(?) LIMIT 1`;
        const params = editId ? [trimmed, editId] : [trimmed];
        const found = await dbClient.queryFirst<
          { id: number; rapor_no: string; baslik: string }
        >(
          sql,
          params,
        );

        if (isCurrent) {
          setDuplicateRapor(found || null);
          setIsCheckingNo(false);
        }
      } catch {
        if (isCurrent) setIsCheckingNo(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [raporNo, editId]);

  const fetchNextSuggestedNo = useCallback(
    async (year: number): Promise<string> => {
      try {
        const nextNo = await ihtiyacRaporuService.getNextRaporNo(year);
        setNextSuggestedNo(nextNo);
        return nextNo;
      } catch {
        const fallback = `IR-${year}/001`;
        setNextSuggestedNo(fallback);
        return fallback;
      }
    },
    [],
  );

  useEffect(() => {
    fetchNextSuggestedNo(targetYear);
  }, [targetYear, fetchNextSuggestedNo]);

  // Doğrudan temindeki gibi: Rapor Tarihi değiştiğinde yılına göre sıradaki numarayı otomatik ata
  const handleTarihChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const newDate = e.target.value;
    const oldYear = targetYear;
    setTarih(newDate);

    const newYear = newDate ? new Date(newDate).getFullYear() : null;
    if (newYear && newYear !== oldYear) {
      try {
        const nextNo = await fetchNextSuggestedNo(newYear);
        const oldPrefix = `${oldYear}/`;
        const isAutoPattern = !raporNo || raporNo.startsWith(oldPrefix) ||
          raporNo.startsWith(`${oldYear}/`);

        if (isAutoPattern || !editId) {
          setRaporNo(nextNo);
        }
      } catch {
        const fallback = `IR-${newYear}/001`;
        setNextSuggestedNo(fallback);
        if (!editId) setRaporNo(fallback);
      }
    }
  };

  // Sıradaki No butonuna tıklandığında boş numarayı ata
  const handleAssignNextNo = async (): Promise<void> => {
    try {
      setIsCheckingNo(true);
      const nextNo = await fetchNextSuggestedNo(targetYear);
      setRaporNo(nextNo);
    } finally {
      setIsCheckingNo(false);
    }
  };

  // Rapor No alanından çıkıldığında format tamamlama (Doğrudan temin standardı)
  const handleRaporNoBlur = (): void => {
    let val = raporNo.trim();
    if (!val) return;

    // Sadece sayı girildiyse (örn: "5" veya "12") -> IR-YYYY/005 formatına getir
    if (/^\d+$/.test(val)) {
      val = `IR-${targetYear}/${val.padStart(3, "0")}`;
    } else {
      // "2026/1" veya "2026/001" girildiyse -> IR-2026/001 formatına getir
      const matchSlash = val.match(/^(\d{4})[/-](\d+)$/);
      if (matchSlash) {
        val = `IR-${matchSlash[1]}/${matchSlash[2].padStart(3, "0")}`;
      }
    }
    setRaporNo(val);
  };

  // Lookups
  const [birimler, setBirimler] = useState<BirimOption[]>([]);
  const [personeller, setPersoneller] = useState<PersonelOption[]>([]);
  const [catalogKalemler, setCatalogKalemler] = useState<CatalogKalemOption[]>(
    [],
  );
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Load Lookups on mount
  useEffect(() => {
    dbClient
      .query<BirimOption>(
        "SELECT id, birim_adi FROM TANIM_Birim ORDER BY birim_adi ASC",
      )
      .then((res) => setBirimler(res))
      .catch(() => {});

    dbClient
      .query<PersonelOption>(
        "SELECT id, ad_soyad, unvan FROM TANIM_Personel WHERE aktif_mi = 1 ORDER BY ad_soyad ASC",
      )
      .then((res) => setPersoneller(res))
      .catch(() => {});

    dbClient
      .query<CatalogKalemOption>(
        "SELECT id, kalem_adi, tipi, birim, kdv_orani, COALESCE(ozelligi, notlar, '') AS aciklama, poz_no, tasinir_kodu FROM TANIM_Kalem ORDER BY kalem_adi ASC LIMIT 200",
      )
      .then((res) => setCatalogKalemler(res))
      .catch(() => {});
  }, []);

  // Load Existing or Prepare New
  useEffect(() => {
    if (editId) {
      Promise.all([
        ihtiyacRaporuService.getRaporById(editId),
        ihtiyacRaporuService.getRaporKalemleri(editId),
      ])
        .then(([rep, items]) => {
          if (!rep) return;
          setRaporNo(rep.rapor_no);
          setEvrakSayisi(rep.evrak_sayisi || "");
          setBaslik(rep.baslik);
          setGerekce(rep.gerekce || "");
          setBirimId(rep.birim_id || null);
          setBirimAdi(rep.birim_adi || "");
          setPersonelId(rep.talep_eden_personel_id || null);
          setPersonelAdi(rep.talep_eden_personel || "");
          setPersonelUnvan(rep.talep_eden_unvan || "");
          setDurum(rep.durum || "taslak");
          setTeminDosyaId(rep.temin_dosya_id || null);
          setTarih(
            rep.tarih
              ? rep.tarih.substring(0, 10)
              : new Date().toISOString().split("T")[0],
          );
          setNotlar(rep.notlar || "");
          setKalemler(items || []);
        })
        .catch((err) => {
          console.error("Rapor yüklenirken hata:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const currentYear = new Date().getFullYear();
      ihtiyacRaporuService
        .getNextRaporNo(currentYear)
        .then((no) => {
          setRaporNo(no);
          setNextSuggestedNo(no);
        })
        .catch(() => {
          setRaporNo(`IR-${currentYear}/001`);
          setNextSuggestedNo(`IR-${currentYear}/001`);
        });
    }
  }, [editId]);

  // Kalem İşlemleri
  const handleAddKalem = (): void => {
    const newItem: IhtiyacRaporuKalem = {
      sira_no: kalemler.length + 1,
      kalem_adi: "",
      tipi: "Mal",
      birim: "Adet",
      miktar: 1,
      kdv_orani: 20,
      tahmini_birim_fiyat: 0,
      aciklama: "",
    };
    setKalemler([...kalemler, newItem]);
  };

  const handleUpdateKalem = (
    index: number,
    patch: Partial<IhtiyacRaporuKalem>,
  ): void => {
    setKalemler((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const handleRemoveKalem = (index: number): void => {
    setKalemler((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((k, idx) => ({ ...k, sira_no: idx + 1 }));
    });
  };

  const handleAddFromCatalog = (cat: CatalogKalemOption): void => {
    const newItem: IhtiyacRaporuKalem = {
      sira_no: kalemler.length + 1,
      kalem_adi: cat.kalem_adi,
      tipi: (cat.tipi as KalemTipi) || "Mal",
      birim: cat.birim || "Adet",
      miktar: 1,
      kdv_orani: cat.kdv_orani ?? 20,
      tasinir_kodu: cat.tasinir_kodu || null,
      poz_no: cat.poz_no || null,
      aciklama: cat.aciklama || "",
      tahmini_birim_fiyat: 0,
    };
    setKalemler([...kalemler, newItem]);
    setShowCatalogModal(false);
  };

  // Birim ve Personel Değişimi
  const handleBirimChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedId = Number(e.target.value) || null;
    setBirimId(selectedId);
    const found = birimler.find((b) => b.id === selectedId);
    setBirimAdi(found ? found.birim_adi : "");
  };

  const handlePersonelChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const selectedId = Number(e.target.value) || null;
    setPersonelId(selectedId);
    const found = personeller.find((p) => p.id === selectedId);
    setPersonelAdi(found ? found.ad_soyad : "");
    setPersonelUnvan(found ? found.unvan || "" : "");
  };

  // Totals
  const subTotal = kalemler.reduce(
    (sum, k) =>
      sum + (Number(k.miktar) || 0) * (Number(k.tahmini_birim_fiyat) || 0),
    0,
  );
  const totalKdv = kalemler.reduce((sum, k) => {
    const lineTotal = (Number(k.miktar) || 0) *
      (Number(k.tahmini_birim_fiyat) || 0);
    return sum + (lineTotal * (Number(k.kdv_orani) || 0)) / 100;
  }, 0);
  const grandTotal = subTotal + totalKdv;

  // Save / Submit
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!baslik.trim()) {
      alert("Lütfen ihtiyaç konusunu / başlığını giriniz.");
      return;
    }

    if (!raporNo.trim()) {
      alert("Lütfen geçerli bir rapor numarası giriniz.");
      return;
    }

    if (duplicateRapor) {
      alert(
        `"${raporNo}" numaralı rapor numarası zaten "${duplicateRapor.baslik}" raporunda kullanımda! Lütfen sıradaki veya benzersiz bir numara belirleyiniz.`,
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        rapor_no: raporNo.trim(),
        evrak_sayisi: evrakSayisi.trim() || null,
        baslik: baslik.trim(),
        gerekce: gerekce.trim() || null,
        birim_id: birimId,
        birim_adi: birimAdi || null,
        talep_eden_personel_id: personelId,
        talep_eden_personel: personelAdi || null,
        talep_eden_unvan: personelUnvan || null,
        durum,
        temin_dosya_id: teminDosyaId,
        tarih,
        tahmini_butce: grandTotal,
        notlar: notlar.trim() || null,
      };

      let savedId: number;

      if (editId) {
        await ihtiyacRaporuService.updateRapor(editId, payload, kalemler);
        savedId = editId;
      } else {
        savedId = await ihtiyacRaporuService.createRapor(payload, kalemler);
      }

      onSuccess(savedId);
    } catch (err: unknown) {
      console.error("İhtiyaç raporu kaydedilemedi:", err);
      const message = err instanceof Error ? err.message : String(err);
      alert("Hata: " + message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalogKalemler.filter((c) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      c.kalem_adi.toLowerCase().includes(q) ||
      (c.aciklama && c.aciklama.toLowerCase().includes(q)) ||
      (c.tasinir_kodu && c.tasinir_kodu.toLowerCase().includes(q)) ||
      (c.poz_no && c.poz_no.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-500">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">
          İhtiyaç raporu bilgileri yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Listeye Geri Dön"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                İhtiyaç Raporları
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {editId ? "Rapor Düzenleme" : "Yeni Rapor Hazırlama"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight mt-0.5">
              {editId ? `${raporNo || "Rapor"} Düzenle` : "Yeni İhtiyaç Raporu"}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            {saving
              ? "Kaydediliyor..."
              : editId
              ? "Değişiklikleri Kaydet"
              : "Raporu Kaydet"}
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alım Dosyası İlişkisi Kartı */}
        {linkedDosya
          ? (
            <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-200/70 dark:bg-blue-850 text-blue-800 dark:text-blue-300">
                      Bağlı Alım Dosyası
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-900 dark:text-blue-200">
                      #{linkedDosya.dosya_no}
                    </span>
                    {linkedDosya.tur && (
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                        ({linkedDosya.tur})
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {linkedDosya.konu}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTeminDosyaId(null)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-all cursor-pointer self-start sm:self-center shadow-xs"
              >
                Dosya Bağlantısını Kaldır (Bağımsız Yap)
              </button>
            </div>
          )
          : (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <span>
                Bu rapor bağımsız bir taslak olarak hazırlanıyor. İhtiyaç
                kalemlerini şimdi belirleyebilir, istediğiniz zaman doğrudan
                temin veya ihale dosyasına bağlayabilirsiniz.
              </span>
            </div>
          )}

        {/* 1. Bölüm: Temel Bilgiler */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={15} />
            </div>
            <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">
              1. Rapor Genel Bilgileri & Talep Eden
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Rapor Numarası - Doğrudan Temin ile Birebir Mantık & Tasarım */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Rapor Numarası *
                </label>
                {isCheckingNo
                  ? (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />{" "}
                      Kontrol ediliyor...
                    </span>
                  )
                  : isYearMismatch
                  ? (
                    <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold">
                      <AlertTriangle className="w-2.5 h-2.5" /> Yıl Uyuşmazlığı
                    </span>
                  )
                  : duplicateRapor
                  ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                      <AlertTriangle className="w-2.5 h-2.5" /> Kullanımda
                    </span>
                  )
                  : isAvailableRaporNo
                  ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Müsait
                    </span>
                  )
                  : null}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={raporNo}
                  onChange={(e) => setRaporNo(e.target.value)}
                  onBlur={handleRaporNoBlur}
                  placeholder={`Örn: IR-${targetYear}/001`}
                  className={cn(
                    "w-full pl-3.5 pr-24 py-2 bg-slate-50/70 dark:bg-slate-800/60 border rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 transition-all",
                    isYearMismatch
                      ? "border-rose-400 dark:border-rose-600 focus:ring-rose-400/20 bg-rose-50/20"
                      : duplicateRapor
                      ? "border-amber-300 dark:border-amber-700/60 focus:ring-amber-400/20 bg-amber-50/20"
                      : isAvailableRaporNo
                      ? "border-emerald-300 dark:border-emerald-700/50 focus:ring-emerald-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500",
                  )}
                />
                <button
                  type="button"
                  title="Sıradaki müsait benzersiz rapor numarasını ata"
                  onClick={handleAssignNextNo}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border-none"
                >
                  <RefreshCw
                    size={11}
                    className={isCheckingNo ? "animate-spin" : ""}
                  />{" "}
                  Sıradaki No
                </button>
              </div>

              {/* Yıl Uyuşmazlığı İkazı */}
              {isYearMismatch && (
                <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-1.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 rounded-lg text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-rose-500 shrink-0">⚠️</span>
                    <span className="truncate">
                      Rapor no yılı (<strong>{raporNo}</strong>) rapor tarihi
                      yılı (
                      <strong>{targetYear}</strong>) ile uyumlu değildir!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      let val = raporNo.trim();
                      const match = val.match(/^(?:IR-)?(\d{4})([/-].+)$/i);
                      if (match) {
                        val = `IR-${targetYear}${match[2]}`;
                      } else {
                        val = `IR-${targetYear}/001`;
                      }
                      setRaporNo(val);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors shrink-0 cursor-pointer border-none"
                  >
                    {targetYear} Yılına Uyarla
                  </button>
                </div>
              )}

              {/* Mükerrer / Duplicate Uyarısı */}
              {!isYearMismatch && duplicateRapor && (
                <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-1.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-amber-500 shrink-0">ℹ️</span>
                    <span className="truncate">
                      Bu numara{" "}
                      <strong>
                        #{duplicateRapor.id} - {duplicateRapor.baslik}
                      </strong>{" "}
                      raporunda kayıtlı.
                    </span>
                  </div>
                  {nextSuggestedNo && (
                    <button
                      type="button"
                      onClick={() => setRaporNo(nextSuggestedNo)}
                      className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded text-[10px] font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      Sıradaki: {nextSuggestedNo}
                    </button>
                  )}
                </div>
              )}

              {!isYearMismatch && isAvailableRaporNo && raporNo && (
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Bu rapor numarası kullanılabilir.</span>
                </div>
              )}
            </div>

            {/* Rapor Tarihi - Değiştiğinde yılına göre sıradaki numarayı otomatik günceller */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Rapor Tarihi *
                </label>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                  {targetYear} Yılı
                </span>
              </div>
              <input
                type="date"
                required
                value={tarih}
                onChange={handleTarihChange}
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* EBYS Evrak No */}
            <div className="lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                EBYS Evrak No / Sayısı
              </label>
              <input
                type="text"
                value={evrakSayisi}
                onChange={(e) => setEvrakSayisi(e.target.value)}
                placeholder="Örn: E-83726194-934.01-12345"
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Rapor Durumu */}
            <div className="lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Rapor Durumu
              </label>
              <select
                value={durum}
                onChange={(e) => setDurum(e.target.value as IhtiyacRaporuDurum)}
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="taslak">Taslak</option>
                <option value="inceleniyor">İnceleniyor</option>
                <option value="onaylandi">Onaylandı</option>
                {editId && (
                  <option value="dosyaya_aktarildi">Dosyaya Aktarıldı</option>
                )}
                <option value="iptal">İptal</option>
              </select>
            </div>

            {/* Tahmini Toplam Bütçe */}
            <div className="lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Tahmini Toplam Bütçe
              </label>
              <div className="px-3.5 py-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 truncate">
                {formatCurrency(grandTotal)}
              </div>
            </div>

            {/* Talep Eden Birim */}
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Talep Eden Birim
              </label>
              <select
                value={birimId || ""}
                onChange={handleBirimChange}
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Birim Seçiniz (Opsiyonel)...</option>
                {birimler.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.birim_adi}
                  </option>
                ))}
              </select>
            </div>

            {/* Talep Eden Personel */}
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Talep Eden Personel
              </label>
              <select
                value={personelId || ""}
                onChange={handlePersonelChange}
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Personel Seçiniz (Opsiyonel)...</option>
                {personeller.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
                  </option>
                ))}
              </select>
              {personelUnvan && (
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Unvan:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {personelUnvan}
                  </span>
                </p>
              )}
            </div>

            {/* İşin Adı / İhtiyaç Konusu */}
            <div className="col-span-full">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                İşin Adı / İhtiyaç Konusu *
              </label>
              <input
                type="text"
                required
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Örn: Hizmet Binası Elektrik Tesisatı Onarımı ve Malzeme Alımı..."
                className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Bölüm: İhtiyaç Gerekçesi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText size={15} />
            </div>
            <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">
              2. İhtiyaç Gerekçesi, Lüzum &amp; Alım Kapsamı
            </h2>
          </div>

          <div>
            <textarea
              rows={4}
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
              placeholder="İhtiyacın ortaya çıkış sebebi, mevcut durum, kullanım yeri ve temininin aciliyeti / lüzumuna ilişkin detaylı açıklamalar..."
              className="w-full px-4 py-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-850 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>
        </div>

        {/* 3. Bölüm: İhtiyaç Kalemleri Tablosu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Package size={15} />
              </div>
              <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">
                3. İhtiyaç Kalemleri &amp; Tahmini Maliyet ({kalemler.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} className="text-purple-600" />
                Malzeme Havuzundan Seç
              </button>

              <button
                type="button"
                onClick={handleAddKalem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                Satır Ekle
              </button>
            </div>
          </div>

          {kalemler.length === 0
            ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Henüz ihtiyaç kalemi eklenmedi. Raporunuza ait malzeme veya
                  hizmetleri ekleyin.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddKalem}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Yeni Kalem Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(true)}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ⚡ Havuzdan Seç
                  </button>
                </div>
              </div>
            )
            : (
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-50">Kalem Adı *</th>
                        <th className="py-2.5 px-3 w-28">Tipi</th>
                        <th className="py-2.5 px-3 w-24">Birim</th>
                        <th className="py-2.5 px-3 w-24 text-right">Miktar</th>
                        <th className="py-2.5 px-3 w-20 text-center">KDV %</th>
                        <th className="py-2.5 px-3 w-32 text-right">
                          Tahmini Fiyat
                        </th>
                        <th className="py-2.5 px-3 w-32 text-right">
                          Tutar (KDV&apos;li)
                        </th>
                        <th className="py-2.5 px-3 min-w-37.5">
                          Açıklama / Özellik
                        </th>
                        <th className="py-2.5 px-3 w-10 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {kalemler.map((k, idx) => {
                        const lineNet = (Number(k.miktar) || 0) *
                          (Number(k.tahmini_birim_fiyat) || 0);
                        const lineKdv = (lineNet * (Number(k.kdv_orani) || 0)) /
                          100;
                        const lineTotal = lineNet + lineKdv;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                value={k.kalem_adi}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    kalem_adi: e.target.value,
                                  })}
                                placeholder="Kalem / Malzeme Adı..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={k.tipi || "Mal"}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    tipi: e.target.value as KalemTipi,
                                  })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                              >
                                {KALEM_TIPLERI.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={k.birim || "Adet"}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    birim: e.target.value,
                                  })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                              >
                                {BIRIM_OPTIONS.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0.001"
                                step="any"
                                required
                                value={k.miktar || ""}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    miktar: parseFloat(e.target.value) || 0,
                                  })}
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <select
                                value={k.kdv_orani ?? 20}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    kdv_orani: Number(e.target.value),
                                  })}
                                className="px-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-mono focus:outline-hidden"
                              >
                                <option value={0}>%0</option>
                                <option value={1}>%1</option>
                                <option value={10}>%10</option>
                                <option value={20}>%20</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={k.tahmini_birim_fiyat || ""}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    tahmini_birim_fiyat:
                                      parseFloat(e.target.value) || 0,
                                  })}
                                placeholder="0.00"
                                className="w-28 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={k.aciklama || ""}
                                onChange={(e) =>
                                  handleUpdateKalem(idx, {
                                    aciklama: e.target.value,
                                  })}
                                placeholder="Teknik detay, poz veya taşınır..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveKalem(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Kalemi Sil"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Totals */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    Toplam {kalemler.length} ihtiyaç kalemi listelendi.
                  </span>

                  <div className="flex items-center gap-6 font-mono">
                    <div className="text-right">
                      <span className="text-[10.5px] text-slate-400 block uppercase">
                        Ara Toplam
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatCurrency(subTotal)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10.5px] text-slate-400 block uppercase">
                        Toplam KDV
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatCurrency(totalKdv)}
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10.5px] text-blue-500 block uppercase font-bold">
                        Tahmini Genel Toplam
                      </span>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* 4. Bölüm: Ek Notlar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Ek Notlar ve Açıklamalar (Opsiyonel)
          </label>
          <textarea
            rows={2}
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            placeholder="Rapor ile ilgili idari veya teknik diğer hususlar..."
            className="w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            ← Listeye Dön
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {saving
              ? "Kaydediliyor..."
              : editId
              ? "Değişiklikleri Kaydet"
              : "Raporu Kaydet ve Tamamla"}
          </button>
        </div>
      </form>

      {/* Catalog Quick Lookup Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                  Malzeme / Hizmet Havuzundan Seç
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Kalem adı, taşınır veya poz ara..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {filteredCatalog.length === 0
                ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Kayıt bulunamadı veya arama sonucu boş.
                  </div>
                )
                : (
                  filteredCatalog.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleAddFromCatalog(cat)}
                      className="p-3 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {cat.kalem_adi}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            {cat.tipi}
                          </span>
                          <span>Birim: {cat.birim}</span>
                          {cat.tasinir_kodu && (
                            <span>Taşınır: {cat.tasinir_kodu}</span>
                          )}
                          {cat.poz_no && <span>Poz: {cat.poz_no}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold"
                      >
                        Ekle +
                      </button>
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
