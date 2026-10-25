import React from 'react'
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  Coins,
  Database,
  FileText,
  FolderKanban,
  FolderOpen,
  FolderTree,
  Hammer,
  HelpCircle,
  Home,
  Key,
  Landmark,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  PackageSearch,
  Ruler,
  Scale,
  Settings,
  Star,
  Tag,
  User,
  Users,
  Boxes,
  Store,
  Sparkles,
  FileSpreadsheet,
  FileDown
} from 'lucide-react'
import { APP_ROUTES } from '../../constants/routeConstants'
import { useModuleStore } from '../../store/moduleStore'

export interface SubItem {
  name: string
  path: string
  icon: React.ElementType
  badge?: string
}

export interface MenuItem {
  name: string
  path?: string
  icon: React.ElementType
  badge?: string
  children?: SubItem[]
  onClick?: () => void
}

export interface MenuGroup {
  title: string
  items: MenuItem[]
}

export type ProcurementMode = 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886'

export function getSidebarMenuGroups(
  procurementMode: ProcurementMode,
  activeDosyaId?: string | number | null,
  isInstalledParam?: (id: string) => boolean
): MenuGroup[] {
  const isInstalled =
    isInstalledParam || ((id: string) => useModuleStore.getState().isInstalled(id))
  const isBelgelerimActive = true
  const isDtOzelBelgelerActive = true
  const isDtActive = true
  const isPersonelIzinActive = isInstalled('modul-personel-izin') || isInstalled('personel')
  const isKikLimitActive = true
  const isEbysActive =
    isInstalled('ebys-resmi-yazisma-studyosu') ||
    isInstalled('modul-ebys-sablon') ||
    isInstalled('ebys')
  const isTasinirActive =
    isInstalled('tasinir-ambar') || isInstalled('modul-tasinir-tif') || isInstalled('tasinir')

  const belgelerimMenuItem: MenuItem = {
    name: 'Belgelerim (Özel Alan)',
    path: APP_ROUTES.BELGELERIM,
    icon: FolderTree,
    badge: 'YENİ'
  }

  const dtOzelBelgelerMenuItem: MenuItem = {
    name: 'Özel Belge & Yer Tutucular',
    path: APP_ROUTES.DEGISKENLER,
    icon: Sparkles,
    badge: 'BETA'
  }
  if (procurementMode === 'devlet_ihale_2886') {
    return [
      {
        title: '2886 Devlet İhale (Gelir)',
        items: [
          { name: 'Gösterge Paneli', path: APP_ROUTES.DASHBOARD, icon: Home },
          ...(isBelgelerimActive ? [belgelerimMenuItem] : []),
          {
            name: 'EBYS Resmî Yazı Şablonları',
            path: APP_ROUTES.EBYS,
            icon: FileText,
            badge: 'YENİ'
          },
          {
            name: '2886 İhale Dosyaları Yönetimi',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=dosyalar`,
            icon: FolderOpen,
            badge: 'DOSYALAR'
          },
          {
            name: '2886 Satış & Kiralama Masası',
            path: APP_ROUTES.DEVLET_IHALE_2886,
            icon: Landmark,
            badge: 'GELİR'
          },
          {
            name: 'Modül & Belge Mağazası',
            path: APP_ROUTES.MODUL_MAGAZASI,
            icon: Store,
            badge: 'YENİ'
          }
        ]
      },
      {
        title: '2886 Süreç İşlemleri',
        items: [
          {
            name: '📁 İhale Dosyaları Yönetimi',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=dosyalar`,
            icon: FolderOpen,
            badge: 'YÖNETİM'
          },
          {
            name: '🏛️ Satış & Kiralama Masası',
            path: APP_ROUTES.DEVLET_IHALE_2886,
            icon: Landmark,
            badge: '2886'
          },
          {
            name: '📊 Muhammen Bedel & Takdir',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=takdir`,
            icon: Calculator
          },
          {
            name: '⚖️ Usul & Karar Matrisi (Md. 45/36/51)',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=usul`,
            icon: Scale
          },
          {
            name: '🔨 İhale Günü & Teklifler',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=ihale_gunu`,
            icon: Hammer
          },
          {
            name: '📑 Süreç & İlan Evrakları (16 Evrak)',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=evraklar`,
            icon: FileText
          },
          {
            name: '💰 Kira Artış & Tahsilat Takibi',
            path: `${APP_ROUTES.DEVLET_IHALE_2886}?tab=tahsilat`,
            icon: Coins,
            badge: '5018'
          },
          {
            name: '🧮 İhale, Belge & Ofis Araçları',
            path: APP_ROUTES.HESAPLAMA_ARACLARI,
            icon: Calculator,
            badge: 'ARAÇLAR'
          }
        ]
      },
      {
        title: 'Kayıtlar & Tanımlar (2886)',
        items: [
          {
            name: 'İdare & Emlak Servisi',
            icon: Building2,
            children: [
              { name: 'İdare Bilgileri', path: APP_ROUTES.KURUM, icon: Building2 },
              { name: 'Emlak & İstimlak Servisleri', path: APP_ROUTES.BIRIMLER, icon: LayoutGrid },
              { name: 'İhale Yetkilileri & Raportörler', path: APP_ROUTES.PERSONEL, icon: Users },
              { name: 'Encümen & Takdir Komisyonu', path: APP_ROUTES.KOMISYONLAR, icon: Users },
              { name: 'Görev Tanımları', path: APP_ROUTES.KOMISYON_GOREVLERI, icon: Settings }
            ]
          },
          { name: 'İstekliler & Kiracılar / Alıcılar', path: APP_ROUTES.FIRMALAR, icon: Building2 },
          {
            name: 'Malzeme & Kodlar (2886)',
            icon: PackageSearch,
            children: [
              {
                name: 'Taşınmaz & Mal Kataloğu',
                path: APP_ROUTES.MALZEMELER,
                icon: PackageSearch
              },
              {
                name: 'Taşınmaz / Taşınır Kodları',
                path: APP_ROUTES.TASINIR_KOD,
                icon: FolderTree
              },
              { name: 'Ölçü Birimleri', path: APP_ROUTES.OLCU_BIRIMLERI, icon: Ruler }
            ]
          }
        ]
      },
      {
        title: 'Sistem',
        items: [
          { name: 'Raporlar & Gelir Cetvelleri', path: APP_ROUTES.RAPORLAR, icon: BarChart3 },
          { name: '2886 Mevzuat ve Parametreler', path: APP_ROUTES.MEVZUAT, icon: Scale },
          { name: 'Şablon Listesi ve Süreçler', path: APP_ROUTES.TASLAK_YONETIM, icon: Star },
          { name: 'Sürüm Notları', path: APP_ROUTES.CHANGELOG, icon: Megaphone },
          { name: 'Yardım & Kılavuzlar', path: APP_ROUTES.YARDIM, icon: HelpCircle },
          {
            name: 'Ayarlar',
            icon: Settings,
            children: [
              { name: 'Genel Ayarlar', path: APP_ROUTES.AYARLAR, icon: Settings },
              { name: 'Kullanıcı Profili & Şifre', path: APP_ROUTES.PROFIL, icon: User },
              { name: 'Mevzuat ve Parametreler', path: APP_ROUTES.MEVZUAT, icon: Scale },
              { name: 'Toplu İçe Aktarma', path: APP_ROUTES.IMPORT, icon: Database },
              {
                name: 'Form Builder v2 (Sürükle & Bırak)',
                path: APP_ROUTES.FORM_BUILDER,
                icon: LayoutTemplate,
                badge: 'YENİ'
              },
              { name: 'Şablon Yönetimi', path: APP_ROUTES.SABLONLAR, icon: FileText },
              { name: 'Şablon & Kategori Yönetimi', path: APP_ROUTES.DEGISKENLER, icon: Key }
            ]
          }
        ]
      }
    ]
  }

  if (procurementMode === 'ihale') {
    return [
      {
        title: 'İhale Süreçleri (KİK 19/21)',
        items: [
          { name: 'Gösterge Paneli', path: APP_ROUTES.DASHBOARD, icon: Home },
          {
            name: 'EBYS Resmî Yazı Şablonları',
            path: APP_ROUTES.EBYS,
            icon: FileText,
            badge: 'YENİ'
          },
          {
            name: 'Harcama & İhale Merkezi',
            path: APP_ROUTES.HARCAMA_MERKEZI,
            icon: Landmark,
            badge: 'KİK'
          },
          {
            name: 'İhale Hakediş & Harcama',
            path: APP_ROUTES.HAKEDIS,
            icon: Hammer,
            badge: 'HAKEDİŞ'
          },
          {
            name: 'Modül & Belge Mağazası',
            path: APP_ROUTES.MODUL_MAGAZASI,
            icon: Store,
            badge: 'YENİ'
          }
        ]
      },
      {
        title: 'İhale Süreç Yönetimi',
        items: [
          ...(activeDosyaId
            ? [
                {
                  name: 'Aktif Dosya (Süreç Takip)',
                  path: APP_ROUTES.TAKIP,
                  icon: FolderOpen,
                  badge: 'AÇIK'
                },
                {
                  name: 'Dosya İhtiyaç Raporu & Lüzum',
                  path: `${APP_ROUTES.IHTIYAC_RAPORLARI}?dosyaId=${activeDosyaId}`,
                  icon: FileSpreadsheet,
                  badge: 'AKTİF'
                }
              ]
            : []),
          {
            name: 'Açık & Pazarlık İhale Masası',
            path: APP_ROUTES.HARCAMA_MERKEZI,
            icon: Landmark,
            badge: '19/21'
          },
          {
            name: activeDosyaId ? 'Tüm İhtiyaç Raporları (Havuz)' : 'İhtiyaç Raporları',
            path: APP_ROUTES.IHTIYAC_RAPORLARI,
            icon: FileSpreadsheet,
            badge: activeDosyaId ? 'HAVUZ' : 'YENİ'
          },
          {
            name: 'Hakediş & Harcama İşlemleri',
            path: APP_ROUTES.HAKEDIS,
            icon: Hammer,
            badge: 'YENİ'
          },
          {
            name: 'İhale & Hesaplama Araçları',
            path: APP_ROUTES.HESAPLAMA_ARACLARI,
            icon: Calculator,
            badge: '4734/2886'
          },
          {
            name: 'Proje Yönetimi & Yatırımlar',
            path: APP_ROUTES.PROJELER,
            icon: FolderKanban
          },
          {
            name: 'Şablon Listesi ve Dokümanlar',
            path: APP_ROUTES.TASLAK_YONETIM,
            icon: Star
          }
        ]
      },
      {
        title: 'Kayıtlar & Tanımlar (İhale)',
        items: [
          {
            name: 'İdare & Makam Yönetimi',
            icon: Building2,
            children: [
              { name: 'İdare Bilgileri', path: APP_ROUTES.KURUM, icon: Building2 },
              { name: 'İhale Birimleri (EKAP)', path: APP_ROUTES.BIRIMLER, icon: LayoutGrid },
              { name: 'İhale Yetkilileri & Raportörler', path: APP_ROUTES.PERSONEL, icon: Users },
              { name: 'İhale Komisyonları (Md. 6)', path: APP_ROUTES.KOMISYONLAR, icon: Users },
              { name: 'Muayene & Kabul Heyetleri', path: APP_ROUTES.KOMISYONLAR, icon: Users },
              { name: 'Görev Tanımları', path: APP_ROUTES.KOMISYON_GOREVLERI, icon: Settings }
            ]
          },
          { name: 'Müteahhit & İstekli Firmalar', path: APP_ROUTES.FIRMALAR, icon: Building2 },
          {
            name: 'Pozlar & OKAS Kodları',
            icon: PackageSearch,
            children: [
              { name: 'ÇŞB Birim Fiyat Pozları', path: APP_ROUTES.POZLAR, icon: BookOpen },
              { name: 'OKAS Kodları', path: APP_ROUTES.OKAS_KOD, icon: Tag },
              { name: 'Bütçe Kodları (4 Düzey)', path: APP_ROUTES.BUTCE_KOD, icon: Coins },
              {
                name: 'Mal, Hizmet & Yapım Kataloğu',
                path: APP_ROUTES.MALZEMELER,
                icon: PackageSearch
              },
              { name: 'Ölçü Birimleri', path: APP_ROUTES.OLCU_BIRIMLERI, icon: Ruler }
            ]
          }
        ]
      },
      {
        title: 'Sistem',
        items: [
          { name: 'Raporlar & Harcama Analizleri', path: APP_ROUTES.RAPORLAR, icon: BarChart3 },
          { name: 'İhale Mevzuatı ve Parametreler', path: APP_ROUTES.MEVZUAT, icon: Scale },
          { name: 'Sürüm Notları', path: APP_ROUTES.CHANGELOG, icon: Megaphone },
          { name: 'Yardım & Kılavuzlar', path: APP_ROUTES.YARDIM, icon: HelpCircle },
          {
            name: 'Ayarlar',
            icon: Settings,
            children: [
              { name: 'Genel Ayarlar', path: APP_ROUTES.AYARLAR, icon: Settings },
              { name: 'Kullanıcı Profili & Şifre', path: APP_ROUTES.PROFIL, icon: User },
              { name: 'Mevzuat ve Parametreler', path: APP_ROUTES.MEVZUAT, icon: Scale },
              { name: 'Toplu İçe Aktarma', path: APP_ROUTES.IMPORT, icon: Database },
              {
                name: 'Form Builder v2 (Sürükle & Bırak)',
                path: APP_ROUTES.FORM_BUILDER,
                icon: LayoutTemplate,
                badge: 'YENİ'
              },
              { name: 'Şablon Yönetimi', path: APP_ROUTES.SABLONLAR, icon: FileText },
              { name: 'Şablon & Kategori Yönetimi', path: APP_ROUTES.DEGISKENLER, icon: Key }
            ]
          }
        ]
      }
    ]
  }

  // Genel Yönetim (Varsayılan Modüler Görünüm)
  return [
    {
      title: 'Genel Bakış',
      items: [
        { name: 'Gösterge Paneli', path: APP_ROUTES.DASHBOARD, icon: Home },
        {
          name: 'Doğrudan Temin Dosyaları',
          path: APP_ROUTES.DOSYALAR,
          icon: FileText,
          badge: '22/d'
        },
        {
          name: 'Harici Dosya Aktar (JSON)',
          path: APP_ROUTES.HARICI_DOSYA_AKTAR,
          icon: FileDown,
          badge: 'YENİ'
        },
        {
          name: 'Modül Mağazası',
          path: APP_ROUTES.MODUL_MAGAZASI,
          icon: Store,
          badge: 'YENİ'
        },
        {
          name: 'Çıktı & Üretim Merkezi',
          path: APP_ROUTES.CIKTI_MERKEZI_DASHBOARD,
          icon: FileText,
          badge: 'PRO'
        }
      ]
    },
    {
      title: 'Aktif İdari Modüller',
      items: [
        ...(isDtActive
          ? [
              {
                name: 'Doğrudan Temin & Satınalma',
                icon: Landmark,
                badge: '4734',
                children: [
                  {
                    name: 'Doğrudan Temin Dosyaları',
                    path: APP_ROUTES.DOSYALAR,
                    icon: FileText,
                    badge: '22/d'
                  },
                  {
                    name: 'Harici Dosya Aktar (JSON)',
                    path: APP_ROUTES.HARICI_DOSYA_AKTAR,
                    icon: FileDown,
                    badge: 'YENİ'
                  },
                  ...(activeDosyaId
                    ? [
                        {
                          name: 'Dosya İhtiyaç Raporu & Lüzum',
                          path: `${APP_ROUTES.IHTIYAC_RAPORLARI}?dosyaId=${activeDosyaId}`,
                          icon: FileSpreadsheet,
                          badge: 'AKTİF'
                        },
                        {
                          name: 'İhtiyaç Raporları Havuzu',
                          path: APP_ROUTES.IHTIYAC_RAPORLARI,
                          icon: FileSpreadsheet,
                          badge: 'HAVUZ'
                        }
                      ]
                    : [
                        {
                          name: 'İhtiyaç Raporları',
                          path: APP_ROUTES.IHTIYAC_RAPORLARI,
                          icon: FileSpreadsheet,
                          badge: 'YENİ'
                        }
                      ]),
                  {
                    name: 'Harcama & Hakediş Merkezi',
                    path: APP_ROUTES.HARCAMA_MERKEZI,
                    icon: Landmark
                  },
                  {
                    name: 'Süreç Akış Haritası',
                    path: APP_ROUTES.SUREC_AKISI,
                    icon: Layers
                  }
                ]
              }
            ]
          : []),
        ...(isPersonelIzinActive
          ? [
              {
                name: 'Personel & İzin / Görev Takibi',
                icon: Users,
                badge: '657/4857',
                children: [
                  {
                    name: 'Kadro & Özlük Yönetimi',
                    path: APP_ROUTES.PERSONEL,
                    icon: Users
                  },
                  {
                    name: 'İzin & Rapor Takip Merkezi',
                    path: `${APP_ROUTES.PERSONEL}?tab=izinler`,
                    icon: BookOpen,
                    badge: 'MEVZUAT'
                  },
                  {
                    name: 'Komisyon & Görevlendirme',
                    path: APP_ROUTES.KOMISYONLAR,
                    icon: Settings
                  }
                ]
              }
            ]
          : []),
        ...(isKikLimitActive
          ? [
              {
                name: 'Bütçe & KİK Limit Denetleyici',
                path: `${APP_ROUTES.HESAPLAMA_ARACLARI}?tab=butce`,
                icon: Calculator,
                badge: 'KİK'
              }
            ]
          : []),
        ...(isEbysActive
          ? [
              {
                name: 'EBYS Resmî Yazı Şablonları',
                path: APP_ROUTES.EBYS,
                icon: FileText,
                badge: 'YENİ'
              }
            ]
          : []),
        ...(isTasinirActive
          ? [
              {
                name: 'Taşınır (TİF) & Envanter',
                icon: PackageSearch,
                children: [
                  {
                    name: 'Ambar & Stok Yönetimi',
                    path: APP_ROUTES.AMBAR,
                    icon: Boxes
                  },
                  {
                    name: 'Taşınır Kodları (TİF)',
                    path: APP_ROUTES.TASINIR_KOD,
                    icon: FolderTree
                  }
                ]
              }
            ]
          : []),
        ...(isBelgelerimActive ? [belgelerimMenuItem] : []),
        ...(isDtOzelBelgelerActive ? [dtOzelBelgelerMenuItem] : [])
      ]
    },
    // Yalnızca aktif modüller varsa Süreç Yönetimi gösterilir
    ...(isDtActive
      ? [
          {
            title: 'Doğrudan Temin Süreçleri',
            items: [
              ...(activeDosyaId
                ? [
                    {
                      name: 'Aktif Dosya (Süreç Takip)',
                      path: APP_ROUTES.TAKIP,
                      icon: FolderOpen,
                      badge: 'AÇIK'
                    },
                    {
                      name: 'Dosya İhtiyaç Raporu & Lüzum',
                      path: `${APP_ROUTES.IHTIYAC_RAPORLARI}?dosyaId=${activeDosyaId}`,
                      icon: FileSpreadsheet,
                      badge: 'AKTİF'
                    },
                    {
                      name: 'Süreç Akış Haritası',
                      path: APP_ROUTES.SUREC_AKISI,
                      icon: Layers,
                      badge: 'BETA'
                    }
                  ]
                : []),
              {
                name: 'Doğrudan Temin Dosyaları',
                path: APP_ROUTES.DOSYALAR,
                icon: FileText
              },
              {
                name: 'Harici Dosya Aktar & Eşle',
                path: APP_ROUTES.HARICI_DOSYA_AKTAR,
                icon: FileDown,
                badge: 'JSON'
              },
              {
                name: activeDosyaId ? 'Tüm İhtiyaç Raporları (Havuz)' : 'İhtiyaç Raporları',
                path: APP_ROUTES.IHTIYAC_RAPORLARI,
                icon: FileSpreadsheet,
                badge: activeDosyaId ? 'HAVUZ' : 'YENİ'
              },
              {
                name: 'Hakediş & Harcama İşlemleri',
                path: APP_ROUTES.HAKEDIS,
                icon: Hammer
              },
              {
                name: 'İhale & Hesaplama Araçları',
                path: APP_ROUTES.HESAPLAMA_ARACLARI,
                icon: Calculator,
                badge: '4734/2886'
              },
              {
                name: 'Proje Yönetimi & Yatırımlar',
                path: APP_ROUTES.PROJELER,
                icon: FolderKanban,
                badge: 'YENİ'
              }
            ]
          }
        ]
      : []),

    // Kurumsal Tanımlar (Yalnızca ilgili modüller kuruluysa alt elemanları görünür)
    {
      title: 'Kurumsal Kayıtlar',
      items: [
        {
          name: 'İdare & Teşkilat Yapısı',
          icon: Building2,
          children: [
            { name: 'Kurum Bilgileri', path: APP_ROUTES.KURUM, icon: Building2 },
            { name: 'Birim Yönetimi', path: APP_ROUTES.BIRIMLER, icon: LayoutGrid },
            ...(isPersonelIzinActive
              ? [
                  { name: 'Personel Yönetimi', path: APP_ROUTES.PERSONEL, icon: Users },
                  { name: 'Komisyon & Kurullar', path: APP_ROUTES.KOMISYONLAR, icon: Users },
                  {
                    name: 'Görev Tanımları',
                    path: APP_ROUTES.KOMISYON_GOREVLERI,
                    icon: Settings
                  }
                ]
              : []),
            ...(isTasinirActive
              ? [{ name: 'Ambar & Stok Yönetimi', path: APP_ROUTES.AMBAR, icon: Boxes }]
              : [])
          ]
        },
        ...(isDtActive
          ? [
              { name: 'İstekli Firma Yönetimi', path: APP_ROUTES.FIRMALAR, icon: Building2 },
              {
                name: 'Malzeme & Kodlar',
                icon: PackageSearch,
                children: [
                  {
                    name: 'Mal, Hizmet & Yapım Kataloğu',
                    path: APP_ROUTES.MALZEMELER,
                    icon: PackageSearch
                  },
                  { name: 'Taşınır Kodları', path: APP_ROUTES.TASINIR_KOD, icon: FolderTree },
                  { name: 'OKAS Kodları', path: APP_ROUTES.OKAS_KOD, icon: Tag },
                  { name: 'Bütçe Kodları (4 Düzey)', path: APP_ROUTES.BUTCE_KOD, icon: Coins },
                  { name: 'Birim Fiyat Pozları', path: APP_ROUTES.POZLAR, icon: BookOpen },
                  { name: 'Ölçü Birimleri', path: APP_ROUTES.OLCU_BIRIMLERI, icon: Ruler }
                ]
              }
            ]
          : [])
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Raporlar', path: APP_ROUTES.RAPORLAR, icon: BarChart3 },
        {
          name: 'Şablon Listesi ve Süreçler',
          path: APP_ROUTES.TASLAK_YONETIM,
          icon: Star
        },
        { name: 'Sürüm Notları', path: APP_ROUTES.CHANGELOG, icon: Megaphone },
        { name: 'Yardım & Kılavuzlar', path: APP_ROUTES.YARDIM, icon: HelpCircle },
        {
          name: 'Ayarlar',
          icon: Settings,
          children: [
            { name: 'Genel Ayarlar', path: APP_ROUTES.AYARLAR, icon: Settings },
            { name: 'Kullanıcı Profili & Şifre', path: APP_ROUTES.PROFIL, icon: User },
            { name: 'Mevzuat ve Parametreler', path: APP_ROUTES.MEVZUAT, icon: Scale },
            { name: 'Toplu İçe Aktarma', path: APP_ROUTES.IMPORT, icon: Database },
            {
              name: 'Form Builder v2 (Sürükle & Bırak)',
              path: APP_ROUTES.FORM_BUILDER,
              icon: LayoutTemplate,
              badge: 'YENİ'
            },
            {
              name: 'Şablon Yönetimi',
              path: APP_ROUTES.SABLONLAR,
              icon: FileText
            },
            {
              name: 'Şablon & Kategori Yönetimi',
              path: APP_ROUTES.DEGISKENLER,
              icon: Key
            }
          ]
        }
      ]
    }
  ]
}
