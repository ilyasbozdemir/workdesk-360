import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  StageRule,
  StageEvaluationContext,
  evaluateStageRules,
  STAGE_TRANSITION_RULES
} from '@temin360/direct-procurement-core'
import { useAppEventListener } from '../../../../utils/appEvents'

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
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<StageEvaluationContext | null>(null)
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

  // Aktif dosyanın durumunu veritabanından topla
  const refreshGuards = useCallback(async () => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) {
      setContext(null)
      return
    }

    try {
      setLoading(true)

      // 1. Dosya Ana Kaydı
      const dosyaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, birim_id, kazanan_firma_id, firma_id, yaklasik_maliyet, hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [activeDosyaId]
      )
      const dosya = dosyaRes?.data?.[0] || null

      // 2. Kalemler
      const kalemRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, kalem_adi, miktar, birim FROM DATA_TeminKalem WHERE temin_dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [activeDosyaId]
      )
      const kalemler = kalemRes?.data || []

      // 3. İstekli Firmalar
      const firmaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, firma_id, teklif_toplami FROM DATA_TeminFirma WHERE dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [activeDosyaId]
      )
      const firmalar = firmaRes?.data || []

      // 4. Teklif Fiyatları
      const teklifRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT kalem_id, temin_firma_id, teklif_birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
        [activeDosyaId]
      )
      const teklifMap: Record<string, number> = {}
      if (Array.isArray(teklifRes?.data)) {
        teklifRes.data.forEach((r: any) => {
          if (r.kalem_id && r.temin_firma_id) {
            teklifMap[`${r.kalem_id}_${r.temin_firma_id}`] = Number(r.teklif_birim_fiyat) || 0
          }
        })
      }

      // 5. Belge Snapshot Kayıtları
      const snapRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_kodu FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [activeDosyaId]
      )
      const snapshots: string[] = Array.isArray(snapRes?.data)
        ? snapRes.data.map((s: any) => String(s.sablon_kodu || '').trim())
        : []

      const winnerId = dosya?.kazanan_firma_id || dosya?.firma_id || null

      setContext({
        dosyaId: activeDosyaId,
        dosya,
        kalemler,
        firmalar,
        teklifler: teklifMap,
        snapshots,
        kazananFirmaId: winnerId ? Number(winnerId) : null
      })
    } catch (err) {
      console.warn('[useStepGuards] Error refreshing guards:', err)
    } finally {
      setLoading(false)
    }
  }, [activeDosyaId])

  useEffect(() => {
    refreshGuards()
  }, [refreshGuards])

  // Olay dinleyicileri (Dosya, teklif, kalem veya belgeler değiştiğinde otomatik yenile)
  useAppEventListener(
    ['dossier:updated', 'bids:changed', 'items:changed', 'documents:changed'],
    () => {
      refreshGuards()
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
