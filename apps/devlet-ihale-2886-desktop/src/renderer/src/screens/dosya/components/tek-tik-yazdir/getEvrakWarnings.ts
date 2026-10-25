import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { getTemplateFieldMapping } from './ciktiWizardFieldMapping'
import { TEMPLATE_REGISTRY } from '@temin360/document-templates'

export interface EvrakWarning {
  type: 'muhatap' | 'workflow' | 'dagitim' | 'tarih' | 'info'
  severity: 'warning' | 'info'
  message: string
}

/**
 * Belge için engellemeyen (non-blocking) evrak kontrollerini çalıştırır.
 * getMissingRequirement'tan bağımsızdır; kullanıcı bu uyarılar olsa dahi yazdırmaya devam edebilir.
 */
export function getEvrakWarnings(sablon: Sablon, veri?: Record<string, unknown>): EvrakWarning[] {
  const warnings: EvrakWarning[] = []
  const templateId = (sablon.dosya_adi || '').replace(/\.html$/, '').trim()
  const mapping = getTemplateFieldMapping(templateId)
  const safeData = veri || {}

  // 1. Muhatap Alanı Kontrolü
  if (mapping.muhatapKey) {
    const muhatapVal = safeData[mapping.muhatapKey]
    if (!muhatapVal || String(muhatapVal).trim() === '') {
      warnings.push({
        type: 'muhatap',
        severity: 'warning',
        message: 'Muhatap / sunulacak makam bilgisi boş bırakılmış.'
      })
    }
  }

  // 2. Belge Tarihi Kontrolü
  if (mapping.tarihKey) {
    const tarihVal = safeData[mapping.tarihKey]
    if (!tarihVal || String(tarihVal).trim() === '') {
      warnings.push({
        type: 'tarih',
        severity: 'info',
        message: 'Belge tarihi belirtilmemiş (yazdırma anındaki geçerli tarih kullanılabilir).'
      })
    }
  }

  // 3. Dağıtım Listesi Kontrolü (Gereği ve Bilgi listesinde aynı kurum çakışması)
  if (mapping.dagitimKey) {
    const dagitimVal = safeData[mapping.dagitimKey]
    if (Array.isArray(dagitimVal)) {
      const names = dagitimVal
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            return String(obj.ad || obj.kurumAdi || '')
          }
          return ''
        })
        .filter(Boolean)
      const duplicate = names.find((name, idx) => names.indexOf(name) !== idx)
      if (duplicate) {
        warnings.push({
          type: 'dagitim',
          severity: 'warning',
          message: `Dağıtım listesinde mükerrer kurum/birim mevcut: "${duplicate}".`
        })
      }
    }
  }

  // 4. Registry Workflow Durumu Kontrolü (from_profile veya tanımsız rota)
  const regDef = TEMPLATE_REGISTRY.find((t) => t.id === templateId)
  if (regDef?.workflow) {
    if (regDef.workflow.explicitState === 'from_profile') {
      warnings.push({
        type: 'workflow',
        severity: 'info',
        message: 'İş akışı ve imza rotası varsayılan arketip profilden türetilmiştir.'
      })
    }
    if (regDef.workflow.routing?.mode === 'none') {
      warnings.push({
        type: 'workflow',
        severity: 'info',
        message: 'Bu belgenin hedef makam yönlendirmesi bulunmamaktadır.'
      })
    }
  }

  return warnings
}
