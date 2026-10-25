import React, { useState } from 'react'
import { ActiveTool } from './types'
import { PlaygroundHeader } from './components/PlaygroundHeader'
import { SayiYaziTool } from './components/SayiYaziTool'
import { YiUfeTool } from './components/YiUfeTool'
import { KdvTevkifatTool } from './components/KdvTevkifatTool'
import { DamgaVergisiTool } from './components/DamgaVergisiTool'
import { GecikmeCezasiTool } from './components/GecikmeCezasiTool'

export default function PlaygroundScreen(): React.JSX.Element {
  const [activeTool, setActiveTool] = useState<ActiveTool>('sayi_yazi')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key = 'default'): void => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100">
      <PlaygroundHeader activeTool={activeTool} onSelectTool={setActiveTool} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTool === 'sayi_yazi' && <SayiYaziTool onCopy={handleCopy} copiedKey={copiedKey} />}
          {activeTool === 'yi_ufe' && <YiUfeTool onCopy={handleCopy} copiedKey={copiedKey} />}
          {activeTool === 'kdv_tevkifat' && <KdvTevkifatTool />}
          {activeTool === 'damga_vergisi' && <DamgaVergisiTool />}
          {activeTool === 'gecikme_cezasi' && <GecikmeCezasiTool />}
        </div>
      </div>
    </div>
  )
}
