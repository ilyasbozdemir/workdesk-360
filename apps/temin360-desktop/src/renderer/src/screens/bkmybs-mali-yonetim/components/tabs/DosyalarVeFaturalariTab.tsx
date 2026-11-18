import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  Calculator,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Edit2,
  ExternalLink,
  FileText,
  FolderCheck,
  FolderOpen,
  Layers,
  LayoutGrid,
  Percent,
  Plus,
  Printer,
  Receipt,
  Save,
  Search,
  ShieldCheck,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { KamuRole } from "../../types";
import { formatCurrency, formatDate } from "@renderer/utils/formatters";
import { useWorkspaceStore } from "@renderer/store/workspaceStore";
import { useWorkspaceContextStore } from "@renderer/store/workspaceContextStore";
import { useTabStore } from "@renderer/store/tabStore";
import { APP_ROUTES } from "@renderer/constants/routeConstants";
import { useNavigate } from "@tanstack/react-router";
import { dialogs } from "@renderer/components/ui/AlertDialogProvider";
import { cn } from "@renderer/utils/cn";
import { calculateInvoiceFinancials } from "../../utils/invoiceFinancials";

// ─── Tipler ────────────────────────────────────────────────────────────────

export interface FaturaKayit {
  id: string | number;
  faturaNo: string;
  faturaTarihi: string;
  firmaTutar: number; // KDV dahil brüt fatura tutarı
  kdvOrani: number; // %20, %10, %1, %0
  kdvTutari?: number;
  matrah?: number; // KDV hariç
  tevkifatOrani?: string; // 'Yok', '2/10', '3/10', '4/10', '5/10', '7/10', '9/10', 'Tam'
  tevkifatTutari?: number;
  damgaVergisi?: number; // Toplam Damga Vergisi (Ödeme Emri DV + varsa Sözleşme DV)
  odemeDamgaVergisi?: number; // Binde 9,48 (Tablo IV/1-a)
  sozlesmeDamgaVergisi?: number; // Binde 9,48 (Tablo I/A-1)
  damgaVergisiUygula?: boolean;
  sozlesmeDamgaVergisiUygula?: boolean;
  kararPulu?: number; // Binde 5,69
  kararPuluUygula?: boolean;
  netOdenecek?: number;
  odemeYontemi?: string | null;
  durum: "beklemede" | "odendi" | "iptal";
  aciklama?: string;
  kaynak?: "sablon" | "kabul_tutanagi" | "mali_giris" | "tahakkuk";
  tutanakNo?: string;
  tutanakTarihi?: string;
  irsaliyeNo?: string;
  teslimYeri?: string;
}

export interface DosyaOzet {
  id: number;
  teminNo: string;
  konu: string;
  tur: string;
  yaklasikMaliyet: number;
  netOdenen: number;
  butceKodu: string;
  ekonomikKod: string;
  kazananFirmaUnvani: string;
  kazananFirmaVkn: string;
  kazananFirmaIban: string;
  olusturmaTarihi: string;
  harcamaBirimi: string;
  durumAsamaId: number;
  status: string | null;
  kesintiDamga: number;
  kesintiKararPulu: number;
  kesintiKdvTevkifat: number;
  sozlesmeYapilacakMi: boolean;
  faturalar: FaturaKayit[];
}

interface DosyalarVeFaturalariTabProps {
  activeRole: KamuRole;
  selectedYil?: string;
  selectedDosyaId?: number | null;
}

// ─── Durum Badge Bileşenleri ───────────────────────────────────────────────

function FaturaDurumBadge({ durum }: { durum: FaturaKayit["durum"] }) {
  if (durum === "odendi") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
        <CheckCircle size={10} className="text-emerald-500" /> Ödendi
      </span>
    );
  }
  if (durum === "iptal") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
        <AlertCircle size={10} className="text-rose-500" /> İptal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
      <Clock size={10} className="text-amber-500" /> Ödeme Bekliyor
    </span>
  );
}

function AlimTuruBadge({ turu }: { turu: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    mal: {
      label: "Mal Alımı",
      cls:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
    },
    hizmet: {
      label: "Hizmet Alımı",
      cls:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40",
    },
    danismanlik: {
      label: "Danışmanlık",
      cls:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40",
    },
    yapim: {
      label: "Yapım İşi",
      cls:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40",
    },
    yapim_isi: {
      label: "Yapım İşi",
      cls:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40",
    },
  };
  const info = map[turu?.toLowerCase()] ?? {
    label: turu || "Doğrudan Temin",
    cls:
      "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${info.cls}`}
    >
      {info.label}
    </span>
  );
}

// ─── Veritabanı Yükleme ve Çözümleme Fonksiyonu ─────────────────────────────

