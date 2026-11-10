import type { ProcessMapping } from "./resolver/types";
import type { TemplateRouteDefinition } from "@temin360/contracts";
import { ANCILLARY_MAPPINGS } from "./constants/ancillary-mappings";
import { toCanonicalDocId } from "./constants/template-constants";
import type React from "react";

// Template component imports
import { IhtiyacListesi } from "./templates/ihtiyac-listesi";
import { IhtiyacTalepFormu } from "./templates/ihtiyac-talep-formu";
import { TasinirKayitYetkilisiGorusu } from "./templates/tasinir-kayit-yetkilisi-gorusu";
import { TeknikSartname } from "./templates/teknik-sartname";
import { LuzumMuzekkeresi } from "./templates/luzum-muzekkeresi";
import { LuzumMuzekkeresiOnayEki } from "./templates/luzum-muzekkeresi-onay-eki";
import { LuzumMuzekkeresiTeslimTesellum } from "./templates/luzum-muzekkeresi-teslim-tesellum";
import { HarcamaTalimati } from "./templates/harcama-talimati";
import { KomisyonGorevlendirmeOnayi } from "./templates/komisyon-gorevlendirme-onayi";
import { KomisyonGorevlendirmeOnayiEki } from "./templates/komisyon-gorevlendirme-onayi-eki";
import { PiyasaFiyatArastirmaGorevlendirmesi } from "./templates/piyasa-fiyat-arastirma-gorevlendirmesi";
import { SonAlimFiyatCetveli } from "./templates/son-alim-fiyat-cetveli";
import { FiyatArastirmaMektubu } from "./templates/fiyat-arastirma-mektubu";
import { BirimFiyatTeklifMektubu } from "./templates/birim-fiyat-teklif-mektubu";
import { ArastirmaMektubu } from "./templates/arastirma-mektubu";
import { YaklasikMaliyetCetveli } from "./templates/yaklasik-maliyet-cetveli";
import { PiyasaFiyatArastirmaTutanagi } from "./templates/piyasa-fiyat-arastirma-tutanagi";
import { KabulEdilenTeklif } from "./templates/kabul-edilen-teklif";
import { DogrudanTeminOnayBelgesi } from "./templates/dogrudan-temin-onay-belgesi";
import { ButceSorgusu } from "./templates/butce-sorgusu";
import { DogrudanTeminSozlesmesi } from "./templates/dogrudan-temin-sozlesmesi";
import { SozlesmeyeDavet } from "./templates/sozlesmeye-davet";
import { MuayeneKabulKomisyonu } from "./templates/muayene-kabul-komisyonu";
import { MuayeneKabulTutanagi } from "./templates/muayene-kabul-tutanagi";
import { HarcamaPusulasi } from "./templates/harcama-pusulasi";
import { OdemeYazisi } from "./templates/odeme-yazisi";
import { Kik048YapimGeciciKabulTeklif } from "./templates/kik048-yapim-gecici-kabul-teklif";
import { Kik049YapimGeciciKabulTutanagi } from "./templates/kik049-yapim-gecici-kabul-tutanagi";
import { Kik050YapimKesinKabulTeklif } from "./templates/kik050-yapim-kesin-kabul-teklif";
import { Kik051YapimKesinKabulTutanagi } from "./templates/kik051-yapim-kesin-kabul-tutanagi";

import type {
  ExplicitState,
  TemplateCapabilities,
  TemplateGroup,
  TemplateType,
  TemplateWorkflow,
  WorkflowProfileName,
} from "./types";
import { getWorkflowProfile } from "./constants/workflowProfiles";

// Mapping imports from template packages
import { dataMapping as ihtiyacListesiMapping } from "./templates/ihtiyac-listesi/data.mapping";
import { dataMapping as ihtiyacTalepFormuMapping } from "./templates/ihtiyac-talep-formu/data.mapping";
import { dataMapping as tasinirKayitYetkilisiGorusuMapping } from "./templates/tasinir-kayit-yetkilisi-gorusu/data.mapping";
import { dataMapping as teknikSartnameMapping } from "./templates/teknik-sartname/data.mapping";
import { dataMapping as luzumMuzekkeresiMapping } from "./templates/luzum-muzekkeresi/data.mapping";
import { dataMapping as luzumOnayEkiMapping } from "./templates/luzum-muzekkeresi-onay-eki/data.mapping";
import { dataMapping as luzumTeslimTesellumMapping } from "./templates/luzum-muzekkeresi-teslim-tesellum/data.mapping";
import { dataMapping as harcamaTalimatiMapping } from "./templates/harcama-talimati/data.mapping";
import { dataMapping as komisyonGorevlendirmeOnayiMapping } from "./templates/komisyon-gorevlendirme-onayi/data.mapping";
import { dataMapping as komisyonGorevlendirmeOnayiEkiMapping } from "./templates/komisyon-gorevlendirme-onayi-eki/data.mapping";
import { dataMapping as piyasaFiyatArastirmaGorevlendirmesiMapping } from "./templates/piyasa-fiyat-arastirma-gorevlendirmesi/data.mapping";
import { dataMapping as sonAlimFiyatCetveliMapping } from "./templates/son-alim-fiyat-cetveli/data.mapping";
import { dataMapping as fiyatArastirmaMektubuMapping } from "./templates/fiyat-arastirma-mektubu/data.mapping";
import { dataMapping as birimFiyatTeklifMektubuMapping } from "./templates/birim-fiyat-teklif-mektubu/data.mapping";
import { dataMapping as arastirmaMektubuMapping } from "./templates/arastirma-mektubu/data.mapping";
import { dataMapping as yaklasikMaliyetCetveliMapping } from "./templates/yaklasik-maliyet-cetveli/data.mapping";
import { dataMapping as piyasaFiyatArastirmaTutanagiMapping } from "./templates/piyasa-fiyat-arastirma-tutanagi/data.mapping";
import { dataMapping as kabulEdilenTeklifMapping } from "./templates/kabul-edilen-teklif/data.mapping";
import { dataMapping as dogrudanTeminOnayBelgesiMapping } from "./templates/dogrudan-temin-onay-belgesi/data.mapping";
import { dataMapping as butceSorgusuMapping } from "./templates/butce-sorgusu/data.mapping";
import { dataMapping as dogrudanTeminSozlesmesiMapping } from "./templates/dogrudan-temin-sozlesmesi/data.mapping";
import { dataMapping as sozlesmeyeDavetMapping } from "./templates/sozlesmeye-davet/data.mapping";
import { dataMapping as muayeneKabulKomisyonuMapping } from "./templates/muayene-kabul-komisyonu/data.mapping";
import { dataMapping as muayeneKabulTutanagiMapping } from "./templates/muayene-kabul-tutanagi/data.mapping";
import { dataMapping as harcamaPusulasiMapping } from "./templates/harcama-pusulasi/data.mapping";
import { dataMapping as odemeYazisiMapping } from "./templates/odeme-yazisi/data.mapping";
import { dataMapping as kik048Mapping } from "./templates/kik048-yapim-gecici-kabul-teklif/data.mapping";
import { dataMapping as kik049Mapping } from "./templates/kik049-yapim-gecici-kabul-tutanagi/data.mapping";
import { dataMapping as kik050Mapping } from "./templates/kik050-yapim-kesin-kabul-teklif/data.mapping";
import { dataMapping as kik051Mapping } from "./templates/kik051-yapim-kesin-kabul-tutanagi/data.mapping";

