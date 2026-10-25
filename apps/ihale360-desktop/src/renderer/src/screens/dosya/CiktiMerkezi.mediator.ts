// Her bir belgenin/şablonun TS Arayüzündeki (Interface) geçerli alanlarını tanımlayan şema veri yapısı.
// Bu alanlar dışındaki "sayiYazıyla", "pulBedeli" gibi alakasız alanlar süzülerek form görünümünde temizlik sağlanır.
export const TemplateFieldsMediator: Record<string, string[]> = {
  'luzum-muzekkeresi': [
    'antetSatirlari',
    'evrakSayisi',
    'dosyaKonusu',
    'maddeNo',
    'tarih',
    'sunulacakMakamAdi',
    'talepEdenPersonelAdi',
    'talepEdenPersonelUnvan',
    'hazirlayanPersonelAdi',
    'hazirlayanPersonelUnvan',
    'kurumIci',
    'kurumAdres',
    'kurumTelefon',
    'kurumFaks',
    'kurumWeb',
    'kurumEposta',
    'kurumKep',
    'solLogo',
    'sagLogo',
    'ihtiyacYeri',
    'isinAciklamasi',
    'ihtiyacKalemleri',
    'olurYazisi',
    'dosyaTarihi',
    'onaylayanPersonelAdi',
    'onaylayanPersonelUnvan',
    'hazirlayanPersonelUnvan',
    'hazirlayanTelefon',
    'hazirlayanEposta',
    'hazirlayanEposta'
  ],
  'ihtiyac-listesi': [
    'antetSatirlari',
    'evrakSayisi',
    'dosyaKonusu',
    'maddeNo',
    'tarih',
    'sunulacakMakamAdi',
    'talepEdenPersonelAdi',
    'talepEdenPersonelUnvan',
    'kurumIci',
    'kurumAdres',
    'kurumTelefon',
    'kurumFaks',
    'kurumWeb',
    'kurumEposta',
    'kurumKep',
    'solLogo',
    'sagLogo',
    'ihtiyacYeri',
    'ihtiyacKalemleri',
    'olurYazisi',
    'dosyaTarihi',
    'onaylayanPersonelAdi',
    'onaylayanPersonelUnvan',
    'hazirlayanPersonelAdi',
    'hazirlayanPersonelUnvan',
    'hazirlayanPersonelUnvan',
    'hazirlayanTelefon',
    'hazirlayanEposta',
    'hazirlayanEposta'
  ],
  'harcama-talimati': [
    'evrakSayisi',
    'tarih',
    'idareAdi',
    'gerekce',
    'isAdi',
    'miktar',
    'sure',
    'teminSekli',
    'yaklasikMaliyet',
    'odenekTutari',
    'butceTertibi',
    'gerceklestirmeGorevlileri',
    'aciklama',
    'mutemetAdi',
    'isTutari',
    'sunumTarihi',
    'hazirlayanPersonelAdi',
    'hazirlayanPersonelUnvan',
    'olurTarihi',
    'onaylayanPersonelAdi',
    'onaylayanPersonelUnvan'
  ],
  'ihtiyac-talep-formu': [
    'antetSatirlari',
    'kurum_adi',
    'birim_adi',
    'evrakSayisi',
    'dosyaKonusu',
    'tarih',
    'sunulacakMakamAdi',
    'talepEdenPersonelAdi',
    'talepEdenPersonelUnvan',
    'kurumIci',
    'kurumAdres',
    'kurumTelefon',
    'kurumFaks',
    'kurumWeb',
    'kurumEposta',
    'kurumKep',
    'solLogo',
    'sagLogo',
    'ihtiyacYeri',
    'ihtiyacKalemleri',
    'olurYazisi',
    'dosyaTarihi',
    'onaylayanPersonelAdi',
    'onaylayanPersonelUnvan',
    'gerekce',
    'hazirlayanPersonelAdi',
    'hazirlayanPersonelUnvan',
    'hazirlayanPersonelUnvan',
    'hazirlayanTelefon',
    'hazirlayanEposta',
    'hazirlayanEposta',
    'altNotlar',
    'schema'
  ],
  'luzum-muzekkeresi-onay-eki': [
    'antetSatirlari',
    'ekNo',
    'dosyaKonusu',
    'talepEdenPersonelAdi',
    'talepEdenPersonelUnvan',
    'solLogo',
    'sagLogo',
    'ihtiyacKalemleri',
    'dosyaTarihi'
  ],
  'luzum-muzekkeresi-teslim-tesellum': [
    'antetSatirlari',
    'dosyaKonusu',
    'isinAdi',
    'isinDegeri',
    'dosyaNumarasi',
    'kurumumuz',
    'dosyaTarihi',
    'solLogo',
    'sagLogo',
    'ihtiyacKalemleri',
    'teslimAlanlar',
    'teslimEdenler'
  ],
  'son-alim-fiyat-cetveli': [
    'antetSatirlari',
    'evrakSayisi',
    'dosyaKonusu',
    'tarih',
    'kurumIci',
    'kurumAdres',
    'kurumTelefon',
    'kurumWeb',
    'kurumEposta',
    'kurumKep',
    'hazirlayanPersonelAdi',
    'hazirlayanPersonelUnvan',
    'kontrolEdenPersonelAdi',
    'kontrolEdenPersonelUnvan',
    'solLogo',
    'sagLogo',
    'fiyatKalemleri',
    'genelToplam',
    'olurYazisi',
    'dosyaTarihi',
    'onaylayanPersonelAdi',
    'onaylayanPersonelUnvan',
    'hazirlayanPersonelUnvan',
    'hazirlayanTelefon',
    'hazirlayanEposta',
    'hazirlayanEposta'
  ]
}

// Mediator Helper: Belge yolunu/adını temizleyip ona uygun tiplemeyi döndürür
export function filterContextForTemplate<T = any>(arg1: any, arg2?: any): T {
  let templatePath = ''
  let rawContext: any = {}

  if (typeof arg1 === 'string') {
    templatePath = arg1
    rawContext = arg2 || {}
  } else if (typeof arg2 === 'string') {
    templatePath = arg2
    rawContext = arg1 || {}
  } else {
    templatePath = String(arg1 || '')
    rawContext = arg2 || {}
  }

  const cleanPath =
    templatePath
      .replace(/\.html$/, '')
      .split('/')
      .pop() || ''

  const allowedKeys = TemplateFieldsMediator[cleanPath]
  if (!allowedKeys) {
    // Tanımlı değilse (örneğin dinamik şablonlar) orjinal context'i bozmadan döndür
    return rawContext as T
  }

  const filtered: any = {}
  // Zorunlu alt-görsel / entegrasyon alanlarını koruyalım
  const mandatoryKeys = ['icerik', 'solLogo', 'sagLogo']

  for (const key of allowedKeys) {
    if (rawContext[key] !== undefined) {
      filtered[key] = rawContext[key]
    }
  }

  for (const mKey of mandatoryKeys) {
    if (rawContext[mKey] !== undefined) {
      filtered[mKey] = rawContext[mKey]
    }
  }

  return filtered as T
}
