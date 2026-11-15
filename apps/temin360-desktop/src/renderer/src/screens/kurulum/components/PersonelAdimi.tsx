import React, { useState } from 'react'
import { Users, Plus, Trash2, Sparkles, UserCheck } from 'lucide-react'
import { KurulumBirimItem, KurulumPersonelItem } from '../types'

interface PersonelAdimiProps {
  personeller: KurulumPersonelItem[]
  birimler: KurulumBirimItem[]
  onChange: (personeller: KurulumPersonelItem[]) => void
}

const SAMPLE_PERSONEL: KurulumPersonelItem[] = [
  { adSoyad: 'Ali Kaya', unvan: 'Belediye Başkan Yardımcısı', gorev: 'Harcama Yetkilisi', birim: 'Destek Hizmetleri Müdürlüğü', rol: 'harcama_yetkilisi' },
  { adSoyad: 'Ayşe Demir', unvan: 'Destek Hizmetleri Müdürü', gorev: 'Gerçekleştirme Görevlisi', birim: 'Destek Hizmetleri Müdürlüğü', rol: 'gerceklestirme_gorevlisi' },
  { adSoyad: 'Mehmet Yılmaz', unvan: 'Muhasebeci / Mutemet', gorev: 'Muhasebe Yetkilisi', birim: 'Mali Hizmetler Müdürlüğü', rol: 'muhasebe' },
  { adSoyad: 'Canan Öz', unvan: 'Makine Mühendisi', gorev: 'Piyasa Araştırma Görevlisi', birim: 'Destek Hizmetleri Müdürlüğü', rol: 'fiyat_arastirma' },
  { adSoyad: 'Burak Şahin', unvan: 'İnşaat Teknikeri', gorev: 'Muayene Kabul Görevlisi', birim: 'Fen İşleri Müdürlüğü', rol: 'muayene_kabul' }
]

export const PersonelAdimi: React.FC<PersonelAdimiProps> = ({ personeller, birimler, onChange }) => {
  const [adSoyad, setAdSoyad] = useState('')
  const [unvan, setUnvan] = useState('')
  const [gorev, setGorev] = useState('')
  const [birim, setBirim] = useState(birimler[0]?.birimAdi || 'Destek Hizmetleri Müdürlüğü')
  const [rol, setRol] = useState<KurulumPersonelItem['rol']>('fiyat_arastirma')

  const handleAddPersonel = () => {
    if (!adSoyad.trim()) return
    const newItem: KurulumPersonelItem = {
      id: Date.now(),
      adSoyad: adSoyad.trim(),
      unvan: unvan.trim() || 'Görevli',
      gorev: gorev.trim() || unvan.trim() || 'Görevli',
      birim: birim || birimler[0]?.birimAdi || 'Genel',
      rol
    }
    onChange([...personeller, newItem])
    setAdSoyad('')
    setUnvan('')
    setGorev('')
  }

  const handleRemovePersonel = (index: number) => {
    const next = [...personeller]
    next.splice(index, 1)
    onChange(next)
  }

  const handleLoadSample = () => {
    const existingNames = new Set(personeller.map((p) => p.adSoyad.toLowerCase()))
    const toAdd = SAMPLE_PERSONEL.filter((p) => !existingNames.has(p.adSoyad.toLowerCase()))
    onChange([...personeller, ...toAdd])
  }

  const getRoleBadge = (r: KurulumPersonelItem['rol']) => {
    switch (r) {
      case 'harcama_yetkilisi':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">🏛️ Harcama Yetkilisi</span>
      case 'gerceklestirme_gorevlisi':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">✍️ Gerçekleştirme</span>
      case 'muhasebe':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">💰 Muhasebe / Mutemet</span>
      case 'fiyat_arastirma':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">🔍 Fiyat Araştırma</span>
      case 'muayene_kabul':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">📦 Muayene Kabul</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Üye</span>
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            3. Adım: Personel Kadrosu ve Rol Atamaları
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Harcama yetkilisi, gerçekleştirme görevlisi, komisyon üyeleri ve araştırmacıları tanımlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Örnek Personel Kadrosu Yükle
        </button>
      </div>

      {/* Personel Ekleme Formu */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-600" /> Yeni Personel Tanımla
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <input
              type="text"
              value={adSoyad}
              onChange={(e) => setAdSoyad(e.target.value)}
              placeholder="Adı Soyadı *"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPersonel()
              }}
            />
          </div>
          <div>
            <input
              type="text"
              value={unvan}
              onChange={(e) => {
                setUnvan(e.target.value)
                if (!gorev) setGorev(e.target.value)
              }}
              placeholder="Resmî Ünvanı (Örn: Mühendis)"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPersonel()
              }}
            />
          </div>
          <div>
            <select
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {birimler.length > 0 ? (
                birimler.map((b, i) => (
                  <option key={`birim_opt_${b.id ?? i}_${i}`} value={b.birimAdi}>{b.birimAdi}</option>
                ))
              ) : (
                <option value="Destek Hizmetleri Müdürlüğü">Destek Hizmetleri Müdürlüğü</option>
              )}
            </select>
          </div>
          <div>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
            >
              <option value="harcama_yetkilisi">🏛️ Harcama Yetkilisi</option>
              <option value="gerceklestirme_gorevlisi">✍️ Gerçekleştirme Görevlisi</option>
              <option value="muhasebe">💰 Muhasebe Yetkilisi / Mutemet</option>
              <option value="fiyat_arastirma">🔍 Piyasa Fiyat Araştırma</option>
              <option value="muayene_kabul">📦 Muayene Kabul Komisyonu</option>
              <option value="uye">Personel / Üye</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddPersonel}
              disabled={!adSoyad.trim()}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Personel Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Eklenen Personel Listesi */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Adı Soyadı</th>
              <th className="py-2.5 px-4">Resmî Ünvanı</th>
              <th className="py-2.5 px-4">Bağlı Olduğu Birim</th>
              <th className="py-2.5 px-4">Rol / Görev</th>
              <th className="py-2.5 px-4 w-16 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {personeller.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  Henüz personel eklenmedi. &quot;Örnek Personel Kadrosu Yükle&quot; butonuna basabilir veya formu kullanarak ekleyebilirsiniz.
                </td>
              </tr>
            ) : (
              personeller.map((p, idx) => (
                <tr key={`personel_row_${p.id ?? idx}_${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    {p.adSoyad}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-300">{p.unvan}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{p.birim}</td>
                  <td className="py-2.5 px-4">{getRoleBadge(p.rol)}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemovePersonel(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Personeli Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
