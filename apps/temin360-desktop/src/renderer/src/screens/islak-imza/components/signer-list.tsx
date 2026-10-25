import React from 'react'
import { UserCheck, Plus } from 'lucide-react'
import { SignerRow } from './signer-row'
import { ImzaciSatiri } from '../types'

interface SignerListProps {
  signers: ImzaciSatiri[]
  onChange: (signers: ImzaciSatiri[]) => void
}

export const SignerList: React.FC<SignerListProps> = ({ signers, onChange }) => {
  const handleAddSigner = () => {
    const newSigner: ImzaciSatiri = {
      id: `imz-${Date.now()}`,
      sira: signers.length + 1,
      adSoyad: '',
      unvan: '',
      imzaTipi: signers.length === 0 ? 'Hazırlayan' : 'Kontrol',
      parafVar: true,
      imzaKutusuVar: true,
      tarihVar: true
    }
    onChange([...signers, newSigner])
  }

  const handleUpdate = (id: string, updated: Partial<ImzaciSatiri>) => {
    onChange(signers.map((s) => (s.id === id ? { ...s, ...updated } : s)))
  }

  const handleDelete = (id: string) => {
    const remaining = signers.filter((s) => s.id !== id)
    // Sıraları yeniden düzenle
    const reindexed = remaining.map((s, index) => ({
      ...s,
      sira: index + 1
    }))
    onChange(reindexed)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= signers.length) return

    const copy = [...signers]
    const [moved] = copy.splice(index, 1)
    copy.splice(targetIndex, 0, moved)

    const reindexed = copy.map((s, idx) => ({
      ...s,
      sira: idx + 1
    }))
    onChange(reindexed)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            İmza Bloğu &amp; Paraf Rotası
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {signers.length} İmzacı
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddSigner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>İmzacı Ekle</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {signers.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500">Henüz imzacı tanımlanmadı.</p>
          </div>
        ) : (
          signers.map((signer, index) => (
            <SignerRow
              key={signer.id}
              signer={signer}
              isFirst={index === 0}
              isLast={index === signers.length - 1}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              onDelete={() => handleDelete(signer.id)}
              onUpdate={(updated) => handleUpdate(signer.id, updated)}
            />
          ))
        )}
      </div>
    </div>
  )
}
