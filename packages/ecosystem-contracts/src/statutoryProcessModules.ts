/**
 * Şablon ve Algoritma Tabanlı Mevzuat Süreç Modülleri (Statutory Process Modules)
 *
 * Bu modül; 3194 Sayılı İmar Kanunu (Md. 32/42 Kaçak Yapı Tespit, Yapı Tatil, Encümen Ceza ve Yıkım),
 * 2886 Sayılı Devlet İhale Kanunu (Satış, Kiralama, Trampa, Ecrimisil) gibi çok aşamalı,
 * kanuni süreli ve karar dallanmalı (algoritmik) süreçleri veritabanı şemasına kod gömmeden,
 * tamamen deklaratif süreç şablonları (`FlowdeskModuleManifest`) olarak tanımlar.
 */

import type {
  FlowdeskModuleManifest,
  FormSchema,
  DocumentTemplateDefinition,
  FlowDefinition
} from './flowdesk.js'

// ============================================================================
// 1. 3194 SAYILI İMAR KANUNU MD. 32 & 42 — KAÇAK YAPI TAKİP ALGORİTMASI MODÜLÜ
// ============================================================================

export const FORM_IMAR_YAPI_TATIL_TESPIT: FormSchema = {
  id: 'form-imar-yapi-tatil-tespit',
  title: '3194 Sayılı Kanun Md. 32 Yapı Tatil (Mühürleme) ve Saha Tespit Formu',
  description:
    'Ruhsatsız veya ruhsat ve eklerine aykırı yapının saha tespiti, mühürleme tarihi ve Md. 42 ceza parametreleri.',
  version: 1,
  fields: [
    {
      id: 'ada_parsel',
      label: 'Mahalle / Ada / Parsel',
      type: 'text',
      required: true,
      order: 1,
      placeholder: 'Örn: Cumhuriyet Mah. 142 Ada 8 Parsel'
    },
    {
      id: 'yapi_sahibi',
      label: 'Yapı Sahibi / Müteahhit Adı Soyadı',
      type: 'text',
      required: true,
      order: 2
    },
    {
      id: 'aykirilik_turu',
      label: 'Aykırılık Türü (Md. 32 / Md. 42)',
      type: 'select',
      required: true,
      order: 3,
      options: [
        { label: 'Tamamen Ruhsatsız Yapı', value: 'ruhsatsiz' },
        { label: 'Ruhsat ve Eklerine Aykırı Yapı', value: 'ruhsata_aykiri' }
      ]
    },
    {
      id: 'aykirilik_alani_m2',
      label: 'Aykırılıktan Etkilenen İnşaat Alanı (m²)',
      type: 'number',
      required: true,
      order: 4
    },
    {
      id: 'yapi_sinifi',
      label: 'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Yapı Sınıfı',
      type: 'select',
      required: true,
      order: 5,
      options: [
        { label: 'I. Sınıf Yapılar (Basit Tarım/Depo)', value: 'I' },
        { label: 'II. Sınıf Yapılar (Tek Katlı/Sanayi)', value: 'II' },
        { label: 'III. Sınıf Yapılar (Konut/Ticari Bina)', value: 'III' },
        { label: 'IV. Sınıf Yapılar (Yüksek/Özellikli Bina)', value: 'IV' },
        { label: 'V. Sınıf Yapılar (Kompleks/Endüstriyel)', value: 'V' }
      ]
    },
    {
      id: 'birim_maliyet_tl',
      label: 'Bakanlık Yapı Yaklaşık Birim Maliyeti (TL/m²)',
      type: 'currency',
      required: true,
      order: 6,
      defaultValue: 15000
    },
    {
      id: 'imar_durumu',
      label: 'İmar Planı Durumu',
      type: 'select',
      required: true,
      order: 7,
      options: [
        { label: 'Uygulama İmar Planı Bulunan Alan', value: 'planli' },
        { label: 'İmarsız / Plansız veya Özel Koruma Alanı', value: 'plansiz' }
      ]
    },
    {
      id: 'kamu_tehlikesi_var_mi',
      label: 'Can ve Mal Güvenliği / Kamu Tehlikesi Mevcut mu?',
      type: 'boolean',
      required: false,
      order: 8,
      defaultValue: false
    },
    {
      id: 'muhurleme_tarihi',
      label: 'Yapı Tatil Tutanağı Düzenleme / Mühürleme Tarihi',
      type: 'date',
      required: true,
      order: 9
    }
  ]
}

