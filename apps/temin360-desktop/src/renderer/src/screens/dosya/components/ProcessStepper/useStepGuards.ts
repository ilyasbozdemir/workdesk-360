import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  StageRule,
  StageEvaluationContext,
  evaluateStageRules,
  STAGE_TRANSITION_RULES
} from '@temin360/direct-procurement-core'
import { useAppEventListener } from '../../../../utils/appEvents'
import { fetchCanonicalDossierPricing } from '../../../../services/dossier/dossierPriceSyncService'

export interface StepGuardState {
  loading: boolean
  context: StageEvaluationContext | null
  isStepUnlocked: (stepId: number) => boolean
  getMissingRules: (targetStepId: number) => StageRule[]
  getAllRulesStatus: (targetStepId: number) => Array<{ rule: StageRule; passed: boolean }>
  isStepCompleted: (stepId: number) => boolean
  bypassGuards: boolean
  setBypassGuards: (val: boolean) => void
  toggleBypassGuards: () => void
  refreshGuards: () => Promise<void>
}

const BYPASS_STORAGE_KEY = 'temin_bypass_stage_guards'

export function useStepGuards(activeDosyaId: number | null): StepGuardState {
  const queryClient = useQueryClient()
  const [bypassGuards, setBypassGuardsState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BYPASS_STORAGE_KEY) === 'true'
    }
    return false
  })

  const setBypassGuards = useCallback((val: boolean) => {
    setBypassGuardsState(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem(BYPASS_STORAGE_KEY, String(val))
    }
  }, [])

  const toggleBypassGuards = useCallback(() => {
    setBypassGuardsState((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(BYPASS_STORAGE_KEY, String(next))
      }
      return next
    })
  }, [])

  // Kanonik Servis ve Snapshot Verilerini TanStack Query ile Çek
  // Cascading render veya senkron setState uyarısını önler
  const {
    data: context = null,
    isLoading: loading,
    refetch
  } = useQuery<StageEvaluationContext | null>({
    queryKey: ['step_guards', activeDosyaId],
    queryFn: async () => {
      if (!activeDosyaId || !window.electron?.ipcRenderer) {
        return null
      }

      // 1. Kanonik Fiyatlandırma, İstekliler, Teklifler ve Kazanan
      const canonical = await fetchCanonicalDossierPricing(activeDosyaId)
      const dosya = canonical.dosya
      const kalemler = canonical.kalemler || []
      const firmalar = canonical.firmalar || []
      const teklifMap = canonical.bidsMap || {}

      // 2. Belge Snapshot Kayıtları
      const snapRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_kodu FROM DATA_TeminBelgeSnapshot WHERE (dosya_id = ? OR temin_dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL)',
        [activeDosyaId, activeDosyaId]
      )
      const snapshots: string[] = Array.isArray(snapRes?.data)
        ? snapRes.data.map((s: any) => String(s.sablon_kodu || '').trim())
        : []

      // Kazanan firma kimliğini belirle (Kanonik -> Dosya -> Firmalar)
      const winnerId =
        canonical.kazananFirma?.master_firma_id ||
        canonical.kazananFirma?.temin_firma_id ||
        canonical.kazananFirma?.id ||
        dosya?.kazanan_firma_id ||
        dosya?.firma_id ||
        (firmalar.length > 0
          ? firmalar.find((f: any) => Number(f.kazandi_mi || f.kazanan_mi) === 1)?.id || firmalar[0].id
          : null)

      return {
        dosyaId: activeDosyaId,
        dosya,
        kalemler,
        firmalar,
        teklifler: teklifMap,
        snapshots,
        kazananFirmaId: winnerId ? Number(winnerId) : null
      }
    },
    enabled: Boolean(activeDosyaId),
    staleTime: 5000
  })

  // Dışarıya açılan manuel tazeleme fonksiyonu
  const refreshGuards = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Olay dinleyicileri (Dosya, teklif, kalem veya belgeler değiştiğinde query'yi yenile)
  useAppEventListener(
    ['dossier:updated', 'bids:changed', 'items:changed', 'documents:changed'],
    () => {
      if (activeDosyaId) {
        queryClient.invalidateQueries({ queryKey: ['step_guards', activeDosyaId] })
      }
    }
  )

  // Hedef adıma geçiş için gereken kuralların durumunu döner
  const getAllRulesStatus = useCallback(
    (targetStepId: number): Array<{ rule: StageRule; passed: boolean }> => {
      if (!context) return []
      const evaluated = evaluateStageRules(targetStepId, context)
      return evaluated.allRules
    },
    [context]
  )

  // Hedef aşamaya geçişi engelleyen eksik zorunlu kurallar
  const getMissingRules = useCallback(
    (targetStepId: number): StageRule[] => {
      if (bypassGuards || !context) return []
      const evaluated = evaluateStageRules(targetStepId, context)
      return evaluated.missingRules
    },
    [bypassGuards, context]
  )

  // Bir aşama açık mı?
  const isStepUnlocked = useCallback(
    (stepId: number): boolean => {
      if (stepId <= 1) return true
      if (bypassGuards) return true
      if (!context) return true // Yüklenirken kilitleyip engelleme yapma

      const evaluated = evaluateStageRules(stepId, context)
      return evaluated.isUnlocked
    },
    [bypassGuards, context]
  )

  // Bir aşamanın kendi içindeki tüm zorunlu kuralları tamamlanmış mı?
  const isStepCompleted = useCallback(
    (stepId: number): boolean => {
      if (!context) return false
      const stepRules = STAGE_TRANSITION_RULES[stepId] || []
      const mandatoryRules = stepRules.filter((r) => r.isMandatory)
      if (mandatoryRules.length === 0) return true
      return mandatoryRules.every((r) => r.check(context))
    },
    [context]
  )

  return useMemo(
    () => ({
      loading,
      context,
      isStepUnlocked,
      getMissingRules,
      getAllRulesStatus,
      isStepCompleted,
      bypassGuards,
      setBypassGuards,
      toggleBypassGuards,
      refreshGuards
    }),
    [
      loading,
      context,
      isStepUnlocked,
      getMissingRules,
      getAllRulesStatus,
      isStepCompleted,
      bypassGuards,
      setBypassGuards,
      toggleBypassGuards,
      refreshGuards
    ]
  )
}