export interface TemplateDefinition<
  TComponent extends React.ComponentType<any> = React.ComponentType<any>,
> {
  id: string;
  name: string;
  title: string;
  category: string;
  categoryLabel: string;
  description?: string;
  component: TComponent;
  orientation: "portrait" | "landscape";
  capabilities: TemplateCapabilities;
  kikKodu?: string;
  kikAdi?: string;
  standartFormKodu?: string;
  standartFormAdi?: string;
  dataMapping?: ProcessMapping;
  mapping?: ProcessMapping;
  routeDefinition?: TemplateRouteDefinition;
  version?: number;
  /** Tek grup (ör. "olur_onay"). Çoklu için `groups` kullanılır. */
  group?: TemplateGroup;
  groups?: readonly TemplateGroup[];
  /** Doğrudan tanımlı iş akışı (rota + imzalar). Profil kullanılmayacaksa. */
  workflow?: TemplateWorkflow;
  /** Ortak iş akışı profili; `workflowOverride` ile kısmen ezilebilir. */
  workflowProfile?: WorkflowProfileName;
  workflowOverride?: Partial<TemplateWorkflow>;
  /** Başka bir şablonun iş akışını miras alır (zincir `resolveTemplateWorkflow` ile çözülür). */
  inheritsFrom?: string;
}

const DEFAULT_CAPS: TemplateCapabilities = {
  supportsOlur: false,
  supportsCommission: false,
  supportedCommissionTypes: ["none"],
  supportsPersonnelList: true,
  supportsKalemListesi: true,
  supportsFirmaListesi: false,
  supportsMuhatap: false,
  supportsIlgi: false,
  supportsEk: false,
  supportsDagitim: false,
  supportsRota: false,
  supportsLogos: true,
};

