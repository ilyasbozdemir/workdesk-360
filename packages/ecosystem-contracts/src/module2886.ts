/**
 * 2886 Devlet İhale Kanunu Modülü Tanımı
 * 
 * Bu dosya, daha önce devlet-ihale-2886-desktop olarak geliştirilen işlevleri
 * FlowDesk üzerinde çalışabilen doğrulanmış bir modül sözleşmesine dönüştürür.
 * 
 * Kapsam:
 * 1. Aşama: Başlangıç ve Yetki Evrakları (Başkanlık Oluru, Encümen Yetki Kararı)
 * 2. Aşama: Kıymet Takdiri & Muhammen Bedel (Kıymet Takdir Komisyonu, Emsal Araştırması)
 * 3. Aşama: Şartname, İhale Kararı & İlan Süreci (İdari Şartname, Askı Tutanakları)
 * 4. Aşama: İhale Günü, Açık Artırma & Encümen Kararı (Teklif Zarfları, Artırma, Karar)
 * 5. Aşama: İta Amiri Onayı, Tebligat, Sözleşme & Tahsilat Takibi
 */

import { FlowDefinition, FlowdeskModuleManifest, FormSchema, DocumentTemplateDefinition } from './flowdesk.js'

export const FLOW_DEFINITION_2886: FlowDefinition = {
  schemaVersion: 1,
  id: 'flow-2886-tasinmaz-ihale',
  name: '2886 Sayılı Kanun Taşınmaz İhale Süreci',
  version: 1,
  status: 'published',
  category: 'procurement',
  moduleId: 'module-devlet-ihale-2886',
  description: '2886 Sayılı Devlet İhale Kanunu uyarınca taşınmaz kiralama, satış ve trampa süreçlerinin 5 aşamalı iş akışı.',
  groups: [
    {
      id: 'asama-1-baslangic',
      title: '1. Aşama: Başlangıç ve Yetki Evrakları',
      order: 1,
      description: 'İhale dosyasının açılması, taşınmaz bilgilerinin girilmesi ve onay belgesi üretimi.',
      steps: [
        {
          id: 'step-tasinmaz-bilgileri',
          title: 'Taşınmaz ve Talep Bilgilerini Gir',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-2886-tasinmaz-girisi'
          }
        },
        {
          id: 'step-baskanlik-oluru-belge',
          title: 'Başkanlık Makamı Onay Belgesi Hazırla (2886-EVR-01)',
          type: 'document',
          order: 2,
          config: {
            templateId: '2886-EVR-01'
          }
        },
        {
          id: 'step-encumen-yetki-onay',
          title: 'Encümen İhale Yetki Kararı',
          type: 'approval',
          order: 3,
          config: {
            approvalRoles: ['encumen_uyesi', 'belediye_baskani']
          }
        }
      ]
    },
    {
      id: 'asama-2-kiymet-takdiri',
      title: '2. Aşama: Kıymet Takdiri & Muhammen Bedel',
      order: 2,
      description: 'Md. 13 uyarınca Kıymet Takdir Komisyonu teşkili, emsal fiyat araştırması ve muhammen bedel tespiti.',
      steps: [
        {
          id: 'step-komisyon-atamasi',
          title: 'Kıymet Takdir Komisyonu Üyelerini Seç',
          type: 'task',
          order: 1,
          config: {
            assigneeType: 'unit',
            assigneeId: 'emlak-istimlak'
          }
        },
        {
          id: 'step-emsal-rayic-formu',
          title: 'Emsal ve Rayiç Fiyat Bilgileri',
          type: 'form',
          order: 2,
          config: {
            formSchemaId: 'form-2886-kiymet-takdiri'
          }
        },
        {
          id: 'step-kiymet-takdir-belge',
          title: 'Kıymet Takdir Tutanağı ve Kararı (2886-EVR-05)',
          type: 'document',
          order: 3,
          config: {
            templateId: '2886-EVR-05'
          }
        }
      ]
    },
    {
      id: 'asama-3-sartname-ilan',
      title: '3. Aşama: Şartname, İhale Kararı & İlan Süreci',
      order: 3,
      description: 'İdari şartname hazırlığı, ilan metinleri ve askıya çıkarma/indirme tutanakları.',
      steps: [
        {
          id: 'step-sartname-parametreleri',
          title: 'Şartname Parametreleri ve İhale Usulü Seçimi (Md. 35/a, 45, 51)',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-2886-sartname-secimi'
          }
        },
        {
          id: 'step-sartname-belge',
          title: 'İdari Şartname ve Tip Sözleşme Metni (2886-EVR-06)',
          type: 'document',
          order: 2,
          config: {
            templateId: '2886-EVR-06'
          }
        },
        {
          id: 'step-ilan-askiya-alma',
          title: 'İlan ve Askı Tutanağı Onayı',
          type: 'approval',
          order: 3,
          config: {
            approvalRoles: ['yazi_isleri_muduru']
          }
        }
      ]
    },
    {
      id: 'asama-4-ihale-gunu',
      title: '4. Aşama: İhale Günü, Açık Artırma & Encümen Kararı',
      order: 4,
      description: 'Teklif zarflarının açılması, açık artırma turları, pey sürme ve komisyon nihai kararı.',
      steps: [
        {
          id: 'step-teklif-zarflari',
          title: 'İsteklilerin ve Teklif Zarflarının Kaydı',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-2886-teklifler'
          }
        },
        {
          id: 'step-artirma-turlari',
          title: 'Açık Artırma Pey Sürme Turları ve İhale Cetveli',
          type: 'action',
          order: 2,
          config: {
            actionName: 'action_2886_artirma_hesapla'
          }
        },
        {
          id: 'step-encumen-ihale-karari-belge',
          title: 'Encümen İhale Kararı (2886-EVR-12)',
          type: 'document',
          order: 3,
          config: {
            templateId: '2886-EVR-12'
          }
        }
      ]
    },
    {
      id: 'asama-5-onay-sozlesme',
      title: '5. Aşama: İta Amiri Onayı, Tebligat & Sözleşme',
      order: 5,
      description: 'İta amiri onayı, kesin teminat yatırılması, sözleşme imzalanması ve kira/tahsilat takvimi.',
      steps: [
        {
          id: 'step-ita-amiri-onayi',
          title: 'İta Amiri (Belediye Başkanı) Nihai Karar Onayı',
          type: 'approval',
          order: 1,
          config: {
            approvalRoles: ['ita_amiri']
          }
        },
        {
          id: 'step-sozlesme-ve-tebligat-belge',
          title: 'Kesinleşen İhale Kararı Tebligatı ve Sözleşme (2886-EVR-14)',
          type: 'document',
          order: 2,
          config: {
            templateId: '2886-EVR-14'
          }
        },
        {
          id: 'step-tahsilat-takvimi',
          title: 'Kira ve Taksit Takvimi Oluşturma',
          type: 'action',
          order: 3,
          config: {
            actionName: 'action_2886_tahsilat_plani_uret'
          }
        }
      ]
    }
  ]
}

