import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_NEW_FEATURES, NewFeatureItem } from '../config/newFeatures.config'

export interface FeatureStatus {
  isNew: boolean
  remainingDays: number
  elapsedDays: number
  effectiveDays: number
  feature?: NewFeatureItem
}

interface NewFeaturesState {
  /** Global rozet gösterim süresi (gün). 0 = Kapalı, 999 = Sınırsız */
  globalDaysActive: number

  /** Yanıp sönen/canlı nabız (ping/pulse) animasyonu açık mı? */
  showPulsingAnimation: boolean

  /** Rozet yanında veya hover'da sürüm etiketini (v1.0.0...) göster */
  showVersionTag: boolean

  /** Özellik listesi (özelleştirilebilir) */
  features: NewFeatureItem[]

  /** Kullanıcının 'Gördüm' diyerek gizlediği özellik id'leri */
  dismissedIds: string[]

  /** Genel gösterim gününü ayarlar */
  setGlobalDaysActive: (days: number) => void

  /** Animasyonu açar/kapatır */
  setShowPulsingAnimation: (show: boolean) => void

  /** Sürüm etiketini açar/kapatır */
  setShowVersionTag: (show: boolean) => void

  /** Belirli bir özelliği gizler */
  dismissFeature: (id: string) => void

  /** Belirli bir özelliği tekrar yeni duruma sıfırlar */
  resetFeature: (id: string) => void

  /** Tüm gizlenenleri sıfırlar ve varsayılan listeyi yükler */
  resetAllFeatures: () => void

  /** Özelliğe özel gün süresini günceller */
  updateFeatureDays: (id: string, days: number) => void

  /** Özelliğe özel sürüm veya tarihi günceller */
  updateFeatureMeta: (id: string, patch: Partial<NewFeatureItem>) => void

  /** Route veya ID üzerinden özelliğin yeni olup olmadığını hesaplar */
  getFeatureStatus: (routeOrId?: string | null) => FeatureStatus
}

export const useNewFeaturesStore = create<NewFeaturesState>()(
  persist(
    (set, get) => ({
      globalDaysActive: 30,
      showPulsingAnimation: true,
      showVersionTag: true,
      features: DEFAULT_NEW_FEATURES,
      dismissedIds: [],

      setGlobalDaysActive: (days: number) => {
        set({ globalDaysActive: Math.max(0, days) })
      },

      setShowPulsingAnimation: (show: boolean) => {
        set({ showPulsingAnimation: show })
      },

      setShowVersionTag: (show: boolean) => {
        set({ showVersionTag: show })
      },

      dismissFeature: (id: string) => {
        const { dismissedIds } = get()
        if (!dismissedIds.includes(id)) {
          set({ dismissedIds: [...dismissedIds, id] })
        }
      },

      resetFeature: (id: string) => {
        const { dismissedIds } = get()
        set({ dismissedIds: dismissedIds.filter((item) => item !== id) })
      },

      resetAllFeatures: () => {
        set({
          features: DEFAULT_NEW_FEATURES,
          dismissedIds: [],
          globalDaysActive: 30,
          showPulsingAnimation: true,
          showVersionTag: true
        })
      },

      updateFeatureDays: (id: string, days: number) => {
        set((state) => ({
          features: state.features.map((f) =>
            f.id === id ? { ...f, daysActive: Math.max(1, days) } : f
          )
        }))
      },

      updateFeatureMeta: (id: string, patch: Partial<NewFeatureItem>) => {
        set((state) => ({
          features: state.features.map((f) => (f.id === id ? { ...f, ...patch } : f))
        }))
      },

      getFeatureStatus: (routeOrId?: string | null): FeatureStatus => {
        if (!routeOrId) {
          return { isNew: false, remainingDays: 0, elapsedDays: 0, effectiveDays: 0 }
        }

        const state = get()
        if (state.globalDaysActive === 0) {
          return { isNew: false, remainingDays: 0, elapsedDays: 0, effectiveDays: 0 }
        }

        // Temiz rota eşlemesi: query stringleri temizle
        const cleanTarget = routeOrId.split('?')[0].trim()

        const feature = state.features.find(
          (f) =>
            f.id.toLowerCase() === routeOrId.toLowerCase() ||
            f.route.toLowerCase() === cleanTarget.toLowerCase() ||
            f.route.toLowerCase() === routeOrId.toLowerCase()
        )

        if (!feature) {
          return { isNew: false, remainingDays: 0, elapsedDays: 0, effectiveDays: 0 }
        }

        if (state.dismissedIds.includes(feature.id)) {
          return { isNew: false, remainingDays: 0, elapsedDays: 0, effectiveDays: 0, feature }
        }

        const effectiveDays = feature.daysActive ?? state.globalDaysActive

        // Sınırsız mod
        if (state.globalDaysActive >= 999) {
          return { isNew: true, remainingDays: 999, elapsedDays: 0, effectiveDays: 999, feature }
        }

        // Tarih farkı hesabı
        const releaseTime = new Date(feature.releaseDate).getTime()
        const now = new Date().getTime()
        const diffMs = now - releaseTime
        const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
        const remainingDays = effectiveDays - elapsedDays

        const isNew = remainingDays > 0

        return {
          isNew,
          remainingDays: Math.max(0, remainingDays),
          elapsedDays,
          effectiveDays,
          feature
        }
      }
    }),
    {
      name: 'temin360_new_features_settings',
      partialize: (state) => ({
        globalDaysActive: state.globalDaysActive,
        showPulsingAnimation: state.showPulsingAnimation,
        showVersionTag: state.showVersionTag,
        dismissedIds: state.dismissedIds,
        // Sadece güncellenen features'ı koruyalım, yeni versiyon çıkışında config ile senkron kalabilsin
        features: state.features
      })
    }
  )
)
