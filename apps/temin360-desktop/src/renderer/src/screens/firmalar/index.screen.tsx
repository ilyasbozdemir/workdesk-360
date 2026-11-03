import React, { useState } from "react";
import { FirmaInput, useFirmalarHooks } from "./firmalar.hooks";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Building2,
  ChevronDown,
  Layers,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";
import { DataViewMode, ViewToggle } from "../../components/ui/ViewToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";

// Sub-components
import { FirmaDetail } from "./components/FirmaDetail";
import { FirmaGrid } from "./components/FirmaGrid";
import { FirmaList } from "./components/FirmaList";
import { FirmaModal } from "./components/FirmaModal";
import { FirmaEslestirmeModal } from "./components/FirmaEslestirmeModal";
import { ExcelActions } from "../../components/ui/ExcelActions";
import { useQueryClient } from "@tanstack/react-query";

const emptyFirma: FirmaInput = {
  firma_kodu: "",
  unvan: "",
  ilgili_adi: "",
  uyrugu: "T.C.",
  istigal_konusu: "",
  adres: "",
  ilce: "",
  posta_kodu: "",
  il: "",
  telefon: "",
  faks: "",
  email: "",
  web_adresi: "",
  banka_adi: "",
  sube_kodu_adi: "",
  hesap_no: "",
  tc_kimlik_no: "",
  dogum_tarihi: "",
  vergi_dairesi: "",
  vergi_no: "",
  deneyim_skoru: 0,
  kalite_skoru: 0,
  odeme_disiplini: 1,
  kara_liste: 0,
  kara_liste_neden: "",
  son_iletisim_tarihi: "",
  sorumlu_personel_id: null,
  iletisim_notlari: "[]",
};