export const FORM_SCHEMAS_2886: FormSchema[] = [
  {
    id: 'form-2886-tasinmaz-girisi',
    title: 'Taşınmaz ve İhale Başlangıç Formu',
    version: 1,
    description: 'İhaleye konu taşınmazın tapu ve nitelik bilgileri.',
    fields: [
      {
        id: 'tasinmaz_adi',
        label: 'Taşınmaz Tanımı / Adı',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'ada_parsel',
        label: 'Ada / Parsel Bilgisi',
        type: 'text',
        required: true,
        order: 2
      },
      {
        id: 'yuzolcumu',
        label: 'Yüzölçümü (m²)',
        type: 'number',
        required: true,
        order: 3
      },
      {
        id: 'islem_turu',
        label: 'İşlem Türü',
        type: 'select',
        required: true,
        order: 4,
        options: [
          { label: 'Kiralama', value: 'kiralama' },
          { label: 'Satış', value: 'satis' },
          { label: 'Trampa', value: 'trampa' },
          { label: 'İrtifak Hakkı', value: 'irtifak' }
        ]
      },
      {
        id: 'tahmini_bedel',
        label: 'Tahmini Muhammen Bedel (TL)',
        type: 'currency',
        required: true,
        order: 5
      }
    ]
  },
  {
    id: 'form-2886-kiymet-takdiri',
    title: 'Kıymet Takdiri ve Emsal Fiyat Formu',
    version: 1,
    fields: [
      {
        id: 'komisyon_baskani',
        label: 'Komisyon Başkanı',
        type: 'text',
        required: true,
        order: 1
      },
      {
        id: 'emsal_rayic_aciklama',
        label: 'Emsal Araştırması ve Gerekçe',
        type: 'textarea',
        required: true,
        order: 2
      },
      {
        id: 'kesin_muhammen_bedel',
        label: 'Takdir Edilen Kesin Muhammen Bedel (TL)',
        type: 'currency',
        required: true,
        order: 3
      },
      {
        id: 'gecici_teminat_orani',
        label: 'Geçici Teminat Oranı (%)',
        type: 'number',
        required: true,
        defaultValue: 3,
        order: 4
      }
    ]
  }
]

