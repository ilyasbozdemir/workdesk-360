/**
 * Çıktı Sihirbazı & Belge Ayarları Kanonik Alan Eşleme Modülü
 *
 * Kanonik Alanlar:
 * - muhatap: Belgenin sunulacağı/hitap ettiği makam veya muhatap
 * - ilgi: Belgenin dayanağı/ilgi tuttuğu evrak
 * - ekler: Belge ekleri listesi
 * - dagitim: Belgenin dağıtılacağı birimler/kurumlar
 *
 * Ortak Bilgiler (Toplu aktarılabilir):
 * - tarih: Belge/dosya tarihi
 * - hazirlayanPersonelAdi: Hazırlayan personel adı
 * - hazirlayanPersonelUnvan: Hazırlayan unvanı
 * - onaylayanPersonelAdi: Harcama yetkilisi / onaylayan personel adı
 * - onaylayanPersonelUnvan: Onaylayan unvanı
 * - talepEdenPersonelAdi: Talep eden personel adı
 * - talepEdenPersonelUnvan: Talep eden unvanı
 *
 * NOT: Veri modelinde asla `_evrak` bloğu kullanılmaz.
 * Tüm alanlar şablon şemasındaki düz anahtarlara (flat keys) eşlenir.
 * Şemada karşılığı olmayan alanlar tanımsız (undefined) bırakılır ve UI'da gösterilmez.
 */

export interface TemplateFieldMapping {
  muhatapKey?: string
  ilgiKey?: string
  eklerKey?: string
  dagitimKey?: string
  tarihKey?: string
  hazirlayanAdiKey?: string
  hazirlayanUnvanKey?: string
  onaylayanAdiKey?: string
  onaylayanUnvanKey?: string
  talepEdenAdiKey?: string
  talepEdenUnvanKey?: string
}

export interface VisibilityFlagSpec {
  key: string
  label: string
  description?: string
  defaultValue: boolean
  isStatutory?: boolean
}

/**
 * Şablon ID -> Kanonik Alan Eşleme Tablosu
 * packages/document-templates/src/templates/[id]/[Id].schema.ts incelenerek birebir eşlenmiştir.
 */
export const TEMPLATE_FIELD_MAPPINGS: Record<string, TemplateFieldMapping> = {
  'dogrudan-temin-onay-belgesi': {
    muhatapKey: 'makam',
    eklerKey: 'ekler',
    tarihKey: 'dosyaTarihi',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan'
  },
  'odeme-yazisi': {
    muhatapKey: 'makamAdi',
    dagitimKey: 'dagitimListesi',
    tarihKey: 'dosyaTarihi',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'baskanAdi',
    onaylayanUnvanKey: 'baskanUnvan'
  },
  'luzum-muzekkeresi': {
    muhatapKey: 'sunulacakMakamAdi',
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan',
    talepEdenAdiKey: 'talepEdenPersonelAdi',
    talepEdenUnvanKey: 'talepEdenPersonelUnvan'
  },
  'arastirma-mektubu': {
    muhatapKey: 'sayinIlgili',
    tarihKey: 'dosyaTarihi'
  },
  'fiyat-arastirma-mektubu': {
    muhatapKey: 'sunulacakMakam',
    tarihKey: 'tarih'
  },
  'birim-fiyat-teklif-mektubu': {
    muhatapKey: 'hitap',
    tarihKey: 'dosyaTarihi'
  },
  'tasinir-kayit-yetkilisi-gorusu': {
    muhatapKey: 'talepEdenBirimAdi',
    ilgiKey: 'ilgi',
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan'
  },
  'ihtiyac-talep-formu': {
    eklerKey: 'ekler',
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan',
    talepEdenAdiKey: 'talepEdenPersonelAdi',
    talepEdenUnvanKey: 'talepEdenPersonelUnvan'
  },
  'ihtiyac-listesi': {
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    onaylayanAdiKey: 'onaylayanPersonelAdi'
  },
  'muayene-kabul-komisyonu': {
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan'
  },
  'muayene-kabul-tutanagi': {
    tarihKey: 'dosyaTarihi'
  },
  'piyasa-fiyat-arastirma-gorevlendirmesi': {
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan'
  },
  'piyasa-fiyat-arastirma-tutanagi': {
    tarihKey: 'tarih'
  },
  'teknik-sartname': {
    tarihKey: 'tarih',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    hazirlayanUnvanKey: 'hazirlayanPersonelUnvan',
    onaylayanAdiKey: 'onaylayanPersonelAdi',
    onaylayanUnvanKey: 'onaylayanPersonelUnvan'
  },
  'yaklasik-maliyet-cetveli': {
    tarihKey: 'tarih'
  },
  'son-alim-fiyat-cetveli': {
    tarihKey: 'alimTarihi'
  },
  'harcama-pusulasi': {
    // harcama pusulasında özel alanlar kullanılır
  },
  'harcama-talimati': {
    tarihKey: 'dosyaTarihi',
    hazirlayanAdiKey: 'hazirlayanPersonelAdi',
    onaylayanAdiKey: 'onaylayanPersonelAdi'
  },
  'butce-sorgusu': {
    tarihKey: 'dosyaTarihi'
  },
  'dogrudan-temin-sozlesmesi': {
    tarihKey: 'dosyaTarihi'
  },
  'sozlesmeye-davet': {
    tarihKey: 'dosyaTarihi'
  },
  'kabul-edilen-teklif': {
    tarihKey: 'dosyaTarihi'
  },
  'komisyon-gorevlendirme-onayi': {
    tarihKey: 'dosyaTarihi'
  }
}