export const FORM_IMAR_30_GUN_KONTROL: FormSchema = {
  id: 'form-imar-30-gun-kontrol',
  title: '3194 Sayılı Kanun Md. 32 — 30 Günlük Yasal Süre Sonu Teknik Tespit Formu',
  description:
    'Yapı tatil tutanağının asılmasından itibaren 30 gün içinde yapının ruhsata bağlanıp bağlanmadığının veya aykırılığın giderilip giderilmediğinin tespiti.',
  version: 1,
  fields: [
    {
      id: 'kontrol_tarihi',
      label: 'Süre Sonu Saha Kontrol Tarihi',
      type: 'date',
      required: true,
      order: 1
    },
    {
      id: 'ruhsata_baglandi_mi',
      label: '30 Gün İçinde Ruhsat Alındı mı / Aykırılık Giderildi mi?',
      type: 'select',
      required: true,
      order: 2,
      options: [
        { label: 'Evet — Ruhsata Bağlandı veya Aykırılık Giderildi (Mühür Fekki)', value: 'evet' },
        { label: 'Hayır — Aykırılık Devam Ediyor (Encümen Yıkım ve TCK 184 Süreci)', value: 'hayir' }
      ]
    },
    {
      id: 'kontrol_ozeti',
      label: 'Teknik Kontrol Heyeti Tespit Özeti',
      type: 'textarea',
      required: true,
      order: 3
    }
  ]
}

