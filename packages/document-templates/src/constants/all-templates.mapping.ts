/**
 * Tüm Belge Şablonlarının Veri Eşleme (ProcessMapping) Koleksiyonu.
 * packages/document-templates çatısı altında merkezi olarak sunulur.
 */
import { getTemplateMapping } from '../registry'
import { ANCILLARY_MAPPINGS } from './ancillary-mappings'
import type { ProcessMapping } from '../resolver/types'

// Doğrudan Şablon Eşleme Tanımları
export const ArastirmaMektubuMapping: ProcessMapping = getTemplateMapping('arastirma-mektubu')
export const BirimFiyatTeklifCetveliMapping: ProcessMapping = getTemplateMapping('birim-fiyat-teklif-cetveli')
export const BirimFiyatTeklifMektubuMapping: ProcessMapping = getTemplateMapping('birim-fiyat-teklif-mektubu')
export const DagitimCizelgesiMapping: ProcessMapping = getTemplateMapping('dagitim-cizelgesi')
export const DagitimCizelgesiKarmaMapping: ProcessMapping = getTemplateMapping('dagitim-cizelgesi-karma')
export const FiyatArastirmaMektubuMapping: ProcessMapping = getTemplateMapping('fiyat-arastirma-mektubu')
export const FiyatArastirmasiMapping: ProcessMapping = getTemplateMapping('fiyat-arastirmasi')
export const PiyasaFiyatArastirmaTutanagiMapping: ProcessMapping = getTemplateMapping('piyasa-fiyat-arastirma-tutanagi')
export const TeklifMektubuDagitimCizelgesiMapping: ProcessMapping = getTemplateMapping('teklif-mektubu-dagitim-cizelgesi')
export const ButceSorgusuMapping: ProcessMapping = getTemplateMapping('butce-sorgusu')
export const DogrudanTeminOnayBelgesiMapping: ProcessMapping = getTemplateMapping('dogrudan-temin-onay-belgesi')
export const DogrudanTeminSonucOnayBelgesiMapping: ProcessMapping = getTemplateMapping('dogrudan-temin-sonuc-onay-belgesi')
export const DogrudanTeminSozlesmesiMapping: ProcessMapping = getTemplateMapping('dogrudan-temin-sozlesmesi')
export const DogrudanTeminSozlesmesiAlternatifMapping: ProcessMapping = getTemplateMapping('dogrudan-temin-sozlesmesi')
export const DogrudanTeminSozlesmesiUzunMapping: ProcessMapping = getTemplateMapping('dogrudan-temin-sozlesmesi')
export const IdareOnayBelgesiMapping: ProcessMapping = getTemplateMapping('idare-onay-belgesi')
export const IhaleKomisyonKarariMapping: ProcessMapping = getTemplateMapping('ihale-komisyon-karari')
export const KabulEdilenTeklifMapping: ProcessMapping = getTemplateMapping('kabul-edilen-teklif')
export const SozlesmeyeDavetMapping: ProcessMapping = getTemplateMapping('sozlesmeye-davet')
export const TeklifMektubuMapping: ProcessMapping = getTemplateMapping('teklif-mektubu')
export const HakedisRaporuMapping: ProcessMapping = getTemplateMapping('hakedis-raporu')
export const HarcamaPusulasiMapping: ProcessMapping = getTemplateMapping('harcama-pusulasi')
export const HarcamaTalimatiMapping: ProcessMapping = getTemplateMapping('harcama-talimati')
export const HizmetIsleriKabulTeklifBelgesiMapping: ProcessMapping = getTemplateMapping('hizmet-isleri-kabul-teklif-belgesi')
export const HizmetIsleriKabulTutanagiMapping: ProcessMapping = getTemplateMapping('hizmet-isleri-kabul-tutanagi')
export const IhtiyacListesiMapping: ProcessMapping = getTemplateMapping('ihtiyac-listesi')
export const IhtiyacTalepFormuMapping: ProcessMapping = getTemplateMapping('ihtiyac-talep-formu')
export const KabulEdilenTeklifOdemeMapping: ProcessMapping = getTemplateMapping('kabul-edilen-teklif')
export const Kik048YapimGeciciKabulTeklifMapping: ProcessMapping = getTemplateMapping('kik048-yapim-gecici-kabul-teklif')
export const Kik049YapimGeciciKabulTutanagiMapping: ProcessMapping = getTemplateMapping('kik049-yapim-gecici-kabul-tutanagi')
export const Kik050YapimKesinKabulTeklifMapping: ProcessMapping = getTemplateMapping('kik050-yapim-kesin-kabul-teklif')
export const Kik051YapimKesinKabulTutanagiMapping: ProcessMapping = getTemplateMapping('kik051-yapim-kesin-kabul-tutanagi')
export const KomisyonGorevlendirmeOnayiMapping: ProcessMapping = getTemplateMapping('komisyon-gorevlendirme-onayi')
export const KomisyonGorevlendirmeOnayiEkiMapping: ProcessMapping = getTemplateMapping('komisyon-gorevlendirme-onayi-eki')
export const LuzumMuzekkeresiMapping: ProcessMapping = getTemplateMapping('luzum-muzekkeresi')
export const LuzumOnayEkiMapping: ProcessMapping = getTemplateMapping('luzum-muzekkeresi-onay-eki')
export const LuzumTeslimTesellumMapping: ProcessMapping = getTemplateMapping('luzum-muzekkeresi-teslim-tesellum')
export const MuayeneKabulKomisyonuMapping: ProcessMapping = getTemplateMapping('muayene-kabul-komisyonu')
export const MuayeneKabulTutanagiMapping: ProcessMapping = getTemplateMapping('muayene-kabul-tutanagi')
export const OdemeEmriBelgesiMapping: ProcessMapping = getTemplateMapping('odeme-emri-belgesi')
export const OdemeYazisiMapping: ProcessMapping = getTemplateMapping('odeme-yazisi')
export const PiyasaFiyatArastirmaGorevlendirmesiMapping: ProcessMapping = getTemplateMapping('piyasa-fiyat-arastirma-gorevlendirmesi')
export const SonAlimFiyatCetveliMapping: ProcessMapping = getTemplateMapping('son-alim-fiyat-cetveli')
export const YaklasikMaliyetCetveliMapping: ProcessMapping = getTemplateMapping('yaklasik-maliyet-cetveli')

