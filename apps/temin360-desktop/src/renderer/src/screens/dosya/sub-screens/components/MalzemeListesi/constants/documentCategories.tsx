import React from 'react'
import {
  BookOpen,
  Building2,
  Calculator,
  Check,
  ClipboardList,
  Download,
  FileCheck,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Layers,
  Link2,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react'
import type { MalzemeTabloPopoverProps } from '../types'

export interface PopoverItemConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconColorClass?: string
  itemClassName?: string
  onClick?: () => void
  steps?: number[]
}

export interface PopoverCategoryConfig {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColorClass?: string
  steps?: number[]
  items: PopoverItemConfig[]
}

export function buildDocumentCategories(props: MalzemeTabloPopoverProps): PopoverCategoryConfig[] {
  const {
    step,
    disableDocumentGuidance,
    onIhtiyacListesi,
    onIhtiyacTalepFormu,
    onLuzumMuzekkeresi,
    onLuzumMuzekkeresiOnayEki,
    onLuzumMuzekkeresiTeslimTesellum,
    onHarcamaTalimati,
    onHarcamaPusulasi,
    onGorevlendirmeOnayi,
    onGorevlendirmeOnayEki,
    onYaklasikMaliyetKomisyonu,
    onMuayeneKabulKomisyonu,
    onMuayeneKabulBelgesi,
    onFiyatArastirmaKomisyonu,
    onPiyasaArastirmaGorevlendirmesi,
    onPiyasaArastirmaTutanagi,
    onYaklasikMaliyetHesapCetveli,
    onSonAlimCetveli,
    onPiyasaSonucCetveli,
    onTeklifIstemeMektubu,
    onTeklifMektubuDagitim,
    onTeklifMektubuKarma,
    onFirmalarTeklifCetveli,
    onYasaklilikSorgulama,
    onOnayBelgesi,
    onKabulEdilenTeklif,
    onSiparisFormu,
    onKabulMektubu,
    onSonucOnayBelgesi,
    onSozlesmeyeDavet,
    onStandartSozlesme,
    onAlternatifSozlesme,
    onUzunFormSozlesme,
    onButceSorgusu,
    onMuayeneKabulTutanagi,
    onHizmetKabulTutanagi,
    onKik048,
    onKik049,
    onKik050,
    onKik051,
    onOdemeEmriBelgesi,
    onOdemeYazisi,
    onTasinirIslemFisi
  } = props

  const rawCategories: PopoverCategoryConfig[] = [
    {
      id: 'talepBaslangic',
      title: 'Talep & Başlangıç Belgeleri',
      icon: FolderPlus,
      iconColorClass: 'text-teal-500',
      steps: [1],
      items: [
        {
          id: 'ihtiyacListesi',
          label: 'İhtiyaç Listesi',
          icon: FileText,
          iconColorClass: 'text-teal-500',
          onClick: onIhtiyacListesi,
          steps: [1]
        },
        {
          id: 'ihtiyacTalepFormu',
          label: 'İhtiyaç Talep Formu',
          icon: FileText,
          iconColorClass: 'text-teal-500',
          onClick: onIhtiyacTalepFormu,
          steps: [1]
        },
        {
          id: 'luzumMuzekkeresi',
          label: 'Lüzum Müzekkeresi',
          icon: FileText,
          iconColorClass: 'text-teal-600',
          onClick: onLuzumMuzekkeresi,
          steps: [1]
        },
        {
          id: 'luzumMuzekkeresiOnayEki',
          label: 'Lüzum Müzekkeresi Onay Eki',
          icon: FileText,
          iconColorClass: 'text-teal-600',
          onClick: onLuzumMuzekkeresiOnayEki,
          steps: [1]
        },

        {
          id: 'luzumMuzekkeresiTeslimTesellum',
          label: 'Teslim Tesellüm Belgesi',
          icon: FileText,
          iconColorClass: 'text-teal-600',
          onClick: onLuzumMuzekkeresiTeslimTesellum,
          steps: [1]
        },

        {
          id: 'harcamaTalimati',
          label: 'Harcama Talimatı',
          icon: FileText,
          iconColorClass: 'text-teal-700',
          onClick: onHarcamaTalimati,
          steps: [1]
        }
      ]
    },
    {
      id: 'komisyon',
      title: 'Komisyon Görevlendirmeleri',
      icon: Users,
      iconColorClass: 'text-blue-500',
      steps: [1, 2, 3, 4],
      items: [
        {
          id: 'yaklasikMaliyetKomisyonu',
          label: 'Yaklaşık Maliyet Komisyonu Görevlendirmesi',
          icon: Users,
          iconColorClass: 'text-indigo-600',
          onClick:
            onPiyasaArastirmaGorevlendirmesi ||
            onYaklasikMaliyetKomisyonu ||
            onFiyatArastirmaKomisyonu,
          steps: [1, 2, 3, 4]
        },
        {
          id: 'muayeneKabulKomisyonu',
          label: 'Muayene ve Kabul Komisyonu Görevlendirmesi',
          icon: UserCheck,
          iconColorClass: 'text-sky-600',
          onClick: onMuayeneKabulKomisyonu || onMuayeneKabulBelgesi,
          steps: [1, 2, 3, 4]
        },
        {
          id: 'fiyatArastirmaVeMuayeneKomisyonu',
          label: 'Komisyon Görevlendirmesi',
          icon: FileCheck,
          iconColorClass: 'text-blue-600',
          onClick: onGorevlendirmeOnayi,
          steps: [1, 2, 3, 4]
        },
        {
          id: 'gorevlendirmeOnayEki',
          label: 'Komisyon (Onay Eki) Görevlendirmesi',
          icon: FileSignature,
          iconColorClass: 'text-teal-600',
          onClick: onGorevlendirmeOnayEki,
          steps: [1, 2, 3, 4]
        }
      ]
    },
    {
      id: 'fiyatArastirma',
      title: 'Fiyat Araştırma Belgeleri',
      icon: ClipboardList,
      iconColorClass: 'text-indigo-500',
      steps: [2],
      items: [
        {
          id: 'piyasaArastirmaTutanagi',
          label: 'Piyasa Araştırma Tutanağı',
          icon: ClipboardList,
          iconColorClass: 'text-indigo-500',
          onClick: onPiyasaArastirmaTutanagi,
          steps: [2]
        },
        {
          id: 'yaklasikMaliyetHesapCetveli',
          label: 'Yaklaşık Maliyet Hesap Cetveli',
          icon: Calculator,
          iconColorClass: 'text-emerald-500',
          onClick: onYaklasikMaliyetHesapCetveli,
          steps: [2]
        },
        {
          id: 'sonAlimCetveli',
          label: 'Son Alım Cetveli',
          icon: Calculator,
          iconColorClass: 'text-emerald-500',
          onClick: onSonAlimCetveli,
          steps: [1, 2]
        },
        {
          id: 'piyasaSonucCetveli',
          label: 'Piyasa Arş. Sonuc Cetveli',
          icon: FileSpreadsheet,
          iconColorClass: 'text-cyan-500',
          onClick: onPiyasaSonucCetveli,
          steps: [2]
        }
      ]
    },
    {
      id: 'istekliFirmalar',
      title: 'İstekli Firmalar & Teklif Belgeleri',
      icon: Building2,
      iconColorClass: 'text-purple-500',
      steps: [2],
      items: [
        {
          id: 'teklifIstemeMektubu',
          label: 'Teklif İsteme Mektubu / Fiyat Formu',
          icon: Send,
          iconColorClass: 'text-purple-500',
          onClick: onTeklifIstemeMektubu,
          steps: [2]
        },
        {
          id: 'teklifMektubuDagitim',
          label: 'Teklif Mektubu (Dağıtım)',
          icon: FileSignature,
          iconColorClass: 'text-violet-500',
          onClick: onTeklifMektubuDagitim,
          steps: [2]
        },
        {
          id: 'teklifMektubuKarma',
          label: 'Teklif Mektubu (Dağıtım Karma)',
          icon: Layers,
          iconColorClass: 'text-fuchsia-500',
          onClick: onTeklifMektubuKarma,
          steps: [2]
        },
        {
          id: 'firmalarTeklifCetveli',
          label: 'Firmalara Teklif Cetveli',
          icon: FileSpreadsheet,
          iconColorClass: 'text-indigo-500',
          onClick: onFirmalarTeklifCetveli,
          steps: [2]
        },
        {
          id: 'yasaklilikSorgulama',
          label: 'EKAP Yasaklılık Sorgulama',
          icon: ShieldAlert,
          iconColorClass: 'text-rose-500',
          onClick: onYasaklilikSorgulama,
          steps: [2]
        }
      ]
    },
    {
      id: 'onayBelgeleri',
      title: 'Onay Belgeleri',
      icon: FileCheck,
      iconColorClass: 'text-amber-500',
      steps: [1, 2],
      items: [
        {
          id: 'onayBelgesi',
          label: 'Doğrudan Temin Onay Belgesi',
          icon: FileCheck,
          iconColorClass: 'text-amber-500',
          onClick: onOnayBelgesi,
          steps: [2]
        }
      ]
    },
    {
      id: 'siparisSozlesme',
      title: 'Sipariş & Sözleşme Belgeleri',
      icon: FileSignature,
      iconColorClass: 'text-violet-500',
      steps: [3],
      items: [
        {
          id: 'kabulEdilenTeklif',
          label: 'Kabul Edilen Teklif / Sipariş Formu',
          icon: FileText,
          iconColorClass: 'text-blue-500',
          onClick: onKabulEdilenTeklif || onSiparisFormu || onKabulMektubu,
          steps: [3]
        },
        {
          id: 'sonucOnayBelgesi',
          label: 'Doğrudan Temin Sonuç Onay Belgesi',
          icon: FileCheck,
          iconColorClass: 'text-emerald-500',
          onClick: onSonucOnayBelgesi,
          steps: [3]
        },
        {
          id: 'sozlesmeyeDavet',
          label: 'Sözleşmeye Davet Mektubu',
          icon: Send,
          iconColorClass: 'text-violet-500',
          onClick: onSozlesmeyeDavet,
          steps: [3]
        },
        {
          id: 'standartSozlesme',
          label: 'Doğrudan Temin Sözleşmesi (Standart)',
          icon: FileSignature,
          iconColorClass: 'text-indigo-600',
          onClick: onStandartSozlesme,
          steps: [3]
        },
        {
          id: 'alternatifSozlesme',
          label: 'Doğrudan Temin Sözleşmesi (Alternatif)',
          icon: FileSignature,
          iconColorClass: 'text-purple-500',
          onClick: onAlternatifSozlesme,
          steps: [3]
        },
        {
          id: 'uzunFormSozlesme',
          label: 'Doğrudan Temin Sözleşmesi (Kapsamlı)',
          icon: FileSignature,
          iconColorClass: 'text-fuchsia-500',
          onClick: onUzunFormSozlesme,
          steps: [3]
        },
        {
          id: 'butceSorgusu',
          label: 'Bütçe Sorgusu / Ödenek Uygunluk',
          icon: Calculator,
          iconColorClass: 'text-teal-600',
          onClick: onButceSorgusu,
          steps: [3]
        }
      ]
    },
    {
      id: 'kabulOdeme',
      title: 'Muayene & Kabul & Ödeme Belgeleri',
      icon: Check,
      iconColorClass: 'text-emerald-600',
      steps: [4],
      items: [
        {
          id: 'muayeneKabulTutanagi',
          label: 'Muayene ve Kabul Tutanağı (Mal/İş)',
          icon: FileCheck,
          iconColorClass: 'text-emerald-500',
          onClick: onMuayeneKabulTutanagi,
          steps: [4]
        },
        {
          id: 'hizmetKabulTutanagi',
          label: 'Hizmet İşleri Kabul Tutanağı',
          icon: FileText,
          iconColorClass: 'text-sky-500',
          onClick: onHizmetKabulTutanagi,
          steps: [4]
        },
        {
          id: 'kik048',
          label: 'KİK048 - Geçici Kabul Teklif Belgesi (Yapım)',
          icon: FileSignature,
          iconColorClass: 'text-amber-600',
          onClick: onKik048,
          steps: [4]
        },
        {
          id: 'kik049',
          label: 'KİK049 - Geçici Kabul Tutanağı (Yapım)',
          icon: FileCheck,
          iconColorClass: 'text-amber-500',
          onClick: onKik049,
          steps: [4]
        },
        {
          id: 'kik050',
          label: 'KİK050 - Kesin Kabul Teklif Belgesi (Yapım)',
          icon: FileSignature,
          iconColorClass: 'text-orange-600',
          onClick: onKik050,
          steps: [4]
        },
        {
          id: 'kik051',
          label: 'KİK051 - Kesin Kabul Tutanağı (Yapım)',
          icon: FileCheck,
          iconColorClass: 'text-orange-500',
          onClick: onKik051,
          steps: [4]
        },
        {
          id: 'tasinirIslemFisi',
          label: 'Taşınır İşlem Fişi (TİF)',
          icon: Layers,
          iconColorClass: 'text-teal-600',
          onClick: onTasinirIslemFisi,
          steps: [4]
        },
        {
          id: 'odemeEmriBelgesi',
          label: 'Ödeme Emri Belgesi',
          icon: Calculator,
          iconColorClass: 'text-blue-600',
          onClick: onOdemeEmriBelgesi,
          steps: [4]
        },
        {
          id: 'harcamaPusulasi',
          label: 'Harcama Pusulası',
          icon: FileText,
          iconColorClass: 'text-indigo-500',
          onClick: onHarcamaPusulasi,
          steps: [4]
        },
        {
          id: 'odemeYazisi',
          label: 'Ödeme Yazısı',
          icon: Send,
          iconColorClass: 'text-slate-600',
          onClick: onOdemeYazisi,
          steps: [4]
        }
      ]
    }
  ]

  return rawCategories
    .map((cat) => {
      const activeItems = cat.items.filter((item) => {
        if (!item.onClick) return false
        if (step && item.steps && !item.steps.includes(step)) return false
        return true
      })

      if (step && cat.steps && !cat.steps.includes(step)) {
        return { ...cat, items: [] }
      }

      return { ...cat, items: activeItems }
    })
    .filter((cat) => cat.items.length > 0)
}