export const templateRegistry = {
  // 1. İhtiyaç Tespiti ve Başlangıç
  ihtiyac_listesi: {
    id: "ihtiyac-listesi",
    name: "IhtiyacListesi",
    title: "Standart Form (): İhtiyaç Listesi Cetveli",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Alımı yapılacak mal/hizmet kalemlerinin detaylı ihtiyaç tablosu",
    component: IhtiyacListesi,
    orientation: "portrait",
    workflowProfile: "ic_form",
    dataMapping: ihtiyacListesiMapping,
    mapping: ihtiyacListesiMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: false, supportsLogos: true },
    standartFormKodu: "",
    standartFormAdi: "İhtiyaç Listesi Cetveli",
  },
  ihtiyac_talep_formu: {
    id: "ihtiyac-talep-formu",
    name: "IhtiyacTalepFormu",
    title:
      "Standart Form ( - 4734 KİK m.22): İhtiyaç Belgesi ve Harcama Talep Müzekkeresi",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Birimlerin mal/hizmet taleplerini yetkili makama ilettiği resmi form",
    component: IhtiyacTalepFormu,
    orientation: "portrait",
    workflowProfile: "ic_form",
    dataMapping: ihtiyacTalepFormuMapping,
    mapping: ihtiyacTalepFormuMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: false, supportsLogos: true },
    standartFormKodu: " - 4734 KİK m.22",
    standartFormAdi: "İhtiyaç Belgesi ve Harcama Talep Müzekkeresi",
  },
  luzum_muzekkeresi: {
    id: "luzum-muzekkeresi",
    name: "LuzumMuzekkeresi",
    title: "Standart Form (): Lüzum Müzekkeresi",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Harcama biriminin alım gerekliliğini onaylatan başlangıç müzekkeresi",
    component: LuzumMuzekkeresi,
    orientation: "portrait",
    workflowProfile: "ic_form",
    dataMapping: luzumMuzekkeresiMapping,
    mapping: luzumMuzekkeresiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsMuhatap: true,
      supportsIlgi: true,
      supportsEk: true,
      supportsLogos: true,
    },
    standartFormKodu: "",
    standartFormAdi: "Lüzum Müzekkeresi",
  },
  luzum_onay_eki: {
    id: "luzum-muzekkeresi-onay-eki",
    name: "LuzumMuzekkeresiOnayEki",
    title: "Standart Form: Lüzum Müzekkeresi Onay Eki",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description: "Lüzum müzekkeresine eklenen kalem ve açıklama listesi",
    component: LuzumMuzekkeresiOnayEki,
    orientation: "portrait",
    inheritsFrom: "luzum-muzekkeresi",
    dataMapping: luzumOnayEkiMapping,
    mapping: luzumOnayEkiMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: true, supportsLogos: true },
    standartFormAdi: "Lüzum Müzekkeresi Onay Eki",
  },
  luzum_muzekkeresi_teslim_tesellum: {
    id: "luzum-muzekkeresi-teslim-tesellum",
    name: "LuzumMuzekkeresiTeslimTesellum",
    title: "Standart Form: Lüzum Müzekkeresi Teslim Tesellüm Tutanağı",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description: "Lüzum müzekkeresi teslim alma ve evrak devir tutanağı",
    component: LuzumMuzekkeresiTeslimTesellum,
    orientation: "portrait",
    group: "muayene_kabul",
    inheritsFrom: "luzum-muzekkeresi",
    dataMapping: luzumTeslimTesellumMapping,
    mapping: luzumTeslimTesellumMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: false, supportsLogos: true },
    standartFormAdi: "Lüzum Müzekkeresi Teslim Tesellüm Tutanağı",
  },
  harcama_talimati: {
    id: "harcama-talimati",
    name: "HarcamaTalimati",
    title:
      "Standart Form-KİK024.0/M: Doğrudan Temin Onay Belgesi (Harcama Talimatı)",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Harcama Yetkilisi tarafından imzalanan alım ve ihale başlatma oluru",
    component: HarcamaTalimati,
    orientation: "portrait",
    group: "olur_onay",
    workflow: {
      routing: {
        mode: "role",
        targetRole: "harcama_yetkilisi",
        usesDynamicInstitutionalHeading: true,
        fallbackHeading: "HARCAMA YETKİLİLİĞİNE",
      },
      signatures: [
        {
          role: "gerceklestirme_gorevlisi",
          slotType: "checked_by",
          requirementSource: "statutory",
        },
        {
          role: "harcama_yetkilisi",
          slotType: "approved_by",
          requirementSource: "statutory",
        },
      ],
      approvalRole: "harcama_yetkilisi",
      explicitState: "explicit_defined",
    },
    dataMapping: harcamaTalimatiMapping,
    mapping: harcamaTalimatiMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: true, supportsLogos: true },
    kikKodu: "KİK024.0/M",
    kikAdi: "Doğrudan Temin Onay Belgesi (Harcama Talimatı)",
  },
  komisyon_gorevlendirme_onayi: {
    id: "komisyon-gorevlendirme-onayi",
    name: "KomisyonGorevlendirmeOnayi",
    title:
      "Standart Form (4734 KİK m.22): Piyasa Fiyat Araştırması ve Muayene Kabul Görevlendirme Onayı",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Piyasa Araştırma veya Muayene Kabul Komisyon üyelerinin görevlendirme oluru",
    component: KomisyonGorevlendirmeOnayi,
    orientation: "portrait",
    groups: ["piyasa_arastirma", "muayene_kabul", "olur_onay"],
    workflow: {
      routing: {
        mode: "role",
        targetRole: "harcama_yetkilisi",
        usesDynamicInstitutionalHeading: true,
        fallbackHeading: "HARCAMA YETKİLİLİĞİNE",
      },
      signatures: [
        {
          role: "harcama_yetkilisi",
          slotType: "approved_by",
          requirementSource: "administrative",
        },
      ],
      approvalRole: "harcama_yetkilisi",
      explicitState: "explicit_defined",
    },
    dataMapping: komisyonGorevlendirmeOnayiMapping,
    mapping: komisyonGorevlendirmeOnayiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: [
        "piyasa_fiyat",
        "muayene_kabul",
        "yaklasik_maliyet",
        "ihale_komisyonu",
        "all",
      ],
      supportsKalemListesi: false,
      supportsLogos: true,
      roleVisibility: {
        harcama_yetkilisi: "show",
        onaylayan: "show",
      },
    },
    standartFormKodu: "4734 KİK m.22",
    standartFormAdi:
      "Piyasa Fiyat Araştırması ve Muayene Kabul Görevlendirme Onayı",
  },
  komisyon_gorevlendirme_onayi_eki: {
    id: "komisyon-gorevlendirme-onayi-eki",
    name: "KomisyonGorevlendirmeOnayiEki",
    title: "Standart Form: Görevlendirilen Komisyon ve Personel Listesi Eki",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Görevlendirilen komisyon üyelerinin detaylı görev dağılım listesi",
    component: KomisyonGorevlendirmeOnayiEki,
    orientation: "portrait",
    groups: ["piyasa_arastirma", "muayene_kabul", "olur_onay"],
    workflow: {
      routing: { mode: "none" },
      signatures: [
        {
          role: "komisyon_baskani",
          slotType: "president",
          requirementSource: "administrative",
        },
        {
          role: "komisyon_uyesi",
          slotType: "member",
          requirementSource: "administrative",
        },
      ],
      explicitState: "explicit_defined",
    },
    dataMapping: komisyonGorevlendirmeOnayiEkiMapping,
    mapping: komisyonGorevlendirmeOnayiEkiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsCommission: true,
      supportedCommissionTypes: [
        "piyasa_fiyat",
        "muayene_kabul",
        "yaklasik_maliyet",
        "ihale_komisyonu",
        "all",
      ],
      supportsKalemListesi: false,
      supportsLogos: true,
      roleVisibility: {
        harcama_yetkilisi: "hide",
        onaylayan: "hide",
      },
    },
    standartFormAdi: "Görevlendirilen Komisyon ve Personel Listesi Eki",
  },
  piyasa_fiyat_arastirma_gorevlendirmesi: {
    id: "piyasa-fiyat-arastirma-gorevlendirmesi",
    name: "PiyasaFiyatArastirmaGorevlendirmesi",
    title:
      "Standart Form (4734 KİK m.22): Piyasa Fiyat Araştırma Görevlendirme Onayı",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Piyasa fiyat araştırmasını yapmak üzere görevlendirilen personelin olur belgesi",
    component: PiyasaFiyatArastirmaGorevlendirmesi,
    orientation: "portrait",
    groups: ["piyasa_arastirma", "olur_onay"],
    workflowProfile: "olur_onay",
    dataMapping: piyasaFiyatArastirmaGorevlendirmesiMapping,
    mapping: piyasaFiyatArastirmaGorevlendirmesiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["piyasa_fiyat", "yaklasik_maliyet"],
      supportsKalemListesi: false,
      supportsLogos: true,
      roleVisibility: {
        harcama_yetkilisi: "show",
        onaylayan: "show",
      },
    },
    standartFormKodu: "4734 KİK m.22",
    standartFormAdi: "Piyasa Fiyat Araştırma Görevlendirme Onayı",
  },
  son_alim_fiyat_cetveli: {
    id: "son-alim-fiyat-cetveli",
    name: "SonAlimFiyatCetveli",
    title: "Standart Form: Son Alım Fiyat Araştırma ve Mukayese Cetveli",
    category: "1-ihtiyac-tespiti-ve-baslangic",
    categoryLabel: "Hazırlık & İhtiyaç",
    description:
      "Geçmiş alımlara ait birim fiyat ve fatura karşılaştırma cetveli",
    component: SonAlimFiyatCetveli,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "ic_form",
    dataMapping: sonAlimFiyatCetveliMapping,
    mapping: sonAlimFiyatCetveliMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: true, supportsLogos: true },
    standartFormAdi: "Son Alım Fiyat Araştırma ve Mukayese Cetveli",
  },

  // 2. Piyasa Fiyat Araştırması
  fiyat_arastirma_mektubu: {
    id: "fiyat-arastirma-mektubu",
    name: "FiyatArastirmaMektubu",
    title:
      "Standart Form-KİK027.0/M: Birim Fiyat Teklif Mektubu ve Fiyat İsteme Formu",
    category: "2-piyasa-fiyat-arastirmasi",
    categoryLabel: "Teklifler & Piyasa",
    description:
      "Firmalara teklif sunmaları için gönderilen resmi davet yazısı",
    component: FiyatArastirmaMektubu,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "dis_yazi",
    dataMapping: fiyatArastirmaMektubuMapping,
    mapping: fiyatArastirmaMektubuMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK027.0/M",
    kikAdi: "Birim Fiyat Teklif Mektubu ve Fiyat İsteme Formu",
  },
  birim_fiyat_teklif_mektubu: {
    id: "birim-fiyat-teklif-mektubu",
    name: "BirimFiyatTeklifMektubu",
    title: "Standart Form-KİK015.1/M: Birim Fiyat Teklif Mektubu",
    category: "2-piyasa-fiyat-arastirmasi",
    categoryLabel: "Teklifler & Piyasa",
    description:
      "Firmaların birim fiyatlarını doldurarak imzaladığı teklif mektubu",
    component: BirimFiyatTeklifMektubu,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "firma_belgesi",
    dataMapping: birimFiyatTeklifMektubuMapping,
    mapping: birimFiyatTeklifMektubuMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsPersonnelList: false,
      supportsFirmaListesi: true,
      supportsLogos: true,
      roleVisibility: {
        harcama_yetkilisi: "hide",
        onaylayan: "hide",
        hazirlayan: "hide",
      },
    },
    kikKodu: "KİK015.1/M",
    kikAdi: "Birim Fiyat Teklif Mektubu",
  },
  arastirma_mektubu: {
    id: "arastirma-mektubu",
    name: "ArastirmaMektubu",
    title:
      "Standart Form-KİK027.0/M: Piyasa Fiyat Araştırma ve Teklif İsteme Mektubu",
    category: "2-piyasa-fiyat-arastirmasi",
    categoryLabel: "Teklifler & Piyasa",
    description:
      "Piyasa araştırması kapsamında gönderilen bilgi ve teklif toplama yazısı",
    component: ArastirmaMektubu,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "dis_yazi",
    dataMapping: arastirmaMektubuMapping,
    mapping: arastirmaMektubuMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK027.0/M",
    kikAdi: "Piyasa Fiyat Araştırma ve Teklif İsteme Mektubu",
  },
  yaklasik_maliyet_cetveli: {
    id: "yaklasik-maliyet-cetveli",
    name: "YaklasikMaliyetCetveli",
    title: "Standart Form-KİK002.0/M: Yaklaşık Maliyet Hesap Cetveli",
    category: "2-piyasa-fiyat-arastirmasi",
    categoryLabel: "Teklifler & Piyasa",
    description:
      "Toplanan tekliflerden alımın yaklaşık maliyetinin hesaplandığı cetvel",
    component: YaklasikMaliyetCetveli,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: yaklasikMaliyetCetveliMapping,
    mapping: yaklasikMaliyetCetveliMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsCommission: true,
      supportedCommissionTypes: ["piyasa_fiyat", "yaklasik_maliyet"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK002.0/M",
    kikAdi: "Yaklaşık Maliyet Hesap Cetveli",
  },
  piyasa_fiyat_arastirma_tutanagi: {
    id: "piyasa-fiyat-arastirma-tutanagi",
    name: "PiyasaFiyatArastirmaTutanagi",
    title:
      "Standart Form (MYHBY Örnek No: 2): Piyasa Fiyat Araştırması Tutanağı",
    category: "2-piyasa-fiyat-arastirmasi",
    categoryLabel: "Teklifler & Piyasa",
    description:
      "Piyasa fiyat araştırması görevlilerinin teklifleri değerlendirdiği ana tutanak",
    component: PiyasaFiyatArastirmaTutanagi,
    orientation: "portrait",
    group: "piyasa_arastirma",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: piyasaFiyatArastirmaTutanagiMapping,
    mapping: piyasaFiyatArastirmaTutanagiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["piyasa_fiyat", "yaklasik_maliyet"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    standartFormKodu: "MYHBY Örnek No: 2",
    standartFormAdi: "Piyasa Fiyat Araştırması Tutanağı",
  },

  // 3. Sipariş ve Sözleşme
  kabul_edilen_teklif: {
    id: "kabul-edilen-teklif",
    name: "KabulEdilenTeklif",
    title:
      "Standart Form (KİK Tebliği m.22): Sipariş Mektubu ve Tebliğ-Tebellüğ Belgesi",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description:
      "En avantajlı teklifi veren firmaya yapılan alım kabul bildirimi",
    component: KabulEdilenTeklif,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "dis_yazi",
    dataMapping: kabulEdilenTeklifMapping,
    mapping: kabulEdilenTeklifMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    standartFormKodu: "KİK Tebliği m.22",
    standartFormAdi: "Sipariş Mektubu ve Tebliğ-Tebellüğ Belgesi",
  },
  dogrudan_temin_onay_belgesi: {
    id: "dogrudan-temin-onay-belgesi",
    name: "DogrudanTeminOnayBelgesi",
    title:
      "Standart Form-KİK024.0/M: Doğrudan Temin Onay Belgesi (Harcama Talimatı)",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description: "Karara bağlanan alımın yetkili makam onay belgesi",
    component: DogrudanTeminOnayBelgesi,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "olur_onay",
    dataMapping: dogrudanTeminOnayBelgesiMapping,
    mapping: dogrudanTeminOnayBelgesiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK024.0/M",
    kikAdi: "Doğrudan Temin Onay Belgesi (Harcama Talimatı)",
  },
  dogrudan_temin_sonuc_onay_belgesi: {
    id: "dogrudan-temin-sonuc-onay-belgesi",
    name: "DogrudanTeminSonucOnayBelgesi",
    title:
      "Standart Form (4734 KİK m.22): Piyasa Fiyat Araştırması Sonuç Onay Belgesi",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description: "Alım sonucunun yetkili makam onay belgesi",
    component: DogrudanTeminOnayBelgesi,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "olur_onay",
    dataMapping: dogrudanTeminOnayBelgesiMapping,
    mapping: dogrudanTeminOnayBelgesiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    standartFormKodu: "4734 KİK m.22",
    standartFormAdi: "Piyasa Fiyat Araştırması Sonuç Onay Belgesi",
  },
  butce_sorgusu: {
    id: "butce-sorgusu",
    name: "ButceSorgusu",
    title: "Standart Form: Bütçe Ödenek Kontrol ve Bloke Belgesi",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description:
      "Alım tutarının ilgili bütçe tertibinden karşılanabilirliğini gösteren form",
    component: ButceSorgusu,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "olur_onay",
    dataMapping: butceSorgusuMapping,
    mapping: butceSorgusuMapping,
    version: 1,
    capabilities: { ...DEFAULT_CAPS, supportsOlur: false, supportsLogos: true },
    standartFormAdi: "Bütçe Ödenek Kontrol ve Bloke Belgesi",
  },
  dogrudan_temin_sozlesmesi: {
    id: "dogrudan-temin-sozlesmesi",
    name: "DogrudanTeminSozlesmesi",
    title:
      "Standart Form-KİK: Doğrudan Temin Mal / Hizmet Alımı Tip Sözleşmesi",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description:
      "Yüklenici firma ile İdare arasında imzalanan matbu alım sözleşmesi",
    component: DogrudanTeminSozlesmesi,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "firma_belgesi",
    dataMapping: dogrudanTeminSozlesmesiMapping,
    mapping: dogrudanTeminSozlesmesiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK",
    kikAdi: "Doğrudan Temin Mal / Hizmet Alımı Tip Sözleşmesi",
  },
  sozlesmeye_davet: {
    id: "sozlesmeye-davet",
    name: "SozlesmeyeDavet",
    title: "Standart Form-KİK023.0/M: Sözleşmeye Davet Mektubu",
    category: "3-siparis-ve-sozlesme",
    categoryLabel: "Sipariş & Sözleşme",
    description:
      "Kazanan yükleniciye sözleşme imzalaması için iletilen davet yazısı",
    component: SozlesmeyeDavet,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "dis_yazi",
    dataMapping: sozlesmeyeDavetMapping,
    mapping: sozlesmeyeDavetMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsKalemListesi: false,
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK023.0/M",
    kikAdi: "Sözleşmeye Davet Mektubu",
  },

  // 4. Kabul ve Ödeme İşlemleri
  muayene_kabul_tutanagi: {
    id: "muayene-kabul-tutanagi",
    name: "MuayeneKabulTutanagi",
    title:
      "Standart Form-KİK054.0/M: Mal Alımları Muayene ve Kabul Komisyonu Tutanağı",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Teslim alınan mal veya hizmetin muayene ve kabul tutanağı cetveli",
    component: MuayeneKabulTutanagi,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: muayeneKabulTutanagiMapping,
    mapping: muayeneKabulTutanagiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK054.0/M",
    kikAdi: "Mal Alımları Muayene ve Kabul Komisyonu Tutanağı",
  },
  muayene_kabul_komisyonu: {
    id: "muayene-kabul-komisyonu",
    name: "MuayeneKabulKomisyonu",
    title: "Standart Form-KİK054.0/M: Muayene ve Kabul Komisyon Kararı",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Teslim alınan mal veya hizmetin muayene kabul komisyonunca onaylanma kararı",
    component: MuayeneKabulKomisyonu,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: muayeneKabulKomisyonuMapping,
    mapping: muayeneKabulKomisyonuMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsLogos: true,
    },
    kikKodu: "KİK054.0/M",
    kikAdi: "Muayene ve Kabul Komisyon Kararı",
  },
  kik048_yapim_gecici_kabul_teklif: {
    id: "kik048-yapim-gecici-kabul-teklif",
    name: "Kik048YapimGeciciKabulTeklif",
    title: "Standart Form-KİK048.0/Y: Yapım İşleri Geçici Kabul Teklif Belgesi",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Yapım işleri yüklenici iş bitirme dilekçesi sonrası ön inceleme ve geçici kabul teklif belgesi",
    component: Kik048YapimGeciciKabulTeklif,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: kik048Mapping,
    mapping: kik048Mapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: false,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK048.0/Y",
    kikAdi: "Yapım İşleri Geçici Kabul Teklif Belgesi",
  },
  kik049_yapim_gecici_kabul_tutanagi: {
    id: "kik049-yapim-gecici-kabul-tutanagi",
    name: "Kik049YapimGeciciKabulTutanagi",
    title: "Standart Form-KİK049.0/Y: Yapım İşleri Geçici Kabul Tutanağı",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Yapım işleri geçici kabul komisyonu heyeti ve yüklenici inceleme tutanağı",
    component: Kik049YapimGeciciKabulTutanagi,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: kik049Mapping,
    mapping: kik049Mapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK049.0/Y",
    kikAdi: "Yapım İşleri Geçici Kabul Tutanağı",
  },
  kik050_yapim_kesin_kabul_teklif: {
    id: "kik050-yapim-kesin-kabul-teklif",
    name: "Kik050YapimKesinKabulTeklif",
    title: "Standart Form-KİK050.0/Y: Yapım İşleri Kesin Kabul Teklif Belgesi",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Yapım işleri teminat süresi sonu kesin kabul heyeti teşkili teklif belgesi",
    component: Kik050YapimKesinKabulTeklif,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: kik050Mapping,
    mapping: kik050Mapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: false,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK050.0/Y",
    kikAdi: "Yapım İşleri Kesin Kabul Teklif Belgesi",
  },
  kik051_yapim_kesin_kabul_tutanagi: {
    id: "kik051-yapim-kesin-kabul-tutanagi",
    name: "Kik051YapimKesinKabulTutanagi",
    title: "Standart Form-KİK051.0/Y: Yapım İşleri Kesin Kabul Tutanağı",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Yapım işleri kesin kabul komisyonu heyeti ve yüklenici kesin kabul onay tutanağı",
    component: Kik051YapimKesinKabulTutanagi,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: kik051Mapping,
    mapping: kik051Mapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsCommission: true,
      supportedCommissionTypes: ["muayene_kabul"],
      supportsFirmaListesi: true,
      supportsLogos: true,
    },
    kikKodu: "KİK051.0/Y",
    kikAdi: "Yapım İşleri Kesin Kabul Tutanağı",
  },
  harcama_pusulasi: {
    id: "harcama-pusulasi",
    name: "HarcamaPusulasi",
    title:
      "Standart Form (MYHBY Örnek No: 3): Harcama Pusulası ve Klasör Dizi Fihristi",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Fatura kesme yükümlülüğü olmayan gerçek kişilerden yapılan alımların tutanağı",
    component: HarcamaPusulasi,
    orientation: "portrait",
    group: "muayene_kabul",
    workflowProfile: "komisyon_tutanagi",
    dataMapping: harcamaPusulasiMapping,
    mapping: harcamaPusulasiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: false,
      supportsLogos: true,
      roleVisibility: {
        harcama_yetkilisi: "show",
        onaylayan: "show",
      },
    },
    standartFormKodu: "MYHBY Örnek No: 3",
    standartFormAdi: "Harcama Pusulası ve Klasör Dizi Fihristi",
  },
  odeme_yazisi: {
    id: "odeme-yazisi",
    name: "OdemeYazisi",
    title: "Standart Form: Muhasebe / Malmüdürlüğü Ödeme Gönderme Müzekkeresi",
    category: "4-kabul-ve-odeme-islemleri",
    categoryLabel: "Muayene & Kabul & Ödeme",
    description:
      "Mali hizmetler / muhasebe müdürlüğüne yazılan ödeme üst yazısı",
    component: OdemeYazisi,
    orientation: "portrait",
    group: "olur_onay",
    workflowProfile: "dis_yazi",
    dataMapping: odemeYazisiMapping,
    mapping: odemeYazisiMapping,
    version: 1,
    capabilities: {
      ...DEFAULT_CAPS,
      supportsOlur: true,
      supportsKalemListesi: false,
      supportsFirmaListesi: true,
      supportsMuhatap: true,
      supportsIlgi: true,
      supportsEk: true,
      supportsLogos: true,
    },
    standartFormAdi: "Muhasebe / Malmüdürlüğü Ödeme Gönderme Müzekkeresi",
  },
} as const satisfies Record<string, TemplateDefinition<any>>;

