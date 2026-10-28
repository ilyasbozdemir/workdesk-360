import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { getMetrics, recordRequest } from "@/lib/metrics";
import fs from "fs";
import path from "path";

export async function GET() {
  const startTime = Date.now();
  try {
    const db = getDatabase();
    const dbPath = path.join(process.cwd(), "temin360_web.db");
    
    let fileSize = "0 KB";
    try {
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        fileSize = stats.size > 1024 * 1024 
          ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(stats.size / 1024).toFixed(1)} KB`;
      }
    } catch {
      fileSize = "N/A";
    }

    // Query tables and row counts dynamically from SQLite
    const tablesQuery = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tables = tablesQuery.map((t) => {
      let count = 0;
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as { count: number };
        count = row?.count || 0;
      } catch {
        count = 0;
      }

      // Turkish descriptions for well known ecosystem & procurement tables
      const descriptions: Record<string, string> = {
        dosyalar: "İhale ve doğrudan temin dosya kayıtları ve genel ayarları.",
        sablonlar: "Dosyalara bağlı dinamik evrak ve şablon snapshot verileri.",
        firmalar: "Piyasa fiyat araştırması yapılan yüklenici/davetli firmalar.",
        malzemeler: "Yaklaşık maliyet cetvelindeki malzeme ve hizmet kalemleri.",
        harcama_yetkilileri: "Yetkili harcama ve gerçekleştirme görevlisi tanımları.",
        settings: "Sistem, kurum bilgileri ve veritabanı şema ayarları.",
        audit_logs: "Sistemde gerçekleşen tüm veri işlem ve değişiklik kayıtları.",
        teklifler: "Firmalar tarafından verilen fiyat teklif dökümleri.",
        ecosystem_sync_records: "WorkDesk 360 çoklu uygulama (Temin, İhale, FlowDesk, Personel, Disk Analiz, Evraktron) bulut eşitleme kayıtları.",
        ecosystem_process_instances: "Şablon ve algoritma tabanlı mevzuat süreç kayıtları (3194 Kaçak Yapı, 2886 Devlet İhale, Kamulaştırma vb.).",
        sync_history: "Masaüstü istemcilerden gelen bulut senkronizasyon oturum geçmişi.",
        DATA_TeminDosyasi: "TEMİN 360 (4734 Md. 22) doğrudan temin ana dosya kayıtları.",
        DATA_IhaleDosyasi: "İHALE 360 (4734 Md. 19/21) açık ve pazarlık ihale dosyaları.",
        TANIM_Firma: "Kurumsal tedarikçi ve istekli firma sicil havuzu.",
        TANIM_Personel: "Kurum personeli, komisyon üyeleri ve harcama yetkilileri.",
        SYS_AuditLog: "Kriptografik hash zincirli (SHA-256) denetim izi kayıtları.",
      };

      return {
        name: t.name,
        records: count,
        desc: descriptions[t.name] || `${t.name} tablosu canlı veri kayıtları.`,
      };
    });

    // Schema version
    let schemaVersion = "1.0.0";
    try {
      const verRow = db.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string };
      if (verRow) schemaVersion = verRow.value;
    } catch {
      // ignore
    }

    const metrics = getMetrics();
    const duration = Date.now() - startTime;
    recordRequest("GET", "/api/stats", 200, duration);

    return NextResponse.json({
      success: true,
      database: {
        status: "connected",
        fileSize,
        schemaVersion,
        tableCount: tables.length,
        tables,
      },
      metrics: {
        totalRequests: metrics.totalRequests,
        avgResponseTime: metrics.avgDuration || Math.max(duration, 4),
        recentLogs: metrics.recentLogs,
      },
      server: {
        uptime: Math.floor(process.uptime()),
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Failed to fetch live stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

