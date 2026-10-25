import React, { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useDosyalarHooks } from '../dosyalar/dosyalar.hooks'
import { HarcamaMerkeziHero } from './components/harcama-merkezi/HarcamaMerkeziHero'
import { HarcamaMerkeziModules } from './components/harcama-merkezi/HarcamaMerkeziModules'
import { HarcamaMerkeziSimulator } from './components/harcama-merkezi/HarcamaMerkeziSimulator'
import { HarcamaMerkeziWizard } from './components/harcama-merkezi/HarcamaMerkeziWizard'

export default function HarcamaMerkeziScreen(): React.JSX.Element {
  const { institutionName, limitType } = useSettingsStore()
  const { dosyalar } = useDosyalarHooks()

  // State for Live Tender Law & Budget Calculator
  const [simulatedBudget, setSimulatedBudget] = useState<number>(650000)
  const [simulatedWorkType, setSimulatedWorkType] = useState<'mal' | 'hizmet' | 'yapim'>('mal')

  // Format Currency Helper
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val)
  }

  const activeLimit = limitType === 'buyuksehir' ? 1021827 : 340391

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. TOP HERO BANNER */}
      <HarcamaMerkeziHero
        institutionName={institutionName}
        activeLimit={activeLimit}
        dosyalarCount={dosyalar.length}
        formatCurrency={formatCurrency}
      />

      {/* 2. CORE PROCESS CARDS GRID (4 BÜYÜK KAMU SÜRECİ) */}
      <HarcamaMerkeziModules activeLimit={activeLimit} formatCurrency={formatCurrency} />

      {/* 3. 4734 SAYILI KANUN: BÜTÇE LİMİTLERİ & CANLI SİMÜLATÖR */}
      <HarcamaMerkeziSimulator
        simulatedBudget={simulatedBudget}
        setSimulatedBudget={setSimulatedBudget}
        simulatedWorkType={simulatedWorkType}
        setSimulatedWorkType={setSimulatedWorkType}
        activeLimit={activeLimit}
        formatCurrency={formatCurrency}
      />

      {/* 4. İLLER BANKASI PANELİ & AKILLI SÜREÇ SİHİRBAZI */}
      <HarcamaMerkeziWizard activeLimit={activeLimit} formatCurrency={formatCurrency} />
    </div>
  )
}