export const DOCUMENT_TEMPLATES_2886: DocumentTemplateDefinition[] = [
  {
    id: '2886-EVR-01',
    title: 'Başkanlık Makamı Onay Belgesi',
    category: 'ihale_onay',
    version: 1,
    supportedOutputs: ['html', 'pdf'],
    fieldMappings: [
      { placeholder: 'kurum_adi', sourceType: 'system', sourceKey: 'organizationName' },
      { placeholder: 'sayi_no', sourceType: 'step_data', sourceKey: 'sayiNo' },
      { placeholder: 'tarih', sourceType: 'step_data', sourceKey: 'tarih' },
      { placeholder: 'tasinmaz_adi', sourceType: 'step_data', sourceKey: 'tasinmaz_adi' },
      { placeholder: 'ada_parsel', sourceType: 'step_data', sourceKey: 'ada_parsel' },
      { placeholder: 'yuzolcumu', sourceType: 'step_data', sourceKey: 'yuzolcumu' },
      { placeholder: 'muhammen_bedel', sourceType: 'step_data', sourceKey: 'tahmini_bedel' },
      { placeholder: 'gecici_teminat', sourceType: 'step_data', sourceKey: 'gecici_teminat' }
    ],
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">T.C.</h3>
    <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase;">{{kurum_adi}}</h3>
    <h4 style="margin: 5px 0 0 0; font-size: 11pt;">Emlak ve İstimlak Müdürlüğü</h4>
  </div>
  <div style="text-align: center; margin: 30px 0; font-weight: bold; font-size: 12pt;">
    BAŞKANLIK MAKAMINA (ONAY BELGESİ)
  </div>
  <p>
    Mülkiyeti idaremize ait <strong>{{tasinmaz_adi}}</strong> (Ada/Parsel: {{ada_parsel}}, Alan: {{yuzolcumu}} m²) 
    taşınmazının 2886 Sayılı Devlet İhale Kanunu uyarınca ihalesine çıkılması hususunu tensiplerinize arz ederim.
  </p>
  <p><strong>Muhammen Bedel:</strong> ₺{{muhammen_bedel}} | <strong>Geçici Teminat:</strong> ₺{{gecici_teminat}}</p>
</div>
`
  },
  {
    id: '2886-EVR-05',
    title: 'Kıymet Takdir Komisyonu Karar Tutanağı',
    category: 'tutanak',
    version: 1,
    supportedOutputs: ['html', 'pdf'],
    fieldMappings: [
      { placeholder: 'kurum_adi', sourceType: 'system', sourceKey: 'organizationName' },
      { placeholder: 'dosya_no', sourceType: 'step_data', sourceKey: 'dosyaNo' },
      { placeholder: 'muhammen_bedel', sourceType: 'step_data', sourceKey: 'kesin_muhammen_bedel' }
    ],
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h3>T.C. {{kurum_adi}} - KIYMET TAKDİR KOMİSYONU KARAR TUTANAĞI</h3>
  <p>2886 Sayılı Kanun Madde 13 gereğince takdir edilen muhammen bedel: ₺{{muhammen_bedel}}</p>
</div>
`
  }
]

export const DEVLET_IHALE_2886_MODULE_MANIFEST: FlowdeskModuleManifest = {
  id: 'module-devlet-ihale-2886',
  name: '2886 Devlet İhale Kanunu Modülü',
  version: '1.0.0',
  flowdeskVersionRange: '>=1.0.0',
  summary: 'Devlet İhale Kanunu Kapsamında Taşınmaz Satış, Kiralama ve İrtifak Süreçleri',
  description: '2886 Sayılı Kanun kapsamındaki 5 aşamalı ihale süreci, encümen kararları, muhammen bedel takdiri, şartname hazırlığı ve kira/tahsilat takibi.',
  category: 'procurement',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  capabilities: [
    '2886_asama_1_5_yonetimi',
    'muhammen_bedel_ve_kiymet_takdiri',
    'encumen_karari_ve_artirma_turlari',
    'kira_ve_tahsilat_takvimi',
    'ebys_2886_belge_sablonlari'
  ],
  flows: [FLOW_DEFINITION_2886],
  formSchemas: FORM_SCHEMAS_2886,
  documentTemplates: DOCUMENT_TEMPLATES_2886,
  resolvers: [
    {
      templateId: '2886-EVR-01',
      resolverName: 'resolve2886BaskanlikOluru',
      description: 'Taşınmaz ve ihale onay belgesi alanlarını çözer',
      requiredFields: ['tasinmaz_adi', 'ada_parsel', 'tahmini_bedel']
    },
    {
      templateId: '2886-EVR-05',
      resolverName: 'resolve2886KiymetTakdiri',
      description: 'Kıymet takdir komisyonu ve muhammen bedel verilerini çözer',
      requiredFields: ['kesin_muhammen_bedel', 'komisyon_baskani']
    }
  ],
  isInstalled: true,
  isEnabled: true
}