export const DOC_IMAR_YAPI_TATIL_ZAPTI: DocumentTemplateDefinition = {
  id: 'IMAR-EVR-01',
  title: 'Yapı Tatil Zaptı (3194 Sayılı İmar Kanunu Md. 32 Mühürleme Tutanağı)',
  category: 'tutanak',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">T.C.<br/>YAPI KONTROL VE İMAR MÜDÜRLÜĞÜ<br/>YAPI TATİL ZAPTI (3194 S.K. MD. 32)</div>
      <p><strong>Taşınmaz Ada / Parsel:</strong> {{ada_parsel}}</p>
      <p><strong>Yapı Sahibi:</strong> {{yapi_sahibi}}</p>
      <p><strong>Aykırılık Türü ve Alanı:</strong> {{aykirilik_turu}} — {{aykirilik_alani_m2}} m² ({{yapi_sinifi}}. Sınıf Yapı)</p>
      <p><strong>Mühürleme Tarihi:</strong> {{muhurleme_tarihi}}</p>
      <p><strong>30 Günlük Yasal Süre Sonu (Md. 32):</strong> {{yasal_sure_bitis_tarihi}}</p>
      <p>3194 sayılı İmar Kanunu'nun 32. maddesi uyarınca yukarıda kimliği belirtilen yapı o andaki inşaat durumu tespit edilerek mühürlenmiş ve inşaat derhal durdurulmuştur. Mühürleme tarihinden itibaren en çok bir ay (30 gün) içinde yapı sahibi tarafından ruhsat alınması veya yapının ruhsat ve eklerine uygun hale getirilmesi zorunludur.</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'ada_parsel', sourceType: 'step_data', sourceKey: 'ada_parsel' },
    { placeholder: 'yapi_sahibi', sourceType: 'step_data', sourceKey: 'yapi_sahibi' },
    { placeholder: 'aykirilik_turu', sourceType: 'step_data', sourceKey: 'aykirilik_turu' },
    { placeholder: 'aykirilik_alani_m2', sourceType: 'step_data', sourceKey: 'aykirilik_alani_m2' },
    { placeholder: 'yapi_sinifi', sourceType: 'step_data', sourceKey: 'yapi_sinifi' },
    { placeholder: 'muhurleme_tarihi', sourceType: 'step_data', sourceKey: 'muhurleme_tarihi' },
    {
      placeholder: 'yasal_sure_bitis_tarihi',
      sourceType: 'step_data',
      sourceKey: 'yasal_sure_bitis_tarihi'
    }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const DOC_IMAR_ENCUMEN_CEZA_KARARI: DocumentTemplateDefinition = {
  id: 'IMAR-EVR-02',
  title: 'Encümen İdari Para Cezası Kararı (3194 S.K. Md. 42)',
  category: 'karar',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">ENCÜMEN İDARİ PARA CEZASI KARARI (3194 S.K. MD. 42)</div>
      <p><strong>Taşınmaz:</strong> {{ada_parsel}}</p>
      <p><strong>Muhatap Yapı Sahibi:</strong> {{yapi_sahibi}}</p>
      <p><strong>Aykırılık Alanı:</strong> {{aykirilik_alani_m2}} m² ({{yapi_sinifi}}. Sınıf Yapı)</p>
      <p><strong>Temel Ceza Tutarı:</strong> {{temel_idari_para_cezasi}} TL</p>
      <p><strong>Md. 42 Artırım Katsayısı:</strong> {{artirim_carpani}}x</p>
      <p><strong>Toplam Hesaplanan İdari Para Cezası:</strong> {{hesaplanan_idari_para_cezasi}} TL</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'ada_parsel', sourceType: 'step_data', sourceKey: 'ada_parsel' },
    { placeholder: 'yapi_sahibi', sourceType: 'step_data', sourceKey: 'yapi_sahibi' },
    { placeholder: 'aykirilik_alani_m2', sourceType: 'step_data', sourceKey: 'aykirilik_alani_m2' },
    { placeholder: 'yapi_sinifi', sourceType: 'step_data', sourceKey: 'yapi_sinifi' },
    {
      placeholder: 'temel_idari_para_cezasi',
      sourceType: 'step_data',
      sourceKey: 'temel_idari_para_cezasi'
    },
    { placeholder: 'artirim_carpani', sourceType: 'step_data', sourceKey: 'artirim_carpani' },
    {
      placeholder: 'hesaplanan_idari_para_cezasi',
      sourceType: 'step_data',
      sourceKey: 'hesaplanan_idari_para_cezasi'
    }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const DOC_IMAR_MUHUR_FEKKI: DocumentTemplateDefinition = {
  id: 'IMAR-EVR-03',
  title: 'Mühür Fekki (Kaldırma) ve Uygunluk Tutanağı (3194 S.K. Md. 32)',
  category: 'tutanak',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">MÜHÜR FEKKİ (KALDIRMA) TUTANAĞI</div>
      <p><strong>Taşınmaz:</strong> {{ada_parsel}} — <strong>Yapı Sahibi:</strong> {{yapi_sahibi}}</p>
      <p><strong>Kontrol Tarihi:</strong> {{kontrol_tarihi}}</p>
      <p><strong>Tespit Özeti:</strong> {{kontrol_ozeti}}</p>
      <p>3194 sayılı Kanun'un 32. maddesi uyarınca tanınan 30 günlük yasal süre içerisinde aykırılığın giderildiği / ruhsata bağlandığı tespit edildiğinden mühür fekki yapılarak inşaatın devamına izin verilmiştir.</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'ada_parsel', sourceType: 'step_data', sourceKey: 'ada_parsel' },
    { placeholder: 'yapi_sahibi', sourceType: 'step_data', sourceKey: 'yapi_sahibi' },
    { placeholder: 'kontrol_tarihi', sourceType: 'step_data', sourceKey: 'kontrol_tarihi' },
    { placeholder: 'kontrol_ozeti', sourceType: 'step_data', sourceKey: 'kontrol_ozeti' }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const DOC_IMAR_YIKIM_VE_SAVCILIK: DocumentTemplateDefinition = {
  id: 'IMAR-EVR-04',
  title: 'Encümen Yıkım Kararı (Md. 32) ve TCK Md. 184 Cumhuriyet Başsavcılığı Suç Duyurusu',
  category: 'karar',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">ENCÜMEN YIKIM KARARI VE TCK MD. 184 SUÇ DUYURUSU MÜZEKKERESİ</div>
      <p><strong>Taşınmaz:</strong> {{ada_parsel}} — <strong>Yapı Sahibi:</strong> {{yapi_sahibi}}</p>
      <p><strong>Mühürleme Tarihi:</strong> {{muhurleme_tarihi}} — <strong>Yasal Süre Bitişi:</strong> {{yasal_sure_bitis_tarihi}}</p>
      <p><strong>Süre Sonu Tespit:</strong> {{kontrol_ozeti}}</p>
      <p>3194 sayılı İmar Kanunu'nun 32. maddesi uyarınca 30 günlük yasal süre sonunda ruhsata bağlanmayan kaçak yapının yıkımına, yıkım masraflarının %20 fazlasıyla yapı sahibinden tahsiline ve 5237 sayılı TCK'nın 184. maddesi (İmar Kirliliğine Neden Olma) uyarınca Cumhuriyet Başsavcılığına suç duyurusunda bulunulmasına karar verilmiştir.</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'ada_parsel', sourceType: 'step_data', sourceKey: 'ada_parsel' },
    { placeholder: 'yapi_sahibi', sourceType: 'step_data', sourceKey: 'yapi_sahibi' },
    { placeholder: 'muhurleme_tarihi', sourceType: 'step_data', sourceKey: 'muhurleme_tarihi' },
    {
      placeholder: 'yasal_sure_bitis_tarihi',
      sourceType: 'step_data',
      sourceKey: 'yasal_sure_bitis_tarihi'
    },
    { placeholder: 'kontrol_ozeti', sourceType: 'step_data', sourceKey: 'kontrol_ozeti' }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const FLOW_IMAR_KACAK_YAPI_3194: FlowDefinition = {
  schemaVersion: 1,
  id: 'flow-imar-kacak-yapi-3194',
  name: '3194 Sayılı İmar Kanunu Md. 32 & 42 Kaçak Yapı Tespit, Ceza ve Yıkım Algoritması',
  version: 1,
  status: 'published',
  moduleId: 'module-imar-kacak-yapi-3194',
  category: 'urban-inspection',
  description:
    'Yapı tatil tutanağı (mühürleme), 30 günlük yasal süre hesabı, Md. 42 kademeli idari para cezası algoritması ve 30 gün sonunda ruhsat durumuna göre Mühür Fekki veya Yıkım/Savcılık (TCK 184) dallanması.',
  groups: [
    {
      id: 'grup-imar-tespit',
      title: '1. Aşama: Saha Tespiti, Mühürleme ve Md. 42 Ceza Hesaplama',
      order: 1,
      steps: [
        {
          id: 'step-imar-saha-tespit',
          title: 'Saha Tespiti ve Yapı Tatil Parametreleri Girişi',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-imar-yapi-tatil-tespit',
            deadlineRule: {
              sourceDateField: 'muhurleme_tarihi',
              durationDays: 30,
              dayType: 'calendar',
              targetDateField: 'yasal_sure_bitis_tarihi',
              description:
                '3194 Sayılı Kanun Md. 32 uyarınca mühürleme tarihinden itibaren 30 günlük ruhsata bağlama süresi'
            },
            computedFields: [
              {
                targetField: 'hesaplanan_idari_para_cezasi',
                formula: 'imar_md42_fine',
                description:
                  '3194 Sayılı Kanun Md. 42 uyarınca m², yapı sınıfı ve artırım katsayılarına göre idari para cezası'
              }
            ]
          }
        },
        {
          id: 'step-imar-yapi-tatil-zapti',
          title: 'Yapı Tatil Zaptı (Mühürleme Tutanağı) Üretimi',
          type: 'document',
          order: 2,
          config: {
            templateId: 'IMAR-EVR-01'
          }
        },
        {
          id: 'step-imar-encumen-ceza-belgesi',
          title: 'Encümen İdari Para Cezası (Md. 42) Karar Evrakı',
          type: 'document',
          order: 3,
          config: {
            templateId: 'IMAR-EVR-02'
          }
        }
      ]
    },
    {
      id: 'grup-imar-30-gun-karar',
      title: '2. Aşama: 30 Günlük Yasal Süre Sonu Kontrol ve Algoritmik Karar Dallanması',
      order: 2,
      steps: [
        {
          id: 'step-imar-30-gun-kontrol',
          title: '30 Günlük Süre Sonu Teknik Kontrol ve Karar Dallanması',
          type: 'form',
          order: 4,
          config: {
            formSchemaId: 'form-imar-30-gun-kontrol',
            conditionRules: [
              {
                field: 'ruhsata_baglandi_mi',
                operator: 'eq',
                value: 'evet',
                targetStepId: 'step-imar-muhur-fekki',
                reason:
                  '30 gün içinde ruhsat alındı veya aykırılık giderildi -> Mühür Fekki dalına geçildi'
              },
              {
                field: 'ruhsata_baglandi_mi',
                operator: 'eq',
                value: 'hayir',
                targetStepId: 'step-imar-yikim-ve-savcilik',
                reason:
                  '30 gün içinde aykırılık giderilmedi -> Encümen Yıkım Kararı ve TCK 184 Suç Duyurusu dalına geçildi'
              }
            ]
          }
        },
        {
          id: 'step-imar-muhur-fekki',
          title: 'Dal A: Mühür Fekki (Kaldırma) Tutanağı ve Dosya Kapatma',
          type: 'document',
          order: 5,
          config: {
            templateId: 'IMAR-EVR-03',
            customParams: {
              terminalStep: true
            }
          }
        },
        {
          id: 'step-imar-yikim-ve-savcilik',
          title: 'Dal B: Encümen Yıkım Kararı (Md. 32) ve TCK 184 Suç Duyurusu Üretimi',
          type: 'document',
          order: 6,
          config: {
            templateId: 'IMAR-EVR-04'
          }
        },
        {
          id: 'step-imar-yikim-infaz',
          title: 'Dal B: Fen İşleri Yıkım İnfazı ve Yıkım Masrafının %20 Fazlasıyla Tahsili',
          type: 'task',
          order: 7,
          config: {
            assigneeType: 'unit',
            assigneeId: 'fen_isleri_yikim_ekibi'
          }
        }
      ]
    }
  ]
}

export const MODULE_IMAR_KACAK_YAPI_3194: FlowdeskModuleManifest = {
  id: 'module-imar-kacak-yapi-3194',
  name: '3194 Sayılı İmar Kanunu (Md. 32 & 42) Kaçak Yapı Süreç Modülü',
  version: '1.0.0',
  flowdeskVersionRange: '>=1.0.0',
  summary:
    'Yapı tatil tutanağı, 30 günlük yasal süre sayacı, Md. 42 kademeli para cezası algoritması ve Mühür Fekki / Yıkım karar ağacı.',
  description:
    'Ruhsatsız veya ruhsata aykırı yapıların 3194 sayılı İmar Kanunu Md. 32 ve Md. 42 kapsamında mühürlenmesi, idari para cezası hesaplanması ve 30 günlük süre sonu dallanmalarını şablon tabanlı yürütür.',
  category: 'urban-inspection',
  author: 'WorkDesk 360 Ekosistemi',
  flows: [FLOW_IMAR_KACAK_YAPI_3194],
  formSchemas: [FORM_IMAR_YAPI_TATIL_TESPIT, FORM_IMAR_30_GUN_KONTROL],
  documentTemplates: [
    DOC_IMAR_YAPI_TATIL_ZAPTI,
    DOC_IMAR_ENCUMEN_CEZA_KARARI,
    DOC_IMAR_MUHUR_FEKKI,
    DOC_IMAR_YIKIM_VE_SAVCILIK
  ],
  resolvers: [],
  capabilities: ['deadline-calculation', 'imar-md42-fine-algorithm', 'conditional-branching']
}

// ============================================================================
// 2. 2886 SAYILI DEVLET İHALE KANUNU — SATIŞ, KİRALAMA VE İRTİFAK MODÜLÜ
// ============================================================================

export const FORM_2886_KIYMET_TAKDIRI: FormSchema = {
  id: 'form-2886-kiymet-takdiri',
  title: '2886 Sayılı Kanun Md. 9 & 13 — Taşınmaz Künyesi ve Tahmini Bedel Formu',
  version: 1,
  fields: [
    {
      id: 'tasinmaz_tanimi',
      label: 'Taşınmaz / İşin Tanımı ve Ada-Parsel',
      type: 'text',
      required: true,
      order: 1
    },
    {
      id: 'islem_turu',
      label: '2886 İşlem Türü',
      type: 'select',
      required: true,
      order: 2,
      options: [
        { label: 'Taşınmaz Satışı (Md. 45 / Md. 36)', value: 'satis' },
        { label: 'Taşınmaz Kiraya Verme (Md. 64)', value: 'kiralama' },
        { label: 'Trampa veya Mülkiyetin Gayri Ayni Hak', value: 'trampa_irtifak' }
      ]
    },
    {
      id: 'tahmini_bedel',
      label: 'Tespit Edilen Tahmini (Muhammen) Bedel (TL)',
      type: 'currency',
      required: true,
      order: 3
    },
    {
      id: 'parasal_limit',
      label: '2886 Md. 45 Açık Teklif / Kapalı Teklif Parasal Eşiği (TL)',
      type: 'currency',
      required: true,
      order: 4,
      defaultValue: 2500000
    }
  ]
}

export const FORM_2886_KOMISYON_KARARI: FormSchema = {
  id: 'form-2886-komisyon-karari',
  title: '2886 Sayılı Kanun Md. 28-31 — İhale Komisyonu Karar ve Teklif Formu',
  version: 1,
  fields: [
    {
      id: 'karar_tarihi',
      label: 'İhale Komisyonu Karar Tarihi',
      type: 'date',
      required: true,
      order: 1
    },
    {
      id: 'ihale_sonucu',
      label: 'İhale Oturum Sonucu',
      type: 'select',
      required: true,
      order: 2,
      options: [
        { label: 'Uygun Teklif Verildi — İta Amiri Onayına Sunulacak', value: 'uygun_teklif_var' },
        {
          label: 'İstekli Çıkmadı / Teklif Haddi Bulmadı — Md. 49 Pazarlığa Bırakıldı',
          value: 'pazarliga_birakildi'
        }
      ]
    },
    {
      id: 'kazanan_istekli',
      label: 'İhale Üzerinde Kalan İstekli Adı / Ünvanı',
      type: 'text',
      required: false,
      order: 3
    },
    {
      id: 'ihale_bedeli',
      label: 'Gerçekleşen İhale Bedeli (TL)',
      type: 'currency',
      required: false,
      order: 4
    }
  ]
}

export const DOC_2886_ONAY_VE_ILAN: DocumentTemplateDefinition = {
  id: '2886-EVR-01',
  title: '2886 Sayılı Kanun İhale Onay Belgesi ve İlan Cetveli',
  category: 'ihale_onay',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">2886 SAYILI DEVLET İHALE KANUNU İHALE ONAY VE İLAN CETVELİ</div>
      <p><strong>Taşınmaz / Konu:</strong> {{tasinmaz_tanimi}} ({{islem_turu}})</p>
      <p><strong>Tahmini Bedel (Md. 9):</strong> {{tahmini_bedel}} TL</p>
      <p><strong>%3 Geçici Teminat Tutarı (Md. 25):</strong> {{gecici_teminat_tutari}} TL</p>
      <p><strong>Algoritmik Belirlenen İhale Usulü:</strong> {{belirlenen_ihale_usulu}}</p>
      <p><strong>Zorunlu İlan Kuralı (Md. 17):</strong> {{zorunlu_ilan_kurali}}</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'tasinmaz_tanimi', sourceType: 'step_data', sourceKey: 'tasinmaz_tanimi' },
    { placeholder: 'islem_turu', sourceType: 'step_data', sourceKey: 'islem_turu' },
    { placeholder: 'tahmini_bedel', sourceType: 'step_data', sourceKey: 'tahmini_bedel' },
    {
      placeholder: 'gecici_teminat_tutari',
      sourceType: 'step_data',
      sourceKey: 'gecici_teminat_tutari'
    },
    {
      placeholder: 'belirlenen_ihale_usulu',
      sourceType: 'step_data',
      sourceKey: 'belirlenen_ihale_usulu'
    },
    {
      placeholder: 'zorunlu_ilan_kurali',
      sourceType: 'step_data',
      sourceKey: 'zorunlu_ilan_kurali'
    }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const DOC_2886_KESINLESEN_KARAR_TEBLIGAT: DocumentTemplateDefinition = {
  id: '2886-EVR-02',
  title: '2886 Sayılı Kanun Md. 31 & 54 — Kesinleşen İhale Kararı Tebligatı ve Sözleşmeye Davet',
  category: 'sozlesme',
  version: 1,
  htmlContent: `
    <div>
      <div class="header">2886 SAYILI KANUN KESİNLEŞEN İHALE KARARI TEBLİGATI</div>
      <p><strong>İstekli:</strong> {{kazanan_istekli}}</p>
      <p><strong>İhale Bedeli:</strong> {{ihale_bedeli}} TL</p>
      <p><strong>%6 Kesin Teminat Tutarı (Md. 54):</strong> {{kesin_teminat_tutari}} TL</p>
      <p><strong>İta Amiri 15 İş Günü Onay Sınırı (Md. 31):</strong> {{ita_amiri_onay_son_tarihi}}</p>
      <p>2886 sayılı Devlet İhale Kanunu'nun 31 ve 54. maddeleri uyarınca tebliğ tarihinden itibaren 15 gün içinde %6 kesin teminatı yatırarak noterlikçe tescil edilmiş sözleşmeyi imzalamanız gerekmektedir.</p>
    </div>
  `,
  fieldMappings: [
    { placeholder: 'kazanan_istekli', sourceType: 'step_data', sourceKey: 'kazanan_istekli' },
    { placeholder: 'ihale_bedeli', sourceType: 'step_data', sourceKey: 'ihale_bedeli' },
    {
      placeholder: 'kesin_teminat_tutari',
      sourceType: 'step_data',
      sourceKey: 'kesin_teminat_tutari'
    },
    {
      placeholder: 'ita_amiri_onay_son_tarihi',
      sourceType: 'step_data',
      sourceKey: 'ita_amiri_onay_son_tarihi'
    }
  ],
  supportedOutputs: ['html', 'pdf']
}

export const FLOW_DEVLET_IHALE_2886: FlowDefinition = {
  schemaVersion: 1,
  id: 'flow-devlet-ihale-2886',
  name: '2886 Sayılı Devlet İhale Kanunu — Satış, Kiralama ve Trampa Süreç Algoritması',
  version: 1,
  status: 'published',
  moduleId: 'module-devlet-ihale-2886',
  category: 'real-estate',
  description:
    'Kıymet takdiri, %3 geçici teminat, parasal limite göre Kapalı/Açık teklif usulü ve ilan süresi algoritması, 15 iş günü İta Amiri onayı ve %6 kesin teminat / sözleşme süreci.',
  groups: [
    {
      id: 'grup-2886-hazirlik',
      title: '1. Aşama: Kıymet Takdiri, Usul Algoritması ve İhale Onayı',
      order: 1,
      steps: [
        {
          id: 'step-2886-kiymet-takdiri',
          title: 'Tahmini Bedel Girişi ve Usul/Teminat Algoritması',
          type: 'form',
          order: 1,
          config: {
            formSchemaId: 'form-2886-kiymet-takdiri',
            computedFields: [
              {
                targetField: 'gecici_teminat_tutari',
                formula: 'percentage',
                sourceField: 'tahmini_bedel',
                rateOrFactor: 3,
                description: '2886 Sayılı Kanun Md. 25 uyarınca %3 Geçici Teminat'
              },
              {
                targetField: 'belirlenen_ihale_usulu',
                formula: 'ihale_2886_notice_rule',
                description: 'Tahmini bedel ve parasal eşiğe göre Kapalı/Açık teklif ve ilan kuralı'
              }
            ]
          }
        },
        {
          id: 'step-2886-onay-belgesi',
          title: 'İhale Onay Belgesi ve İlan Cetveli Üretimi',
          type: 'document',
          order: 2,
          config: {
            templateId: '2886-EVR-01'
          }
        },
        {
          id: 'step-2886-ita-amiri-ihale-onayi',
          title: 'İta Amiri İhaleye Çıkış Onayı',
          type: 'approval',
          order: 3,
          config: {
            approvalRoles: ['ita_amiri']
          }
        }
      ]
    },
    {
      id: 'grup-2886-komisyon-ve-sozlesme',
      title: '2. Aşama: Komisyon Kararı, 15 İş Günü Onay Süresi ve Sözleşme Dallanması',
      order: 2,
      steps: [
        {
          id: 'step-2886-komisyon-karari',
          title: 'İhale Komisyonu Kararı ve Sonuç Dallanması',
          type: 'form',
          order: 4,
          config: {
            formSchemaId: 'form-2886-komisyon-karari',
            deadlineRule: {
              sourceDateField: 'karar_tarihi',
              durationDays: 15,
              dayType: 'business',
              targetDateField: 'ita_amiri_onay_son_tarihi',
              description:
                '2886 Sayılı Kanun Md. 31 uyarınca karar tarihinden itibaren 15 iş günü içinde İta Amiri onay/ret süresi'
            },
            computedFields: [
              {
                targetField: 'kesin_teminat_tutari',
                formula: 'percentage',
                sourceField: 'ihale_bedeli',
                rateOrFactor: 6,
                description: '2886 Sayılı Kanun Md. 54 uyarınca %6 Kesin Teminat'
              }
            ],
            conditionRules: [
              {
                field: 'ihale_sonucu',
                operator: 'eq',
                value: 'pazarliga_birakildi',
                targetStepId: 'step-2886-pazarlik-donusum',
                reason: 'İstekli çıkmadı -> Md. 49/51 Pazarlık Usulüne Dönüşüm dalına geçildi'
              },
              {
                field: 'ihale_sonucu',
                operator: 'eq',
                value: 'uygun_teklif_var',
                targetStepId: 'step-2886-kesinlesen-karar-belgesi',
                reason: 'Uygun teklif var -> Kesinleşen İhale Kararı ve Sözleşme dalına geçildi'
              }
            ]
          }
        },
        {
          id: 'step-2886-pazarlik-donusum',
          title: 'Dal A: 2886 Md. 49/51 Pazarlık Usulüne Dönüştürme İşlemi',
          type: 'task',
          order: 5,
          config: {
            assigneeType: 'unit',
            assigneeId: 'ihale_komisyonu',
            customParams: {
              terminalStep: true
            }
          }
        },
        {
          id: 'step-2886-kesinlesen-karar-belgesi',
          title: 'Dal B: Kesinleşen İhale Kararı Tebligatı ve %6 Kesin Teminat Daveti',
          type: 'document',
          order: 6,
          config: {
            templateId: '2886-EVR-02'
          }
        }
      ]
    }
  ]
}

export const MODULE_DEVLET_IHALE_2886: FlowdeskModuleManifest = {
  id: 'module-devlet-ihale-2886',
  name: '2886 Sayılı Devlet İhale Kanunu Süreç Modülü',
  version: '1.0.0',
  flowdeskVersionRange: '>=1.0.0',
  summary:
    'Taşınmaz satış, kiralama ve irtifak süreçleri için %3/%6 teminat, Kapalı/Açık teklif usulü ve 15 iş günü onay süresi algoritması.',
  description:
    '2886 sayılı Devlet İhale Kanunu kapsamındaki işlemleri sabit veritabanı tabloları yerine şablon, kanuni süre ve karar ağacı algoritmasıyla yürütür.',
  category: 'real-estate',
  author: 'WorkDesk 360 Ekosistemi',
  flows: [FLOW_DEVLET_IHALE_2886],
  formSchemas: [FORM_2886_KIYMET_TAKDIRI, FORM_2886_KOMISYON_KARARI],
  documentTemplates: [DOC_2886_ONAY_VE_ILAN, DOC_2886_KESINLESEN_KARAR_TEBLIGAT],
  resolvers: [],
  capabilities: ['deadline-calculation', 'ihale-2886-algorithm', 'conditional-branching']
}

export const STATUTORY_PROCESS_MODULES: FlowdeskModuleManifest[] = [
  MODULE_IMAR_KACAK_YAPI_3194,
  MODULE_DEVLET_IHALE_2886
]

