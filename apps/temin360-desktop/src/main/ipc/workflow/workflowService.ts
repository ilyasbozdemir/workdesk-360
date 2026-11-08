import crypto from 'node:crypto'
import { workspaceManager } from '../../database/workspace'
import {
  DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
  evaluateTransition,
  resolveNextActions,
  WorkflowContext,
  WorkflowInstance,
  WorkflowTask,
  WorkflowEvent,
  WorkflowNotification
} from '@workdesk-360/workflow-engine'

export class WorkflowService {
  /**
   * Aktif dosya için workflow instance kaydını getirir veya ilk kez açılıyorsa başlatır.
   */
  public static getOrCreateInstance(dosyaId: number): WorkflowInstance {
    const db = workspaceManager.getDb()

    const existing = db
      .prepare('SELECT * FROM WORKFLOW_Instance WHERE dosya_id = ?')
      .get(dosyaId) as any

    if (existing) {
      return {
        id: existing.id,
        dosyaId: existing.dosya_id,
        definitionId: existing.definition_id,
        definitionVersion: existing.definition_version,
        currentState: existing.current_state,
        status: existing.status,
        assignedUserId: existing.assigned_user_id,
        assignedUnitId: existing.assigned_unit_id,
        assignedRole: existing.assigned_role,
        lastActorId: existing.last_actor_id,
        returnReason: existing.return_reason,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at
      }
    }

    // Dosyayı oku ve mevcut aşamasına göre başlangıç durumunu belirle
    const dosya = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = ?').get(dosyaId) as any

    let initialState = 'PROCUREMENT_DRAFT'
    let initialRole = 'satin_alma'
    let initialStatus = 'IN_PROGRESS'

    if (dosya) {
      if (dosya.status === 'tamamlandi' || dosya.durum_asama_id === 5) {
        initialState = 'COMPLETED'
        initialStatus = 'COMPLETED'
      } else if (dosya.status === 'muhasebe') {
        initialState = 'ACCOUNTING_PAYMENT'
        initialRole = 'muhasebe'
      } else if (dosya.status === 'mali_hizmetler') {
        initialState = 'FINANCE_REVIEW'
        initialRole = 'mali_hizmetler'
      } else if (dosya.durum_asama_id === 4) {
        initialState = 'INSPECTION_ACCEPTANCE'
      } else if (dosya.durum_asama_id === 3) {
        initialState = 'ORDER_CONTRACT'
      } else if (dosya.durum_asama_id === 2) {
        initialState = 'MARKET_RESEARCH'
      }
    }

    const instanceId = 'wf_' + crypto.randomUUID()
    const now = new Date().toISOString()

    const insertTx = db.transaction(() => {
      db.prepare(
        `INSERT INTO WORKFLOW_Instance 
         (id, dosya_id, definition_id, definition_version, current_state, status, assigned_role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        instanceId,
        dosyaId,
        DIRECT_PROCUREMENT_WORKFLOW_DEFINITION.id,
        DIRECT_PROCUREMENT_WORKFLOW_DEFINITION.version,
        initialState,
        initialStatus,
        initialRole,
        now,
        now
      )

      // İlk tarihçe kaydı
      db.prepare(
        `INSERT INTO WORKFLOW_TransitionHistory 
         (instance_id, dosya_id, from_state, to_state, event_type, actor_id, actor_role, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        instanceId,
        dosyaId,
        'NONE',
        initialState,
        'WORKFLOW_INITIALIZED',
        'SYSTEM',
        'system',
        'Dosya süreç motoruna dahil edildi.',
        now
      )

      // İlk görev kaydı
      const taskId = 'tsk_' + crypto.randomUUID()
      db.prepare(
        `INSERT INTO WORKFLOW_Task 
         (id, instance_id, dosya_id, title, description, status, required_role, idempotency_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        taskId,
        instanceId,
        dosyaId,
        'Dosya Hazırlık ve İhtiyaç Tespiti',
        'İhtiyaç raporu, onay belgesi ve yaklaşık maliyet hazırlıklarını tamamlayınız.',
        'OPEN',
        initialRole,
        `init_${instanceId}`,
        now,
        now
      )
    })

    insertTx()

    return {
      id: instanceId,
      dosyaId,
      definitionId: DIRECT_PROCUREMENT_WORKFLOW_DEFINITION.id,
      definitionVersion: DIRECT_PROCUREMENT_WORKFLOW_DEFINITION.version,
      currentState: initialState,
      status: initialStatus as any,
      assignedRole: initialRole,
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Dosyanın veritabanındaki gerçek ilişkilerine göre kural değerlendirme context'ini oluşturur.
   */
  public static buildWorkflowContext(
    dosyaId: number,
    actorRole: string = 'satin_alma',
    actorId: string = 'CURRENT_USER'
  ): WorkflowContext {
    const db = workspaceManager.getDb()
    const instance = this.getOrCreateInstance(dosyaId)

    const dosya = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = ?').get(dosyaId) as any

    // Onay belgesi var mı?
    const onayBelgesi = db
      .prepare(
        `SELECT id FROM DATA_TeminBelge 
         WHERE dosya_id = ? AND (belge_turu LIKE '%ONAY%' OR kod LIKE '%ONAY%')
         LIMIT 1`
      )
      .get(dosyaId)

    // İhtiyaç raporu var mı?
    const ihtiyacRaporu = db
      .prepare('SELECT id FROM DATA_IhtiyacRaporu WHERE temin_dosya_id = ? LIMIT 1')
      .get(dosyaId)

    const hasOnayBelgesi = Boolean(onayBelgesi || ihtiyacRaporu || (dosya && dosya.onay_tarihi))

    // Teklif sayısı ve kazanan firma
    const teklifCountRow = db
      .prepare('SELECT COUNT(*) as count FROM DATA_TeminFirma WHERE dosya_id = ?')
      .get(dosyaId) as any
    const teklifSayisi = Number(teklifCountRow?.count) || 0

    let kazananFirmaId = dosya?.firma_id || undefined
    let kazananFirmaUnvan = undefined
    if (kazananFirmaId) {
      const fRow = db.prepare('SELECT unvan FROM TANIM_Firma WHERE id = ?').get(kazananFirmaId) as any
      kazananFirmaUnvan = fRow?.unvan
    }

    // Muayene kabul tutanağı var mı?
    const muayeneBelge = db
      .prepare(
        `SELECT id FROM DATA_TeminBelge 
         WHERE dosya_id = ? AND (belge_turu LIKE '%MUAYENE%' OR kod LIKE '%KABUL%' OR belge_turu LIKE '%KABUL%')
         LIMIT 1`
      )
      .get(dosyaId)
    const hasMuayeneKabul = Boolean(muayeneBelge || (dosya && dosya.durum_asama_id >= 4))

    // Fatura bilgisi var mı?
    const hasFatura = Boolean(
      (dosya?.fatura_no && String(dosya.fatura_no).trim().length > 0) ||
      (dosya?.fatura_tarihi && String(dosya.fatura_tarihi).trim().length > 0)
    )

    return {
      dosyaId,
      dosyaNo: dosya?.temin_no || `DT-${dosyaId}`,
      konu: dosya?.konu || '',
      tur: dosya?.tur || 'mal',
      yaklasikMaliyet: Number(dosya?.yaklasik_maliyet) || 0,
      netTutar: Number(dosya?.net_odenen) || 0,
      butceTertibi: dosya?.butce_kodu || dosya?.odenek_kalemi || '03.2.1.01',
      hasOnayBelgesi,
      hasPiyasaArastirmasi: teklifSayisi > 0,
      teklifSayisi,
      kazananFirmaId,
      kazananFirmaUnvan,
      hasSiparisMektubu: Boolean(dosya?.durum_asama_id >= 3),
      hasMuayeneKabul,
      hasFatura,
      faturaNo: dosya?.fatura_no,
      currentState: instance.currentState,
      actorId,
      actorRole
    }
  }

  /**
   * Mevcut duruma göre yapılabilecek geçişler ve kuralları döner.
   */
  public static async getAvailableActions(dosyaId: number, actorRole: string, actorId?: string) {
    const context = this.buildWorkflowContext(dosyaId, actorRole, actorId)
    return await resolveNextActions(DIRECT_PROCUREMENT_WORKFLOW_DEFINITION, context)
  }

  /**
   * Süreç durum geçişini transaction içinde çalıştırır.
   */
  public static async executeTransition(
    dosyaId: number,
    transitionId: string,
    actorRole: string,
    actorId: string = 'CURRENT_USER',
    payload?: { reason?: string; faturaNo?: string; faturaTarihi?: string }
  ) {
    const db = workspaceManager.getDb()
    const context = this.buildWorkflowContext(dosyaId, actorRole, actorId)

    // 1. Kural & Geçiş Değerlendirmesi
    const evaluation = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      transitionId,
      context
    )

    if (!evaluation.canTransition || !evaluation.transition) {
      throw new Error(
        `Geçiş engellendi: ${evaluation.blockingReasons.join('; ')}`
      )
    }

    const transition = evaluation.transition
    const fromState = context.currentState
    const toState = transition.toState
    const instance = this.getOrCreateInstance(dosyaId)
    const now = new Date().toISOString()
    const targetStatus = toState === 'COMPLETED' ? 'COMPLETED' : toState === 'RETURNED' ? 'RETURNED' : 'IN_PROGRESS'

    // 2. Transaction İçerisinde Bütüncül Güncelleme
    const executeTx = db.transaction(() => {
      // Instance güncelle
      db.prepare(
        `UPDATE WORKFLOW_Instance 
         SET current_state = ?, status = ?, assigned_role = ?, last_actor_id = ?, return_reason = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        toState,
        targetStatus,
        transition.targetAssigneeRole || actorRole,
        actorId,
        payload?.reason || null,
        now,
        instance.id
      )

      // Tarihçe kaydı
      db.prepare(
        `INSERT INTO WORKFLOW_TransitionHistory 
         (instance_id, dosya_id, from_state, to_state, event_type, actor_id, actor_role, reason, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        instance.id,
        dosyaId,
        fromState,
        toState,
        transition.actionName,
        actorId,
        actorRole,
        payload?.reason || null,
        JSON.stringify(payload || {}),
        now
      )

      // Kural değerlendirme logları
      if (evaluation.ruleSummary.allResults.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO WORKFLOW_RuleEvaluation 
           (instance_id, rule_id, category, passed, severity, message, details_json, evaluated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        for (const r of evaluation.ruleSummary.allResults) {
          stmt.run(
            instance.id,
            r.ruleId,
            r.category,
            r.passed ? 1 : 0,
            r.severity,
            r.message,
            JSON.stringify(r),
            now
          )
        }
      }

      // Önceki açık görevleri tamamla
      db.prepare(
        `UPDATE WORKFLOW_Task 
         SET status = 'COMPLETED', completed_at = ?, completed_by = ? 
         WHERE instance_id = ? AND status = 'OPEN'`
      ).run(now, actorId, instance.id)

      // Yeni görev oluştur (Varsa)
      if (transition.createsTask) {
        const taskId = 'tsk_' + crypto.randomUUID()
        const idempotencyKey = `${instance.id}_${toState}_${transition.id}`
        db.prepare(
          `INSERT OR IGNORE INTO WORKFLOW_Task 
           (id, instance_id, dosya_id, title, description, status, required_role, idempotency_key, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          taskId,
          instance.id,
          dosyaId,
          transition.createsTask.title,
          transition.createsTask.description || null,
          'OPEN',
          transition.createsTask.requiredRole || transition.targetAssigneeRole,
          idempotencyKey,
          now,
          now
        )
      }

      // Bildirim & Outbox oluştur
      if (transition.generatesNotification) {
        const notifConfig = transition.generatesNotification
        const title = notifConfig.title
        const message = notifConfig.template
          .replace('{dosyaNo}', context.dosyaNo || `DT-${dosyaId}`)
          .replace('{reason}', payload?.reason || '')

        const notifId = 'notif_' + crypto.randomUUID()

        // In-App bildirim
        db.prepare(
          `INSERT INTO WORKFLOW_Notification 
           (id, dosya_id, user_id, title, message, type, channel, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'IN_APP', ?)`
        ).run(
          notifId,
          dosyaId,
          transition.targetAssigneeRole,
          title,
          message,
          notifConfig.type,
          now
        )

        // Email Outbox
        if (notifConfig.notifyChannels.includes('EMAIL')) {
          const outboxId = 'outbox_' + crypto.randomUUID()
          db.prepare(
            `INSERT OR IGNORE INTO WORKFLOW_NotificationOutbox 
             (id, channel, recipient, payload_json, status, idempotency_key, created_at)
             VALUES (?, 'EMAIL', ?, ?, 'PENDING', ?, ?)`
          ).run(
            outboxId,
            transition.targetAssigneeRole || 'finance-department',
            JSON.stringify({ title, message, dosyaId, dosyaNo: context.dosyaNo }),
            `outbox_${instance.id}_${transition.id}_${now}`,
            now
          )
        }
      }

      // DATA_TeminDosyasi senkronizasyonu
      let newDosyaStatus: string | null = null
      let newAsamaId: number | null = null

      if (toState === 'FINANCE_REVIEW') {
        newDosyaStatus = 'mali_hizmetler'
        newAsamaId = 4
      } else if (toState === 'ACCOUNTING_PAYMENT') {
        newDosyaStatus = 'muhasebe'
        newAsamaId = 4
      } else if (toState === 'COMPLETED') {
        newDosyaStatus = 'tamamlandi'
        newAsamaId = 5
      } else if (toState === 'RETURNED') {
        newDosyaStatus = 'iade'
      } else if (toState === 'MARKET_RESEARCH') {
        newAsamaId = 2
      } else if (toState === 'ORDER_CONTRACT') {
        newAsamaId = 3
      } else if (toState === 'INSPECTION_ACCEPTANCE') {
        newAsamaId = 4
      }

      if (newDosyaStatus || newAsamaId || payload?.faturaNo) {
        let updateSql = 'UPDATE DATA_TeminDosyasi SET updated_at = CURRENT_TIMESTAMP'
        const params: any[] = []

        if (newDosyaStatus) {
          updateSql += ', status = ?'
          params.push(newDosyaStatus)
        }
        if (newAsamaId) {
          updateSql += ', durum_asama_id = ?'
          params.push(newAsamaId)
        }
        if (payload?.faturaNo) {
          updateSql += ', fatura_no = ?'
          params.push(payload.faturaNo)
        }
        if (payload?.faturaTarihi) {
          updateSql += ', fatura_tarihi = ?'
          params.push(payload.faturaTarihi)
        }

        updateSql += ' WHERE id = ?'
        params.push(dosyaId)
        db.prepare(updateSql).run(...params)
      }
    })

    executeTx()

    return {
      success: true,
      instance: this.getOrCreateInstance(dosyaId),
      transition
    }
  }

  /**
   * Dosya süreç geçmişi (Transition history).
   */
  public static getWorkflowHistory(dosyaId: number): WorkflowEvent[] {
    const db = workspaceManager.getDb()
    return db
      .prepare(
        `SELECT 
           id, 
           instance_id as instanceId, 
           dosya_id as dosyaId, 
           event_type as eventType, 
           from_state as fromState, 
           to_state as toState, 
           actor_id as actorId, 
           actor_role as actorRole, 
           reason, 
           metadata_json as metadataJson, 
           created_at as timestamp
         FROM WORKFLOW_TransitionHistory 
         WHERE dosya_id = ? 
         ORDER BY id ASC`
      )
      .all(dosyaId) as WorkflowEvent[]
  }

  /**
   * Görevleri listele.
   */
  public static getTasks(filter?: { dosyaId?: number; role?: string; status?: string }): WorkflowTask[] {
    const db = workspaceManager.getDb()
    let sql = `
      SELECT 
        id, 
        instance_id as instanceId, 
        dosya_id as dosyaId, 
        title, 
        description, 
        status, 
        assigned_user_id as assignedUserId, 
        assigned_unit_id as assignedUnitId, 
        required_role as requiredRole, 
        due_at as dueAt, 
        created_at as createdAt, 
        completed_at as completedAt, 
        completed_by as completedBy, 
        return_reason as returnReason, 
        idempotency_key as idempotencyKey
      FROM WORKFLOW_Task
      WHERE 1=1
    `
    const params: any[] = []

    if (filter?.dosyaId) {
      sql += ' AND dosya_id = ?'
      params.push(filter.dosyaId)
    }
    if (filter?.role) {
      sql += ' AND (required_role = ? OR required_role IS NULL)'
      params.push(filter.role)
    }
    if (filter?.status) {
      sql += ' AND status = ?'
      params.push(filter.status)
    }

    sql += ' ORDER BY created_at DESC'
    return db.prepare(sql).all(...params) as WorkflowTask[]
  }

  /**
   * Bildirimleri listele.
   */
  public static getNotifications(unreadOnly: boolean = false): WorkflowNotification[] {
    const db = workspaceManager.getDb()
    let sql = `
      SELECT 
        id, 
        task_id as taskId, 
        dosya_id as dosyaId, 
        user_id as userId, 
        title, 
        message, 
        type, 
        channel, 
        read_at as readAt, 
        created_at as createdAt
      FROM WORKFLOW_Notification
      WHERE 1=1
    `
    if (unreadOnly) {
      sql += ' AND read_at IS NULL'
    }
    sql += ' ORDER BY created_at DESC LIMIT 50'
    return db.prepare(sql).all() as WorkflowNotification[]
  }

  /**
   * Bildirimi okundu olarak işaretle.
   */
  public static markNotificationRead(notificationId: string): void {
    const db = workspaceManager.getDb()
    db.prepare("UPDATE WORKFLOW_Notification SET read_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      notificationId
    )
  }

  /**
   * Tüm bildirimleri okundu olarak işaretle.
   */
  public static markAllNotificationsRead(): void {
    const db = workspaceManager.getDb()
    db.prepare("UPDATE WORKFLOW_Notification SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL").run()
  }
}