/**
 * Şablon ID'sine göre desteklenen görünürlük bayrakları listesi.
 * Sadece şablon TSX bileşeni tarafından okunan anahtarlar dahil edilir.
 */
export const TEMPLATE_SUPPORTED_FLAGS: Record<string, VisibilityFlagSpec[]> = {
  'odeme-yazisi': [
    {
      key: 'olurGoster',
      label: 'Harcama Yetkilisi Olur Bloğu',
      description: 'Ödeme yazısı altındaki Harcama Yetkilisi Olur ve imza alanını göster/gizle',
      defaultValue: true,
      // 5018 SK gereği ödeme onayında olur imza bloğu idari/yasal prosedürdür
      isStatutory: false
    }
  ],
  'muayene-kabul-tutanagi': [
    {
      key: 'olurGoster',
      label: 'Muayene Kabul Onay Bloğu',
      description: 'Harcama yetkilisi kabul onay bloğunu göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'luzum-muzekkeresi': [
    {
      key: 'olurYazisi',
      label: 'OLUR / Onay Metni Bloğu',
      description: 'Lüzum müzekkeresi altındaki makam onay metnini göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'ihtiyac-listesi': [
    {
      key: 'olurYazisi',
      label: 'Onay Bloğu',
      description: 'İhtiyaç listesi onay metnini göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'kabul-edilen-teklif': [
    {
      key: 'olurYazisi',
      label: 'Onay Bloğu',
      description: 'Kabul edilen teklif onay metnini göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'komisyon-gorevlendirme-onayi': [
    {
      key: 'olurYazisi',
      label: 'Görevlendirme Onay Bloğu',
      description: 'Makam onay metnini göster/gizle',
      defaultValue: true,
      isStatutory: true
    }
  ],
  'piyasa-fiyat-arastirma-gorevlendirmesi': [
    {
      key: 'olurYazisi',
      label: 'Görevlendirme Onay Bloğu',
      description: 'Fiyat araştırma görevlendirme olurunu göster/gizle',
      defaultValue: true,
      isStatutory: true
    }
  ],
  'piyasa-fiyat-arastirma-tutanagi': [
    {
      key: 'olurYazisi',
      label: 'Karar Onay Bloğu',
      description: 'Piyasa fiyat araştırma onay bloğunu göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'son-alim-fiyat-cetveli': [
    {
      key: 'olurYazisi',
      label: 'Onay Bloğu',
      description: 'Son alım cetveli onay metnini göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'ekGoster',
      label: 'Ek Belge Bloğu',
      description: 'Ek belgeler referans satırını göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'yiUfeEkiGoster',
      label: 'Yİ-ÜFE Endeks Eki',
      description: 'Fiyat güncelleme endeksi ek tablosunu göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ],
  'harcama-pusulasi': [
    {
      key: 'tutarYaziGosterilecek',
      label: 'Tutar Yazı İle',
      description: 'Toplam tutarın yazı ile ifadesini göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'miktarGosterilecek',
      label: 'Miktar Sütunu',
      description: 'Mal/hizmet miktar sütununu göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'aciklamaGosterilecek',
      label: 'İşin Açıklaması',
      description: 'Pusula açıklama metnini göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'saticiAdiSoyadiGosterilecek',
      label: 'Satıcı Adı Soyadı',
      description: 'Ödeme yapılan satıcı adı soyadı alanını göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'saticiAdresGosterilecek',
      label: 'Satıcı Adresi',
      description: 'Satıcı ikametgah adresi alanını göster/gizle',
      defaultValue: true,
      isStatutory: false
    },
    {
      key: 'saticiTcNoGosterilecek',
      label: 'Satıcı T.C. Kimlik No',
      description: 'Satıcı T.C. Kimlik numarası alanını göster/gizle',
      defaultValue: true,
      isStatutory: false
    }
  ]
}

/**
 * Belirli bir şablon ID için alan eşlemesini döndürür
 */
export function getTemplateFieldMapping(templateId: string): TemplateFieldMapping {
  const normalizedId = templateId.replace(/\.html$/, '').trim()
  return TEMPLATE_FIELD_MAPPINGS[normalizedId] || {}
}

/**
 * Belirli bir şablon ID için desteklenen bayrakları döndürür
 */
export function getTemplateSupportedFlags(templateId: string): VisibilityFlagSpec[] {
  const normalizedId = templateId.replace(/\.html$/, '').trim()
  return TEMPLATE_SUPPORTED_FLAGS[normalizedId] || []
}

/**
 * Ortak bilgilerin seçili şablon verilerine aktarımı
 * @param existingData Belgenin mevcut veri nesnesi
 * @param templateId Şablon ID'si
 * @param commonData Ortak girilen alanlar
 * @param overwriteExisting Dolu olan alanların üzerine yazılsın mı? (Varsayılan: false)
 * @returns Ezme korumalı güncellenmiş veri nesnesi ve ezilen alanların listesi
 */
export function applyCommonDataToTemplate(
  existingData: Record<string, unknown>,
  templateId: string,
  commonData: {
    tarih?: string
    muhatap?: string
    hazirlayanAdi?: string
    hazirlayanUnvan?: string
    onaylayanAdi?: string
    onaylayanUnvan?: string
    talepEdenAdi?: string
    talepEdenUnvan?: string
  },
  overwriteExisting = false
): { updatedData: Record<string, unknown>; overwrittenFields: string[]; appliedFields: string[] } {
  const mapping = getTemplateFieldMapping(templateId)
  const result = { ...existingData }
  const overwrittenFields: string[] = []
  const appliedFields: string[] = []

  const pairs: Array<{
    key?: string
    val?: string
    label: string
  }> = [
    { key: mapping.tarihKey, val: commonData.tarih, label: 'Tarih' },
    { key: mapping.muhatapKey, val: commonData.muhatap, label: 'Muhatap' },
    { key: mapping.hazirlayanAdiKey, val: commonData.hazirlayanAdi, label: 'Hazırlayan Adı' },
    {
      key: mapping.hazirlayanUnvanKey,
      val: commonData.hazirlayanUnvan,
      label: 'Hazırlayan Unvanı'
    },
    { key: mapping.onaylayanAdiKey, val: commonData.onaylayanAdi, label: 'Onaylayan Adı' },
    { key: mapping.onaylayanUnvanKey, val: commonData.onaylayanUnvan, label: 'Onaylayan Unvanı' },
    { key: mapping.talepEdenAdiKey, val: commonData.talepEdenAdi, label: 'Talep Eden Adı' },
    { key: mapping.talepEdenUnvanKey, val: commonData.talepEdenUnvan, label: 'Talep Eden Unvanı' }
  ]

  for (const item of pairs) {
    if (!item.key || !item.val || item.val.trim() === '') continue

    const currentVal = result[item.key]
    const hasExistingValue =
      currentVal !== undefined && currentVal !== null && String(currentVal).trim() !== ''

    if (hasExistingValue) {
      if (overwriteExisting) {
        result[item.key] = item.val
        overwrittenFields.push(item.label)
        appliedFields.push(item.label)
      }
    } else {
      result[item.key] = item.val
      appliedFields.push(item.label)
    }
  }

  return { updatedData: result, overwrittenFields, appliedFields }
}