export type TemplateKey = keyof typeof templateRegistry;

export type TemplateData<K extends TemplateKey> = React.ComponentProps<
  (typeof templateRegistry)[K]["component"]
> extends { data?: infer D } ? NonNullable<D>
  : never;

/**
 * ID ve ad eşleştirme tablosu: kebab-case, snake_case veya alias'ları registry anahtarına dönüştürür.
 */
const REGISTRY_LOOKUP: Record<string, TemplateKey> = {
  // Doğrudan anahtarlar
  ihtiyac_listesi: "ihtiyac_listesi",
  ihtiyac_talep_formu: "ihtiyac_talep_formu",
  tasinir_kayit_yetkilisi_gorusu: "tasinir_kayit_yetkilisi_gorusu",
  teknik_sartname: "teknik_sartname",
  luzum_muzekkeresi: "luzum_muzekkeresi",
  luzum_onay_eki: "luzum_onay_eki",
  luzum_muzekkeresi_onay_eki: "luzum_onay_eki",
  luzum_muzekkeresi_teslim_tesellum: "luzum_muzekkeresi_teslim_tesellum",
  harcama_talimati: "harcama_talimati",
  komisyon_gorevlendirme_onayi: "komisyon_gorevlendirme_onayi",
  komisyon_gorevlendirme_onayi_eki: "komisyon_gorevlendirme_onayi_eki",
  piyasa_fiyat_arastirma_gorevlendirmesi:
    "piyasa_fiyat_arastirma_gorevlendirmesi",
  son_alim_fiyat_cetveli: "son_alim_fiyat_cetveli",
  fiyat_arastirma_mektubu: "fiyat_arastirma_mektubu",
  birim_fiyat_teklif_mektubu: "birim_fiyat_teklif_mektubu",
  arastirma_mektubu: "arastirma_mektubu",
  yaklasik_maliyet_cetveli: "yaklasik_maliyet_cetveli",
  piyasa_fiyat_arastirma_tutanagi: "piyasa_fiyat_arastirma_tutanagi",
  kabul_edilen_teklif: "kabul_edilen_teklif",
  dogrudan_temin_onay_belgesi: "dogrudan_temin_onay_belgesi",
  dogrudan_temin_sonuc_onay_belgesi: "dogrudan_temin_sonuc_onay_belgesi",
  butce_sorgusu: "butce_sorgusu",
  dogrudan_temin_sozlesmesi: "dogrudan_temin_sozlesmesi",
  sozlesmeye_davet: "sozlesmeye_davet",
  muayene_kabul_tutanagi: "muayene_kabul_tutanagi",
  muayene_kabul_komisyonu: "muayene_kabul_komisyonu",
  kik048_yapim_gecici_kabul_teklif: "kik048_yapim_gecici_kabul_teklif",
  kik049_yapim_gecici_kabul_tutanagi: "kik049_yapim_gecici_kabul_tutanagi",
  kik050_yapim_kesin_kabul_teklif: "kik050_yapim_kesin_kabul_teklif",
  kik051_yapim_kesin_kabul_tutanagi: "kik051_yapim_kesin_kabul_tutanagi",
  harcama_pusulasi: "harcama_pusulasi",
  odeme_yazisi: "odeme_yazisi",

  // Kebab-case eşleştirmeleri
  "ihtiyac-listesi": "ihtiyac_listesi",
  "ihtiyac-talep-formu": "ihtiyac_talep_formu",
  "tasinir-kayit-yetkilisi-gorusu": "tasinir_kayit_yetkilisi_gorusu",
  "teknik-sartname": "teknik_sartname",
  "luzum-muzekkeresi": "luzum_muzekkeresi",
  "luzum-onay-eki": "luzum_onay_eki",
  "luzum-muzekkeresi-onay-eki": "luzum_onay_eki",
  "luzum-muzekkeresi-teslim-tesellum": "luzum_muzekkeresi_teslim_tesellum",
  "harcama-talimati": "harcama_talimati",
  "komisyon-gorevlendirme-onayi": "komisyon_gorevlendirme_onayi",
  "komisyon-gorevlendirme-onayi-eki": "komisyon_gorevlendirme_onayi_eki",
  "piyasa-fiyat-arastirma-gorevlendirmesi":
    "piyasa_fiyat_arastirma_gorevlendirmesi",
  "son-alim-fiyat-cetveli": "son_alim_fiyat_cetveli",
  "fiyat-arastirma-mektubu": "fiyat_arastirma_mektubu",
  "birim-fiyat-teklif-mektubu": "birim_fiyat_teklif_mektubu",
  "birim-fiyat-teklif-cetveli": "birim_fiyat_teklif_mektubu",
  "arastirma-mektubu": "arastirma_mektubu",
  "yaklasik-maliyet-cetveli": "yaklasik_maliyet_cetveli",
  "piyasa-fiyat-arastirma-tutanagi": "piyasa_fiyat_arastirma_tutanagi",
  "kabul-edilen-teklif": "kabul_edilen_teklif",
  "dogrudan-temin-onay-belgesi": "dogrudan_temin_onay_belgesi",
  "dogrudan-temin-sonuc-onay-belgesi": "dogrudan_temin_sonuc_onay_belgesi",
  "butce-sorgusu": "butce_sorgusu",
  "dogrudan-temin-sozlesmesi": "dogrudan_temin_sozlesmesi",
  "sozlesmeye-davet": "sozlesmeye_davet",
  "muayene-kabul-tutanagi": "muayene_kabul_tutanagi",
  "muayene-kabul-komisyonu": "muayene_kabul_komisyonu",
  "kik048-yapim-gecici-kabul-teklif": "kik048_yapim_gecici_kabul_teklif",
  "kik049-yapim-gecici-kabul-tutanagi": "kik049_yapim_gecici_kabul_tutanagi",
  "kik050-yapim-kesin-kabul-teklif": "kik050_yapim_kesin_kabul_teklif",
  "kik051-yapim-kesin-kabul-tutanagi": "kik051_yapim_kesin_kabul_tutanagi",
  "harcama-pusulasi": "harcama_pusulasi",
  "odeme-yazisi": "odeme_yazisi",

  // Sık kullanılan alias'lar
  "ihale-komisyon-karari": "muayene_kabul_komisyonu",
  "hizmet-isleri-kabul-tutanagi": "muayene_kabul_komisyonu",
  "hizmet-isleri-kabul-teklif-belgesi": "muayene_kabul_komisyonu",
  "hakedis-raporu": "muayene_kabul_komisyonu",
  "tasinir-islem-fisi": "muayene_kabul_komisyonu",
  "odeme-emri-belgesi": "muayene_kabul_komisyonu",
};

