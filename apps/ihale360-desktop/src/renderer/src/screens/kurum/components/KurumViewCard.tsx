import React, { useState } from 'react'
import { Key } from 'lucide-react'
import { KurumVerisi } from '../kurum.hooks'
import { KeyValuePair, KurumMetadataManager } from './KurumMetadataManager'
import { useSettingsStore } from '../../../store/settingsStore'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { KurumHeroBanner } from './view-card/KurumHeroBanner'
import { KurumEvrakAntetPreview } from './view-card/KurumEvrakAntetPreview'
import { KurumBilgiKartlariGrid } from './view-card/KurumBilgiKartlariGrid'

interface KurumViewCardProps {
  data: Partial<KurumVerisi>
  institutionLetterhead: string[]
  parentInstitutionLines: string[]
  customMetadata: KeyValuePair[]
  onEditClick: () => void
  institutionLogo?: string | null
  logoLeft?: string | null
  logoRight?: string | null
  showLogoLeft?: boolean
  showLogoRight?: boolean
}

export const KurumViewCard: React.FC<KurumViewCardProps> = ({
  data,
  institutionLetterhead,
  parentInstitutionLines,
  customMetadata,
  onEditClick,
  institutionLogo: propInstitutionLogo,
  logoLeft: propLogoLeft,
  logoRight: propLogoRight,
  showLogoLeft: propShowLogoLeft,
  showLogoRight: propShowLogoRight
}) => {
  const storeSettings = useSettingsStore()

  const effectiveInstitutionLogo =
    propInstitutionLogo !== undefined
      ? propInstitutionLogo
      : storeSettings.institutionLogo || data.logo_kurum || null

  const effectiveLogoLeft =
    propLogoLeft !== undefined ? propLogoLeft : storeSettings.logoLeft || data.logo_sol || null

  const effectiveLogoRight =
    propLogoRight !== undefined ? propLogoRight : storeSettings.logoRight || data.logo_sag || null

  const effectiveShowLogoLeft =
    propShowLogoLeft !== undefined ? propShowLogoLeft : storeSettings.showLogoLeft !== false

  const effectiveShowLogoRight =
    propShowLogoRight !== undefined ? propShowLogoRight : storeSettings.showLogoRight !== false

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string | undefined, fieldKey: string): Promise<void> => {
    if (!text || text === '—') return
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedField(fieldKey)
      setTimeout(() => setCopiedField(null), 1800)
    }
  }

  // Primary avatar logo for profile header
  const profileAvatar =
    effectiveInstitutionLogo ||
    effectiveLogoLeft ||
    effectiveLogoRight ||
    (data as Record<string, any>)?.kurum_logo ||
    (data as Record<string, any>)?.logo_url ||
    null

  const hasLetterhead =
    institutionLetterhead.length > 0 &&
    institutionLetterhead.some((l: string): boolean => Boolean(l && l.trim().length > 0))

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative z-0 pb-6">
      {/* 🌟 HERO COVER BANNER & INSTITUTION PROFILE HEADER */}
      <KurumHeroBanner
        data={data}
        profileAvatar={profileAvatar}
        onEditClick={onEditClick}
        effectiveLogoLeft={effectiveLogoLeft}
        effectiveLogoRight={effectiveLogoRight}
        effectiveShowLogoLeft={effectiveShowLogoLeft}
        effectiveShowLogoRight={effectiveShowLogoRight}
      />

      {/* 📄 CANLI RESMİ EVRAK BAŞLIĞI & ANTET ÖNİZLEMESİ */}
      <KurumEvrakAntetPreview
        institutionLetterhead={institutionLetterhead}
        parentInstitutionLines={parentInstitutionLines}
        hasLetterhead={hasLetterhead}
        effectiveLogoLeft={effectiveLogoLeft}
        effectiveLogoRight={effectiveLogoRight}
        effectiveInstitutionLogo={effectiveInstitutionLogo}
        effectiveShowLogoLeft={effectiveShowLogoLeft}
        effectiveShowLogoRight={effectiveShowLogoRight}
      />

      {/* 📊 RESMİ BİLGİ KARTLARI (4'LÜ / 2'Lİ RESPONSIVE GRID) */}
      <KurumBilgiKartlariGrid data={data} copiedField={copiedField} onCopy={handleCopy} />

      {/* ⚙️ ÖZEL PARAMETRELER & DİNAMİK ALANLAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            Özel Parametreler & Key-Value Alanları ({customMetadata.length})
          </h3>
        </div>

        <KurumMetadataManager metadata={customMetadata} onChange={() => {}} isReadOnly={true} />
      </div>
    </div>
  )
}
