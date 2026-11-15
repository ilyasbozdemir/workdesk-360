import type { DocumentStorageAdapter } from "@worksuite-360/document-engine";

/**
 * Electron masaüstü ortamı için IPC tabanlı Belge Depolama Adaptörü.
 * DocumentEngine'e enjekte edilir (IoC).
 */
export function createElectronStorageAdapter(): DocumentStorageAdapter {
  return {
    async getDocument({ dosyaId, templateKey }) {
      if (
        typeof window === "undefined" || !(window as any).electron?.ipcRenderer
      ) {
        return { success: false, error: "Electron ortamı bulunamadı" };
      }
      const ipc = (window as any).electron.ipcRenderer;
      const res = await ipc.invoke("belge:get-document", {
        dosyaId,
        templateKey,
      });
      if (res?.success && res.exists && res.record) {
        return {
          success: true,
          exists: true,
          record: {
            id: res.record.id,
            data: res.record.data,
            sablonVersiyon: res.record.sablonVersiyon,
            createdAt: res.record.createdAt,
            updatedAt: res.record.updatedAt,
          },
        };
      }
      if (res?.success === false) {
        return { success: false, error: res.error || "Belge yüklenemedi" };
      }
      return { success: true, exists: false };
    },

    async saveDocument({ dosyaId, templateKey, data, sablonVersiyon }) {
      if (
        typeof window === "undefined" || !(window as any).electron?.ipcRenderer
      ) {
        return { success: false, error: "Electron ortamı bulunamadı" };
      }
      const ipc = (window as any).electron.ipcRenderer;
      return await ipc.invoke("belge:save-document", {
        dosyaId,
        templateKey,
        data,
        sablonVersiyon,
      });
    },

    async resetDocument({ dosyaId, templateKey }) {
      if (
        typeof window === "undefined" || !(window as any).electron?.ipcRenderer
      ) {
        return { success: false, error: "Electron ortamı bulunamadı" };
      }
      const ipc = (window as any).electron.ipcRenderer;
      return await ipc.invoke("belge:reset-document", {
        dosyaId,
        templateKey,
      });
    },

    async deleteDocument({ dosyaId, templateKey }) {
      if (
        typeof window === "undefined" || !(window as any).electron?.ipcRenderer
      ) {
        return { success: false, error: "Electron ortamı bulunamadı" };
      }
      const ipc = (window as any).electron.ipcRenderer;
      return await ipc.invoke("belge:delete-document", {
        dosyaId,
        templateKey,
      });
    },

    async executeQuery(sql, params = []) {
      if (
        typeof window === "undefined" || !(window as any).electron?.ipcRenderer
      ) {
        throw new Error(
          "[ElectronStorageAdapter] Electron ortamı (window.electron.ipcRenderer) bulunamadı. Veritabanı sorgusu yürütülemez.",
        );
      }
      const ipc = (window as any).electron.ipcRenderer;

      // settings veya TANIM_Ayar tablosuna yönelik sorguları sqlGuard kısıtlamasına takılmadan
      // yetkili ve güvenli `db:get-settings` IPC işleyicisi üzerinden çözümle
      if (/\bFROM\s+(?:settings|TANIM_Ayar)\b/i.test(sql)) {
        try {
          const settingsObj = await ipc.invoke("db:get-settings");
          if (settingsObj && typeof settingsObj === "object") {
            return Object.entries(settingsObj).map(([key, value]) => ({
              key,
              value: typeof value === "string" ? value : JSON.stringify(value),
            }));
          }
        } catch {
          return [];
        }
      }

      const res = await ipc.invoke("db:query", sql, params);
      if (res && res.success === false) {
        throw new Error(res.error || "Sorgu başarısız");
      }
      return res && res.data ? res.data : Array.isArray(res) ? res : [];
    },
  };
}