/**
 * Herhangi bir şablon kimliğini (snake_case, kebab-case veya alias) geçerli TemplateKey'e çözümler.
 */
export function resolveTemplateKey(
  key: string | null | undefined,
): TemplateKey | undefined {
  if (!key) return undefined;
  const direct = REGISTRY_LOOKUP[key];
  if (direct) return direct;

  const normalized = key.toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized in templateRegistry) {
    return normalized as TemplateKey;
  }

  const kebab = key.toLowerCase().replace(/[\s_]+/g, "-");
  if (REGISTRY_LOOKUP[kebab]) {
    return REGISTRY_LOOKUP[kebab];
  }

  return undefined;
}

/**
 * Şablon anahtarına göre şablon tanımını döner.
 */
export function getTemplateDefinition(
  key: string | null | undefined,
): TemplateDefinition<any> | undefined {
  const resolvedKey = resolveTemplateKey(key);
  if (!resolvedKey) return undefined;
  return templateRegistry[resolvedKey];
}

/**
 * UI seçim ve listeleme için şablon seçeneklerini döner.
 */
export function getAllTemplateDefinitions(): TemplateDefinition<any>[] {
  return Object.values(templateRegistry);
}

/**
 * Şablon anahtarına veya süreç yoluna göre veri eşleme (ProcessMapping) tanımını döner.
 */
