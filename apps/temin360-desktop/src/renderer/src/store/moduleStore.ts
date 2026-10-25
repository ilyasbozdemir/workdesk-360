import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleTrashItem } from '../screens/modul-magazasi/modulMagazasi.types'
import { emitAppEvent } from '../utils/appEvents'
import { IS_DT_EDITION, isModuleAllowedInEdition } from '../../../shared/edition'

/**
 * Kullanıcının Modül & Belge Mağazası'ndan kurduğu paketleri ve
 * silinen/çöp kutusuna (soft delete) alınan paketleri tutar (localStorage kalıcı).
 */
interface ModuleStoreState {
  /** Kurulu paketlerin ModulPaketi.id listesi */
  installedIds: string[]

  /** Çöp kutusundaki modüller (id -> ModuleTrashItem) */
  trashedModules: Record<string, ModuleTrashItem>

  /** Varsayılan saklama süresi (gün) */
  defaultRetentionDays: number

  /** Paket kurulu mu? */
  isInstalled: (id: string) => boolean

  /** Paket çöp kutusunda mı bekliyor? */
  isTrashed: (id: string) => boolean

  /** Çöp kutusundaki paketin kalan gün sayısını döner */
  getRemainingTrashDays: (id: string) => number

  /** Paketi kurar; çöp kutusunda ise oradan da çıkarır */
  installModule: (id: string) => void

  /**
   * Paketi doğrudan kaldırmak yerine ÇÖP KUTUSUNA (soft delete) taşır.
   * Belirtilen gün (varsayılan: 30 gün) boyunca ayarlar ve şablonlar saklanır.
   */
  trashModule: (id: string, retentionDays?: number) => void

  /** Çöp kutusundaki paketi geri yükler */
  restoreModule: (id: string) => void

  /** Paketi hem kurulu listesinden hem çöp kutusundan kalıcı olarak siler */
  permanentlyDeleteModule: (id: string) => void

  /** Geriye dönük uyumluluk için eski uninstallModule -> trashModule yönlendirir */
  uninstallModule: (id: string) => void

  /** Kuruluysa çöpe taşır, değilse kurar */
  toggleInstall: (id: string) => void

  /** Süresi dolan çöp kutusu modüllerini temizler */
  purgeExpired: () => void
}

const DEFAULT_RETENTION_DAYS = 30

export const useModuleStore = create<ModuleStoreState>()(
  persist(
    (set, get) => ({
      installedIds: IS_DT_EDITION
        ? ['kik-dogrudan-temin-22d']
        : ['kik-dogrudan-temin-22d', 'modul-personel-izin'],
      trashedModules: {},
      defaultRetentionDays: DEFAULT_RETENTION_DAYS,

      isInstalled: (id: string) => isModuleAllowedInEdition(id) && get().installedIds.includes(id),

      isTrashed: (id: string) => {
        const item = get().trashedModules[id]
        if (!item) return false
        const now = new Date().getTime()
        const expires = new Date(item.expiresAt).getTime()
        return expires > now
      },

      getRemainingTrashDays: (id: string) => {
        const item = get().trashedModules[id]
        if (!item) return 0
        const now = new Date().getTime()
        const expires = new Date(item.expiresAt).getTime()
        const diffMs = expires - now
        if (diffMs <= 0) return 0
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      },

      installModule: (id: string) => {
        if (!isModuleAllowedInEdition(id)) return
        set((state) => {
          const nextTrashed = { ...state.trashedModules }
          delete nextTrashed[id]
          return {
            installedIds: state.installedIds.includes(id)
              ? state.installedIds
              : [...state.installedIds, id],
            trashedModules: nextTrashed
          }
        })
        emitAppEvent('module:installed', { moduleId: id })
      },

      trashModule: (id: string, customRetentionDays?: number) => {
        const days = customRetentionDays || get().defaultRetentionDays || DEFAULT_RETENTION_DAYS
        set((state) => {
          const trashedAtDate = new Date()
          const expiresAtDate = new Date(trashedAtDate.getTime() + days * 24 * 60 * 60 * 1000)

          const trashItem: ModuleTrashItem = {
            id,
            trashedAt: trashedAtDate.toISOString(),
            expiresAt: expiresAtDate.toISOString(),
            retentionDays: days
          }

          return {
            installedIds: state.installedIds.filter((item) => item !== id),
            trashedModules: {
              ...state.trashedModules,
              [id]: trashItem
            }
          }
        })
        emitAppEvent('module:trashed', { moduleId: id, retentionDays: days })
      },

      restoreModule: (id: string) => {
        set((state) => {
          const nextTrashed = { ...state.trashedModules }
          delete nextTrashed[id]
          return {
            installedIds: state.installedIds.includes(id)
              ? state.installedIds
              : [...state.installedIds, id],
            trashedModules: nextTrashed
          }
        })
        emitAppEvent('module:restored', { moduleId: id })
      },

      permanentlyDeleteModule: (id: string) => {
        set((state) => {
          const nextTrashed = { ...state.trashedModules }
          delete nextTrashed[id]
          return {
            installedIds: state.installedIds.filter((item) => item !== id),
            trashedModules: nextTrashed
          }
        })
        emitAppEvent('module:uninstalled', { moduleId: id })
      },

      // Eski kodlar uninstallModule çağırırsa güvenle trashModule çalıştırır
      uninstallModule: (id: string) => {
        get().trashModule(id)
      },

      toggleInstall: (id: string) => {
        const { installedIds, isTrashed } = get()
        if (installedIds.includes(id)) {
          get().trashModule(id)
        } else if (isTrashed(id)) {
          get().restoreModule(id)
        } else {
          get().installModule(id)
        }
      },

      purgeExpired: () =>
        set((state) => {
          const now = new Date().getTime()
          const nextTrashed: Record<string, ModuleTrashItem> = {}
          for (const [key, val] of Object.entries(state.trashedModules)) {
            if (new Date(val.expiresAt).getTime() > now) {
              nextTrashed[key] = val
            }
          }
          return { trashedModules: nextTrashed }
        })
    }),
    {
      name: 'temin360_installed_modules_v4'
    }
  )
)
