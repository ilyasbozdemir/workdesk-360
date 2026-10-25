import React from 'react'
import { DatabaseSeederCard } from './developer/DatabaseSeederCard'
import { DevUpdateTestCard } from './developer/DevUpdateTestCard'
import { VitestRunnerCard } from './developer/VitestRunnerCard'
import { SystemLogsCard } from './developer/SystemLogsCard'

interface DeveloperTabProps {
  isPackaged?: boolean
  devUpdateTestMode: boolean
  setDevUpdateTestMode: (val: boolean) => void
  devUpdateVersion: string
  setDevUpdateVersion: (val: string) => void
  githubReleases: string[]
}

export const DeveloperTab: React.FC<DeveloperTabProps> = ({
  devUpdateTestMode,
  setDevUpdateTestMode,
  devUpdateVersion,
  setDevUpdateVersion,
  githubReleases
}) => {
  return (
    <div className="space-y-6">
      {/* 1. TEST VERİLERİ VE SEEDER BÖLÜMÜ */}
      <DatabaseSeederCard />

      {/* 2. GÜNCELLEME VE DEV MODU AYARLARI */}
      <DevUpdateTestCard
        devUpdateTestMode={devUpdateTestMode}
        setDevUpdateTestMode={setDevUpdateTestMode}
        devUpdateVersion={devUpdateVersion}
        setDevUpdateVersion={setDevUpdateVersion}
        githubReleases={githubReleases}
      />

      {/* 3. BİRİM & ENTEGRASYON TESTLERİ (VITEST RUNNER) */}
      <VitestRunnerCard />

      {/* 4. SİSTEM & OLAY GÜNLÜKLERİ (EVENT LOGS) */}
      <SystemLogsCard />
    </div>
  )
}