export function getTemplateMapping(
  key: string | null | undefined,
): ProcessMapping {
  if (!key) return {};
  if (ANCILLARY_MAPPINGS[key]) return ANCILLARY_MAPPINGS[key];
  const canonical = toCanonicalDocId(key);
  if (ANCILLARY_MAPPINGS[canonical]) return ANCILLARY_MAPPINGS[canonical];

  const resolvedKey = resolveTemplateKey(key);
  if (resolvedKey && (templateRegistry as any)[resolvedKey]) {
    const def = (templateRegistry as any)[resolvedKey];
    if (def.dataMapping) return def.dataMapping;
    if (def.mapping) return def.mapping;
  }

  const canonicalKey = resolveTemplateKey(canonical);
  if (canonicalKey && (templateRegistry as any)[canonicalKey]) {
    const def = (templateRegistry as any)[canonicalKey];
    if (def.dataMapping) return def.dataMapping;
    if (def.mapping) return def.mapping;
  }

  return {};
}

// =============================================================================
// İŞ AKIŞI (WORKFLOW) KATMANI — templateRegistry'den türetilir
// =============================================================================
// Şablon başına rota/imza/grup bilgisi ARTIK templateRegistry girişinin içinde tanımlanır.
// Ayrı bir `constants/template-registry.ts` defteri yoktur; aşağıdaki TEMPLATE_REGISTRY
// yalnızca templateRegistry'nin iş akışı çözümlenmiş görünümüdür (ikinci kaynak değildir).

