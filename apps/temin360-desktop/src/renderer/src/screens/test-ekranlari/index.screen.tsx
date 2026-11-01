import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@renderer/store/workspaceStore";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  FileJson,
  FileText,
} from "lucide-react";

interface BelgeSnapshot {
  id: number;
  dosya_id: number;
  sablon_id: number | null;
  sablon_kodu: string;
  veri_json: string;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  is_active: number;
  is_deleted: number;
  sablon_versiyon: number;
}

function formatJson(value: unknown) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function formatSablonName(value: string) {
  return value
    ?.split("_")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

export default function TestEkranlariScreen({
  isSubComponent = false,
}: {
  isSubComponent?: boolean;
}): React.ReactNode {
  const [belgeler, setBelgeler] = useState<BelgeSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const { activeDosyaId } = useWorkspaceStore();

  useEffect(() => {
    if (!activeDosyaId) {
      setBelgeler([]);
      return;
    }

    let cancelled = false;

    const fetchBelgeler = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await window.electron.ipcRenderer.invoke(
          "db:query",
          `SELECT *
           FROM DATA_TeminBelgeSnapshot
           WHERE dosya_id = ?
             AND is_deleted = 0
           ORDER BY updated_at DESC`,
          [activeDosyaId],
        );

        if (cancelled) return;

        if (res.success && Array.isArray(res.data)) {
          setBelgeler(res.data);
        } else {
          setBelgeler([]);
          setError(res.error || "Snapshot kayıtları alınamadı.");
        }
      } catch (err: any) {
        if (cancelled) return;

        console.error(err);
        setBelgeler([]);
        setError(err.message || "Veritabanı sorgusu başarısız.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBelgeler();

    return () => {
      cancelled = true;
    };
  }, [activeDosyaId]);

  const toggleJson = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div
      className={isSubComponent
        ? "flex flex-col h-full space-y-6 w-full animate-in fade-in duration-200"
        : "p-8 max-w-[1600px] mx-auto flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full"}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Belge Snapshot Yönetimi
            </h2>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            Aktif dosyanın kayıtlı belge verileri
          </p>
        </div>

        <div className="rounded-lg border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Dosya ID:</span>
          <strong>{activeDosyaId ?? "-"}</strong>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FileText size={16} />
            Toplam Snapshot
          </div>
          <div className="text-2xl font-semibold mt-2">
            {belgeler.length}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Database size={16} />
            Aktif Kayıt
          </div>
          <div className="text-2xl font-semibold mt-2">
            {belgeler.filter((b) => b.is_active === 1).length}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar size={16} />
            Son Güncelleme
          </div>
          <div className="text-sm font-semibold mt-3">
            {belgeler[0]?.updated_at ?? "-"}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10 text-muted-foreground">
          Snapshot kayıtları yükleniyor...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && belgeler.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileJson className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Snapshot bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bu dosyaya ait kayıtlı belge verisi bulunmuyor.
          </p>
        </div>
      )}

      {/* Snapshot Cards */}
      <div className="space-y-4">
        {belgeler.map((belge) => {
          const expanded = expandedIds.includes(belge.id);

          return (
            <div
              key={belge.id}
              className="rounded-xl border bg-card overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileJson className="w-5 h-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {formatSablonName(belge.sablon_kodu)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {belge.sablon_kodu} · Snapshot #{belge.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs rounded-full px-2.5 py-1 bg-muted">
                    v{belge.sablon_versiyon}
                  </span>

                  <span
                    className={`text-xs rounded-full px-2.5 py-1 ${
                      belge.is_active === 1
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {belge.is_active === 1 ? "Aktif" : "Pasif"}
                  </span>

                  <button
                    onClick={() => toggleJson(belge.id)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    {expanded
                      ? <ChevronDown size={16} />
                      : <ChevronRight size={16} />}
                    {expanded ? "JSON'ı Gizle" : "JSON'ı Görüntüle"}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t bg-muted/20 px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Dosya ID</p>
                    <p className="font-medium mt-1">{belge.dosya_id}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Şablon ID</p>
                    <p className="font-medium mt-1">{belge.sablon_id}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Oluşturulma</p>
                    <p className="font-medium mt-1">{belge.created_at}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Son Güncelleme
                    </p>
                    <p className="font-medium mt-1">{belge.updated_at}</p>
                  </div>
                </div>
              </div>

              {/* JSON Content */}
              {expanded && (
                <div className="border-t">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileJson size={16} />
                      Snapshot JSON İçeriği
                    </div>

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          formatJson(belge.veri_json),
                        )}
                      className="text-xs rounded-md border px-3 py-1.5 hover:bg-muted transition-colors"
                    >
                      JSON Kopyala
                    </button>
                  </div>

                  <pre className="mx-4 mb-4 rounded-lg bg-[#111827] text-[#d1d5db] p-4 text-xs leading-6 overflow-auto max-h-[600px] whitespace-pre-wrap break-words">
                    {formatJson(belge.veri_json)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
