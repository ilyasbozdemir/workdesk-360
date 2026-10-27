/**
 * Kurumsal Genel Amaçlı Dinamik Süreç Tanımları
 * 
 * Bu tanımlar herhangi bir mevzuata (2886 veya doğrudan temin gibi) bağlı olmayan,
 * tamamen kurum içi ihtiyaç, talep, onay ve görev yönetimi senaryolarını temsil eder.
 */

import { FlowDefinition, FormSchema, DocumentTemplateDefinition } from './flowdesk.js'

export const FORM_SCHEMA_KURUMSAL_TALEP: FormSchema = {
  id: 'form-kurumsal-talep',
  title: 'Kurum İçi Mal / Hizmet / İş Talep Formu',
  version: 1,
  fields: [
    {
      id: 'talep_basligi',
      label: 'Talep Başlığı / Konusu',
      type: 'text',
      required: true,
      order: 1,
      placeholder: 'Örn: Bilgi İşlem Sunucu Bakım Hizmeti Alımı'
    },
    {
      id: 'talep_eden_birim',
      label: 'Talep Eden Birim',
      type: 'text',
      required: true,
      order: 2,
      placeholder: 'Örn: Fen İşleri Dairesi Başkanlığı'
    },
    {
      id: 'ihtiyac_aciklamasi',
      label: 'İhtiyaç Gerekçesi ve Açıklama',
      type: 'textarea',
      required: true,
      order: 3
    },
    {
      id: 'tahmini_butce',
      label: 'Tahmini Bütçe (TL)',
      type: 'currency',
      required: false,
      order: 4
    },
    {
      id: 'oncelik',
      label: 'Öncelik Seviyesi',
      type: 'select',
      required: true,
      order: 5,
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Yüksek', value: 'high' },
        { label: 'Acil', value: 'urgent' }
      ]
    }
  ]
}

export const DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI: DocumentTemplateDefinition = {
  id: 'DOC-TALEP-01',
  title: 'Birim İhtiyaç ve Görevlendirme Onay Yazısı',
  category: 'onay_belgesi',
  version: 1,
  htmlContent: `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="text-align: center;">KURUM İÇİ TALEP VE ONAY FORMU</h2>
      <p><strong>Birim:</strong> {{talep_eden_birim}}</p>
      <p><strong>Konu:</strong> {{talep_basligi}}</p>
      <p><strong>Gerekçe:</strong> {{ihtiyac_aciklamasi}}</p>
      <p><strong>Tahmini Bütçe:</strong> {{tahmini_butce}} TL</p>
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div>Talep Eden Personel<br/>İmza</div>
        <div>Birim Amiri Onayı<br/>İmza</div>
      </div>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'talep_basligi', sourceType: 'step_data', sourceKey: 'talep_basligi' },
    { placeholder: 'talep_eden_birim', sourceType: 'step_data', sourceKey: 'talep_eden_birim' },
    { placeholder: 'ihtiyac_aciklamasi', sourceType: 'step_data', sourceKey: 'ihtiyac_aciklamasi' },
    { placeholder: 'tahmini_butce', sourceType: 'step_data', sourceKey: 'tahmini_butce', defaultValue: '0' }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const GENERIC_FLOW_DEFINITION: FlowDefinition = {
  schemaVersion: 1,
  id: 'flow-kurumsal-talep-yonetimi',
  name: 'Kurum İçi Talep ve Onay Süreci',
  version: 1,
  status: 'published',
  category: 'workflow',
  description: 'Birim taleplerinin oluşturulması, amir onayı, görev dağılımı ve sonuç belgesi üretim akışı.',
  groups: [
    {
      id: 'grup-talep',
      title: 'Talep ve Ön İnceleme',
      order: 1,
      steps: [
        {
          id: 'step-talep-formu',
          title: 'Talep Formunu Doldur',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-kurumsal-talep'
          }
        },
        {
          id: 'step-talep-belgesi',
          title: 'Talep ve Onay Yazısı Hazırla',
          type: 'document',
          order: 2,
          config: {
            templateId: 'DOC-TALEP-01'
          }
        },
        {
          id: 'step-amir-onayi',
          title: 'Şube Müdürü / Daire Başkanı Onayı',
          type: 'approval',
          order: 3,
          config: {
            approvalRoles: ['birim_amiri', 'daire_baskani']
          }
        }
      ]
    },
    {
      id: 'grup-yurutme',
      title: 'Görevlendirme ve Sonuçlandırma',
      order: 2,
      steps: [
        {
          id: 'step-gorev-atama',
          title: 'Uygulama ve İnceleme Görevi',
          type: 'task',
          order: 4,
          config: {
            assigneeType: 'unit',
            assigneeId: 'destek_hizmetleri'
          }
        }
      ]
    }
  ]
}