async function loadDosyalarVeFaturalar(): Promise<DosyaOzet[]> {
  if (typeof window === "undefined" || !window.electron?.ipcRenderer) return [];

  try {
    // 1. DATA_TeminDosyasi sorgusu (ŞEMA İLE %100 UYUMLU KOLONLAR)
    const dosyaRes = await window.electron.ipcRenderer.invoke(
      "db:query",
      `SELECT
         d.id,
         d.temin_no,
         d.konu,
         d.tur,
         d.yaklasik_maliyet,
         d.net_odenen,
         d.kdv,
         d.kesinti_damga,
         d.kesinti_karar_pulu,
         d.kesinti_kdv_tevkifat,
         COALESCE(d.sozlesme_yapilacak_mi, 0) AS sozlesme_yapilacak_mi,
         d.butce_kodu,
         d.ekonomik_kod,
         d.harcama_birimi,
         d.durum_asama_id,
         d.status,
         d.created_at,
         d.temin_tarihi,
         d.dosya_acilis_tarihi,
         d.sablon_tercihleri,
         f.unvan   AS tanim_unvan,
         f.vergi_no AS tanim_vkn,
         f.hesap_no AS tanim_iban,
         tf.unvan  AS dosya_firma_unvan,
         tf.vergi_no AS dosya_firma_vkn,
         tf.teklif_toplami AS kazanan_teklif_toplami,
         (SELECT tf2.unvan FROM DATA_TeminFirma tf2 WHERE tf2.temin_dosya_id = d.id AND COALESCE(tf2.teklif_toplami, 0) > 0 ORDER BY tf2.teklif_toplami ASC, tf2.id ASC LIMIT 1) AS en_dusuk_firma_unvan,
         (SELECT tf2.vergi_no FROM DATA_TeminFirma tf2 WHERE tf2.temin_dosya_id = d.id AND COALESCE(tf2.teklif_toplami, 0) > 0 ORDER BY tf2.teklif_toplami ASC, tf2.id ASC LIMIT 1) AS en_dusuk_firma_vkn,
         (SELECT MIN(tf2.teklif_toplami) FROM DATA_TeminFirma tf2 WHERE tf2.temin_dosya_id = d.id AND COALESCE(tf2.teklif_toplami, 0) > 0) AS en_dusuk_teklif_toplami,
         b.ad      AS birim_adi
       FROM DATA_TeminDosyasi d
       LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
       LEFT JOIN DATA_TeminFirma tf ON tf.temin_dosya_id = d.id AND (tf.kazanan_mi = 1 OR tf.kazandi_mi = 1)
       LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
       WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
       ORDER BY d.id DESC
       LIMIT 300`,
    );

    const rawRows = dosyaRes?.success
      ? dosyaRes.data
      : Array.isArray(dosyaRes)
      ? dosyaRes
      : [];
    if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

    // JOIN'lerden kaynaklanan d.id mükerrerliğini (örn. DATA_TeminFirma çift eşleşmesi) re'sen önle
    const seenDosyaIds = new Set<number>();
    const uniqueRows = rawRows.filter((r: any) => {
      const idNum = Number(r?.id);
      if (!idNum || seenDosyaIds.has(idNum)) return false;
      seenDosyaIds.add(idNum);
      return true;
    });

    // 2. DATA_TeminBelgeSnapshot tablosundan kabul & fatura şablonlarını re'sen oku
    const snapshotsByDosya = new Map<number, any[]>();
    try {
      const snapRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        `SELECT dosya_id, sablon_kodu, veri_json 
         FROM DATA_TeminBelgeSnapshot 
         WHERE (is_deleted = 0 OR is_deleted IS NULL) 
           AND (
             sablon_kodu LIKE '%kabul%' OR 
             sablon_kodu LIKE '%fatura%' OR 
             sablon_kodu LIKE '%hakedis%' OR 
             sablon_kodu LIKE '%odeme%'
           )`,
      );
      if (snapRes?.success && Array.isArray(snapRes.data)) {
        for (const row of snapRes.data) {
          const dId = Number(row.dosya_id);
          if (!dId) continue;
          const list = snapshotsByDosya.get(dId) || [];
          list.push(row);
          snapshotsByDosya.set(dId, list);
        }
      }
    } catch (e) {
      console.warn("[DosyalarVeFaturalariTab] Snapshot verileri okunamadı:", e);
    }

    return uniqueRows.map((d: any) => {
      let preferences: any = {};
      if (d.sablon_tercihleri) {
        try {
          preferences = typeof d.sablon_tercihleri === "string"
            ? JSON.parse(d.sablon_tercihleri)
            : d.sablon_tercihleri || {};
        } catch {
          preferences = {};
        }
      }

      const faturalar: FaturaKayit[] = [];
      const faturaNoSet = new Set<string>();

      const pushFatura = (f: FaturaKayit) => {
        const key = (f.faturaNo || "").trim().toLowerCase();
        if (key && !faturaNoSet.has(key)) {
          faturaNoSet.add(key);
          // Finansal tutarları hesapla:
          // 4734 sayılı Kanun md. 22 doğrudan temin bir ihale usulü olmadığından ve ihale komisyonu
          // kararı bulunmadığından 488 sayılı Damga Vergisi Kanunu uyarınca ihale karar damga vergisi
          // (karar pulu %0.569) KANUNEN KESİLMEZ (Maliye Bakanlığı Tebliği ve Sayıştay Kararları).
          // Dosya sözleşmeli olsa dahi doğrudan teminde ihale karar pulu kesilmez.
          // Yalnızca kullanıcı açıkça faturada kararPuluUygula = true seçmişse uygulanır.
          const kdvDegeri = Number.isFinite(Number(f.kdvOrani))
            ? Number(f.kdvOrani)
            : 20;
          const dvUygula = (f as any).damgaVergisiUygula !== false;
          const sozlesmeDvUygula =
            (f as any).sozlesmeDamgaVergisiUygula !== undefined
              ? Boolean((f as any).sozlesmeDamgaVergisiUygula)
              : Boolean(d.sozlesme_yapilacak_mi);

          const fin = calculateInvoiceFinancials(
            f.firmaTutar,
            kdvDegeri,
            f.tevkifatOrani || "Yok",
            false,
            dvUygula,
            sozlesmeDvUygula,
          );

          const kararPuluTutari = 0;

          const netOdenecekTutari = Number(
            (f.firmaTutar - fin.damgaVergisi - fin.tevkifatTutari).toFixed(2),
          );

          faturalar.push({
            ...f,
            kdvOrani: kdvDegeri,
            matrah: fin.matrah,
            kdvTutari: fin.kdvTutari,
            tevkifatTutari: fin.tevkifatTutari,
            odemeDamgaVergisi: fin.odemeDamgaVergisi,
            sozlesmeDamgaVergisi: fin.sozlesmeDamgaVergisi,
            damgaVergisi: fin.damgaVergisi,
            damgaVergisiUygula: dvUygula,
            sozlesmeDamgaVergisiUygula: sozlesmeDvUygula,
            kararPulu: kararPuluTutari,
            netOdenecek: netOdenecekTutari,
            kararPuluUygula: false,
          });
        }
      };

      // 1. sablon_tercihleri.faturalar (Mali Hizmetler faturası)
      if (
        Array.isArray(preferences.faturalar) && preferences.faturalar.length > 0
      ) {
        preferences.faturalar.forEach((f: any, idx: number) => {
          pushFatura({
            id: f.id || `fat-pref-${d.id}-${idx}`,
            faturaNo: f.faturaNo || f.fatura_no || `FAT-${d.id}-${idx + 1}`,
            faturaTarihi: f.faturaTarihi || f.fatura_tarihi || d.temin_tarihi ||
              d.created_at,
            firmaTutar: Number(
              f.firmaTutar || f.tutar || f.fatura_tutari ||
                d.yaklasik_maliyet || 0,
            ),
            kdvOrani: Number(f.kdvOrani ?? 20),
            tevkifatOrani: f.tevkifatOrani || "Yok",
            odemeYontemi: f.odemeYontemi || "Hazine / Muhasebat Ödeme Emri",
            durum: f.durum === "odendi" || f.durum === "iptal"
              ? f.durum
              : "beklemede",
            aciklama: f.aciklama || "Mali Hizmetler Fatura Kaydı",
            kaynak: "mali_giris",
          });
        });
      }

      // 2. sablon_tercihleri.kabulTutanaklari (Doğrudan Temin Kabul ve Ödeme sekmesi)
      if (
        Array.isArray(preferences.kabulTutanaklari) &&
        preferences.kabulTutanaklari.length > 0
      ) {
        preferences.kabulTutanaklari.forEach((t: any, idx: number) => {
          const fatNo = (t.faturaNo || t.tutanakNo || "").trim();
          if (fatNo) {
            pushFatura({
              id: t.id || `tut-fat-${d.id}-${idx}`,
              faturaNo: fatNo,
              faturaTarihi: t.faturaTarihi || t.tutanakTarihi ||
                d.temin_tarihi || d.created_at,
              firmaTutar: Number(
                t.tutar || d.net_odenen || d.yaklasik_maliyet || 0,
              ),
              kdvOrani: 20,
              tevkifatOrani: "Yok",
              odemeYontemi: "Hazine / Muhasebat Ödeme Emri",
              durum: t.durum === "kabul"
                ? "odendi"
                : t.durum === "red"
                ? "iptal"
                : "beklemede",
              aciklama: t.notlar ||
                "Doğrudan Temin Muayene ve Kabul Tutanağı Faturası",
              kaynak: "kabul_tutanagi",
            });
          }
        });
      }

      // 3. Snapshot'lardan (muayene-kabul-tutanagi, fatura-ve-odeme-belgesi) gelen faturalar
      const snaps = snapshotsByDosya.get(Number(d.id));
      if (snaps && snaps.length > 0) {
        snaps.forEach((s: any, idx: number) => {
          if (s.veri_json) {
            try {
              const p = JSON.parse(s.veri_json);
              const fatNo = (p.faturaNo || p.fatura_no || p.evrakSayisi || "")
                .trim();
              const tutar = Number(
                p.genelToplam || p.kdvDahilToplam || p.tutar || p.toplamTutar ||
                  0,
              );
              if (fatNo && tutar > 0) {
                pushFatura({
                  id: `snap-fat-${d.id}-${idx}`,
                  faturaNo: fatNo,
                  faturaTarihi: p.faturaTarihi || p.tutanakTarihi ||
                    p.dosyaTarihi || d.temin_tarihi || d.created_at,
                  firmaTutar: tutar,
                  kdvOrani: Number(p.kdvOrani ?? 20),
                  tevkifatOrani: p.tevkifatOrani || "Yok",
                  odemeYontemi: "Hazine / Muhasebat Ödeme Emri",
                  durum: Number(d.durum_asama_id) >= 4 ? "odendi" : "beklemede",
                  aciklama:
                    `${s.sablon_kodu} resmî şablonundan derlenen fatura kaydı.`,
                  kaynak: "sablon",
                });
              }
            } catch {}
          }
        });
      }

      // 4. Tekil fatura fallback
      if (preferences.faturaNo && faturalar.length === 0) {
        pushFatura({
          id: `single-fat-${d.id}`,
          faturaNo: preferences.faturaNo,
          faturaTarihi: preferences.faturaTarihi || d.temin_tarihi ||
            d.created_at,
          firmaTutar: Number(d.net_odenen || d.yaklasik_maliyet || 0),
          kdvOrani: 20,
          tevkifatOrani: "Yok",
          odemeYontemi: "Hazine / Muhasebat Ödeme Emri",
          durum: Number(d.durum_asama_id) >= 4 ? "odendi" : "beklemede",
          aciklama: "Doğrudan Temin Fatura Kaydı",
          kaynak: "tahakkuk",
        });
      }

      const kazananUnvan = d.tanim_unvan ||
        d.dosya_firma_unvan ||
        d.en_dusuk_firma_unvan ||
        "Yüklenici Belirlenmedi";
      const kazananVkn = d.tanim_vkn || d.dosya_firma_vkn ||
        d.en_dusuk_firma_vkn || "-";
      const kazananIban = d.tanim_iban || "TR00 0000 0000 0000 0000 0000 00";
      const resolvedBedel = Number(d.kazanan_teklif_toplami) > 0
        ? Number(d.kazanan_teklif_toplami)
        : Number(d.yaklasik_maliyet) > 0
        ? Number(d.yaklasik_maliyet)
        : Number(d.en_dusuk_teklif_toplami || 0);

      return {
        id: Number(d.id),
        teminNo: d.temin_no || `DT-${d.id}`,
        konu: d.konu || "Doğrudan Temin Dosyası",
        tur: d.tur || "mal",
        yaklasikMaliyet: resolvedBedel,
        netOdenen: Number(d.net_odenen || 0),
        butceKodu: d.butce_kodu || "03.2.1.01",
        ekonomikKod: d.ekonomik_kod || "03.2.1.01",
        kazananFirmaUnvani: kazananUnvan,
        kazananFirmaVkn: kazananVkn,
        kazananFirmaIban: kazananIban,
        olusturmaTarihi: d.temin_tarihi || d.dosya_acilis_tarihi ||
          d.created_at || new Date().toISOString(),
        harcamaBirimi: d.birim_adi || d.harcama_birimi || "Destek Hizmetleri",
        durumAsamaId: Number(d.durum_asama_id || 1),
        status: d.status,
        kesintiDamga: Number(d.kesinti_damga || 0),
        kesintiKararPulu: 0,
        kesintiKdvTevkifat: Number(d.kesinti_kdv_tevkifat || 0),
        sozlesmeYapilacakMi: Boolean(d.sozlesme_yapilacak_mi),
        faturalar,
      };
    });
  } catch (err) {
    console.warn("[DosyalarVeFaturalariTab] Veri yüklenemedi:", err);
    return [];
  }
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────