export type TemplateInput = {
  id: string;
  name: string;
  title: string;
  category: string;
  description?: string;
  group?: TemplateGroup;
  groups?: readonly TemplateGroup[];
  capabilities?: Partial<TemplateCapabilities>;
  workflow?: TemplateWorkflow;
  workflowProfile?: WorkflowProfileName;
  workflowOverride?: Partial<TemplateWorkflow>;
  inheritsFrom?: string;
  kikKodu?: string;
  kikAdi?: string;
  standartFormKodu?: string;
  standartFormAdi?: string;
};

/** Derin nesne birleştirme yardımcısı (Workflow birleştirme için). */
function deepMergeWorkflow(
  base: TemplateWorkflow,
  override?: Partial<TemplateWorkflow>,
): TemplateWorkflow {
  if (!override) return base;
  return {
    ...base,
    ...override,
    routing: override.routing
      ? ({ ...base.routing, ...override.routing } as any)
      : base.routing,
    signatures: override.signatures
      ? [...override.signatures]
      : base.signatures
      ? [...base.signatures]
      : undefined,
  };
}

/**
 * @purpose Şablon girişini iş akışı çözümlenmiş TemplateType'a dönüştürür.
 * @source templateRegistry girişleri (workflow / workflowProfile / inheritsFrom / group)
 * @scope Tek şablon
 * @usedBy TEMPLATE_REGISTRY, TemplateRegistryService, testler
 *
 * Workflow önceliği: 1) doğrudan `workflow`, 2) `inheritsFrom`, 3) `workflowProfile` (+ override).
 */