export function buildTableActionItems(props: MalzemeTabloPopoverProps): PopoverItemConfig[] {
  const {
    selectedCount = 0,
    totalCount = 0,
    onSelectAll,
    onDeleteSelected,
    onExcelImport,
    onDownloadTemplate,
    onExportToLibrary,
    onKatalogSync,
    onKomisyonSettings,
    onIstekliFirmaSettings
  } = props

  const isAllSelected = totalCount > 0 && selectedCount === totalCount

  const rawItems: PopoverItemConfig[] = [
    {
      id: 'selectAll',
      label: isAllSelected ? 'Seçimi Kaldır' : 'Tümünü Seç',
      icon: Check,
      iconColorClass: isAllSelected ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500',
      onClick: onSelectAll
    },
    {
      id: 'deleteSelected',
      label: selectedCount > 0 ? `Seçilenleri Sil (${selectedCount})` : 'Seçilenleri Sil',
      icon: Trash2,
      itemClassName:
        selectedCount > 0
          ? 'text-red-600 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 font-semibold'
          : 'text-slate-400 dark:text-slate-500',
      onClick: onDeleteSelected
    },
    {
      id: 'ihtiyacRaporuBagla',
      label: 'İhtiyaç Raporunu Bağla & Aktar',
      icon: Link2,
      iconColorClass: 'text-indigo-600 font-semibold',
      onClick: (props as any).onIhtiyacRaporuBagla
    },
    {
      id: 'katalogSync',
      label: 'Katalogdaki Değişiklikleri Eşitle',
      icon: RefreshCw,
      iconColorClass: 'text-cyan-500 font-medium',
      onClick: onKatalogSync
    },
    {
      id: 'exportMasterExcel',
      label: 'Dosya Excel Raporu (.xlsx)',
      icon: FileSpreadsheet,
      iconColorClass: 'text-emerald-600 font-semibold',
      onClick: (props as any).onExportMasterExcel
    },
    {
      id: 'excelImport',
      label: "Excel'den İçe Aktar",
      icon: FileSpreadsheet,
      iconColorClass: 'text-emerald-500',
      onClick: onExcelImport
    },
    {
      id: 'downloadTemplate',
      label: 'Excel Şablonunu İndir',
      icon: Download,
      iconColorClass: 'text-blue-500',
      onClick: onDownloadTemplate
    },
    {
      id: 'exportToLibrary',
      label: 'Genel Kütüphaneye Aktar',
      icon: BookOpen,
      iconColorClass: 'text-amber-500',
      onClick: onExportToLibrary
    },
    {
      id: 'istekliFirmaSettings',
      label: 'İstekli Firma Ayarları',
      icon: Building2,
      iconColorClass: 'text-purple-500',
      onClick: onIstekliFirmaSettings
    }
  ]

  return rawItems.filter((item) => Boolean(item.onClick))
}