export const DosyalarVeFaturalariTab: React.FC<DosyalarVeFaturalariTabProps> = (
  {
    activeRole: _activeRole,
    selectedYil,
    selectedDosyaId,
  },
) => {
  const navigate = useNavigate();
  const { addTab } = useTabStore();
  const { setActiveWorkspace } = useWorkspaceContextStore();
  const { setActiveDosyaId } = useWorkspaceStore();
  const [dosyalar, setDosyalar] = useState<DosyaOzet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alimFilter, setAlimFilter] = useState("all");
  const [faturaFilter, setFaturaFilter] = useState<
    "all" | "with-invoice" | "without-invoice" | "paid" | "pending"
  >("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [scopeFilter, setScopeFilter] = useState<"active" | "all">(
    () => (selectedDosyaId ? "active" : "all"),
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const activeDosya = useMemo(
    () => (selectedDosyaId
      ? dosyalar.find((d) => d.id === selectedDosyaId)
      : null),
    [dosyalar, selectedDosyaId],
  );

  // Seçili dosya değiştiğinde scope'u 'active' yap ve ilgili dosyayı genişlet
  useEffect(() => {
    if (selectedDosyaId) {
      setScopeFilter("active");
      setExpanded((prev) => new Set([...prev, selectedDosyaId]));
    }
  }, [selectedDosyaId]);

  // Fatura Ekleme/Düzenleme Modalı State
  const [modalOpen, setModalOpen] = useState(false);
  const [seciliDosya, setSeciliDosya] = useState<DosyaOzet | null>(null);
  const [duzenlenenFatura, setDuzenlenenFatura] = useState<FaturaKayit | null>(
    null,
  );
  const [formFaturaNo, setFormFaturaNo] = useState("");
  const [formFaturaTarihi, setFormFaturaTarihi] = useState("");
  const [formTutanakNo, setFormTutanakNo] = useState("");
  const [formTutanakTarihi, setFormTutanakTarihi] = useState("");
  const [formIrsaliyeNo, setFormIrsaliyeNo] = useState("");
  const [formTeslimYeri, setFormTeslimYeri] = useState("");
  const [formFaturaTutar, setFormFaturaTutar] = useState<number>(0);
  const [formKdvOrani, setFormKdvOrani] = useState<number>(20);
  const [formTevkifatOrani, setFormTevkifatOrani] = useState<string>("Yok");
  const [formOdemeYontemi, setFormOdemeYontemi] = useState(
    "Hazine / Muhasebat Ödeme Emri",
  );
  const [formDurum, setFormDurum] = useState<"beklemede" | "odendi" | "iptal">(
    "beklemede",
  );
  const [formAciklama, setFormAciklama] = useState("");
  const [formDamgaVergisiUygula, setFormDamgaVergisiUygula] = useState<boolean>(
    true,
  );
  const [formSozlesmeDamgaUygula, setFormSozlesmeDamgaUygula] = useState<boolean>(
    false,
  );
  const [isSaving, setIsSaving] = useState(false);

  const reloadData = () => {
    setLoading(true);
    loadDosyalarVeFaturalar()
      .then((data) => {
        setDosyalar(data);
        setLoading(false);
        // İlk 3 dosyayı varsayılan olarak açık tut
        if (data.length > 0) {
          setExpanded((
            prev,
          ) => (prev.size > 0
            ? prev
            : new Set(data.slice(0, 3).map((d) => d.id)))
          );
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    reloadData();

    const handleRefresh = () => reloadData();
    const events = [
      "app:db-changed",
      "focus",
      "bids:changed",
      "items:changed",
      "dossier:updated",
      "workspace:refreshed",
    ];
    events.forEach((ev) => window.addEventListener(ev, handleRefresh));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleRefresh));
    };
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(dosyalar.map((d) => d.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  // Fatura & Muayene Kabul Ekle Modal Aç
  const handleOpenAddInvoice = (dosya: DosyaOzet) => {
    setSeciliDosya(dosya);
    setDuzenlenenFatura(null);
    const nextIdx = (dosya.faturalar.length + 1).toString().padStart(2, "0");
    const todayStr = new Date().toISOString().slice(0, 10);
    setFormFaturaNo("");
    setFormFaturaTarihi(todayStr);
    setFormTutanakNo(`KT-${new Date().getFullYear()}-${nextIdx}`);
    setFormTutanakTarihi(todayStr);
    setFormIrsaliyeNo("");
    setFormTeslimYeri("Kurum Ambarı / İhtiyaç Yeri");
    setFormFaturaTutar(dosya.netOdenen || dosya.yaklasikMaliyet || 0);
    setFormKdvOrani(20);
    setFormTevkifatOrani("Yok");
    setFormOdemeYontemi("Hazine / Muhasebat Ödeme Emri");
    setFormDurum("beklemede");
    setFormAciklama(
      `${dosya.konu} alımı muayene kabul ve fatura hak ediş kaydı.`,
    );
    setFormDamgaVergisiUygula(true);
    setFormSozlesmeDamgaUygula(Boolean(dosya.sozlesmeYapilacakMi));
    setModalOpen(true);
  };

  // Fatura & Muayene Kabul Düzenle Modal Aç
  const handleOpenEditInvoice = (dosya: DosyaOzet, fatura: FaturaKayit) => {
    setSeciliDosya(dosya);
    setDuzenlenenFatura(fatura);
    setFormFaturaNo(fatura.faturaNo);
    setFormFaturaTarihi(
      fatura.faturaTarihi ? fatura.faturaTarihi.slice(0, 10) : "",
    );
    setFormTutanakNo(fatura.tutanakNo || `KT-${new Date().getFullYear()}-001`);
    setFormTutanakTarihi(
      fatura.tutanakTarihi ||
        (fatura.faturaTarihi ? fatura.faturaTarihi.slice(0, 10) : ""),
    );
    setFormIrsaliyeNo(fatura.irsaliyeNo || "");
    setFormTeslimYeri(fatura.teslimYeri || "Kurum Ambarı / İhtiyaç Yeri");
    setFormFaturaTutar(fatura.firmaTutar);
    setFormKdvOrani(
      Number.isFinite(Number(fatura.kdvOrani)) ? Number(fatura.kdvOrani) : 20,
    );
    setFormTevkifatOrani(fatura.tevkifatOrani || "Yok");
    setFormOdemeYontemi(fatura.odemeYontemi || "Hazine / Muhasebat Ödeme Emri");
    setFormDurum(fatura.durum);
    setFormAciklama(fatura.aciklama || "");
    setFormDamgaVergisiUygula(fatura.damgaVergisiUygula !== false);
    setFormSozlesmeDamgaUygula(
      fatura.sozlesmeDamgaVergisiUygula !== undefined
        ? Boolean(fatura.sozlesmeDamgaVergisiUygula)
        : Boolean(dosya.sozlesmeYapilacakMi),
    );
    setModalOpen(true);
  };

  // Faturayı Kaydet (sablon_tercihleri içine hem fatura hem kabul tutanağı kalıcı yazılır)
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliDosya || !window.electron?.ipcRenderer) return;

    try {
      setIsSaving(true);
      const fileRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        "SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?",
        [seciliDosya.id],
      );

      let prefs: any = {};
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs = typeof fileRes.data[0].sablon_tercihleri === "string"
            ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
            : fileRes.data[0].sablon_tercihleri || {};
        } catch {
          prefs = {};
        }
      }

      const existingInvoices: FaturaKayit[] = Array.isArray(prefs.faturalar)
        ? [...prefs.faturalar]
        : [];

      const kdvVal = Number.isFinite(Number(formKdvOrani))
        ? Number(formKdvOrani)
        : 20;
      const fin = calculateInvoiceFinancials(
        Number(formFaturaTutar) || 0,
        kdvVal,
        formTevkifatOrani,
        false,
        formDamgaVergisiUygula,
        formSozlesmeDamgaUygula,
      );

      const updatedInvoice: FaturaKayit = {
        id: duzenlenenFatura?.id || `fat-${Date.now()}`,
        faturaNo: formFaturaNo.trim(),
        faturaTarihi: formFaturaTarihi,
        firmaTutar: Number(formFaturaTutar) || 0,
        kdvOrani: kdvVal,
        matrah: fin.matrah,
        kdvTutari: fin.kdvTutari,
        tevkifatOrani: formTevkifatOrani,
        tevkifatTutari: fin.tevkifatTutari,
        odemeDamgaVergisi: fin.odemeDamgaVergisi,
        sozlesmeDamgaVergisi: fin.sozlesmeDamgaVergisi,
        damgaVergisi: fin.damgaVergisi,
        damgaVergisiUygula: formDamgaVergisiUygula,
        sozlesmeDamgaVergisiUygula: formSozlesmeDamgaUygula,
        kararPulu: 0,
        kararPuluUygula: false,
        netOdenecek: fin.netOdenecek,
        odemeYontemi: formOdemeYontemi,
        durum: formDurum,
        aciklama: formAciklama.trim(),
        kaynak: "mali_giris",
        tutanakNo: formTutanakNo.trim(),
        tutanakTarihi: formTutanakTarihi,
        irsaliyeNo: formIrsaliyeNo.trim(),
        teslimYeri: formTeslimYeri.trim(),
      };

      // Aynı fatura numarasının mükerrer eklenmesini önle
      const normalizedNo = formFaturaNo.trim().toLowerCase();
      const isDuplicate = existingInvoices.some(
        (item) =>
          item.faturaNo.trim().toLowerCase() === normalizedNo &&
          item.id !== duzenlenenFatura?.id,
      );
      if (isDuplicate) {
        await dialogs.alert({
          title: "Mükerrer Fatura",
          message:
            `Hata: "${formFaturaNo.trim()}" numaralı fatura bu dosyada zaten kayıtlıdır.`,
          variant: "warning",
        });
        setIsSaving(false);
        return;
      }

      if (duzenlenenFatura) {
        const idx = existingInvoices.findIndex((item) =>
          item.id === duzenlenenFatura.id
        );
        if (idx !== -1) {
          existingInvoices[idx] = updatedInvoice;
        } else {
          existingInvoices.push(updatedInvoice);
        }
      } else {
        existingInvoices.push(updatedInvoice);
      }

      prefs.faturalar = existingInvoices;
      prefs.faturaNo = updatedInvoice.faturaNo;
      prefs.faturaTarihi = updatedInvoice.faturaTarihi;

      // ─── Muayene ve Kabul Tutanakları ile %100 Senkronize Et ───
      const currentTutanaklar: any[] = Array.isArray(prefs.kabulTutanaklari)
        ? [...prefs.kabulTutanaklari]
        : [];

      const tutIdx = currentTutanaklar.findIndex(
        (t) =>
          (t.faturaNo && t.faturaNo.trim().toLowerCase() === normalizedNo) ||
          (t.id && duzenlenenFatura?.id && t.id === duzenlenenFatura.id),
      );

      const tutanakPayload = {
        id: tutIdx !== -1 ? currentTutanaklar[tutIdx].id : `tut_${Date.now()}`,
        tutanakNo: formTutanakNo.trim() || `KT-${new Date().getFullYear()}-001`,
        tutanakTarihi: formTutanakTarihi || formFaturaTarihi,
        faturaNo: formFaturaNo.trim(),
        faturaTarihi: formFaturaTarihi,
        irsaliyeNo: formIrsaliyeNo.trim() || undefined,
        teslimYeri: formTeslimYeri.trim() || undefined,
        durum: formDurum === "odendi"
          ? "kabul"
          : formDurum === "iptal"
          ? "red"
          : "kabul",
        tutar: Number(formFaturaTutar) || 0,
        notlar: formAciklama.trim() ||
          `${formFaturaNo.trim()} faturasına ait muayene kabul kaydı.`,
        created_at: tutIdx !== -1
          ? currentTutanaklar[tutIdx].created_at
          : new Date().toISOString(),
      };

      if (tutIdx !== -1) {
        currentTutanaklar[tutIdx] = {
          ...currentTutanaklar[tutIdx],
          ...tutanakPayload,
        };
      } else {
        currentTutanaklar.push(tutanakPayload);
      }

      prefs.kabulTutanaklari = currentTutanaklar;

      const updateRes = await window.electron.ipcRenderer.invoke(
        "db:run",
        "UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime('now') WHERE id = ?",
        [JSON.stringify(prefs), seciliDosya.id],
      );

      if (!updateRes?.success) {
        await dialogs.alert({
          title: "Kayıt Hatası",
          message: "Fatura kaydedilirken veritabanı hatası oluştu: " +
            (updateRes?.error || "Bilinmeyen hata"),
          variant: "danger",
        });
        setIsSaving(false);
        return;
      }

      window.dispatchEvent(
        new CustomEvent("dossier:updated", {
          detail: { dosyaId: seciliDosya.id },
        }),
      );

      setModalOpen(false);
      setIsSaving(false);
      reloadData();
    } catch (err: any) {
      console.error("[DosyalarVeFaturalariTab] Fatura kaydedilemedi:", err);
      await dialogs.alert({
        title: "Beklenmeyen Hata",
        message: "Fatura kaydedilirken beklenmeyen hata: " +
          (err?.message || String(err)),
        variant: "danger",
      });
      setIsSaving(false);
    }
  };

  // Fatura Durumunu Hızlıca Değiştir (Ödendi / Beklemede)
  const handleToggleDurum = async (dosya: DosyaOzet, fatura: FaturaKayit) => {
    if (!window.electron?.ipcRenderer) return;
    const yeniDurum = fatura.durum === "odendi" ? "beklemede" : "odendi";

    try {
      const fileRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        "SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?",
        [dosya.id],
      );

      let prefs: any = {};
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs = typeof fileRes.data[0].sablon_tercihleri === "string"
            ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
            : fileRes.data[0].sablon_tercihleri || {};
        } catch {
          prefs = {};
        }
      }

      const existingInvoices: FaturaKayit[] = Array.isArray(prefs.faturalar)
        ? [...prefs.faturalar]
        : [];

      const idx = existingInvoices.findIndex((item) =>
        item.id === fatura.id || item.faturaNo === fatura.faturaNo
      );
      if (idx !== -1) {
        existingInvoices[idx].durum = yeniDurum;
      } else {
        existingInvoices.push({ ...fatura, durum: yeniDurum });
      }

      prefs.faturalar = existingInvoices;

      const updateRes = await window.electron.ipcRenderer.invoke(
        "db:run",
        "UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime('now') WHERE id = ?",
        [JSON.stringify(prefs), dosya.id],
      );

      if (!updateRes?.success) {
        await dialogs.alert({
          title: "Hata",
          message: "Fatura durumu güncellenirken hata oluştu: " +
            (updateRes?.error || "Bilinmeyen hata"),
          variant: "danger",
        });
        return;
      }

      reloadData();
    } catch (err: any) {
      console.error("Durum değiştirilemedi:", err);
      await dialogs.alert({
        title: "Hata",
        message: "Durum güncellenirken beklenmeyen hata: " +
          (err?.message || String(err)),
        variant: "danger",
      });
    }
  };

  // Fatura Sil
  const handleDeleteInvoice = async (
    dosya: DosyaOzet,
    faturaId: string | number,
  ) => {
    const ok = await dialogs.confirm({
      title: "Faturayı Sil",
      message: "Bu fatura kaydını silmek istediğinize emin misiniz?",
      confirmText: "Sil",
      cancelText: "Vazgeç",
      variant: "danger",
    });
    if (!ok) return;
    if (!window.electron?.ipcRenderer) return;

    try {
      const fileRes = await window.electron.ipcRenderer.invoke(
        "db:query",
        "SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?",
        [dosya.id],
      );

      let prefs: any = {};
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs = typeof fileRes.data[0].sablon_tercihleri === "string"
            ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
            : fileRes.data[0].sablon_tercihleri || {};
        } catch {
          prefs = {};
        }
      }

      const deletedFatura = (prefs.faturalar || []).find((item: any) =>
        item.id === faturaId
      );
      if (Array.isArray(prefs.faturalar)) {
        prefs.faturalar = prefs.faturalar.filter((item: any) =>
          item.id !== faturaId
        );
      }
      if (deletedFatura?.faturaNo && Array.isArray(prefs.kabulTutanaklari)) {
        const delNorm = deletedFatura.faturaNo.trim().toLowerCase();
        prefs.kabulTutanaklari = prefs.kabulTutanaklari.filter(
          (t: any) =>
            !t.faturaNo || t.faturaNo.trim().toLowerCase() !== delNorm,
        );
      }

      const updateRes = await window.electron.ipcRenderer.invoke(
        "db:run",
        "UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime('now') WHERE id = ?",
        [JSON.stringify(prefs), dosya.id],
      );

      if (!updateRes?.success) {
        await dialogs.alert({
          title: "Hata",
          message: "Fatura silinirken hata oluştu: " +
            (updateRes?.error || "Bilinmeyen hata"),
          variant: "danger",
        });
        return;
      }

      window.dispatchEvent(
        new CustomEvent("dossier:updated", {
          detail: { dosyaId: dosya.id },
        }),
      );

      reloadData();
    } catch (err: any) {
      console.error("Fatura silinemedi:", err);
      await dialogs.alert({
        title: "Hata",
        message: "Fatura silinirken beklenmeyen hata: " +
          (err?.message || String(err)),
        variant: "danger",
      });
    }
  };

  // Doğrudan Temin Dosyasına Git
  const handleOpenDosya = (dosyaId: number) => {
    setActiveDosyaId(dosyaId);
    try {
      setActiveWorkspace("procurement");
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(
        new CustomEvent("takip:view-mode-changed", {
          detail: { mode: "detay", dosyaId, tab: "kunye" },
        }),
      );
    } catch {
      // ignore
    }
    addTab(APP_ROUTES.DOSYA_DETAY);
    navigate({ to: APP_ROUTES.DOSYA_DETAY });
  };

  // Filtreleme
  const filteredDosyalar = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return dosyalar.filter((d) => {
      const matchSearch = !term ||
        d.teminNo.toLowerCase().includes(term) ||
        d.konu.toLowerCase().includes(term) ||
        d.kazananFirmaUnvani.toLowerCase().includes(term) ||
        d.kazananFirmaVkn.toLowerCase().includes(term) ||
        d.harcamaBirimi.toLowerCase().includes(term) ||
        d.faturalar.some((f) => f.faturaNo.toLowerCase().includes(term));

      const matchAlim = alimFilter === "all" ||
        d.tur.toLowerCase() === alimFilter.toLowerCase();

      let matchFatura = true;
      if (faturaFilter === "with-invoice") {
        matchFatura = d.faturalar.length > 0;
      } else if (faturaFilter === "without-invoice") {
        matchFatura = d.faturalar.length === 0;
      } else if (faturaFilter === "paid") {
        matchFatura = d.faturalar.some((f) => f.durum === "odendi");
      } else if (faturaFilter === "pending") {
        matchFatura = d.faturalar.some((f) => f.durum === "beklemede");
      }

      const matchYil = !selectedYil ||
        selectedYil === "ALL" ||
        (d.olusturmaTarihi &&
          new Date(d.olusturmaTarihi).getFullYear() === Number(selectedYil));

      const matchDosya = scopeFilter === "all" || !selectedDosyaId ||
        d.id === selectedDosyaId;

      return matchSearch && matchAlim && matchFatura && matchYil && matchDosya;
    });
  }, [
    dosyalar,
    searchTerm,
    alimFilter,
    faturaFilter,
    selectedYil,
    selectedDosyaId,
    scopeFilter,
  ]);

  // Toplu Fatura Kontrol Listesi için düzleştirilmiş faturalar
  const allFilteredInvoices = useMemo(() => {
    const list: Array<
      FaturaKayit & {
        dosyaId: number;
        dosyaTeminNo: string;
        dosyaKonu: string;
        dosyaTur: string;
        dosyaFirma: string;
        dosyaVkn: string;
        dosyaButceKodu: string;
        dosyaSozlesmeli: boolean;
      }
    > = [];

    filteredDosyalar.forEach((d) => {
      d.faturalar.forEach((f) => {
        list.push({
          ...f,
          dosyaId: d.id,
          dosyaTeminNo: d.teminNo,
          dosyaKonu: d.konu,
          dosyaTur: d.tur,
          dosyaFirma: d.kazananFirmaUnvani,
          dosyaVkn: d.kazananFirmaVkn,
          dosyaButceKodu: d.butceKodu,
          dosyaSozlesmeli: d.sozlesmeYapilacakMi,
        });
      });
    });

    return list;
  }, [filteredDosyalar]);

  // Canlı Hesaplanan İstatistikler (Filtrelenen Kapsama Göre)
  const stats = useMemo(() => {
    let totalFaturalar = 0;
    let totalHarcama = 0;
    let paidHarcama = 0;
    let pendingHarcama = 0;
    let totalDamga = 0;
    let totalKararPulu = 0;
    let totalTevkifat = 0;

    filteredDosyalar.forEach((d) => {
      d.faturalar.forEach((f) => {
        totalFaturalar++;
        const tutar = Number(f.firmaTutar || 0);
        totalHarcama += tutar;

        if (f.durum === "odendi") {
          paidHarcama += tutar;
        } else if (f.durum === "beklemede") {
          pendingHarcama += tutar;
        }

        totalDamga += Number(f.damgaVergisi || 0);
        totalKararPulu += Number(f.kararPulu || 0);
        totalTevkifat += Number(f.tevkifatTutari || 0);
      });
    });

    return {
      totalDosya: filteredDosyalar.length,
      allDosyaCount: dosyalar.length,
      totalFaturalar,
      totalHarcama,
      paidHarcama,
      pendingHarcama,
      totalDamga,
      totalKararPulu,
      totalTevkifat,
      netHazineCikisi: totalHarcama -
        (totalDamga + totalKararPulu + totalTevkifat),
    };
  }, [filteredDosyalar, dosyalar.length]);

  // Canlı modal hesaplama
  const modalCalculations = useMemo(() => {
    return calculateInvoiceFinancials(
      formFaturaTutar || 0,
      Number.isFinite(Number(formKdvOrani)) ? Number(formKdvOrani) : 20,
      formTevkifatOrani,
      false,
      formDamgaVergisiUygula,
      formSozlesmeDamgaUygula,
    );
  }, [
    formFaturaTutar,
    formKdvOrani,
    formTevkifatOrani,
    formDamgaVergisiUygula,
    formSozlesmeDamgaUygula,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Üst İstatistik Kartları (5018 & BKMYBS Mali Özet) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Dosyalar */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                5018 Kapsamında Dosyalar
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {stats.totalDosya}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Doğrudan Temin
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={12} className="shrink-0" />
                <span>{dosyalar.filter((d) => d.faturalar.length > 0).length} dosyanın faturası bağlı</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-2xs">
              <FolderOpen size={20} />
            </div>
          </div>
        </div>

        {/* Kart 2: Fatura Durumu */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Toplam Fatura Kaydı
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {stats.totalFaturalar}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Clock size={10} />
                  {dosyalar.flatMap((d) => d.faturalar).filter((f) => f.durum === "beklemede").length} Bekleyen
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>{dosyalar.flatMap((d) => d.faturalar).filter((f) => f.durum === "odendi").length} Ödenen Fatura</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
              <Receipt size={20} />
            </div>
          </div>
        </div>

        {/* Kart 3: Harcama ve Tahakkuk Bedeli */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Toplam Harcama / Fatura Tutarı
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                  {formatCurrency(stats.totalHarcama)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Ödenen: </span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(stats.paidHarcama)}</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-2xs">
              <Banknote size={20} />
            </div>
          </div>
        </div>

        {/* Kart 4: Kamu Yasal Kesintileri */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 rounded-t-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Yasal Kesintiler (Damga & Tevkifat)
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                  {formatCurrency(stats.totalDamga + stats.totalTevkifat)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                <span>Damga (‰9,48): <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(stats.totalDamga)}</strong></span>
                <span>•</span>
                <span>Tevkifat: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(stats.totalTevkifat)}</strong></span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-2xs">
              <Percent size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtreleme & Arama Çubuğu ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Üst Sıra: Dosya Kapsamı (Scope) & Görünüm Modu (Cards / Table) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Kapsam:
            </span>
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold shrink-0">
              {selectedDosyaId
                ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setScopeFilter("active")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        scopeFilter === "active"
                          ? "bg-blue-600 text-white shadow-xs font-black"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                      )}
                      title={`Yalnızca aktif doğrudan temin dosyasını (${
                        activeDosya?.teminNo || `#${selectedDosyaId}`
                      }) göster`}
                    >
                      <FolderCheck
                        size={14}
                        className={scopeFilter === "active"
                          ? "text-white"
                          : "text-blue-500"}
                      />
                      <span>
                        Aktif Dosya ({activeDosya?.teminNo ||
                          `#${selectedDosyaId}`})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeFilter("all")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        scopeFilter === "all"
                          ? "bg-blue-600 text-white shadow-xs font-black"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                      )}
                      title="Tüm doğrudan temin dosyalarını ve faturalarını sorgula / kontrol et"
                    >
                      <Layers
                        size={14}
                        className={scopeFilter === "all"
                          ? "text-white"
                          : "text-slate-400"}
                      />
                      <span>Tüm Dosyalar ({dosyalar.length})</span>
                    </button>
                  </>
                )
                : (
                  <div className="flex items-center gap-1.5 px-3 py-1 text-slate-600 dark:text-slate-300 text-xs font-bold">
                    <Layers size={14} className="text-slate-400" />
                    <span>
                      Tüm Doğrudan Temin Dosyaları ({dosyalar.length})
                    </span>
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Görünüm:
            </span>
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "cards"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900",
                )}
                title="Dosya bazlı kart ve akordeon görünümü"
              >
                <LayoutGrid size={13} />
                <span>Dosya Kartları</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900",
                )}
                title="Tüm faturaların tek çizelgede denetlendiği Fatura Kontrol Listesi"
              >
                <Table size={13} />
                <span>
                  Fatura Kontrol Çizelgesi ({allFilteredInvoices.length})
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Alt Sıra: Arama & Filtreler */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dosya no, konu, firma unvanı, VKN veya fatura no ara..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={alimFilter}
              onChange={(e) => setAlimFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Alım Türleri</option>
              <option value="mal">Mal Alımı</option>
              <option value="hizmet">Hizmet Alımı</option>
              <option value="danismanlik">Danışmanlık</option>
              <option value="yapim">Yapım İşi</option>
            </select>

            <select
              value={faturaFilter}
              onChange={(e) => setFaturaFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="with-invoice">Faturası Olanlar</option>
              <option value="without-invoice">Faturası Beklenenler</option>
              <option value="paid">Ödenen Faturalar</option>
              <option value="pending">Ödeme Bekleyenler</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "cards" && (
              <>
                <button
                  onClick={expandAll}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Tümünü Aç
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Tümünü Kapat
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              </>
            )}
            <span className="text-xs text-slate-500 font-bold">
              Toplam <strong>{filteredDosyalar.length}</strong>{" "}
              dosya ({allFilteredInvoices.length} fatura)
            </span>
          </div>
        </div>
      </div>

      {/* ── Dosyalar ve Faturaları Listesi ── */}
      <div className="space-y-4">
        {loading
          ? (
            <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Clock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Doğrudan Temin dosyaları ve faturaları derleniyor...
              </p>
            </div>
          )
          : filteredDosyalar.length === 0
          ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  Kayıtlı dosya bulunamadı
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Arama kriterlerinize uyan Doğrudan Temin dosyası bulunamadı
                  veya henüz dosya oluşturulmadı.
                </p>
              </div>
            </div>
          )
          : viewMode === "table"
          ? (
            /* Görünüm 1: Fatura Kontrol Çizelgesi (Toplu Fatura Denetim Tablosu) */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    5018 / BKMYBS Fatura Denetim ve Kontrol Çizelgesi
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {allFilteredInvoices.length} Fatura
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {scopeFilter === "active" && activeDosya
                    ? (
                      <span>
                        Yalnızca <strong>{activeDosya.teminNo}</strong>{" "}
                        dosyası faturaları listeleniyor
                      </span>
                    )
                    : (
                      <span>
                        Tüm doğrudan temin dosyalarının faturaları denetleniyor
                      </span>
                    )}
                </div>
              </div>

              {allFilteredInvoices.length === 0
                ? (
                  <div className="py-16 text-center">
                    <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Kriterlere uygun kayıtlı fatura bulunamadı.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Filtreleri değiştirerek veya dosya kartlarından yeni
                      fatura ekleyerek işlem yapabilirsiniz.
                    </p>
                  </div>
                )
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-3.5 py-3">Dosya No</th>
                          <th className="px-3.5 py-3">Fatura No</th>
                          <th className="px-3.5 py-3">Tarih</th>
                          <th className="px-3.5 py-3">Yüklenici Firma</th>
                          <th className="px-3.5 py-3 text-right">
                            KDV Matrahı (₺)
                          </th>
                          <th className="px-3.5 py-3 text-center">KDV (%)</th>
                          <th className="px-3.5 py-3 text-right font-black">
                            Fatura Tutarı (Brüt)
                          </th>
                          <th className="px-3.5 py-3 text-right">
                            Damga Vergisi (‰9,48)
                          </th>
                          <th className="px-3.5 py-3 text-right">
                            KDV Tevkifatı
                          </th>
                          <th className="px-3.5 py-3 text-right font-black text-blue-600 dark:text-blue-400">
                            Net Ödenecek (₺)
                          </th>
                          <th className="px-3.5 py-3 text-center">
                            Ödeme Durumu
                          </th>
                          <th className="px-3.5 py-3 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                        {allFilteredInvoices.map((fatura, idx) => {
                          const parentDosya = dosyalar.find((d) =>
                            d.id === fatura.dosyaId
                          );
                          const isPaid = fatura.durum === "odendi";

                          return (
                            <tr
                              key={`flat_table_${fatura.dosyaId}_${fatura.id}_${idx}`}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors"
                            >
                              <td className="px-3.5 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDosyaId(fatura.dosyaId);
                                    setScopeFilter("active");
                                    setViewMode("cards");
                                  }}
                                  className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 cursor-pointer"
                                  title="Bu dosyaya odaklan"
                                >
                                  {fatura.dosyaTeminNo}
                                </button>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                                {fatura.faturaNo}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {formatDate(fatura.faturaTarihi)}
                              </td>
                              <td
                                className="px-3.5 py-2.5 max-w-[200px] truncate"
                                title={fatura.dosyaFirma}
                              >
                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {fatura.dosyaFirma}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  VKN: {fatura.dosyaVkn}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                {formatCurrency(fatura.matrah || 0)}
                              </td>
                              <td className="px-3.5 py-2.5 text-center font-bold text-slate-500">
                                %{fatura.kdvOrani || 20}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                                {formatCurrency(fatura.firmaTutar || 0)}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                                {formatCurrency(fatura.damgaVergisi || 0)}
                              </td>
                              <td
                                className={cn(
                                  "px-3.5 py-2.5 text-right font-mono",
                                  fatura.tevkifatTutari &&
                                    fatura.tevkifatTutari > 0
                                    ? "text-rose-600 dark:text-rose-400 font-bold"
                                    : "text-slate-400 dark:text-slate-500 font-normal",
                                )}
                              >
                                {fatura.tevkifatTutari &&
                                    fatura.tevkifatTutari > 0
                                  ? formatCurrency(fatura.tevkifatTutari)
                                  : "0,00 ₺"}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                  fatura.netOdenecek || fatura.firmaTutar,
                                )}
                              </td>
                              <td className="px-3.5 py-2.5 text-center">
                                <FaturaDurumBadge durum={fatura.durum} />
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {parentDosya && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleToggleDurum(
                                            parentDosya,
                                            fatura,
                                          )}
                                        title={isPaid
                                          ? "Beklemeye Al"
                                          : "Ödendi Olarak İşaretle"}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                          isPaid
                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                        }`}
                                      >
                                        {isPaid ? "Beklet" : "Ödendi Yap"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleOpenEditInvoice(
                                            parentDosya,
                                            fatura,
                                          )}
                                        title="Faturayı Düzenle"
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100/80 dark:bg-slate-950 border-t-2 border-slate-200 dark:border-slate-800 font-black text-slate-800 dark:text-slate-200 text-xs">
                        <tr>
                          <td colSpan={4} className="px-3.5 py-3 text-left">
                            TOPLAM ({allFilteredInvoices.length} Fatura)
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono">
                            {formatCurrency(
                              allFilteredInvoices.reduce(
                                (a, f) => a + (f.matrah || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-center">-</td>
                          <td className="px-3.5 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                            {formatCurrency(
                              allFilteredInvoices.reduce(
                                (a, f) => a + (f.firmaTutar || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                            {formatCurrency(
                              allFilteredInvoices.reduce(
                                (a, f) => a + (f.damgaVergisi || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-slate-500">
                            {formatCurrency(
                              allFilteredInvoices.reduce(
                                (a, f) => a + (f.tevkifatTutari || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(
                              allFilteredInvoices.reduce(
                                (a, f) => a + (f.netOdenecek || f.firmaTutar),
                                0,
                              ),
                            )}
                          </td>
                          <td
                            colSpan={2}
                            className="px-3.5 py-3 text-right text-[11px] text-slate-500"
                          >
                            Ödenen: {allFilteredInvoices.filter((f) =>
                              f.durum === "odendi"
                            ).length} | Bekleyen:{" "}
                            {allFilteredInvoices.filter((f) =>
                              f.durum === "beklemede"
                            ).length}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
            </div>
          )
          : (
            filteredDosyalar.map((dosya, idx) => {
              const isExp = expanded.has(dosya.id);
              const faturaSayisi = dosya.faturalar.length;
              const dosyaFaturaToplam = dosya.faturalar.reduce(
                (acc, f) => acc + (f.firmaTutar || 0),
                0,
              );

              return (
                <div
                  key={`card_dosya_${dosya.id}_${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  {/* Dosya Başlık Şeridi */}
                  <div
                    onClick={() => toggleExpand(dosya.id)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {isExp
                          ? <ChevronDown size={18} />
                          : <ChevronRight size={18} />}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                          {dosya.teminNo}
                        </span>
                        {selectedDosyaId === dosya.id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shadow-xs">
                            <FolderCheck
                              size={11}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                            Aktif Dosya
                          </span>
                        )}
                        <AlimTuruBadge turu={dosya.tur} />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                            dosya.sozlesmeYapilacakMi
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
                          )}
                          title={
                            dosya.sozlesmeYapilacakMi
                              ? "Dosya sözleşmelidir — Sözleşme Damga Vergisi (‰ 9,48) otomatik tahsil edilir"
                              : "Dosyada sözleşme yoktur — Sözleşme Damga Vergisi tahsil edilmez"
                          }
                        >
                          {dosya.sozlesmeYapilacakMi
                            ? "📜 Sözleşmeli (Sözleşme DV ‰9,48)"
                            : "📦 Sözleşmesiz"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {dosya.konu}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Building2 size={11} className="text-slate-400" />
                            {dosya.kazananFirmaUnvani} (VKN:{" "}
                            {dosya.kazananFirmaVkn})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Layers size={11} className="text-slate-400" />
                            {dosya.harcamaBirimi}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400" />
                            {formatDate(dosya.olusturmaTarihi)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ Taraf: Bedel ve Fatura Rozeti */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Yaklaşık Maliyet / Bedel
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(
                            dosya.yaklasikMaliyet || dosya.netOdenen,
                          )}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Fatura Toplamı
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {faturaSayisi > 0
                            ? formatCurrency(dosyaFaturaToplam)
                            : "Fatura Yok"}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          faturaSayisi > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {faturaSayisi > 0
                          ? `${faturaSayisi} Fatura Kayıtlı`
                          : "Fatura Bekleniyor"}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDosya(dosya.id);
                        }}
                        title="Dosya Detayına Git (Süreç Takip & Şartname)"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-2xs"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">Dosya Detayı</span>
                      </button>
                    </div>
                  </div>

                  {/* Genişletilmiş Alan: Fatura Detay Tablosu & Mali İşlemler */}
                  {isExp && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Receipt size={13} />
                          </div>
                          <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-100">
                            Doğrudan Temin Fatura & Hak Ediş Çizelgesi (5018 / BKMYBS)
                          </h5>
                          {dosya.butceKodu && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                              Bütçe Kodu: {dosya.butceKodu}
                            </span>
                          )}
                          {dosya.kazananFirmaIban && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                              IBAN: {dosya.kazananFirmaIban}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAddInvoice(dosya)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                          >
                            <Plus size={13} />
                            Kabul Tutanağı & Fatura Ekle
                          </button>
                        </div>
                      </div>

                      {/* Fatura Tablosu */}
                      {dosya.faturalar.length === 0
                        ? (
                          <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              Bu dosyaya henüz bir fatura veya muayene kabul
                              kaydı bağlanmadı.
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Doğrudan Temin ekranında Muayene ve Kabul Tutanağı
                              düzenlendiğinde veya buradan Kabul Tutanağı &
                              Fatura Ekle butonuna tıklandığında senkronize
                              listelenecektir.
                            </p>
                          </div>
                        )
                        : (
                          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-3.5 py-2.5">Fatura No</th>
                                  <th className="px-3.5 py-2.5">
                                    Fatura Tarihi
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right">
                                    KDV Matrahı (₺)
                                  </th>
                                  <th className="px-3.5 py-2.5 text-center">
                                    KDV (%)
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right">
                                    Fatura Tutarı (Brüt)
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right">
                                    Damga Vergisi (‰9,48)
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right">
                                    KDV Tevkifatı
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right font-black text-blue-600 dark:text-blue-400">
                                    Net Ödenecek (₺)
                                  </th>
                                  <th className="px-3.5 py-2.5 text-center">
                                    Durum
                                  </th>
                                  <th className="px-3.5 py-2.5 text-right">
                                    İşlemler
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                                {dosya.faturalar.map((fatura, fIdx) => (
                                  <tr
                                    key={`card_fat_${dosya.id}_${fatura.id}_${fIdx}`}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors"
                                  >
                                    <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                                      {fatura.faturaNo}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-slate-500">
                                      {formatDate(fatura.faturaTarihi)}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                      {formatCurrency(fatura.matrah || 0)}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center font-bold text-slate-500">
                                      %{Number.isFinite(Number(fatura.kdvOrani))
                                        ? fatura.kdvOrani
                                        : 20}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                                      {formatCurrency(fatura.firmaTutar || 0)}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                                      {formatCurrency(fatura.damgaVergisi || 0)}
                                    </td>
                                    <td
                                      className={cn(
                                        "px-3.5 py-2.5 text-right font-mono",
                                        fatura.tevkifatTutari &&
                                          fatura.tevkifatTutari > 0
                                          ? "text-rose-600 dark:text-rose-400 font-bold"
                                          : "text-slate-400 dark:text-slate-500 font-normal",
                                      )}
                                    >
                                      {fatura.tevkifatTutari &&
                                          fatura.tevkifatTutari > 0
                                        ? formatCurrency(fatura.tevkifatTutari)
                                        : "0,00 ₺"}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(
                                        fatura.netOdenecek || fatura.firmaTutar,
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center">
                                      <FaturaDurumBadge durum={fatura.durum} />
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() =>
                                            handleToggleDurum(dosya, fatura)}
                                          title={fatura.durum === "odendi"
                                            ? "Beklemeye Al"
                                            : "Ödendi Olarak İşaretle"}
                                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                            fatura.durum === "odendi"
                                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                          }`}
                                        >
                                          {fatura.durum === "odendi"
                                            ? "Beklet"
                                            : "Ödendi Yap"}
                                        </button>

                                        <button
                                          onClick={() =>
                                            handleOpenEditInvoice(
                                              dosya,
                                              fatura,
                                            )}
                                          title="Faturayı Düzenle"
                                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                        >
                                          <Edit2 size={13} />
                                        </button>

                                        <button
                                          onClick={() =>
                                            handleDeleteInvoice(
                                              dosya,
                                              fatura.id,
                                            )}
                                          title="Faturayı Sil"
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          )}
      </div>

      {/* ── Muayene Kabul & Fatura Ekleme/Düzenleme Modalı (Portal ile tam ekran üst katmanda) ── */}
      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Receipt size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                      {duzenlenenFatura
                        ? "Muayene Kabul & Fatura Düzenle"
                        : "Yeni Muayene Kabul Tutanağı & Fatura Kaydet"}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {seciliDosya?.teminNo} — {seciliDosya?.konu}{" "}
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        (5018 & Kabul Aşaması ile Entegre)
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form (Scrollable Body + Sticky Footer) */}
              <form
                onSubmit={handleSaveInvoice}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {/* Muayene ve Kabul Tutanağı Entegrasyon Kartı */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <CheckCircle
                          size={14}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <span>
                          Muayene ve Kabul Tutanağı Entegrasyonu (5018 / MYHBY)
                        </span>
                      </span>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                        Otomatik Senkronize
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Kabul Tutanağı No *
                        </label>
                        <input
                          type="text"
                          required
                          value={formTutanakNo}
                          onChange={(e) => setFormTutanakNo(e.target.value)}
                          placeholder="Örn: KT-2026-001"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Kabul / Muayene Tarihi *
                        </label>
                        <input
                          type="date"
                          required
                          value={formTutanakTarihi}
                          onChange={(e) => setFormTutanakTarihi(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          İrsaliye No (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          value={formIrsaliyeNo}
                          onChange={(e) => setFormIrsaliyeNo(e.target.value)}
                          placeholder="Örn: İRS-2026-104"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Teslim Yeri / Ambar
                        </label>
                        <input
                          type="text"
                          value={formTeslimYeri}
                          onChange={(e) => setFormTeslimYeri(e.target.value)}
                          placeholder="Kurum Ambarı / İhtiyaç Yeri"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fatura / E-Arşiv No *
                      </label>
                      <input
                        type="text"
                        required
                        value={formFaturaNo}
                        onChange={(e) => setFormFaturaNo(e.target.value)}
                        placeholder="Örn: GIB20260000001"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fatura Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        value={formFaturaTarihi}
                        onChange={(e) => setFormFaturaTarihi(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fatura Tutarı (Brüt ₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formFaturaTutar}
                        onChange={(e) =>
                          setFormFaturaTutar(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KDV Oranı (%)
                      </label>
                      <select
                        value={formKdvOrani}
                        onChange={(e) =>
                          setFormKdvOrani(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={20}>%20 Standart</option>
                        <option value={10}>%10 İndirimli</option>
                        <option value={1}>%1 Temel</option>
                        <option value={0}>%0 Muaf</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KDV Tevkifatı
                      </label>
                      <select
                        value={formTevkifatOrani}
                        onChange={(e) => setFormTevkifatOrani(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="Yok">Tevkifat Yok</option>
                        <option value="2/10">2/10</option>
                        <option value="3/10">3/10</option>
                        <option value="4/10">4/10</option>
                        <option value="5/10">5/10</option>
                        <option value="7/10">7/10</option>
                        <option value="9/10">9/10</option>
                        <option value="Tam">Tam Tevkifat</option>
                      </select>
                    </div>
                  </div>

                  {/* Damga Vergisi ve Sözleşme Damga Vergisi Kesintileri */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="damgaVergisiCheck"
                        checked={formDamgaVergisiUygula}
                        onChange={(e) =>
                          setFormDamgaVergisiUygula(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="damgaVergisiCheck"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        Ödeme Emri / Fatura Damga Vergisi Kesintisi Uygula (488
                        S.K. Tablo IV/1-a — ‰ 9,48)
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                          Resmî dairelerce yapılan mal ve hizmet alımı
                          ödemelerinde KDV hariç fatura matrahı üzerinden binde
                          9,48 ödeme emri damga vergisi kesilir.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/50">
                      <input
                        type="checkbox"
                        id="sozlesmeDamgaCheck"
                        checked={formSozlesmeDamgaUygula}
                        onChange={(e) =>
                          setFormSozlesmeDamgaUygula(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 focus:ring-purple-500 cursor-pointer"
                      />
                      <label
                        htmlFor="sozlesmeDamgaCheck"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none flex-1"
                      >
                        <span className="flex items-center justify-between gap-2 flex-wrap">
                          <span>
                            Sözleşme Damga Vergisi Tahsil Et (488 S.K. Tablo
                            I/A-1 — ‰ 9,48)
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-extrabold",
                              seciliDosya?.sozlesmeYapilacakMi
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200"
                                : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                            )}
                          >
                            {seciliDosya?.sozlesmeYapilacakMi
                              ? "📜 Dosya Sözleşmeli (Otomatik Bağlı)"
                              : "📦 Dosyada Sözleşme Yok (Tahsil Edilmez)"}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block mt-0.5">
                          Dosyada sözleşme düzenlenmişse sözleşmeye ait damga
                          vergisi (‰ 9,48) otomatik olarak bağlanır ve tahsil
                          edilir; sözleşme yoksa tahsil edilmez.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Otomatik Yasal Kesinti Kartı */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                      <Calculator size={13} className="text-blue-500" />{" "}
                      Otomatik 5018 / BKMYBS Hesaplaması:
                    </span>
                    <div className="flex justify-between text-slate-500">
                      <span>KDV Matrahı (KDV Hariç):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(modalCalculations.matrah)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Hesaplanan KDV Tutarı:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(modalCalculations.kdvTutari)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Ödeme Emri Damga Vergisi (488 S.K. ‰ 9,48):</span>
                      <span className="font-mono font-bold">
                        -{formatCurrency(modalCalculations.odemeDamgaVergisi)}
                      </span>
                    </div>
                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span>
                        Sözleşme Damga Vergisi (488 S.K. ‰ 9,48):
                      </span>
                      <span className="font-mono font-bold">
                        {modalCalculations.sozlesmeDamgaVergisi > 0
                          ? `-${formatCurrency(modalCalculations.sozlesmeDamgaVergisi)}`
                          : "0,00 ₺ (Sözleşme Yok)"}
                      </span>
                    </div>
                    {modalCalculations.tevkifatTutari > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400">
                        <span>KDV Tevkifat Kesintisi:</span>
                        <span className="font-mono font-bold">
                          -{formatCurrency(modalCalculations.tevkifatTutari)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      <span>Net Ödenecek Hazine Tutarı:</span>
                      <span className="font-mono">
                        {formatCurrency(modalCalculations.netOdenecek)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ödeme Durumu
                      </label>
                      <select
                        value={formDurum}
                        onChange={(e) => setFormDurum(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="beklemede">
                          Ödeme Bekliyor / Tahakkukta
                        </option>
                        <option value="odendi">
                          Ödendi (İşlem Tamamlandı)
                        </option>
                        <option value="iptal">İptal / İade</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ödeme Yöntemi
                      </label>
                      <input
                        type="text"
                        value={formOdemeYontemi}
                        onChange={(e) => setFormOdemeYontemi(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mali Açıklama / Hak Ediş Notu
                    </label>
                    <textarea
                      rows={2}
                      value={formAciklama}
                      onChange={(e) => setFormAciklama(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Modal Sticky Footer */}
                <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSaving
                      ? "Kaydediliyor..."
                      : "Muayene Kabul & Faturayı Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
export default DosyalarVeFaturalariTab;