export function defineTemplate(input: TemplateInput): TemplateType {
  const groups = input.groups ?? (input.group ? [input.group] : []);
  let resolvedWorkflow: TemplateWorkflow | undefined = undefined;

  if (input.workflow) {
    resolvedWorkflow = {
      ...input.workflow,
      explicitState: input.workflow.explicitState ?? "explicit_defined",
    };
  } else if (input.inheritsFrom) {
    resolvedWorkflow = {
      inheritsFrom: input.inheritsFrom,
      explicitState: "from_profile",
      routing: { mode: "none" },
      signatures: [],
    };
  } else if (input.workflowProfile) {
    resolvedWorkflow = deepMergeWorkflow(
      getWorkflowProfile(input.workflowProfile),
      input.workflowOverride,
    );
    resolvedWorkflow.explicitState = "from_profile";
  }

  return {
    id: input.id,
    name: input.name,
    title: input.title,
    category: input.category,
    description: input.description,
    group: input.group ?? (groups.length > 0 ? groups[0] : undefined),
    groups: [...groups],
    capabilities: { ...DEFAULT_CAPS, ...input.capabilities },
    workflow: resolvedWorkflow,
    kikKodu: input.kikKodu,
    kikAdi: input.kikAdi,
    standartFormKodu: input.standartFormKodu ?? input.kikKodu,
    standartFormAdi: input.standartFormAdi ?? input.kikAdi,
  };
}

/** templateRegistry'nin iş akışı çözümlenmiş, bileşensiz (UI'dan bağımsız) görünümü. */
export const TEMPLATE_REGISTRY: TemplateType[] = (
  Object.values(templateRegistry) as TemplateDefinition<any>[]
).map((def) => defineTemplate(def as TemplateInput));

/**
 * inheritsFrom zincirini çözümler ve döngüsel bağımlılıkları kontrol eder.
 */
export function resolveTemplateWorkflow(
  templateId: string,
  registry: TemplateType[] = TEMPLATE_REGISTRY,
): TemplateWorkflow | undefined {
  const templateMap = new Map<string, TemplateType>();
  registry.forEach((t) => templateMap.set(t.id, t));

  const target = templateMap.get(templateId);
  if (!target) return undefined;
  if (!target.workflow) return undefined;

  if (!target.workflow.inheritsFrom) {
    return target.workflow;
  }

  const visited = new Set<string>([templateId]);
  let currentId: string | undefined = target.workflow.inheritsFrom;

  while (currentId) {
    if (visited.has(currentId)) {
      throw new Error(
        `Döngüsel şablon bağımlılığı tespit edildi: ${
          Array.from(visited).join(" -> ")
        } -> ${currentId}`,
      );
    }
    visited.add(currentId);

    const parent = templateMap.get(currentId);
    if (!parent) {
      throw new Error(
        `Miras alınacak şablon bulunamadı: "${currentId}" (referans veren: "${templateId}")`,
      );
    }

    if (!parent.workflow?.inheritsFrom) {
      if (!parent.workflow) {
        throw new Error(
          `Miras alınacak şablonun workflow tanımı yok: "${currentId}"`,
        );
      }
      return { ...parent.workflow, explicitState: "from_profile" };
    }

    currentId = parent.workflow.inheritsFrom;
  }

  return target.workflow;
}

/** 'from_profile' explicitState durumundaki tüm şablonları listeler. */
export function getFromProfileTemplates(
  registry: TemplateType[] = TEMPLATE_REGISTRY,
): TemplateType[] {
  return registry.filter((t) => t.workflow?.explicitState === "from_profile");
}

/** Belirli bir explicitState durumundaki şablonları filtreler. */
export function getTemplatesByExplicitState(
  state: ExplicitState,
  registry: TemplateType[] = TEMPLATE_REGISTRY,
): TemplateType[] {
  return registry.filter((t) => t.workflow?.explicitState === state);
}
