import React from 'react'
import {
  FileText,
  GitCommit,
  GitFork,
  MoveDown,
  MoveUp,
  Plus,
  Sparkles,
  Trash2,
  Users,
  CheckCircle2,
  HelpCircle
} from 'lucide-react'
import { toTrDate } from '@temin360/document-templates'

export type BelgeModuType = 'standart' | 'koordinasyonlu' | 'hizli_onay'

export interface RotaAdimItem {
  t?: 'Hazırlayan' | 'Paraf' | 'Koordinasyon' | 'İmza' | 'Olur' | string
  a?: string // Ad Soyad
  u?: string // Unvan
  tarih?: string // GG.AA.YYYY
  sira?: number
}

interface DocumentPreviewRotaSectionProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  personelListesi?: Array<{ id?: number | string; ad_soyad?: string; unvan?: string }>
  supportsOlur?: boolean
}

export function DocumentPreviewRotaSection({
  formData,
  setFormData,
  personelListesi = [],
  supportsOlur = false
}: DocumentPreviewRotaSectionProps): React.JSX.Element {
  const currentMode: BelgeModuType = (formData.belgeModu as BelgeModuType) || 'standart'
  const rota: RotaAdimItem[] = Array.isArray(formData.rota)
    ? formData.rota
    : Array.isArray(formData.koordinasyon)
      ? formData.koordinasyon.map((k: any) => ({
          t: k.rol || 'Koordinasyon',
          a: k.adSoyad || '',
          u: k.unvan || '',
          tarih: k.tarih || toTrDate(new Date())
        }))
      : []

  // Mod Değiştirme
  const handleModeChange = (newMode: BelgeModuType) => {
    setFormData((prev: any) => {
      const updated: any = {
        ...prev,
        belgeModu: newMode
      }

      // Hızlı Olur moduna geçilirse Olur Yazısı toggle'ını da aç
      if (newMode === 'hizli_onay') {
        updated.olurYazisi = true
      }

      // Koordinasyonlu moda geçilirse ve rota boşsa akıllı başlangıç rotası ata
      if (newMode === 'koordinasyonlu' && (!prev.rota || prev.rota.length === 0)) {
        const today = toTrDate(new Date())
        const initialRota: RotaAdimItem[] = []

        if (prev.hazirlayanPersonelAdi) {
          initialRota.push({
            t: 'Hazırlayan',
            a: prev.hazirlayanPersonelAdi,
            u: prev.hazirlayanPersonelUnvan || 'Görevli Personel',
            tarih: today
          })
        } else if (personelListesi.length > 0) {
          initialRota.push({
            t: 'Hazırlayan',
            a: (personelListesi[0].ad_soyad || '').split('(')[0].trim(),
            u: personelListesi[0].unvan || 'Görevli Personel',
            tarih: today
          })
        } else {
          initialRota.push({
            t: 'Hazırlayan',
            a: '',
            u: '',
            tarih: today
          })
        }

        initialRota.push({
          t: 'Paraf',
          a:
            personelListesi.length > 1
              ? (personelListesi[1].ad_soyad || '').split('(')[0].trim()
              : '',
          u: personelListesi.length > 1 ? personelListesi[1].unvan || 'Şube Müdürü' : 'Birim Yetkilisi',
          tarih: today
        })

        if (prev.onaylayanPersonelAdi) {
          initialRota.push({
            t: 'İmza',
            a: prev.onaylayanPersonelAdi,
            u: prev.onaylayanPersonelUnvan || 'Harcama Yetkilisi',
            tarih: today
          })
        }

        updated.rota = initialRota
        updated.koordinasyon = initialRota.map((r) => ({
          adSoyad: r.a,
          unvan: r.u,
          tarih: r.tarih,
          rol: r.t
        }))
      }

      return updated
    })
  }

  // Yeni Rota Adımı Ekleme
  const handleAddStep = () => {
    const today = toTrDate(new Date())
    const newStep: RotaAdimItem = {
      t: rota.length === 0 ? 'Hazırlayan' : 'Paraf',
      a: '',
      u: '',
      tarih: today
    }
    const updated = [...rota, newStep]
    setFormData((prev: any) => ({
      ...prev,
      rota: updated,
      koordinasyon: updated.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  // Adım Güncelleme
  const handleUpdateStep = (index: number, field: keyof RotaAdimItem, val: string) => {
    const updated = [...rota]
    updated[index] = { ...updated[index], [field]: val }
    setFormData((prev: any) => ({
      ...prev,
      rota: updated,
      koordinasyon: updated.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  // Personel Seçimiyle Adımı Doldurma
  const handleSelectPersonel = (index: number, personelId: string) => {
    const p = personelListesi.find((item) => String(item.id) === personelId)
    if (!p) return
    const cleanName = (p.ad_soyad || '').split('(')[0].trim()
    const updated = [...rota]
    updated[index] = {
      ...updated[index],
      a: cleanName,
      u: p.unvan || updated[index].u || ''
    }
    setFormData((prev: any) => ({
      ...prev,
      rota: updated,
      koordinasyon: updated.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  // Adım Silme
  const handleDeleteStep = (index: number) => {
    const updated = rota.filter((_, idx) => idx !== index)
    setFormData((prev: any) => ({
      ...prev,
      rota: updated,
      koordinasyon: updated.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  // Yukarı / Aşağı Taşıma
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === rota.length - 1) return
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const updated = [...rota]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setFormData((prev: any) => ({
      ...prev,
      rota: updated,
      koordinasyon: updated.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  // Otomatik Rota Oluşturucu
  const handleAutoGenerateRota = () => {
    const today = toTrDate(new Date())
    const newRota: RotaAdimItem[] = []

    // 1. Adım: Hazırlayan
    const hazirlayan =
      formData.hazirlayanPersonelAdi ||
      formData.talepEdenPersonelAdi ||
      (personelListesi.length > 0 ? (personelListesi[0].ad_soyad || '').split('(')[0].trim() : '')
    const hazirlayanUnvan =
      formData.hazirlayanPersonelUnvan ||
      formData.talepEdenPersonelUnvan ||
      (personelListesi.length > 0 ? personelListesi[0].unvan : 'Görevli Personel')

    newRota.push({
      t: 'Hazırlayan',
      a: hazirlayan,
      u: hazirlayanUnvan || '',
      tarih: today
    })

    // 2. Adım: Paraf / Koordinasyon (Birim Yetkilisi / Şube Müdürü)
    const parafPersonel =
      personelListesi.length > 1
        ? (personelListesi[1].ad_soyad || '').split('(')[0].trim()
        : ''
    const parafUnvan =
      personelListesi.length > 1 ? personelListesi[1].unvan : 'Birim Yetkilisi / Şube Müdürü'

    newRota.push({
      t: 'Paraf',
      a: parafPersonel,
      u: parafUnvan || '',
      tarih: today
    })

    // 3. Adım: İmza / Olur Makamı
    const onaylayan =
      formData.onaylayanPersonelAdi ||
      formData.baskanAdi ||
      (personelListesi.length > 2 ? (personelListesi[2].ad_soyad || '').split('(')[0].trim() : '')
    const onaylayanUnvan =
      formData.onaylayanPersonelUnvan ||
      formData.baskanUnvan ||
      (personelListesi.length > 2 ? personelListesi[2].unvan : 'Harcama Yetkilisi')

    newRota.push({
      t: 'İmza',
      a: onaylayan,
      u: onaylayanUnvan || '',
      tarih: today
    })

    setFormData((prev: any) => ({
      ...prev,
      belgeModu: 'koordinasyonlu',
      rota: newRota,
      koordinasyon: newRota.map((r) => ({
        adSoyad: r.a,
        unvan: r.u,
        tarih: r.tarih,
        rol: r.t
      }))
    }))
  }

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
      {/* 1. BÖLÜM: BELGE ÇALIŞMA MODU (MODES) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Belge Çalışma Modu</span>
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              currentMode === 'koordinasyonlu'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                : currentMode === 'hizli_onay'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {currentMode === 'koordinasyonlu'
              ? 'Koordinasyonlu'
              : currentMode === 'hizli_onay'
                ? 'Hızlı Olur'
                : 'Standart'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleModeChange('standart')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
              currentMode === 'standart'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Standart mevzuat belgesi (tek imza/onay)"
          >
            Standart
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('koordinasyonlu')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
              currentMode === 'koordinasyonlu'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Resmî EBYS / Paraf ve Koordinasyon akışı aktif"
          >
            Koordinasyon
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('hizli_onay')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
              currentMode === 'hizli_onay'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Harcama Yetkilisi Olur/Onay makamı odaklı"
          >
            Hızlı Onay
          </button>
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          {currentMode === 'koordinasyonlu'
            ? 'EBYS & Koordinasyon: Belge altında resmi paraf/koordinasyon tablosu basılır.'
            : currentMode === 'hizli_onay'
              ? 'Hızlı Onay: Makam OLUR bloğu vurgulanır, doğrudan onaya sunulur.'
              : 'Standart: Kurum içi olağan mevzuat düzeninde imza ve onay blokları kullanılır.'}
        </p>
      </div>

      {/* 2. BÖLÜM: ROTA & KOORDİNASYON AKIŞI LİSTESİ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>İmza & Rota Akışı ({rota.length})</span>
          </span>

          <button
            type="button"
            onClick={handleAutoGenerateRota}
            className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
            title="Belgedeki ve kayıtlı personellerden 3 adımlı resmi rota oluştur"
          >
            <Sparkles className="w-3 h-3" />
            <span>⚡ Otomatik Rota</span>
          </button>
        </div>

        {/* Adımlar Listesi */}
        <div className="space-y-2">
          {rota.length === 0 ? (
            <div className="p-3 bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Henüz paraf veya koordinasyon adımı eklenmedi.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adım Ekle</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoGenerateRota}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Önerilen Rota</span>
                </button>
              </div>
            </div>
          ) : (
            rota.map((step, idx) => {
              const badgeColor =
                step.t === 'Hazırlayan'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : step.t === 'İmza'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : step.t === 'Olur'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'

              return (
                <div
                  key={idx}
                  className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs"
                >
                  {/* Başlık: Sıra No + Tür Seçimi + Aksiyonlar */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <select
                        value={step.t || 'Paraf'}
                        onChange={(e) => handleUpdateStep(idx, 't', e.target.value)}
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded border border-transparent cursor-pointer ${badgeColor}`}
                      >
                        <option value="Hazırlayan">Hazırlayan</option>
                        <option value="Paraf">Paraf</option>
                        <option value="Koordinasyon">Koordinasyon</option>
                        <option value="İmza">İmza</option>
                        <option value="Olur">Olur</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === rota.length - 1}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(idx)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500 cursor-pointer"
                        title="Adımı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Personel Listesi Dropdown (Varsa Hızlı Seçim) */}
                  {personelListesi.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => handleSelectPersonel(idx, e.target.value)}
                      className="w-full text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <option value="">👤 Personel Listesinden Seç...</option>
                      {personelListesi.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Ad Soyad ve Unvan Inputları */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={step.a || ''}
                      onChange={(e) => handleUpdateStep(idx, 'a', e.target.value)}
                      placeholder="Adı Soyadı"
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={step.u || ''}
                      onChange={(e) => handleUpdateStep(idx, 'u', e.target.value)}
                      placeholder="Unvanı / Görevi"
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  {/* Tarih Alanı (GG.AA.YYYY mevzuata uygun) */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Tarih:</span>
                    <input
                      type="text"
                      value={step.tarih || toTrDate(new Date())}
                      onChange={(e) => handleUpdateStep(idx, 'tarih', e.target.value)}
                      placeholder="GG.AA.YYYY"
                      className="w-24 text-right px-1.5 py-0.5 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-200 font-mono focus:outline-hidden"
                    />
                  </div>
                </div>
              )
            })
          )}

          {/* Adım Ekle Butonu */}
          {rota.length > 0 && (
            <button
              type="button"
              onClick={handleAddStep}
              className="w-full py-1.5 border border-dashed border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Adım Ekle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
