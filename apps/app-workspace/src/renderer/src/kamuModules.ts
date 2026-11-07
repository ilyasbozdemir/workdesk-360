import {
  Sparkles,
  Star,
  Compass,
  Users,
  Coins,
  LucideIcon
} from 'lucide-react'

export type KamuModuleKey =
  | 'all'
  | 'ihale_satin_alma'
  | 'cbs_arazi_su'
  | 'personel_ik'
  | 'bkmybs_mali'

export interface KamuModuleDefinition {
  key: KamuModuleKey
  name: string
  shortName: string
  miniLabel: string
  icon: LucideIcon
  badge: string
  color: string
  borderColor: string
  bgLight: string
  textColor: string
  tagline: string
  description: string
  targetCategory?: string
  matchingAppIds: string[]
}

export const KAMU_360_MODULES: Record<KamuModuleKey, KamuModuleDefinition> = {
  all: {
    key: 'all',
    name: 'Tüm Modüller (360° Portal)',
    shortName: 'Tüm Modüller',
    miniLabel: 'Tümü',
    icon: Sparkles,
    badge: '360°',
    color: '#3b82f6',
    borderColor: '#3b82f6',
    bgLight: 'bg-blue-500/15',
    textColor: 'text-blue-500',
    tagline: 'Genişletilmiş Tüm Süreçler',
    description: 'İhale, doğrudan temin, CBS arazi/su, personel ve bütçe süreçlerinin tümü.',
    matchingAppIds: []
  },
  ihale_satin_alma: {
    key: 'ihale_satin_alma',
    name: 'İhale ve Satın Alma Modülü',
    shortName: 'İhale & Satın Alma',
    miniLabel: 'İhale',
    icon: Star,
    badge: '4734 & 2886',
    color: '#2563eb',
    borderColor: '#2563eb',
    bgLight: 'bg-blue-500/15',
    textColor: 'text-blue-500',
    tagline: '4734 KİK Gider & 2886 DİK Gelir',
    description: '22/d Doğrudan Temin Masası, piyasa tutanakları, teklif matrisi ve kamu gelir ihaleleri.',
    matchingAppIds: ['dev.ilyasbozdemir.temin360', 'dev.ilyasbozdemir.ihale360', 'dev.ilyasbozdemir.flowdesk360']
  },
  cbs_arazi_su: {
    key: 'cbs_arazi_su',
    name: 'CBS, Arazi ve Su Altyapı Modülü',
    shortName: 'CBS & Su Altyapı',
    miniLabel: 'CBS/Su',
    icon: Compass,
    badge: 'Harita / Su',
    color: '#10b981',
    borderColor: '#10b981',
    bgLight: 'bg-emerald-500/15',
    textColor: 'text-emerald-500',
    tagline: 'Arazi, Parsel, Şebeke & Sayaç',
    description: 'Ada/parsel kadastro sorgusu, kamu mülkiyeti, içme suyu şebekesi ve saha analizleri.',
    matchingAppIds: ['dev.ilyasbozdemir.harita360', 'dev.ilyasbozdemir.diskanaliz360']
  },
  personel_ik: {
    key: 'personel_ik',
    name: 'İnsan Kaynakları & Personel (İK 360)',
    shortName: 'Personel & İK 360',
    miniLabel: 'İK 360',
    icon: Users,
    badge: '657 & Kadro',
    color: '#8b5cf6',
    borderColor: '#8b5cf6',
    bgLight: 'bg-purple-500/15',
    textColor: 'text-purple-500',
    tagline: 'Kadro, İzin, Görevlendirme & Liyakat',
    description: '657 Devlet Memurları, işçi kadroları, komisyon atamaları, izin ve görev takibi.',
    matchingAppIds: ['dev.ilyasbozdemir.personel360']
  },
  bkmybs_mali: {
    key: 'bkmybs_mali',
    name: 'Mali Yönetim & Bütçe (BKMYBS)',
    shortName: 'Mali Yönetim & Bütçe',
    miniLabel: 'Maliye',
    icon: Coins,
    badge: '5018 & Muhasebe',
    color: '#f59e0b',
    borderColor: '#f59e0b',
    bgLight: 'bg-amber-500/15',
    textColor: 'text-amber-500',
    tagline: '5018 Sayılı Kanun & Ödenek Planlaması',
    description: 'Bütçe tertipleri, analitik bütçe kodları, harcama kalemleri ve mali analizler.',
    matchingAppIds: ['dev.ilyasbozdemir.arsiv360', 'dev.ilyasbozdemir.evraktron', 'dev.ilyasbozdemir.belge360']
  }
}