export default function FirmalarScreen(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { firmalar, isLoadingFirmalar, addFirma, updateFirma, deleteFirma } =
    useFirmalarHooks();
  const [form, setForm] = useState<FirmaInput>({ ...emptyFirma });
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEslestirmeModalOpen, setIsEslestirmeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>("grid");
  const [viewingFirma, setViewingFirma] = useState<any | null>(null);

  const candidateCount = firmalar.filter(
    (f: any) =>
      !f.firma_kodu || String(f.firma_kodu).trim() === "" ||
      String(f.firma_kodu).trim() === "0000",
  ).length;

  const openAddModal = () => {
    setForm({ ...emptyFirma });
    setEditingId(null);
    setShowExtraFields(false);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, firma: any) => {
    e.stopPropagation();
    const { id, aktif_mi, created_at, updated_at, ...editableData } = firma;
    setForm({ ...emptyFirma, ...editableData });
    setEditingId(id);
    setShowExtraFields(false);
    setIsModalOpen(true);
  };

  const handleViewClick = (firma: any) => {
    setViewingFirma(firma);
  };

  const handleChange = (key: keyof FirmaInput, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!form.unvan.trim()) return;

    try {
      if (editingId) {
        await updateFirma({ id: editingId, data: form });
      } else {
        await addFirma(form);
      }
      setForm({ ...emptyFirma });
      setEditingId(null);
      setShowExtraFields(false);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "İşlem sırasında hata oluştu!");
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: number,
  ): Promise<void> => {
    e.stopPropagation();
    if (confirm("Bu firmayı silmek istediğinize emin misiniz?")) {
      try {
        await deleteFirma(id);
      } catch {
        alert("Silme sırasında hata oluştu!");
      }
    }
  };

  const handleAutoAssignCodes = async () => {
    try {
      const existingCodesRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        "SELECT firma_kodu FROM TANIM_Firma WHERE firma_kodu GLOB '[0-9][0-9][0-9][0-9]'",
      );
      let maxNum = 0;
      for (const row of existingCodesRes.data || []) {
        const n = parseInt(row.firma_kodu, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }

      const stubsRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        "SELECT id, unvan FROM TANIM_Firma WHERE firma_kodu IS NULL OR TRIM(firma_kodu) = '' OR TRIM(firma_kodu) = '0000' ORDER BY id ASC",
      );
      const stubs = stubsRes.data || [];
      if (stubs.length === 0) {
        alert("Tüm firmaların geçerli firma kodları mevcut.");
        return;
      }

      for (const s of stubs) {
        maxNum++;
        const newCode = maxNum.toString().padStart(4, "0");
        await window.electron.ipcRenderer.invoke(
          "db:query",
          "UPDATE TANIM_Firma SET firma_kodu = ? WHERE id = ?",
          [newCode, s.id],
        );
      }
      queryClient.invalidateQueries({ queryKey: ["firmalar"] });
      alert(
        `${stubs.length} adet firmaya sıralı firma kodu başarıyla tanımlandı!`,
      );
    } catch (err: any) {
      alert("Kod atama hatası: " + (err.message || err));
    }
  };

  const handleSyncOrphanBids = async () => {
    try {
      const res = await window.electron.ipcRenderer.invoke(
        "db:query",
        `UPDATE DATA_TeminFirma
         SET firma_id = (
           SELECT f.id FROM TANIM_Firma f
           WHERE (f.vergi_no IS NOT NULL AND f.vergi_no != '' AND f.vergi_no = DATA_TeminFirma.vergi_no)
              OR (LOWER(TRIM(f.unvan)) = LOWER(TRIM(DATA_TeminFirma.unvan)))
           LIMIT 1
         )
         WHERE (firma_id IS NULL OR firma_id = 0)
           AND EXISTS (
             SELECT 1 FROM TANIM_Firma f
             WHERE (f.vergi_no IS NOT NULL AND f.vergi_no != '' AND f.vergi_no = DATA_TeminFirma.vergi_no)
                OR (LOWER(TRIM(f.unvan)) = LOWER(TRIM(DATA_TeminFirma.unvan)))
           )`,
      );
      queryClient.invalidateQueries({ queryKey: ["firmalar"] });
      alert("Firma ve dosya teklif ilişkileri başarıyla senkronize edildi!");
    } catch (err: any) {
      alert("Senkronizasyon hatası: " + (err.message || err));
    }
  };

  const [procurementFilter, setProcurementFilter] = useState<
    "all" | "dogrudan_temin" | "ihale"
  >(
    () => {
      const saved = localStorage.getItem("temin_procurement_mode");
      return (saved as "dogrudan_temin" | "ihale") || "dogrudan_temin";
    },
  );

  React.useEffect(() => {
    const handleMode = (e: any) => {
      if (e.detail?.mode) {
        setProcurementFilter(e.detail.mode);
      }
    };
    window.addEventListener("procurement-mode-change", handleMode);
    return () =>
      window.removeEventListener("procurement-mode-change", handleMode);
  }, []);

  const filtered = firmalar.filter((f: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = f.unvan?.toLowerCase().includes(q) ||
        f.firma_kodu?.toLowerCase().includes(q) ||
        f.vergi_no?.toLowerCase().includes(q) ||
        f.il?.toLowerCase().includes(q) ||
        f.istigal_konusu?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (procurementFilter === "all") return true;
    const text = `${f.istigal_konusu || ""} ${f.unvan || ""}`.toLowerCase();
    if (procurementFilter === "ihale") {
      // İhale Müteahhitleri / Yüklenicileri
      return (
        text.includes("inşaat") ||
        text.includes("taahhüt") ||
        text.includes("yapı") ||
        text.includes("mühendislik") ||
        text.includes("mimarlık") ||
        text.includes("ihale") ||
        text.includes("proje") ||
        text.includes("hafriyat") ||
        text.includes("aş") ||
        text.includes("a.ş") ||
        text.includes("sanayi")
      );
    }
    if (procurementFilter === "dogrudan_temin") {
      // Doğrudan Temin Tedarikçileri / Esnaf / Hizmet
      return (
        text.includes("kırtasiye") ||
        text.includes("gıda") ||
        text.includes("temizlik") ||
        text.includes("medikal") ||
        text.includes("onarım") ||
        text.includes("servis") ||
        text.includes("ticaret") ||
        text.includes("ltd") ||
        text.includes("hizmet") ||
        !text.includes("inşaat")
      );
    }
    return true;
  });

  if (viewingFirma) {
    return (
      <FirmaDetail
        viewingFirma={viewingFirma}
        setViewingFirma={setViewingFirma}
      />
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-855 dark:text-slate-100">
            <Building2 className="w-8 h-8 text-blue-600" />
            İstekli & Yüklenici Firma Yönetimi{" "}
            {procurementFilter === "dogrudan_temin"
              ? "(Doğrudan Temin)"
              : procurementFilter === "ihale"
              ? "(İhale Müteahhitleri)"
              : ""}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Tedarikçi firmaların performans skoru, KİK kara liste durumları ve
            teklif geçmişini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-right border-r border-slate-200 dark:border-slate-800 pr-6 hidden sm:block">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {filtered.length} / {firmalar.length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Listelenen Firma
            </div>
          </div>
          {/* GELİŞMİŞ SEÇENEKLER DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center px-3.5 py-2 text-sm font-semibold shadow-2xs cursor-pointer relative"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Gelişmiş Seçenekler</span>
                {candidateCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse absolute -top-1 -right-1 shadow-xs ring-2 ring-white dark:ring-slate-900" />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 p-1.5 shadow-xl border-slate-200 dark:border-slate-800"
            >
              <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                Firma & Veri Yönetimi
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => setIsEslestirmeModalOpen(true)}
                className="cursor-pointer py-2.5 px-2.5 rounded-xl flex items-start gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      Akıllı Eşleştirme & Birleştirme
                    </span>
                    {candidateCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                        {candidateCount} Bekleyen
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Taslak/kısa unvanlı firmaları ana havuza bağlar ve geçmiş
                    temin ilişkilerini birleştirir.
                  </p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

              <DropdownMenuItem
                onClick={handleAutoAssignCodes}
                className="cursor-pointer py-2.5 px-2.5 rounded-xl flex items-start gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Tag className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Kodsuz Firmalara Otomatik Kod Ata
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Firma kodu boş olan tüm firmalara 0001 formatında sıralı kod
                    tanımlar.
                  </p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSyncOrphanBids}
                className="cursor-pointer py-2.5 px-2.5 rounded-xl flex items-start gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Dosya Teklif İlişkilerini Senkronize Et
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Veritabanındaki yetim veya eksik teklif kayıtlarını
                    unvan/vergi no ile onarır.
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ExcelActions
            tableName="TANIM_Firma"
            title="Firmalar"
            uniqueCol="id"
          />
          <Button
            onClick={openAddModal}
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md flex items-center px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Yeni Firma Ekle
          </Button>
        </div>
      </div>

      {/* ARAMA, USUL SEÇİCİ VE GÖRÜNÜM KONTROLLERİ */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Firma unvanı, vergi no veya il ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl w-full text-sm"
          />
        </div>

        {/* 3'lü Süreç Usulü Filtresi */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setProcurementFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              procurementFilter === "all"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tüm Firmalar ({firmalar.length})
          </button>
          <button
            type="button"
            onClick={() => setProcurementFilter("dogrudan_temin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              procurementFilter === "dogrudan_temin"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span>🛒 Doğrudan Temin İsteklileri</span>
          </button>
          <button
            type="button"
            onClick={() => setProcurementFilter("ihale")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              procurementFilter === "ihale"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <span>🏛️ İhale Müteahhitleri</span>
          </button>
        </div>

        <ViewToggle viewMode={dataViewMode} onChange={setDataViewMode} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
            Kayıtlı Firmalar
          </h3>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={dataViewMode} onChange={setDataViewMode} />
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Firma ünvanı, vergi no, kod veya şehir ara..."
                className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs py-2 h-9 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingFirmalar
            ? (
              <div className="text-center text-slate-450 dark:text-slate-500 animate-pulse italic py-8">
                Firmalar yükleniyor...
              </div>
            )
            : filtered.length === 0
            ? (
              <div className="col-span-full p-16 flex flex-col items-center justify-center text-slate-450 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <Building2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  Firma Bulunamadı
                </h3>
                <p className="text-xs mt-1 text-slate-500">
                  {searchQuery
                    ? "Arama kriterlerinize uygun firma yok."
                    : "Henüz sisteme eklenmiş bir firma bulunmuyor."}
                </p>
              </div>
            )
            : dataViewMode === "grid"
            ? (
              <FirmaGrid
                filtered={filtered}
                handleViewClick={handleViewClick}
                openEditModal={openEditModal}
                handleDelete={handleDelete}
              />
            )
            : (
              <FirmaList
                filtered={filtered}
                dataViewMode={dataViewMode}
                handleViewClick={handleViewClick}
                openEditModal={openEditModal}
                handleDelete={handleDelete}
              />
            )}
        </div>
      </div>

      <FirmaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        form={form}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        showExtraFields={showExtraFields}
        setShowExtraFields={setShowExtraFields}
      />

      <FirmaEslestirmeModal
        isOpen={isEslestirmeModalOpen}
        onClose={() => setIsEslestirmeModalOpen(false)}
      />
    </div>
  );
}