// Kapak ve Yan Belge Eşlemeleri
export {
  TasinirIslemFisiMapping,
  IhaleKapagiMapping,
  KapakIciIndeksSablonuMapping,
  KlasorSirtligi3cmMapping,
  KlasorSirtligi5cmMapping,
  KlasorSirtligi75cmMapping,
  ANCILLARY_MAPPINGS
} from './ancillary-mappings'

/**
 * Tüm şablonların ve yan belgelerin eşlemelerini tek bir sözlük olarak sunar.
 */
export const ALL_TEMPLATE_MAPPINGS: Record<string, ProcessMapping> = {
  'arastirma-mektubu': ArastirmaMektubuMapping,
  'birim-fiyat-teklif-cetveli': BirimFiyatTeklifCetveliMapping,
  'birim-fiyat-teklif-mektubu': BirimFiyatTeklifMektubuMapping,
  'dagitim-cizelgesi': DagitimCizelgesiMapping,
  'dagitim-cizelgesi-karma': DagitimCizelgesiKarmaMapping,
  'fiyat-arastirma-mektubu': FiyatArastirmaMektubuMapping,
  'fiyat-arastirmasi': FiyatArastirmasiMapping,
  'piyasa-fiyat-arastirma-tutanagi': PiyasaFiyatArastirmaTutanagiMapping,
  'teklif-mektubu-dagitim-cizelgesi': TeklifMektubuDagitimCizelgesiMapping,
  'butce-sorgusu': ButceSorgusuMapping,
  'dogrudan-temin-onay-belgesi': DogrudanTeminOnayBelgesiMapping,
  'dogrudan-temin-sonuc-onay-belgesi': DogrudanTeminSonucOnayBelgesiMapping,
  'dogrudan-temin-sozlesmesi': DogrudanTeminSozlesmesiMapping,
  'idare-onay-belgesi': IdareOnayBelgesiMapping,
  'ihale-komisyon-karari': IhaleKomisyonKarariMapping,
  'kabul-edilen-teklif': KabulEdilenTeklifMapping,
  'sozlesmeye-davet': SozlesmeyeDavetMapping,
  'teklif-mektubu': TeklifMektubuMapping,
  'hakedis-raporu': HakedisRaporuMapping,
  'harcama-pusulasi': HarcamaPusulasiMapping,
  'harcama-talimati': HarcamaTalimatiMapping,
  'hizmet-isleri-kabul-teklif-belgesi': HizmetIsleriKabulTeklifBelgesiMapping,
  'hizmet-isleri-kabul-tutanagi': HizmetIsleriKabulTutanagiMapping,
  'ihtiyac-listesi': IhtiyacListesiMapping,
  'ihtiyac-talep-formu': IhtiyacTalepFormuMapping,
  'kik048-yapim-gecici-kabul-teklif': Kik048YapimGeciciKabulTeklifMapping,
  'kik049-yapim-gecici-kabul-tutanagi': Kik049YapimGeciciKabulTutanagiMapping,
  'kik050-yapim-kesin-kabul-teklif': Kik050YapimKesinKabulTeklifMapping,
  'kik051-yapim-kesin-kabul-tutanagi': Kik051YapimKesinKabulTutanagiMapping,
  'komisyon-gorevlendirme-onayi': KomisyonGorevlendirmeOnayiMapping,
  'komisyon-gorevlendirme-onayi-eki': KomisyonGorevlendirmeOnayiEkiMapping,
  'luzum-muzekkeresi': LuzumMuzekkeresiMapping,
  'luzum-muzekkeresi-onay-eki': LuzumOnayEkiMapping,
  'luzum-muzekkeresi-teslim-tesellum': LuzumTeslimTesellumMapping,
  'muayene-kabul-komisyonu': MuayeneKabulKomisyonuMapping,
  'muayene-kabul-tutanagi': MuayeneKabulTutanagiMapping,
  'odeme-emri-belgesi': OdemeEmriBelgesiMapping,
  'odeme-yazisi': OdemeYazisiMapping,
  'piyasa-fiyat-arastirma-gorevlendirmesi': PiyasaFiyatArastirmaGorevlendirmesiMapping,
  'son-alim-fiyat-cetveli': SonAlimFiyatCetveliMapping,
  'yaklasik-maliyet-cetveli': YaklasikMaliyetCetveliMapping,
  ...ANCILLARY_MAPPINGS
}

/**
 * Tüm kayıtlı şablonların ve yan belgelerin eşlemelerini sözlük olarak döner.
 */
export function getAllTemplateMappings(): Record<string, ProcessMapping> {
  return ALL_TEMPLATE_MAPPINGS
}
